import React, { useState } from 'react';
import { 
  X, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, checkBackendStatus } from '../services/api';

export default function BackendModal({ isOpen, onClose, backendStatus, onStatusChange }) {
  const [urlInput, setUrlInput] = useState(getApiBaseUrl());
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndPing = async () => {
    setIsPinging(true);
    setPingResult(null);
    setApiBaseUrl(urlInput);
    const result = await checkBackendStatus();
    setIsPinging(false);
    setPingResult(result);
    if (onStatusChange) {
      onStatusChange(result);
    }
  };

  const starterCode = `# In backend/ directory:
pip install fastapi uvicorn pydantic scikit-learn
python fastapi_app_stub.py
# API will start at http://localhost:8000`;

  const copyCode = () => {
    navigator.clipboard.writeText(starterCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Server size={20} className="text-accent-cyan" />
            </div>
            <div>
              <h3 className="modal-title">AI Backend Integration & Bridge</h3>
              <p className="modal-subtitle">Configure connection to your Python ML inference microservice</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Current Status Box */}
          <div className={`status-banner ${backendStatus.online ? 'status-banner-online' : 'status-banner-simulation'}`}>
            <div className="status-banner-icon">
              {backendStatus.online ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div className="status-banner-text">
              <div className="status-banner-title">
                {backendStatus.online ? 'Python Backend Connected' : 'Local AI Simulation Engine Active'}
              </div>
              <div className="status-banner-desc">
                {backendStatus.online 
                  ? `Live inference stream active via ${backendStatus.url}. Model responses are sourced from FastAPI.`
                  : 'The backend service is currently offline. The React frontend is seamlessly simulating model scoring using historical weights from fraudTest.csv.'}
              </div>
            </div>
          </div>

          {/* Endpoint Input */}
          <div className="form-group" style={{ marginTop: '1.2rem' }}>
            <label className="input-label">Backend API Base URL</label>
            <div className="url-input-row">
              <input 
                type="text" 
                className="input-field font-mono" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8000"
              />
              <button 
                className="btn-primary" 
                onClick={handleSaveAndPing}
                disabled={isPinging}
                style={{ whiteSpace: 'nowrap' }}
              >
                {isPinging ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                <span>Test Connection</span>
              </button>
            </div>
            <span className="input-hint">Default Vite proxy & FastAPI port is http://localhost:8000</span>
          </div>

          {/* Ping Result Alert */}
          {pingResult && (
            <div className={`ping-result-box ${pingResult.online ? 'success' : 'fail'}`}>
              {pingResult.online ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Success! Backend is reachable at {pingResult.url} (Model: {pingResult.details?.service || 'Online'})</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} />
                  <span>Could not reach backend at {pingResult.url}. Continuing in Simulation Mode.</span>
                </>
              )}
            </div>
          )}

          {/* Quick Backend Instructions */}
          <div className="backend-instructions-card">
            <div className="instructions-header">
              <div className="instructions-title">
                <Terminal size={15} />
                <span>Backend Starter Instructions</span>
              </div>
              <button className="copy-btn btn-ghost" onClick={copyCode}>
                {copiedSnippet ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                <span>{copiedSnippet ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <pre className="code-block font-mono">{starterCode}</pre>
            <p className="instructions-note">
              Files are already prepared in the <code>/backend</code> directory with <code>schema.py</code>, <code>fastapi_app_stub.py</code>, and documentation!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
