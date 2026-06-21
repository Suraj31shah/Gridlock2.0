from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import pandas as pd
import numpy as np
import math
import os

from data_loader import load_and_preprocess_data
from ml_model import CongestionImpactPredictor
from recommender import get_recommendations

app = FastAPI(title="Congestion Intelligence API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to hold data and models
df_events = None
predictor = None

def init_app():
    global df_events, predictor
    print("Loading and preprocessing data...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "..", "data", "Astram_event_data_anonymized.csv")
    df, df_ml = load_and_preprocess_data(data_path)
    df_events = df
    
    print("Training ML models...")
    predictor = CongestionImpactPredictor()
    predictor.train(df_ml)
    print("Initialization complete.")

@app.on_event("startup")
def startup_event():
    init_app()

@app.get("/")
def read_root():
    return {"status": "online", "message": "AstramAI Backend is running", "version": "1.0"}

class PredictRequest(BaseModel):
    event_cause: str
    event_type: str
    zone: str
    requires_road_closure: bool
    priority: str
    hour_of_day: int
    day_of_week: int
    corridor: str

@app.get("/api/summary")
def get_summary():
    if df_events is None or df_events.empty:
        return {}
        
    total_events = len(df_events)
    planned = len(df_events[df_events['event_type'].str.lower() == 'planned'])
    unplanned = total_events - planned
    
    causes = df_events['event_cause'].value_counts().head(5).to_dict()
    zones = df_events['zone'].value_counts().to_dict()
    
    # Events over time (monthly)
    monthly = df_events.groupby(df_events['start_datetime'].dt.to_period('M')).size()
    monthly_trend = [{"month": str(k), "count": int(v)} for k, v in monthly.items()]
    
    # Road closure rate
    closure_rate = df_events.groupby('event_cause')['requires_road_closure_bool'].mean().to_dict()
    
    # Avg resolution time
    avg_duration = df_events.groupby('event_cause')['duration_hours_clean'].mean().to_dict()
    
    return {
        "total_events": total_events,
        "planned_percent": round((planned / total_events) * 100, 1) if total_events else 0,
        "unplanned_percent": round((unplanned / total_events) * 100, 1) if total_events else 0,
        "top_causes": [{"name": str(k), "value": int(v)} for k, v in causes.items()],
        "zones": [{"name": str(k), "value": int(v)} for k, v in zones.items() if not pd.isna(k)],
        "monthly_trend": monthly_trend,
        "closure_rate": [{"name": str(k), "rate": round(v * 100, 1)} for k, v in closure_rate.items() if not pd.isna(v)],
        "avg_duration": [{"name": str(k), "hours": round(v, 1)} for k, v in avg_duration.items() if not pd.isna(v)]
    }

@app.get("/api/events")
def get_events(zone: Optional[str] = None, cause: Optional[str] = None):
    if df_events is None or df_events.empty:
        return []
        
    df = df_events.copy()
    if zone:
        df = df[df['zone'] == zone]
    if cause:
        causes = cause.split(',')
        df = df[df['event_cause'].isin(causes)]
        
    df = df.head(2000)
    
    records = df[['id', 'latitude', 'longitude', 'event_cause', 'status', 'zone', 'junction', 
                  'start_datetime', 'duration_hours_clean', 'requires_road_closure_bool']].to_dict('records')
                  
    cleaned = []
    for r in records:
        clean_r = {}
        for k, v in r.items():
            if pd.isna(v) or (isinstance(v, float) and math.isnan(v)):
                clean_r[k] = None
            elif isinstance(v, pd.Timestamp):
                clean_r[k] = v.isoformat()
            else:
                clean_r[k] = v
        cleaned.append(clean_r)
        
    return cleaned

@app.get("/api/heatmap")
def get_heatmap(zone: Optional[str] = None):
    if df_events is None or df_events.empty:
        return []
    
    df_valid = df_events.dropna(subset=['latitude', 'longitude'])
    if zone:
        df_valid = df_valid[df_valid['zone'] == zone]
        
    points = df_valid[['latitude', 'longitude']].values.tolist()
    return points

@app.get("/api/zone-risk")
def get_zone_risk():
    if df_events is None or df_events.empty:
        return []
        
    matrix = pd.crosstab(df_events['zone'], df_events['day_of_week']).to_dict('index')
    
    result = []
    for zone, days in matrix.items():
        if pd.isna(zone): continue
        row = {"zone": str(zone)}
        for d in range(7):
            row[f"day_{d}"] = int(days.get(d, 0))
        result.append(row)
        
    return result

@app.get("/api/similar")
def get_similar(cause: str, zone: str):
    if df_events is None or df_events.empty:
        return []
        
    df = df_events[(df_events['event_cause'] == cause) & (df_events['zone'] == zone)]
    if df.empty:
        df = df_events[df_events['event_cause'] == cause]
        
    df = df.sort_values(by='duration_hours_clean', ascending=False).head(5)
    
    records = df[['id', 'start_datetime', 'duration_hours_clean', 'junction', 'status']].to_dict('records')
    
    cleaned = []
    for r in records:
        clean_r = {}
        for k, v in r.items():
            if pd.isna(v) or (isinstance(v, float) and math.isnan(v)):
                clean_r[k] = None
            elif isinstance(v, pd.Timestamp):
                clean_r[k] = v.isoformat()
            else:
                clean_r[k] = v
        cleaned.append(clean_r)
        
    return cleaned

@app.post("/api/predict")
def predict_impact(req: PredictRequest):
    if predictor is None:
        raise HTTPException(status_code=500, detail="Model not initialized")
        
    input_data = req.dict()
    result = predictor.predict(input_data)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return result

@app.post("/api/recommend")
def recommend_resources(req: PredictRequest):
    input_data = req.dict()
    prediction = predictor.predict(input_data)
    
    if "error" in prediction:
        raise HTTPException(status_code=500, detail=prediction["error"])
        
    recs = get_recommendations(prediction, input_data)
    return {
        "prediction": prediction,
        "recommendation": recs
    }

@app.get("/api/metrics")
def get_metrics():
    if predictor is None or not hasattr(predictor, 'metrics'):
        return {}
    return predictor.metrics

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
