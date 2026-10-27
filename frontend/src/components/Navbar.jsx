import React from 'react';
import { 
  ShieldAlert, 
  Cpu, 
  FileSpreadsheet, 
  History, 
  Layers, 
  Settings, 
  Wifi, 
  WifiOff, 
  ExternalLink 
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  backendStatus, 
  onOpenSettings,
  historyCount = 0 
}) {
  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand Logo & Model Tag */}
        <div className="brand-group">
          <div className="brand-icon-wrapper">
            <ShieldAlert className="brand-shield" size={26} />
            <div className="pulse-ring"></div>
          </div>
          <div>
            <div className="brand-title-row">
              <span className="brand-title">AEGIS<span className="text-gradient-cyan">.AI</span></span>
              <span className="badge badge-cyan brand-tag">INFERENCE DEPLOYMENT</span>
            </div>
            <div className="brand-subtitle">
              <span>Financial Fraud Detection System</span>
              <span className="brand-dot">•</span>
              <span className="font-mono text-xs">fraudTest.csv ML Engine</span>
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="nav-tabs">
          <button 
            className={`nav-tab-btn ${activeTab === 'single' ? 'active' : ''}`}
            onClick={() => setActiveTab('single')}
            id="tab-single-predict"
          >
            <Cpu size={17} />
            <span>Single Transaction</span>
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
            onClick={() => setActiveTab('batch')}
            id="tab-batch-predict"
          >
            <FileSpreadsheet size={17} />
            <span>Batch & Dataset</span>
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'model' ? 'active' : ''}`}
            onClick={() => setActiveTab('model')}
            id="tab-model-specs"
          >
            <Layers size={17} />
            <span>Model Specs</span>
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            id="tab-audit-history"
          >
            <History size={17} />
            <span>Audit Log</span>
            {historyCount > 0 && (
              <span className="nav-badge-count">{historyCount}</span>
            )}
          </button>
        </nav>

        {/* Right Status & Backend Controls */}
        <div className="nav-actions">
          <button 
            className={`backend-status-pill ${backendStatus.online ? 'online' : 'simulation'}`}
            onClick={onOpenSettings}
            title="Click to configure Python Backend integration"
          >
            {backendStatus.online ? (
              <>
                <span className="status-indicator-dot online"></span>
                <span className="status-label">Backend: Connected</span>
              </>
            ) : (
              <>
                <span className="status-indicator-dot simulation"></span>
                <span className="status-label">Mode: Simulation Active</span>
              </>
            )}
            <Settings size={14} className="settings-icon" />
          </button>
        </div>
      </div>
    </header>
  );
}
