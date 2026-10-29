import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SinglePredictor from './components/SinglePredictor';
import BatchPredictor from './components/BatchPredictor';
import ModelSpecs from './components/ModelSpecs';
import AuditHistory from './components/AuditHistory';
import BackendModal from './components/BackendModal';
import { checkBackendStatus, fetchModelAvailability } from './services/api';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('single');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState({
    online: false,
    details: null,
    url: 'http://localhost:8000'
  });
  const [auditHistory, setAuditHistory] = useState([]);
  const [availableModels, setAvailableModels] = useState(null);

  useEffect(() => {
    checkBackendStatus().then((res) => {
      setBackendStatus(res);
    });
    fetchModelAvailability().then(setAvailableModels).catch((error) => {
      setAvailableModels({
        baseline: { id: 'baseline', available: true },
        tabpfn: { id: 'tabpfn', available: false, reason: error.message }
      });
    });
  }, []);

  const handleBackendStatusChange = (status) => {
    setBackendStatus(status);
    fetchModelAvailability().then(setAvailableModels).catch((error) => {
      setAvailableModels({
        baseline: { id: 'baseline', available: true },
        tabpfn: { id: 'tabpfn', available: false, reason: error.message }
      });
    });
  };

  const handlePredictionComplete = (newTx) => {
    setAuditHistory((prev) => [newTx, ...prev]);
  };

  const handleBatchComplete = (batchSummary) => {
    if (batchSummary?.items) {
      setAuditHistory((prev) => [...batchSummary.items, ...prev]);
    }
  };

  const handleClearHistory = () => {
    setAuditHistory([]);
  };

  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyCount={auditHistory.length}
      />

      {/* Main Content Area */}
      <main className="app-main">
        {activeTab === 'single' && (
          <SinglePredictor
            onPredictionComplete={handlePredictionComplete}
            backendStatus={backendStatus}
            availableModels={availableModels}
          />
        )}

        {activeTab === 'batch' && (
          <BatchPredictor
            onBatchComplete={handleBatchComplete}
            availableModels={availableModels}
          />
        )}

        {activeTab === 'model' && (
          <ModelSpecs />
        )}

        {activeTab === 'history' && (
          <AuditHistory
            history={auditHistory}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>

      {/* Backend Integration & Configuration Modal */}
      <BackendModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        backendStatus={backendStatus}
        onStatusChange={handleBackendStatusChange}
      />

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>AI Fraud Detection System • Samsung Innovation Campus Project</span>
          <span className="footer-sep">|</span>
          <span>Benchmarked on <code>fraudTest.csv</code></span>
          <span className="footer-sep">|</span>
          <button className="footer-link" onClick={() => setIsSettingsOpen(true)}>
            Backend Endpoint Settings
          </button>
        </div>
      </footer>
    </div>
  );
}
