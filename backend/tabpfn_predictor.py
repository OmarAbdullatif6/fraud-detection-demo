import importlib.util
import json
import logging
import os
import threading
import time
from pathlib import Path

import numpy as np
import pandas as pd


BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
DEFAULT_MODEL_PATH = BACKEND_DIR / "Model" / "tabpfn-v3.5-20260909.safetensors"
DEFAULT_CONTEXT_PATH = ROOT_DIR / "fraudTest.csv"
DEFAULT_FALLBACK_SAMPLE_PATH = ROOT_DIR / "frontend" / "src" / "data" / "sample_dataset.json"
CONTEXT_COLUMNS = [
    "trans_date_trans_time",
    "category",
    "amt",
    "gender",
    "state",
    "lat",
    "long",
    "city_pop",
    "dob",
    "merch_lat",
    "merch_long",
    "is_fraud",
]
MAX_CONTEXT_ROWS = 10000
DEFAULT_FRAUD_ROWS = 10
DEFAULT_LEGITIMATE_ROWS = 5000
DEFAULT_CONTEXT_ROWS = 5010
logger = logging.getLogger(__name__)


class TabPFNUnavailableError(RuntimeError):
    pass


class TabPFNPredictor:
    def __init__(self, baseline_predictor):
        self.baseline_predictor = baseline_predictor
        self.model_path = self._configured_path("TABPFN_MODEL_PATH", DEFAULT_MODEL_PATH)
        self.context_path = self._configured_path("TABPFN_CONTEXT_CSV", DEFAULT_CONTEXT_PATH)
        self._classifier = None
        self._device = None
        self._context_rows = 0
        self._fraud_context_rows = 0
        self._training_fraud_prior = 0.0
        self._context_fraud_prior = 0.0
        self._load_lock = threading.Lock()
        self._predict_lock = threading.Lock()

    @staticmethod
    def _configured_path(setting, default):
        configured = os.getenv(setting)
        path = Path(configured) if configured else Path(default)
        return path if path.is_absolute() else BACKEND_DIR / path

    def availability(self):
        token = os.getenv("TABPFN_TOKEN", "").strip()
        has_client = importlib.util.find_spec("tabpfn_client") is not None
        has_local_tabpfn = importlib.util.find_spec("tabpfn") is not None
        has_local_model = self.model_path.is_file()
        has_context = self.context_path.is_file() or DEFAULT_FALLBACK_SAMPLE_PATH.is_file()

        reasons = []

        # Cloud API Mode (Preferred when token is set)
        if token:
            if not has_client and not has_local_tabpfn:
                reasons.append("Install tabpfn-client (pip install tabpfn-client) to enable TabPFN Cloud API.")
            if not has_context:
                reasons.append(f"Labeled context CSV not found: {self.context_path}")
        # Local Mode (Fallback when local model checkpoint exists)
        elif has_local_model and has_local_tabpfn:
            if not has_context:
                reasons.append(f"Labeled context CSV not found: {self.context_path}")
        # Not configured
        else:
            reasons.append(
                "TabPFN API key not configured. Set TABPFN_TOKEN in backend/.env "
                "(get a free key at https://platform.priorlabs.ai) or place local model weights in Model/."
            )

        result = {"available": not reasons}
        if reasons:
            result["reason"] = " ".join(reasons)
        elif self._classifier is not None:
            result.update({
                "loaded": True,
                "device": self._device,
                "context_rows": self._context_rows,
            })
        else:
            result["loaded"] = False
        return result

    def _select_device(self):
        requested = os.getenv("TABPFN_DEVICE", "auto").lower()
        if requested not in {"auto", "cpu", "cuda"}:
            raise TabPFNUnavailableError("TABPFN_DEVICE must be auto, cpu, or cuda.")
        if requested == "cpu":
            return "cpu"

        import torch

        if requested == "cuda" and not torch.cuda.is_available():
            raise TabPFNUnavailableError(
                "CUDA was requested, but the installed PyTorch does not have CUDA support."
            )
        if torch.cuda.is_available():
            memory_bytes = torch.cuda.get_device_properties(0).total_memory
            if requested == "cuda" or memory_bytes >= 8 * 1024**3:
                return "cuda"
        return "cpu"

    def _load_context(self):
        try:
            fraud_target = int(os.getenv("TABPFN_FRAUD_ROWS", str(DEFAULT_FRAUD_ROWS)))
        except ValueError:
            fraud_target = DEFAULT_FRAUD_ROWS

        try:
            legitimate_target = int(os.getenv("TABPFN_LEGITIMATE_ROWS", str(DEFAULT_LEGITIMATE_ROWS)))
        except ValueError:
            legitimate_target = DEFAULT_LEGITIMATE_ROWS

        default_limit = fraud_target + legitimate_target
        try:
            context_limit = int(os.getenv("TABPFN_CONTEXT_ROWS", str(default_limit)))
        except ValueError as exc:
            raise TabPFNUnavailableError("TABPFN_CONTEXT_ROWS must be an integer.") from exc

        if context_limit < 2 or context_limit > MAX_CONTEXT_ROWS:
            raise TabPFNUnavailableError(
                f"TABPFN_CONTEXT_ROWS must be between 2 and {MAX_CONTEXT_ROWS}."
            )

        if self.context_path.is_file():
            try:
                data = pd.read_csv(self.context_path, usecols=CONTEXT_COLUMNS)
            except (OSError, ValueError, pd.errors.ParserError) as exc:
                raise TabPFNUnavailableError(
                    f"Could not load TabPFN context data from {self.context_path}."
                ) from exc
        elif DEFAULT_FALLBACK_SAMPLE_PATH.is_file():
            try:
                with open(DEFAULT_FALLBACK_SAMPLE_PATH, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                data = pd.DataFrame(raw_data)
                data = data[[col for col in CONTEXT_COLUMNS if col in data.columns]]
            except Exception as exc:
                raise TabPFNUnavailableError(
                    f"Could not load fallback TabPFN context data from {DEFAULT_FALLBACK_SAMPLE_PATH}."
                ) from exc
        else:
            raise TabPFNUnavailableError(
                f"TabPFN context data not found at {self.context_path} or fallback sample."
            )

        labels = pd.to_numeric(data.pop("is_fraud"), errors="raise").astype(int)
        if labels.nunique() != 2:
            raise TabPFNUnavailableError(
                "TabPFN context data must contain both legitimate and fraud labels."
            )
        self._training_fraud_prior = float(labels.mean())
        fraud_rows = data.loc[labels == 1]
        legitimate_rows = data.loc[labels == 0]

        fraud_count = min(fraud_target, len(fraud_rows))
        max_legitimate_allowed = max(context_limit - fraud_count, 1)
        legitimate_count = min(legitimate_target, len(legitimate_rows), max_legitimate_allowed)

        if fraud_count < 1 or legitimate_count < 1:
            raise TabPFNUnavailableError(
                "TabPFN context data does not contain enough fraud and legitimate rows."
            )

        sampled = pd.concat([
            fraud_rows.sample(n=fraud_count, random_state=42),
            legitimate_rows.sample(n=legitimate_count, random_state=42),
        ])
        data = sampled.sample(frac=1, random_state=42)
        labels = labels.loc[data.index]

        self._context_fraud_prior = float(labels.mean())
        feature_rows = [
            self.baseline_predictor.preprocess_record(record)[0].iloc[0].to_dict()
            for record in data.to_dict(orient="records")
        ]
        features = pd.DataFrame(
            feature_rows,
            columns=self.baseline_predictor.feature_columns,
        )
        return features, labels.reset_index(drop=True)

    def _get_classifier(self):
        if self._classifier is not None:
            return self._classifier

        with self._load_lock:
            if self._classifier is not None:
                return self._classifier
            availability = self.availability()
            if not availability["available"]:
                raise TabPFNUnavailableError(availability["reason"])

            token = os.getenv("TABPFN_TOKEN", "").strip()
            features, labels = self._load_context()

            try:
                if token:
                    # Cloud API Mode (Prior Labs)
                    import tabpfn_client
                    from tabpfn_client import TabPFNClassifier
                    tabpfn_client.set_access_token(token)
                    try:
                        tabpfn_client.init()
                    except Exception:
                        pass
                    classifier = TabPFNClassifier(random_state=42)
                    classifier.fit(features, labels)
                    device = "cloud-api"
                else:
                    # Local Checkpoint Mode
                    from tabpfn import TabPFNClassifier
                    device = self._select_device()
                    classifier = TabPFNClassifier(
                        model_path=str(self.model_path),
                        device=device,
                        n_estimators=1,
                        n_preprocessing_jobs=1,
                        random_state=42,
                    )
                    classifier.fit(features, labels)
            except TabPFNUnavailableError:
                raise
            except Exception as exc:
                logger.exception("Could not initialize TabPFN")
                raise TabPFNUnavailableError(
                    f"TabPFN could not be initialized: {exc}. "
                    "Check your TABPFN_TOKEN or local model checkpoint."
                ) from exc

            self._classifier = classifier
            self._device = device
            self._context_rows = len(labels)
            self._fraud_context_rows = int(labels.sum())
            return self._classifier

    def predict_one(self, transaction):
        return self.predict_batch([transaction])[0]

    def predict_batch(self, transactions):
        classifier = self._get_classifier()
        feature_rows = []
        telemetry = []
        for transaction in transactions:
            features, distance_km, age = self.baseline_predictor.preprocess_record(transaction)
            feature_rows.append(features.iloc[0].to_dict())
            telemetry.append((distance_km, age))

        model_input = pd.DataFrame(
            feature_rows,
            columns=self.baseline_predictor.feature_columns,
        )
        fraud_class_index = list(classifier.classes_).index(1)
        start_time = time.perf_counter()
        with self._predict_lock:
            raw_probabilities = classifier.predict_proba(model_input)[:, fraud_class_index]
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        context_odds = max(self._context_fraud_prior, 1e-6) / max(1 - self._context_fraud_prior, 1e-6)
        training_odds = max(self._training_fraud_prior, 1e-6) / max(1 - self._training_fraud_prior, 1e-6)
        prior_correction = training_odds / context_odds
        probabilities = (raw_probabilities * prior_correction) / (
            (raw_probabilities * prior_correction) + (1 - raw_probabilities)
        )
        results = []

        for transaction, probability, (distance_km, age) in zip(
            transactions,
            probabilities,
            telemetry,
        ):
            fraud_probability = float(np.clip(probability, 0.0, 1.0))
            risk_score = round(fraud_probability * 100, 1)
            is_fraud = int(fraud_probability >= 0.5)
            risk_level = "HIGH" if risk_score >= 75 else "MEDIUM" if risk_score >= 45 else "LOW"
            decision = "BLOCK" if risk_score >= 75 else "REVIEW" if risk_score >= 45 else "APPROVE"
            severity = "high" if risk_score >= 75 else "medium" if risk_score >= 45 else "safe"

            results.append({
                "is_fraud": is_fraud,
                "fraud_probability": round(fraud_probability, 4),
                "risk_score": risk_score,
                "risk_level": risk_level,
                "decision": decision,
                "distance_km": round(float(distance_km), 1),
                "cardholder_age": age,
                "explanation": [{
                    "factor": "TabPFN probability from labeled transaction context",
                    "impact": f"{risk_score:.1f}%",
                    "severity": severity,
                }],
                "latency_ms": latency_ms,
                "model_diagnostics": {
                    "model": "TabPFN 3.5 (Cloud API)" if self._device == "cloud-api" else "TabPFN 3.5",
                    "context_rows": self._context_rows,
                    "fraud_context_rows": self._fraud_context_rows,
                    "context_fraud_prior": round(self._context_fraud_prior, 6),
                    "training_fraud_prior": round(self._training_fraud_prior, 6),
                    "device": self._device,
                },
            })

        return results
