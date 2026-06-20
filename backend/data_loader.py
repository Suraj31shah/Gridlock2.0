import pandas as pd
import numpy as np
import os

def load_and_preprocess_data(file_path):
    if not os.path.exists(file_path):
        return pd.DataFrame(), pd.DataFrame()
        
    df = pd.read_csv(file_path)

    # Parse datetimes
    df['start_datetime'] = pd.to_datetime(df['start_datetime'], utc=True, errors='coerce')
    df['closed_datetime'] = pd.to_datetime(df['closed_datetime'], utc=True, errors='coerce')
    df['resolved_datetime'] = pd.to_datetime(df['resolved_datetime'], utc=True, errors='coerce')

    # Duration
    df['duration_hours'] = (df['closed_datetime'] - df['start_datetime']).dt.total_seconds() / 3600

    # Time features
    df['hour_of_day'] = df['start_datetime'].dt.hour
    df['day_of_week'] = df['start_datetime'].dt.dayofweek
    df['month'] = df['start_datetime'].dt.month
    df['is_peak_hour'] = df['hour_of_day'].isin([7,8,9,10,17,18,19,20]).astype(int)
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)

    # Clean cause
    df['event_cause'] = df['event_cause'].astype(str).str.lower().str.strip()
    df['event_cause'] = df['event_cause'].replace({'debris': 'others', 'fog / low visibility': 'others', 'test_demo': 'others', 'nan': 'others'})

    # Frequency and historical duration features
    zone_freq = df['zone'].value_counts().to_dict()
    df['zone_event_frequency'] = df['zone'].map(zone_freq).fillna(0)
    
    cause_dur = df.groupby('event_cause')['duration_hours'].median().to_dict()
    df['cause_avg_duration'] = df['event_cause'].map(cause_dur).fillna(0)

    # Severity score
    df['priority_score'] = df['priority'].map({'High': 2, 'Low': 1}).fillna(0)
    
    # Handle NaNs in duration to prevent log errors
    df['duration_hours_clean'] = df['duration_hours'].fillna(0).clip(0, 2000)
    
    # requires_road_closure might be string or bool
    df['requires_road_closure_bool'] = df['requires_road_closure'].astype(str).str.lower().isin(['true', '1', 'yes'])

    cause_risk_map = {
        'accident': 3,
        'water_logging': 2,
        'tree_fall': 2,
        'construction': 1,
        'vehicle_breakdown': 1,
        'public_event': 2,
        'procession': 2,
        'vip_movement': 3,
        'protest': 3,
        'pot_holes': 1,
        'others': 1
    }
    df['cause_risk'] = df['event_cause'].map(cause_risk_map).fillna(1)

    df['severity_score'] = (
        df['requires_road_closure_bool'].astype(int) * 4 +
        df['priority_score'] * 2 +
        df['cause_risk']
    )
    
    # Normalize severity score
    min_sev = df['severity_score'].min()
    max_sev = df['severity_score'].max()
    if max_sev > min_sev:
        df['severity_score'] = (df['severity_score'] - min_sev) / (max_sev - min_sev) * 10
    else:
        df['severity_score'] = 0

    # Filter valid rows for ML
    df_ml = df[df['duration_hours'].between(0.01, 2000)].copy()
    
    return df, df_ml
