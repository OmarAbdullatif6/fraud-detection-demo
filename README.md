# AegisAI — Real-Time Financial Fraud Detection Platform

A full-stack architecture for deploying AI/ML credit card fraud detection models, benchmarked against the **Kaggle Credit Card Fraud Dataset** (`fraudTest.csv`).

---

## 📁 Repository Structure

```
fraud-detection-demo/
│
├── frontend/                     # ⚛️ React 19 + Vite Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Navigation, branding & live backend connection status
│   │   │   ├── SinglePredictor.jsx # Real-time inference form, presets & animated risk gauge
│   │   │   ├── BatchPredictor.jsx  # CSV batch runner, KPI summary cards & data table
│   │   │   ├── ModelSpecs.jsx    # Model architecture, feature registry & Python integration guide
│   │   │   ├── AuditHistory.jsx  # Session transaction logs with JSON/CSV export
│   │   │   └── BackendModal.jsx  # Backend endpoint config & connection ping tool
│   │   ├── data/
│   │   │   ├── constants.js      # Categories, feature registry, and presets
│   │   │   └── sample_dataset.json # Real sample rows extracted from fraudTest.csv
│   │   ├── services/
│   │   │   └── api.js            # REST client with automated simulation engine fallback
│   │   ├── App.jsx & App.css     # Main application layout & glassmorphic styling
│   │   └── index.css             # FinTech design system variables & animations
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # 🐍 FastAPI service running the trained model
│   ├── Model/                    # Preprocessor, Isolation Forest & autoencoder artifacts
│   ├── main.py                   # Health, single-prediction & batch-prediction endpoints
│   ├── predictor.py              # Feature engineering and ensemble inference
│   ├── requirements.txt          # Backend Python dependencies
│   └── README.md                 # API documentation and setup guide
│
└── fraudTest.csv                 # Benchmark dataset (555,719 rows)
```

---

## 🚀 Getting Started

### 1. Running the React Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser.

> **Offline demo mode**: If the backend is unreachable, the frontend shows locally simulated results. A live result is marked **Python API** and includes model diagnostics.

### 2. Running the trained-model backend

In a second terminal:

```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```

The API starts at `http://localhost:8000`. Open `http://localhost:8000/docs` to inspect the endpoints. With the frontend running at `http://localhost:5173`, single transactions are sent to `POST /api/predict` and batch uploads to `POST /api/batch-predict`. The service validates the request, prepares the model features, runs the Isolation Forest and autoencoder, and returns prediction scores and explanations to the UI.

The trained model artifacts are expected in `backend/Model/`. The frontend endpoint can be changed from **Backend Endpoint Settings**.