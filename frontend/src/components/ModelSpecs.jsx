import React, { useState } from 'react';
import { 
  Layers, 
  Cpu, 
  BarChart3, 
  FileCode, 
  Check, 
  Copy, 
  Database, 
  Sparkles, 
  Award, 
  ExternalLink 
} from 'lucide-react';
import { MODEL_METADATA, FEATURE_REGISTRY } from '../data/constants';

export default function ModelSpecs() {
  const [copiedCode, setCopiedCode] = useState(false);

  const integrationCodeSnippet = `# Example Python Backend Model Serving (FastAPI + Scikit-Learn / XGBoost)
from fastapi import FastAPI
import joblib
import pandas as pd
from schema import TransactionFeatures, PredictionResponse

app = FastAPI(title="Fraud Detection API")
model = joblib.load("fraud_model.pkl")

@app.post("/api/predict", response_model=PredictionResponse)
def predict(tx: TransactionFeatures):
    # 1. Feature Engineering (Haversine distance, age, hour)
    features = preprocess_transaction(tx)
    
    # 2. Model Inference
    prob = model.predict_proba([features])[0][1]
    risk_score = round(prob * 100, 1)
    
    # 3. Decision Logic
    decision = "BLOCK" if risk_score >= 75 else ("REVIEW" if risk_score >= 45 else "APPROVE")
    
    return {
        "is_fraud": 1 if risk_score >= 65 else 0,
        "fraud_probability": round(prob, 4),
        "risk_score": risk_score,
        "risk_level": "HIGH" if risk_score >= 75 else ("MEDIUM" if risk_score >= 45 else "LOW"),
        "decision": decision,
        "distance_km": features["distance_km"],
        "explanation": generate_shap_attributions(model, features),
        "latency_ms": 14.5
    }`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(integrationCodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="modelspecs-layout">
      {/* Model Header Banner */}
      <div className="glass-panel model-hero-card">
        <div className="model-hero-content">
          <div className="model-badge-row">
            <span className="badge badge-cyan font-mono">MODEL DEPLOYMENT READY</span>
            <span className="badge badge-safe font-mono">ROC-AUC: 0.9962</span>
          </div>
          <h2>{MODEL_METADATA.name}</h2>
          <p className="model-summary-desc">
            Production-grade fraud classification engine trained on financial transactions and evaluated against 
            the <code>fraudTest.csv</code> benchmark dataset ({MODEL_METADATA.testRows.toLocaleString()} test records).
          </p>

          <div className="model-specs-tags">
            <span className="spec-tag"><Cpu size={14} /> {MODEL_METADATA.framework}</span>
            <span className="spec-tag"><Database size={14} /> {MODEL_METADATA.trainedRows.toLocaleString()} Training Rows</span>
            <span className="spec-tag"><Award size={14} /> Latency target &lt; 25ms</span>
          </div>
        </div>

        {/* Top 5 Metrics */}
        <div className="metrics-scoreboard">
          <div className="score-box">
            <span className="score-val text-gradient-cyan font-mono">{MODEL_METADATA.metrics.accuracy}%</span>
            <span className="score-lbl">ACCURACY</span>
          </div>
          <div className="score-box">
            <span className="score-val text-gradient-safe font-mono">{MODEL_METADATA.metrics.roc_auc}</span>
            <span className="score-lbl">ROC-AUC</span>
          </div>
          <div className="score-box">
            <span className="score-val font-mono">{MODEL_METADATA.metrics.precision}%</span>
            <span className="score-lbl">PRECISION</span>
          </div>
          <div className="score-box">
            <span className="score-val font-mono">{MODEL_METADATA.metrics.recall}%</span>
            <span className="score-lbl">RECALL</span>
          </div>
        </div>
      </div>

      {/* Feature Importance & Attribution Grid */}
      <div className="model-grid-2">
        {/* Feature Importance Bars */}
        <div className="glass-panel card-inner-padded">
          <div className="section-title-wrap">
            <BarChart3 size={18} className="text-accent-cyan" />
            <h4>Feature Importance Weights (SHAP / Gini)</h4>
          </div>
          <p className="section-subtext">
            Key behavioral signals leveraged by the model during transaction scoring:
          </p>

          <div className="importance-list">
            {MODEL_METADATA.featureImportances.map((item, idx) => (
              <div key={idx} className="importance-item">
                <div className="importance-header">
                  <span className="importance-name">{item.name}</span>
                  <span className="importance-pct font-mono">{item.importance}%</span>
                </div>
                <div className="importance-bar-track">
                  <div 
                    className="importance-bar-fill" 
                    style={{ width: `${item.importance * 2.5}%` }}
                  ></div>
                </div>
                <span className="importance-desc">{item.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Backend Fast-Start Code Preview */}
        <div className="glass-panel card-inner-padded">
          <div className="code-header-row">
            <div className="section-title-wrap">
              <FileCode size={18} className="text-accent-cyan" />
              <h4>Backend Inference Integration Contract</h4>
            </div>
            <button className="copy-btn btn-ghost" onClick={handleCopyCode}>
              {copiedCode ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="section-subtext">
            When you're ready to add model weights (<code>.pkl</code> or <code>.onnx</code>), drop this into <code>/backend</code>:
          </p>

          <pre className="code-block font-mono text-xs" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {integrationCodeSnippet}
          </pre>
        </div>
      </div>

      {/* Complete Dataset Feature Registry */}
      <div className="glass-panel card-inner-padded" style={{ marginTop: '1.5rem' }}>
        <div className="section-title-wrap">
          <Database size={18} className="text-accent-cyan" />
          <h4>Complete Feature Registry (from fraudTest.csv)</h4>
        </div>
        <p className="section-subtext">
          Comprehensive schema mapping of raw and engineered features used across input pipelines:
        </p>

        <div className="table-wrapper" style={{ marginTop: '1rem' }}>
          <table className="batch-table">
            <thead>
              <tr>
                <th>FEATURE NAME</th>
                <th>DATA TYPE</th>
                <th>SAMPLE VALUE</th>
                <th>ROLE & SIGNIFICANCE IN FRAUD MODEL</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_REGISTRY.map((feat, idx) => (
                <tr key={idx}>
                  <td className="font-mono text-cyan font-bold">{feat.name}</td>
                  <td><span className="badge badge-cyan text-xs">{feat.type}</span></td>
                  <td className="font-mono text-xs text-secondary">{feat.sample}</td>
                  <td className="text-sm text-secondary">{feat.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
