import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, classification_report
import pickle
import os

class CongestionImpactPredictor:
    def __init__(self):
        self.duration_model = None
        self.severity_model = None
        self.preprocessor = None
        self.metrics = {}
        self.feature_importances = []
        self.zone_freq_map = {}
        self.cause_dur_map = {}
        
        # Features definition
        self.categorical_features = ['event_cause', 'zone']
        self.numerical_features = ['event_type_encoded', 'requires_road_closure_encoded', 
                                   'priority_encoded', 'hour_of_day', 'day_of_week', 'is_corridor',
                                   'is_peak_hour', 'is_weekend', 'zone_event_frequency', 'cause_avg_duration']
                                   
    def prepare_features(self, df):
        df_proc = df.copy()
        
        # Encode inputs
        df_proc['event_type_encoded'] = (df_proc['event_type'].str.lower() == 'planned').astype(int)
        df_proc['requires_road_closure_encoded'] = df_proc['requires_road_closure'].astype(str).str.lower().isin(['true', '1', 'yes']).astype(int)
        df_proc['priority_encoded'] = df_proc['priority'].map({'High': 2, 'Low': 1}).fillna(0)
        df_proc['is_corridor'] = (df_proc['corridor'].str.lower() == 'corridor').astype(int)
        
        # Time features
        if 'is_peak_hour' not in df_proc.columns:
            df_proc['is_peak_hour'] = df_proc['hour_of_day'].isin([7,8,9,10,17,18,19,20]).astype(int)
        if 'is_weekend' not in df_proc.columns:
            df_proc['is_weekend'] = (df_proc['day_of_week'] >= 5).astype(int)
        
        df_proc['event_cause'] = df_proc['event_cause'].astype(str).str.lower()
        df_proc['zone'] = df_proc['zone'].astype(str)
        
        # Historical maps (for inference)
        if 'zone_event_frequency' not in df_proc.columns:
            df_proc['zone_event_frequency'] = df_proc['zone'].map(self.zone_freq_map).fillna(0)
        if 'cause_avg_duration' not in df_proc.columns:
            df_proc['cause_avg_duration'] = df_proc['event_cause'].map(self.cause_dur_map).fillna(0)
        
        X = df_proc[self.categorical_features + self.numerical_features]
        return X

    def train(self, df_ml):
        if len(df_ml) == 0:
            return False
            
        # Store historical maps for inference before prepare_features
        self.zone_freq_map = df_ml.groupby('zone').size().to_dict()
        self.cause_dur_map = df_ml.groupby('event_cause')['duration_hours'].median().to_dict()
            
        X = self.prepare_features(df_ml)
        
        # Log-transform duration to handle massive outliers
        y_duration = np.log1p(df_ml['duration_hours_clean'])
        
        # Severity bucketing for classification
        # Scores range roughly from 1 to 11. Define explicit bins to avoid qcut duplicate edge issues.
        bins = [0, 3, 6, 15]
        labels = ['Low', 'Medium', 'High']
        y_severity = pd.cut(df_ml['severity_score'], bins=bins, labels=labels, right=True)
        
        # Preprocessing for categorical data
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))
        ])

        # Preprocessing for numerical data
        numerical_transformer = SimpleImputer(strategy='median')

        # Bundle preprocessing for numerical and categorical data
        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', numerical_transformer, self.numerical_features),
                ('cat', categorical_transformer, self.categorical_features)
            ])
            
        self.duration_model = Pipeline(steps=[
            ('preprocessor', self.preprocessor),
            ('regressor', GradientBoostingRegressor(n_estimators=100, random_state=42, max_depth=5))
        ])
        
        self.severity_model = Pipeline(steps=[
            ('preprocessor', self.preprocessor),
            ('classifier', GradientBoostingClassifier(n_estimators=100, random_state=42, max_depth=5))
        ])
        
        print("Running 5-fold cross validation...")
        sev_cv_scores = cross_val_score(self.severity_model, X, y_severity, cv=5, scoring='accuracy')
        dur_cv_scores = cross_val_score(self.duration_model, X, y_duration, cv=5, scoring='r2')
        
        print(f"\n--- Model Evaluation (5-Fold CV) ---")
        print(f"Duration Model (Regression)     - R2 Score: {dur_cv_scores.mean():.4f} ± {dur_cv_scores.std():.4f}")
        print(f"Severity Model (Classification) - Accuracy: {sev_cv_scores.mean():.2%} ± {sev_cv_scores.std():.2%}")
        print("------------------------------------\n")
        
        # Retrain on full dataset for production use
        self.duration_model.fit(X, y_duration)
        self.severity_model.fit(X, y_severity)
        
        # Feature Importances
        feature_names = (
            self.duration_model.named_steps['preprocessor']
            .transformers_[1][1]
            .named_steps['onehot']
            .get_feature_names_out(self.categorical_features)
            .tolist() + self.numerical_features
        )
        
        importances = self.duration_model.named_steps['regressor'].feature_importances_
        # Aggregate importances by original feature name
        agg_importances = {}
        for name, imp in zip(feature_names, importances):
            base_name = name.split('_')[0] if name.startswith(('event_cause', 'zone')) else name
            agg_importances[base_name] = agg_importances.get(base_name, 0) + imp
            
        top_features = sorted(agg_importances.items(), key=lambda x: x[1], reverse=True)[:5]
        self.feature_importances = [{"name": k, "value": round(v, 4)} for k, v in top_features]
        
        self.metrics = {
            "severity_accuracy_cv": float(sev_cv_scores.mean()),
            "duration_r2_cv": float(dur_cv_scores.mean()),
            "feature_importances": self.feature_importances
        }
        
        return True

    def predict(self, input_data):
        """
        input_data should be a dictionary containing:
        event_cause, event_type, zone, requires_road_closure, priority, hour_of_day, day_of_week, corridor
        """
        if self.duration_model is None or self.severity_model is None:
            return {"error": "Model not trained yet"}
            
        df_input = pd.DataFrame([input_data])
        X = self.prepare_features(df_input)
        
        pred_duration_log = self.duration_model.predict(X)[0]
        pred_duration = np.expm1(pred_duration_log)
        
        # Prevent negative predictions from the regressor
        pred_duration = max(0.1, pred_duration)
        
        pred_severity = self.severity_model.predict(X)[0]
        
        confidence = self.severity_model.predict_proba(X).max() * 100
        
        return {
            "predicted_duration_hours": round(pred_duration, 2),
            "severity_label": pred_severity,
            "confidence": round(confidence, 1)
        }
