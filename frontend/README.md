# Fraud Detection Frontend

## Run

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Start the Python service in a separate terminal by following [`../backend/README.md`](../backend/README.md).

Choose **Baseline Ensemble** or **TabPFN 3.5** on the single-transaction or batch screen. Single predictions are posted to `POST /api/predict`; batch predictions are posted together to `POST /api/batch-predict`. The default backend URL is `http://localhost:8000` and can be changed in **Backend Endpoint Settings** or with `VITE_API_BASE_URL`. Backend validation and inference errors are shown in the app. If no backend can be reached, the app indicates its offline simulation mode. See [`../backend/README.md`](../backend/README.md) for TabPFN checkpoint, context data, and licensing requirements.
