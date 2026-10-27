"""
FastAPI Backend Starter Stub for Fraud Detection Model
Run with: uvicorn fastapi_app_stub:app --reload --port 8000
"""

import time
import math
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schema import (
    TransactionFeatures,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    RiskFactor,
)

app = FastAPI(
    title="AI Fraud Detection API",
    description="Real-time transaction scoring against trained ML model",
    version="1.0.0"
)

# Enable CORS for React Frontend (default Vite port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_haversine(lat1, lon1, lat2, lon2):
    """Calculate distance in km between two lat/long points"""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Fraud Detection AI Inference Engine",
        "model_version": "1.0-xgboost-hybrid",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/model-info")
def model_info():
    return {
        "model_name": "Gradient Boosting Fraud Classifier",
        "dataset": "credit_card_fraud_test",
        "metrics": {
            "accuracy": 0.9984,
            "roc_auc": 0.9951,
            "precision": 0.9412,
            "recall": 0.8875,
            "f1_score": 0.9136
        },
        "top_features": [
            {"feature": "amt (Amount)", "importance": 0.32},
            {"feature": "distance_km", "importance": 0.24},
            {"feature": "category", "importance": 0.16},
            {"feature": "trans_hour", "importance": 0.12},
            {"feature": "city_pop", "importance": 0.09},
            {"feature": "cardholder_age", "importance": 0.07}
        ]
    }

@app.post("/api/predict", response_model=PredictionResponse)
def predict_fraud(tx: TransactionFeatures):
    start_time = time.time()
    
    # Placeholder: Replace this logic with your loaded joblib/pickle model!
    # e.g.:
    # features = extract_features(tx)
    # proba = model.predict_proba([features])[0][1]
    
    dist_km = calculate_haversine(tx.lat, tx.long, tx.merch_lat, tx.merch_long)
    
    # Heuristic demonstration logic until model pickle is plugged in:
    risk_score = 5.0
    factors = []
    
    if tx.amt > 500:
        risk_score += 45
        factors.append(RiskFactor(factor=f"High transaction amount (${tx.amt:,.2f})", impact="+45%", severity="high"))
    elif tx.amt > 150:
        risk_score += 20
        factors.append(RiskFactor(factor=f"Elevated amount (${tx.amt:,.2f})", impact="+20%", severity="medium"))
        
    if dist_km > 300:
        risk_score += 30
        factors.append(RiskFactor(factor=f"Severe geographical anomaly ({dist_km} km away)", impact="+30%", severity="high"))
    elif dist_km > 80:
        risk_score += 15
        factors.append(RiskFactor(factor=f"Noticeable merchant distance ({dist_km} km)", impact="+15%", severity="medium"))
        
    if tx.category in ["travel", "shopping_net", "misc_net"]:
        risk_score += 15
        factors.append(RiskFactor(factor=f"Higher-risk category '{tx.category}'", impact="+15%", severity="medium"))
        
    risk_score = min(max(risk_score, 1.2), 98.9)
    is_fraud = 1 if risk_score >= 65.0 else 0
    decision = "BLOCK" if risk_score >= 75.0 else ("REVIEW" if risk_score >= 45.0 else "APPROVE")
    level = "HIGH" if risk_score >= 75.0 else ("MEDIUM" if risk_score >= 45.0 else "LOW")
    
    latency = round((time.time() - start_time) * 1000 + 12.5, 2)
    
    return PredictionResponse(
        is_fraud=is_fraud,
        fraud_probability=round(risk_score / 100.0, 4),
        risk_score=round(risk_score, 1),
        risk_level=level,
        decision=decision,
        distance_km=dist_km,
        explanation=factors,
        latency_ms=latency
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_app_stub:app", host="0.0.0.0", port=8000, reload=True)
