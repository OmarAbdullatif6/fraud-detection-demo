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
├── backend/                      # 🐍 Python ML Inference Service Contract (Prepared for later)
│   ├── README.md                 # API documentation, endpoint schemas & quick-start guide
│   ├── schema.py                 # Pydantic v2 data models matching fraudTest.csv features
│   ├── fastapi_app_stub.py       # Ready-to-use FastAPI starter microservice
│   └── sample_payload.json       # Example request payloads
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

> **💡 Offline Simulation Active**: The frontend works 100% out-of-the-box! Even without the backend running, the built-in AI simulation engine evaluates transactions using realistic mathematical heuristics and weights derived from `fraudTest.csv`.

---

### 2. Connecting the Backend (When you are ready)

In a separate terminal:

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Install requirements:
pip install fastapi uvicorn pydantic scikit-learn
# Run starter API:
python fastapi_app_stub.py
```

The frontend will automatically detect the backend at `http://localhost:8000` and switch the connection indicator from **"Simulation Mode Active"** to **"Backend: Connected"**.