import sys
sys.path.append('d:/gridlock2/backend')
from ml_model import CongestionImpactPredictor
from data_loader import load_and_preprocess_data

df, df_ml = load_and_preprocess_data('d:/gridlock2/data/Astram_event_data_anonymized.csv')
predictor = CongestionImpactPredictor()
predictor.train(df_ml)

input_data = {
    'event_cause': 'vehicle_breakdown',
    'event_type': 'unplanned',
    'zone': 'East Zone 2',
    'requires_road_closure': False,
    'priority': 'Low',
    'hour_of_day': 22,
    'day_of_week': 2,
    'corridor': 'non-corridor'
}

import pandas as pd
df_input = pd.DataFrame([input_data])
X = predictor.prepare_features(df_input)
print("Features DataFrame:")
print(X.iloc[0])
print("\nPrediction:")
print(predictor.predict(input_data))

