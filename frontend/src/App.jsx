import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SinglePredictor from './components/SinglePredictor';
import BatchPredictor from './components/BatchPredictor';
import ModelSpecs from './components/ModelSpecs';
import AuditHistory from './components/AuditHistory';
import BackendModal from './components/BackendModal';
import { checkBackendStatus } from './services/api';
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

  // Check backend health on initial load
  useEffect(() => {
    checkBackendStatus().then((res) => {
      setBackendStatus(res);
    });
  }, []);

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
          />
        )}

        {activeTab === 'batch' && (
          <BatchPredictor
            onBatchComplete={handleBatchComplete}
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
        onStatusChange={(status) => setBackendStatus(status)}
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
