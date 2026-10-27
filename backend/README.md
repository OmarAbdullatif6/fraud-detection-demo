# Fraud Detection AI - Backend Service Contract

This directory is designated for the backend API and AI model inference service (e.g., FastAPI, Flask, or PyTorch/Triton).

> **Note**: As requested, the backend service is decoupled from the React frontend. The frontend is built to communicate with this backend via REST API, and includes an intelligent simulation / mock mode when the backend is offline.

---

## 🚀 Quick Setup (When ready to build backend)

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# Install recommended dependencies:
pip install fastapi uvicorn pydantic scikit-learn pandas joblib
# Run starter stub:
python fastapi_app_stub.py
```

The frontend defaults to connecting to `http://localhost:8000`. You can configure this via `VITE_API_BASE_URL` in `frontend/.env`.

---

## 📡 API Endpoints Specification

### 1. Health & Model Info
- **`GET /api/health`**
  - **Description**: Verifies API is live and model is loaded.
  - **Response**:
    ```json
    {
      "status": "healthy",
      "model_name": "FraudDetection-XGBoost-v1",
      "version": "1.0.0",
      "loaded_at": "2026-10-27T12:00:00Z"
    }
    ```

- **`GET /api/model-info`**
  - **Description**: Returns model architecture, metrics, and trained feature importances.
  - **Response**:
    ```json
    {
      "model_type": "GradientBoostingClassifier",
      "accuracy": 0.9982,
      "roc_auc": 0.9945,
      "precision": 0.963,
      "recall": 0.891,
      "features": ["amt", "category", "hour", "day_of_week", "age", "distance_km", "city_pop"]
    }
    ```

---

### 2. Single Transaction Prediction
- **`POST /api/predict`**
- **Payload Schema (`TransactionInput`)**:
```json
{
  "trans_date_trans_time": "2020-06-21 22:06:39",
  "cc_num": "3560725013359375",
  "merchant": "fraud_Hamill-D'Amore",
  "category": "health_fitness",
  "amt": 24.84,
  "first": "Brooke",
  "last": "Smith",
  "gender": "F",
  "street": "63542 Luna Brook Apt. 012",
  "city": "Notrees",
  "state": "TX",
  "zip": "79759",
  "lat": 31.8599,
  "long": -102.7413,
  "city_pop": 23,
  "job": "Cytogeneticist",
  "dob": "1969-09-15",
  "trans_num": "16bf2e46c54369a8eab2214649506425",
  "unix_time": 1371852399,
  "merch_lat": 32.575873,
  "merch_long": -102.60429
}
```

- **Prediction Response Schema (`PredictionResponse`)**:
```json
{
  "is_fraud": 1,
  "fraud_probability": 0.874,
  "risk_score": 87.4,
  "risk_level": "HIGH",
  "decision": "BLOCK",
  "explanation": [
    { "factor": "Unusual Transaction Hour (Night)", "impact": "+28%", "severity": "high" },
    { "factor": "High Distance to Merchant (82.4 km)", "impact": "+19%", "severity": "medium" },
    { "factor": "Merchant Fraud Ratio in Health & Fitness", "impact": "+15%", "severity": "medium" }
  ],
  "latency_ms": 14.2
}
```

---

### 3. Batch Transaction Prediction
- **`POST /api/batch-predict`**
  - Accepts a list of transactions or CSV upload.
  - Returns batch stats (total, fraud count, flag rate, list of evaluated items).
