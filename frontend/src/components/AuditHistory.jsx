import React, { useState } from 'react';
import { 
  History, 
  Download, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  FileJson, 
  FileSpreadsheet 
} from 'lucide-react';

export default function AuditHistory({ history = [], onClearHistory }) {
  const [filter, setFilter] = useState('ALL');

  const filteredHistory = history.filter((item) => {
    if (filter === 'FRAUD') return item.prediction?.is_fraud === 1;
    if (filter === 'SAFE') return item.prediction?.is_fraud === 0;
    return true;
  });

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fraud_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = ["Timestamp", "Merchant", "Category", "Amount", "Cardholder", "Distance_km", "Risk_Score", "Decision"];
    const rows = history.map(item => [
      item.trans_date_trans_time || item.timestamp,
      `"${item.merchant}"`,
      item.category,
      item.amt,
      `"${item.first} ${item.last}"`,
      item.prediction?.distance_km || 0,
      item.prediction?.risk_score || 0,
      item.prediction?.decision || "N/A"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fraud_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="audit-history-layout">
      {/* Header Card */}
      <div className="glass-panel audit-header-card">
        <div className="audit-title-group">
          <History size={24} className="text-accent-cyan" />
          <div>
            <h3>Audit Log & Session Activity</h3>
            <p className="audit-desc">
              Immutable ledger of real-time fraud scores evaluated across this operational session.
            </p>
          </div>
        </div>

        <div className="audit-actions-group">
          <button 
            className="btn-secondary"
            onClick={handleExportJSON}
            disabled={history.length === 0}
          >
            <FileJson size={16} />
            <span>Export JSON</span>
          </button>

          <button 
            className="btn-secondary"
            onClick={handleExportCSV}
            disabled={history.length === 0}
          >
            <FileSpreadsheet size={16} />
            <span>Export CSV</span>
          </button>

          <button 
            className="btn-ghost"
            onClick={onClearHistory}
            disabled={history.length === 0}
            style={{ color: 'var(--status-fraud)' }}
          >
            <Trash2 size={16} />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-panel table-container-card">
        <div className="table-controls-bar">
          <span className="font-mono text-xs text-muted">
            Total Logged Events: <strong>{history.length}</strong>
          </span>

          <div className="filter-group">
            <button 
              className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              All Events ({history.length})
            </button>
            <button 
              className={`filter-btn filter-fraud ${filter === 'FRAUD' ? 'active' : ''}`}
              onClick={() => setFilter('FRAUD')}
            >
              Fraud Blocks
            </button>
            <button 
              className={`filter-btn filter-safe ${filter === 'SAFE' ? 'active' : ''}`}
              onClick={() => setFilter('SAFE')}
            >
              Approved
            </button>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="table-empty-state">
            <History size={36} className="text-muted" />
            <p>No transactions evaluated in this session yet.</p>
            <span className="text-xs text-muted">Run single evaluations or batch tests to populate the audit log.</span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="batch-table">
              <thead>
                <tr>
                  <th>TIME</th>
                  <th>MERCHANT</th>
                  <th>CATEGORY</th>
                  <th>AMOUNT</th>
                  <th>CARDHOLDER</th>
                  <th>DISTANCE</th>
                  <th>RISK SCORE</th>
                  <th>DECISION</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, idx) => {
                  const pred = item.prediction;
                  return (
                    <tr key={idx} className={pred && pred.is_fraud === 1 ? 'row-fraud' : ''}>
                      <td className="font-mono text-xs text-muted">
                        {item.trans_date_trans_time || item.timestamp?.slice(11, 19)}
                      </td>
                      <td className="font-bold">{item.merchant}</td>
                      <td>
                        <span className="badge badge-cyan text-xs">{item.category}</span>
                      </td>
                      <td className="font-mono font-bold">${parseFloat(item.amt).toFixed(2)}</td>
                      <td className="text-sm">{item.first} {item.last}</td>
                      <td className="font-mono text-xs">{pred?.distance_km} km</td>
                      <td className="font-mono font-bold">{pred?.risk_score}</td>
                      <td>
                        {pred && (
                          <span className={`badge badge-${pred.decision.toLowerCase()}`}>
                            {pred.decision === 'BLOCK' ? 'FRAUD (BLOCK)' : pred.decision}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
