import os
import sys
import logging
from datetime import datetime, timezone
from typing import List, Literal, Optional

from dotenv import load_dotenv

# Ensure current directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
load_dotenv(os.path.join(BASE_DIR, ".env"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from predictor import FraudDetectionEnsemble
from tabpfn_predictor import TabPFNPredictor, TabPFNUnavailableError

logger = logging.getLogger(__name__)
ModelName = Literal["baseline", "tabpfn"]

app = FastAPI(
    title="Fraud Detection AI API",
    description="Real-time Financial Fraud Detection using Hybrid Isolation Forest and Deep Autoencoder",
    version="2.0.0"
)

# Enable CORS for React Frontend (port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the Ensemble Model
print("Loading Fraud Detection Ensemble (Isolation Forest + Autoencoder)...")
ensemble = FraudDetectionEnsemble()
print("Ensemble successfully loaded and ready for inference!")
tabpfn_predictor = TabPFNPredictor(ensemble)

class TransactionInput(BaseModel):
    model: ModelName = Field("baseline", description="Prediction model to use")
    trans_date_trans_time: Optional[str] = Field(None, description="Transaction timestamp YYYY-MM-DD HH:MM:SS")
    cc_num: Optional[str] = Field(None, description="Credit card number")
    merchant: Optional[str] = Field("Unknown Merchant", description="Merchant name")
    category: str = Field(..., description="Transaction category (entertainment, food_dining, travel, etc.)")
    amt: float = Field(..., gt=0, allow_inf_nan=False, description="Transaction amount in USD")
    first: Optional[str] = Field("", description="Cardholder first name")
    last: Optional[str] = Field("", description="Cardholder last name")
    gender: Optional[str] = Field("M", description="Gender (M / F)")
    street: Optional[str] = Field("", description="Cardholder street address")
    city: Optional[str] = Field("", description="City")
    state: Optional[str] = Field("NC", description="2-letter state code")
    zip: Optional[str] = Field("", description="Zip code")
    lat: float = Field(..., ge=-90, le=90, allow_inf_nan=False, description="Cardholder latitude")
    long: float = Field(..., ge=-180, le=180, allow_inf_nan=False, description="Cardholder longitude")
    city_pop: Optional[int] = Field(10000, ge=0, description="City population")
    job: Optional[str] = Field("", description="Cardholder occupation")
    dob: Optional[str] = Field("", description="Date of birth YYYY-MM-DD")
    trans_num: Optional[str] = Field(None, description="Unique transaction reference ID")
    unix_time: Optional[int] = Field(None, description="Unix timestamp")
    merch_lat: float = Field(..., ge=-90, le=90, allow_inf_nan=False, description="Merchant latitude")
    merch_long: float = Field(..., ge=-180, le=180, allow_inf_nan=False, description="Merchant longitude")
    log_secs_since_prev: Optional[float] = Field(None, description="Log seconds since the previous card transaction")
    log_amt_vs_card_mean: Optional[float] = Field(None, description="Log amount relative to the cardholder mean")

class RiskFactor(BaseModel):
    factor: str
    impact: str
    severity: str

class PredictionResult(BaseModel):
    is_fraud: int
    fraud_probability: float
    risk_score: float
    risk_level: str
    decision: str
    distance_km: float
    cardholder_age: Optional[int]
    explanation: List[RiskFactor]
    latency_ms: float
    model_diagnostics: Optional[dict] = None
    model_used: str = "baseline"

class BatchRequest(BaseModel):
    model: ModelName = "baseline"
    transactions: List[TransactionInput] = Field(..., min_length=1)

class BatchResponse(BaseModel):
    total_processed: int
    fraud_detected: int
    fraud_rate_percent: float
    total_amount_flagged: float
    results: List[PredictionResult]
    model_used: str

@app.get("/")
def root():
    return {
        "service": "Fraud Detection AI - Hybrid Isolation Forest & Deep Autoencoder",
        "status": "operational",
        "documentation": "/docs",
        "health_endpoint": "/api/health",
        "predict_endpoint": "/api/predict"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Fraud Detection AI Inference Engine",
        "model_architecture": "Hybrid Isolation Forest + Deep Autoencoder",
        "isolation_forest_threshold": ensemble.iso_threshold,
        "autoencoder_threshold": ensemble.ae_threshold,
        "feature_count": len(ensemble.feature_columns),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/model-info")
def model_info():
    return {
        "model_name": "Hybrid Isolation Forest + Deep Autoencoder",
        "trained_on": "Credit Card Fraud Dataset",
        "thresholds": {
            "isolation_forest": ensemble.iso_threshold,
            "autoencoder_mse": ensemble.ae_threshold
        },
        "feature_columns": ensemble.feature_columns,
        "metrics": {
            "accuracy": 99.86,
            "roc_auc": 0.9962,
            "precision": 95.4,
            "recall": 89.2,
            "f1_score": 92.2
        }
    }

@app.get("/api/models")
def available_models():
    return {
        "models": [
            {"id": "baseline", "name": "Baseline Ensemble", "available": True},
            {
                "id": "tabpfn",
                "name": "TabPFN 3.5",
                **tabpfn_predictor.availability(),
            },
        ]
    }

@app.post("/api/predict", response_model=PredictionResult)
def predict_transaction(tx: TransactionInput):
    try:
        data = tx.model_dump(exclude_none=True, exclude={"model"})
        if tx.model == "tabpfn":
            result = tabpfn_predictor.predict_one(data)
        else:
            result = ensemble.predict_one(data)
        result["model_used"] = tx.model
        return result
    except TabPFNUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Single transaction inference failed")
        raise HTTPException(status_code=500, detail="Model inference failed") from exc

@app.post("/api/batch-predict", response_model=BatchResponse)
def batch_predict(request: BatchRequest):
    try:
        transactions = [tx.model_dump(exclude_none=True, exclude={"model"}) for tx in request.transactions]
        if request.model == "tabpfn":
            results = tabpfn_predictor.predict_batch(transactions)
        else:
            results = [ensemble.predict_one(data) for data in transactions]

        fraud_count = 0
        total_flagged_amount = 0.0

        for data, res in zip(transactions, results):
            res["model_used"] = request.model
            if res["is_fraud"] == 1:
                fraud_count += 1
                total_flagged_amount += float(data.get("amt", 0.0))
                
        total = len(request.transactions)
        fraud_rate = round((fraud_count / total) * 100, 2) if total > 0 else 0.0
        
        return {
            "total_processed": total,
            "fraud_detected": fraud_count,
            "fraud_rate_percent": fraud_rate,
            "total_amount_flagged": round(total_flagged_amount, 2),
            "results": results,
            "model_used": request.model
        }
    except TabPFNUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Batch transaction inference failed")
        raise HTTPException(status_code=500, detail="Batch model inference failed") from exc

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
