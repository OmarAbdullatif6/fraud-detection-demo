import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  X, 
  DollarSign, 
  Layers 
} from 'lucide-react';
import { sampleDataset } from '../data/constants';
import { predictBatch, calculateHaversineDistance } from '../services/api';

export default function BatchPredictor({ onBatchComplete }) {
  const [datasetRows, setDatasetRows] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [batchResults, setBatchResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, FRAUD, LEGIT
  const [selectedTxModal, setSelectedTxModal] = useState(null);

  // Quick load from pre-extracted real sample dataset
  const handleLoadSampleDataset = () => {
    const formatted = sampleDataset.map((row, index) => ({
      id: index + 1,
      trans_date_trans_time: row.trans_date_trans_time,
      cc_num: row.cc_num,
      merchant: row.merchant,
      category: row.category,
      amt: parseFloat(row.amt) || 0,
      first: row.first,
      last: row.last,
      gender: row.gender,
      street: row.street,
      city: row.city,
      state: row.state,
      zip: row.zip,
      lat: parseFloat(row.lat) || 0,
      long: parseFloat(row.long) || 0,
      city_pop: parseInt(row.city_pop, 10) || 0,
      job: row.job,
      dob: row.dob,
      trans_num: row.trans_num,
      unix_time: parseInt(row.unix_time, 10) || 0,
      merch_lat: parseFloat(row.merch_lat) || 0,
      merch_long: parseFloat(row.merch_long) || 0,
      ground_truth_is_fraud: row.is_fraud === '1' ? 1 : 0
    }));

    setDatasetRows(formatted);
    setBatchResults(null);
    setErrorMessage('');
  };

  // Handle CSV file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) return;

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const parsed = [];

      for (let i = 1; i < Math.min(lines.length, 100); i++) {
        // Simple regex to handle quoted commas
        const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] ? values[idx].replace(/^"|"$/g, '').trim() : '';
        });

        parsed.push({
          id: i,
          trans_date_trans_time: row.trans_date_trans_time || '',
          cc_num: row.cc_num || '',
          merchant: row.merchant || 'Unknown Merchant',
          category: row.category || 'misc_pos',
          amt: parseFloat(row.amt) || 0,
          first: row.first || '',
          last: row.last || '',
          gender: row.gender || 'M',
          street: row.street || '',
          city: row.city || '',
          state: row.state || '',
          zip: row.zip || '',
          lat: parseFloat(row.lat) || 0,
          long: parseFloat(row.long) || 0,
          city_pop: parseInt(row.city_pop, 10) || 0,
          job: row.job || '',
          dob: row.dob || '',
          trans_num: row.trans_num || '',
          unix_time: parseInt(row.unix_time, 10) || 0,
          merch_lat: parseFloat(row.merch_lat) || 0,
          merch_long: parseFloat(row.merch_long) || 0,
          ground_truth_is_fraud: row.is_fraud === '1' ? 1 : 0
        });
      }

      setDatasetRows(parsed);
      setBatchResults(null);
      setErrorMessage('');
    };

    reader.readAsText(file);
  };

  // Run predictions on all loaded rows
  const handleRunBatch = async () => {
    if (datasetRows.length === 0) return;
    setIsRunning(true);
    setErrorMessage('');

    try {
      const summary = await predictBatch(datasetRows);
      setBatchResults(summary);
      if (onBatchComplete) {
        onBatchComplete(summary);
      }
    } catch (err) {
      setBatchResults(null);
      setErrorMessage(err.message || 'Batch prediction failed. Check the backend service and try again.');
    } finally {
      setIsRunning(false);
    }
  };

  // Filter items
  const itemsToDisplay = batchResults ? batchResults.items : datasetRows;
  const filteredList = itemsToDisplay.filter((item) => {
    const matchesSearch = 
      (item.merchant && item.merchant.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.first && item.first.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.last && item.last.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'FRAUD') {
      return item.prediction ? item.prediction.is_fraud === 1 : item.ground_truth_is_fraud === 1;
    }
    if (filterType === 'LEGIT') {
      return item.prediction ? item.prediction.is_fraud === 0 : item.ground_truth_is_fraud === 0;
    }
    return true;
  });

  return (
    <div className="batch-predictor-layout">
      {/* Top Action Box */}
      <div className="glass-panel batch-header-card">
        <div className="batch-intro">
          <div className="batch-title-row">
            <FileSpreadsheet className="text-accent-cyan" size={24} />
            <h3>Batch Processing & Dataset Testing</h3>
          </div>
          <p className="batch-desc">
            Test model inference against multiple transactions from <code>fraudTest.csv</code> or upload a custom test batch.
          </p>
        </div>

        <div className="batch-actions-cluster">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={handleLoadSampleDataset}
            id="btn-load-sample-dataset"
          >
            <Layers size={16} />
            <span>Load 16 Sample Rows</span>
          </button>

          <label className="btn-secondary upload-label">
            <Upload size={16} />
            <span>Upload CSV File</span>
            <input 
              type="file" 
              accept=".csv" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload}
            />
          </label>

          <button 
            type="button" 
            className="btn-primary" 
            disabled={datasetRows.length === 0 || isRunning}
            onClick={handleRunBatch}
            id="btn-run-batch-inference"
          >
            {isRunning ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Evaluating {datasetRows.length} Rows...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Run Batch Inference ({datasetRows.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="ping-result-box fail" role="alert">
          <AlertTriangle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Metrics Dashboard (When results available) */}
      {batchResults && (
        <div className="batch-kpi-grid">
          <div className="glass-panel kpi-card">
            <span className="kpi-label">TOTAL PROCESSED</span>
            <span className="kpi-value font-mono">{batchResults.total}</span>
            <span className="kpi-sub">Transactions Evaluated</span>
          </div>

          <div className="glass-panel kpi-card kpi-fraud">
            <span className="kpi-label">FRAUD DETECTED</span>
            <span className="kpi-value text-gradient-fraud font-mono">
              {batchResults.fraudCount}
            </span>
            <span className="kpi-sub font-mono">{batchResults.fraudRate}% Fraud Incidence</span>
          </div>

          <div className="glass-panel kpi-card kpi-safe">
            <span className="kpi-label">CLEAN / APPROVED</span>
            <span className="kpi-value text-gradient-safe font-mono">
              {batchResults.cleanCount}
            </span>
            <span className="kpi-sub font-mono">{(100 - batchResults.fraudRate).toFixed(1)}% Approved Rate</span>
          </div>

          <div className="glass-panel kpi-card kpi-alert">
            <span className="kpi-label">TOTAL VOLUME FLAGGED</span>
            <span className="kpi-value font-mono">
              ${parseFloat(batchResults.flaggedAmount).toLocaleString()}
            </span>
            <span className="kpi-sub">High-Risk Exposure Prevented</span>
          </div>
        </div>
      )}

      {/* Table & Controls Section */}
      <div className="glass-panel table-container-card">
        {/* Table Filters Header */}
        <div className="table-controls-bar">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="search-input"
              placeholder="Search merchant, cardholder, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <span className="filter-label"><Filter size={14} /> Filter:</span>
            <button 
              className={`filter-btn ${filterType === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              All ({itemsToDisplay.length})
            </button>
            <button 
              className={`filter-btn filter-fraud ${filterType === 'FRAUD' ? 'active' : ''}`}
              onClick={() => setFilterType('FRAUD')}
            >
              Flagged Fraud
            </button>
            <button 
              className={`filter-btn filter-safe ${filterType === 'LEGIT' ? 'active' : ''}`}
              onClick={() => setFilterType('LEGIT')}
            >
              Legitimate
            </button>
          </div>
        </div>

        {/* Data Table */}
        {filteredList.length === 0 ? (
          <div className="table-empty-state">
            <Layers size={36} className="text-muted" />
            <p>No rows loaded. Click <strong>"Load 16 Sample Rows"</strong> or upload a CSV file above.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="batch-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>TIMESTAMP</th>
                  <th>CARDHOLDER</th>
                  <th>MERCHANT</th>
                  <th>CATEGORY</th>
                  <th>AMOUNT</th>
                  <th>DISTANCE</th>
                  <th>AI DECISION</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row, idx) => {
                  const dist = calculateHaversineDistance(row.lat, row.long, row.merch_lat, row.merch_long);
                  const pred = row.prediction;
                  const isFraud = pred ? pred.is_fraud === 1 : row.ground_truth_is_fraud === 1;

                  return (
                    <tr key={idx} className={pred && pred.is_fraud === 1 ? 'row-fraud' : ''}>
                      <td className="font-mono text-muted">{idx + 1}</td>
                      <td className="font-mono text-xs text-secondary">
                        {row.trans_date_trans_time || '—'}
                      </td>
                      <td>
                        <span className="table-name">{row.first} {row.last}</span>
                        <span className="table-sub text-muted font-mono">{row.city}, {row.state}</span>
                      </td>
                      <td>
                        <span className="table-merchant">{row.merchant}</span>
                      </td>
                      <td>
                        <span className="badge badge-cyan text-xs">
                          {row.category}
                        </span>
                      </td>
                      <td className="font-mono font-bold">
                        ${parseFloat(row.amt).toFixed(2)}
                      </td>
                      <td className="font-mono text-xs">
                        {dist.toLocaleString()} km
                      </td>
                      <td>
                        {pred ? (
                          <span className={`badge badge-${pred.decision.toLowerCase()}`}>
                            {pred.decision === 'BLOCK' ? 'FRAUD (BLOCK)' : pred.decision} • {pred.risk_score}
                          </span>
                        ) : (
                          <span className="badge font-mono text-muted">
                            Pending Eval (Label: {row.ground_truth_is_fraud})
                          </span>
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn-ghost inspect-btn"
                          onClick={() => setSelectedTxModal(row)}
                          title="Inspect transaction features"
                        >
                          <Eye size={15} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row Inspection Modal */}
      {selectedTxModal && (
        <div className="modal-backdrop" onClick={() => setSelectedTxModal(null)}>
          <div className="modal-window glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge">
                  <ShieldAlert size={20} className="text-accent-cyan" />
                </div>
                <div>
                  <h3 className="modal-title">Transaction Feature Inspection</h3>
                  <span className="font-mono text-xs text-muted">Ref: {selectedTxModal.trans_num || 'N/A'}</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedTxModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="inspection-grid">
                <div className="inspect-field">
                  <span className="inspect-label">Amount:</span>
                  <span className="inspect-val font-mono text-gradient-cyan font-bold">${parseFloat(selectedTxModal.amt).toFixed(2)}</span>
                </div>
                <div className="inspect-field">
                  <span className="inspect-label">Merchant:</span>
                  <span className="inspect-val">{selectedTxModal.merchant}</span>
                </div>
                <div className="inspect-field">
                  <span className="inspect-label">Category:</span>
                  <span className="inspect-val badge badge-cyan">{selectedTxModal.category}</span>
                </div>
                <div className="inspect-field">
                  <span className="inspect-label">Cardholder:</span>
                  <span className="inspect-val">{selectedTxModal.first} {selectedTxModal.last} ({selectedTxModal.gender})</span>
                </div>
                <div className="inspect-field">
                  <span className="inspect-label">Card Number:</span>
                  <span className="inspect-val font-mono">{selectedTxModal.cc_num}</span>
                </div>
                <div className="inspect-field">
                  <span className="inspect-label">Billing Location:</span>
                  <span className="inspect-val">{selectedTxModal.street}, {selectedTxModal.city}, {selectedTxModal.state} {selectedTxModal.zip}</span>
                </div>
                <div className="inspect-field">
                  <span className="inspect-label">Cardholder GPS:</span>
                  <span className="inspect-val font-mono">{selectedTxModal.lat}, {selectedTxModal.long}</span>
                </div>
                <div className="inspect-field">
                  <span className="inspect-label">Merchant GPS:</span>
                  <span className="inspect-val font-mono">{selectedTxModal.merch_lat}, {selectedTxModal.merch_long}</span>
                </div>
                <div className="inspect-field">
                  <span className="inspect-label">Distance to POS:</span>
                  <span className="inspect-val font-mono font-bold">
                    {calculateHaversineDistance(selectedTxModal.lat, selectedTxModal.long, selectedTxModal.merch_lat, selectedTxModal.merch_long)} km
                  </span>
                </div>
                <div className="inspect-field">
                  <span className="inspect-label">City Population:</span>
                  <span className="inspect-val font-mono">{(selectedTxModal.city_pop || 0).toLocaleString()}</span>
                </div>
              </div>

              {selectedTxModal.prediction && (
                <div className="inspect-prediction-box">
                  <div className="inspect-pred-header">
                    <span>AI Model Evaluation:</span>
                    <span className={`badge badge-${selectedTxModal.prediction.decision.toLowerCase()}`}>
                      {selectedTxModal.prediction.decision} • Score: {selectedTxModal.prediction.risk_score}
                    </span>
                  </div>
                  <div className="factors-list" style={{ marginTop: '0.8rem' }}>
                    {selectedTxModal.prediction.explanation?.map((fac, i) => (
                      <div key={i} className={`factor-item factor-${fac.severity}`}>
                        <span>{fac.factor}</span>
                        <span className={`factor-impact impact-${fac.severity}`}>{fac.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedTxModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
