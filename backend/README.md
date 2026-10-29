# Fraud Detection AI - Backend Service & Model Engine

This backend is powered by a **Hybrid Isolation Forest & Deep Neural Autoencoder** anomaly ensemble, trained on credit card financial transactions (`fraudTest.csv`).

---

## 🏗️ Architecture Overview

```
backend/
├── Model/
│   ├── metadata.json           # Model configuration, 16 features & anomaly thresholds
│   ├── preprocessor.joblib     # StandardScaler (13 numerical) + OneHotEncoder (3 categorical) -> 79 features
│   ├── isolation_forest.joblib # 100-tree Isolation Forest outlier detector
│   └── autoencoder.keras       # 6-layer Deep Neural Autoencoder (79 -> 64 -> 32 -> 16 -> 32 -> 64 -> 79)
├── predictor.py                # Ensemble inference engine with Haversine spatial telemetry
├── tabpfn_predictor.py          # Optional local TabPFN 3.5 classifier
├── main.py                     # FastAPI REST API serving endpoints for React frontend
├── schema.py                   # Pydantic data validation schemas
├── requirements.txt            # Runtime dependencies
└── test_api_client.py          # Quick verification script for health & prediction endpoints
```

---

## ⚡ Running the Backend

```bash
cd backend
python -m pip install -r requirements.txt
python main.py
# Or with uvicorn directly:
uvicorn main:app --port 8000 --host 0.0.0.0 --reload
```

The API will be available at:
- **API Base**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/health`

---

## 📡 Endpoints

### 1. `GET /api/health`
Verifies API status and model thresholds:
```json
{
  "status": "healthy",
  "service": "Fraud Detection AI Inference Engine",
  "model_architecture": "Hybrid Isolation Forest + Deep Autoencoder",
  "isolation_forest_threshold": -0.1048614,
  "autoencoder_threshold": 0.0259746,
  "feature_count": 16
}
```

### 2. `POST /api/predict`
Real-time single transaction scoring:
```json
{
  "trans_date_trans_time": "2020-06-21 02:45:19",
  "cc_num": "3560725013359375",
  "merchant": "fraud_Hamill-D'Amore",
  "category": "travel",
  "amt": 894.25,
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
  "merch_lat": 41.8781,
  "merch_long": -87.6298
}
```

**Response**:
```json
{
  "is_fraud": 1,
  "fraud_probability": 0.8,
  "risk_score": 80.0,
  "risk_level": "HIGH",
  "decision": "BLOCK",
  "distance_km": 1741.2,
  "cardholder_age": 50,
  "explanation": [
    {
      "factor": "Autoencoder Neural Reconstruction Anomaly (MSE: 16.0644 > 0.0260)",
      "impact": "+42%",
      "severity": "high"
    },
    {
      "factor": "High Geographic Distance to POS (1741.2 km)",
      "impact": "+20%",
      "severity": "medium"
    }
  ],
  "model_diagnostics": {
    "isolation_forest_score": 0.1157,
    "isolation_forest_threshold": -0.10486,
    "isolation_forest_anomaly": false,
    "autoencoder_recon_error": 16.0644,
    "autoencoder_threshold": 0.02597,
    "autoencoder_anomaly": true
  },
  "latency_ms": 14.5
}
```

### 3. `POST /api/batch-predict`
Takes an array of transactions in `{ "transactions": [...] }` and returns aggregated batch predictions.

The React client sends each batch in one request. The service returns `total_processed`, `fraud_detected`, `fraud_rate_percent`, `total_amount_flagged`, the selected `model_used`, and one model prediction per transaction in `results`. Invalid inputs return HTTP 422; inference failures are logged and return HTTP 500. The frontend displays these errors rather than presenting them as model predictions.

## Connecting the frontend

Start the Vite app in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The default API URL is `http://localhost:8000`; it can also be changed from **Backend Endpoint Settings** or set with `VITE_API_BASE_URL`. When the backend is unreachable, the frontend indicates that it is using its offline simulation.

## Selecting Baseline or TabPFN

The **Single Transaction** and **Batch & Dataset** screens provide a model selector. The default **Baseline Ensemble** continues to use the saved Isolation Forest and autoencoder. **TabPFN 3.5** is enabled when its checkpoint, the labeled context CSV, and the `tabpfn` package are available.

TabPFN fits a classifier once on a deterministic sample of 5 fraud and 6,000 legitimate labeled rows from `fraudTest.csv` by default, then adjusts probabilities back to the dataset's observed fraud rate. The total context size can be changed up to 6,005 rows with `TABPFN_CONTEXT_ROWS`; the sample uses up to 5 fraud rows and fills the remainder with legitimate rows. Larger samples can be substantially slower on CPU. The first TabPFN prediction loads the checkpoint and fits the context, so it takes longer than subsequent predictions. By default, device selection uses CUDA only when PyTorch has CUDA support and the GPU has at least 8 GB of memory; otherwise it runs on CPU. The device, context path, and model checkpoint path can be adjusted in `backend/.env`.

Copy `backend/.env.example` to `backend/.env` to configure the local checkpoint. If authentication is required to retrieve a checkpoint, use the official `TABPFN_TOKEN` variable in this ignored file; never put the token in frontend code or commit it. The provided local checkpoint avoids sending transaction records to an external API.

> **Model license:** TabPFN 3.5 weights are provided under a separate non-commercial license. A website/product integration or use in commercial decisions requires a commercial license or API agreement. Review the [official model license guidance](https://docs.priorlabs.ai/models#tabpfn-model-license) before deployment.
