import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  MapPin, 
  DollarSign, 
  CreditCard, 
  User, 
  Clock, 
  Layers, 
  Activity, 
  Shuffle, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { 
  CATEGORIES, 
  PRESETS, 
  sampleDataset 
} from '../data/constants';
import { 
  calculateHaversineDistance, 
  calculateAge, 
  predictTransaction 
} from '../services/api';

export default function SinglePredictor({ onPredictionComplete, backendStatus }) {
  // Initial transaction state initialized from first preset
  const [formData, setFormData] = useState(PRESETS[0].data);
  const [activePresetId, setActivePresetId] = useState(PRESETS[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [distanceKm, setDistanceKm] = useState(0);
  const [cardholderAge, setCardholderAge] = useState(null);

  // Recalculate distance and age whenever coordinates or DOB change
  useEffect(() => {
    const dist = calculateHaversineDistance(
      parseFloat(formData.lat) || 0,
      parseFloat(formData.long) || 0,
      parseFloat(formData.merch_lat) || 0,
      parseFloat(formData.merch_long) || 0
    );
    setDistanceKm(dist);

    const age = calculateAge(formData.dob, formData.trans_date_trans_time);
    setCardholderAge(age);
  }, [formData.lat, formData.long, formData.merch_lat, formData.merch_long, formData.dob, formData.trans_date_trans_time]);

  // Load preset scenario
  const applyPreset = (preset) => {
    setFormData(preset.data);
    setActivePresetId(preset.id);
    setPrediction(null);
    setErrorMessage('');
  };

  // Pick random row from real dataset samples
  const applyRandomSample = () => {
    const randomIndex = Math.floor(Math.random() * sampleDataset.length);
    const sample = sampleDataset[randomIndex];
    const converted = {
      trans_date_trans_time: sample.trans_date_trans_time,
      cc_num: sample.cc_num,
      merchant: sample.merchant,
      category: sample.category,
      amt: parseFloat(sample.amt),
      first: sample.first,
      last: sample.last,
      gender: sample.gender,
      street: sample.street,
      city: sample.city,
      state: sample.state,
      zip: sample.zip,
      lat: parseFloat(sample.lat),
      long: parseFloat(sample.long),
      city_pop: parseInt(sample.city_pop, 10),
      job: sample.job,
      dob: sample.dob,
      trans_num: sample.trans_num,
      unix_time: parseInt(sample.unix_time, 10),
      merch_lat: parseFloat(sample.merch_lat),
      merch_long: parseFloat(sample.merch_long)
    };
    setFormData(converted);
    setActivePresetId(null);
    setPrediction(null);
    setErrorMessage('');
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    setActivePresetId(null);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await predictTransaction(formData);
      setPrediction(result);
      if (onPredictionComplete) {
        onPredictionComplete({
          ...formData,
          prediction: result,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      setPrediction(null);
      setErrorMessage(err.message || 'Prediction failed. Check the backend service and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for masked card number
  const formatCardNumber = (num) => {
    if (!num) return '•••• •••• •••• ••••';
    const str = String(num).replace(/\s+/g, '');
    const last4 = str.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  return (
    <div className="single-predictor-layout">
      {/* Top Presets Bar */}
      <div className="presets-bar glass-panel">
        <div className="presets-header">
          <div className="presets-title">
            <Sparkles size={16} className="text-accent-cyan" />
            <span>Demonstration Scenarios (from fraudTest.csv):</span>
          </div>
          <button 
            type="button" 
            className="btn-ghost random-btn" 
            onClick={applyRandomSample}
            title="Load random real row from dataset"
          >
            <Shuffle size={14} />
            <span>Random Dataset Row</span>
          </button>
        </div>
        <div className="preset-chips">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-chip ${activePresetId === preset.id ? 'active' : ''} preset-${preset.riskType}`}
              onClick={() => applyPreset(preset)}
            >
              <span className={`chip-dot ${preset.riskType}`}></span>
              <span className="chip-text">{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="predictor-main-grid">
        {/* Left Form Panel */}
        <form className="glass-panel form-container" onSubmit={handleSubmit}>
          <div className="form-section-header">
            <div className="section-title-wrap">
              <CreditCard size={18} className="text-accent-cyan" />
              <h4>Transaction Details</h4>
            </div>
            <span className="badge badge-cyan font-mono">16 Features</span>
          </div>

          <div className="form-grid-2">
            {/* Amount */}
            <div className="form-group">
              <label className="input-label">Transaction Amount (USD $)</label>
              <div className="input-with-icon">
                <DollarSign size={16} className="field-icon" />
                <input
                  type="number"
                  step="0.01"
                  required
                  className="input-field font-mono"
                  value={formData.amt}
                  onChange={(e) => handleInputChange('amt', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="input-label">Merchant Category</label>
              <select
                className="input-field"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({cat.value})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            {/* Merchant */}
            <div className="form-group">
              <label className="input-label">Merchant Name</label>
              <input
                type="text"
                className="input-field"
                value={formData.merchant}
                onChange={(e) => handleInputChange('merchant', e.target.value)}
                placeholder="e.g. fraud_Kirlin and Sons"
              />
            </div>

            {/* Date & Time */}
            <div className="form-group">
              <label className="input-label">Date & Time</label>
              <div className="input-with-icon">
                <Clock size={16} className="field-icon" />
                <input
                  type="text"
                  className="input-field font-mono"
                  value={formData.trans_date_trans_time}
                  onChange={(e) => handleInputChange('trans_date_trans_time', e.target.value)}
                  placeholder="YYYY-MM-DD HH:MM:SS"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Cardholder Profile */}
          <div className="form-divider"></div>
          <div className="form-section-header">
            <div className="section-title-wrap">
              <User size={18} className="text-accent-cyan" />
              <h4>Cardholder Profile</h4>
            </div>
            {cardholderAge !== null && (
              <span className="badge badge-cyan font-mono">Age: {cardholderAge} yrs</span>
            )}
          </div>

          <div className="form-grid-3">
            {/* Name */}
            <div className="form-group">
              <label className="input-label">First Name</label>
              <input
                type="text"
                className="input-field"
                value={formData.first}
                onChange={(e) => handleInputChange('first', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="input-label">Last Name</label>
              <input
                type="text"
                className="input-field"
                value={formData.last}
                onChange={(e) => handleInputChange('last', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="input-label">Gender</label>
              <select
                className="input-field"
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
              >
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
              </select>
            </div>
          </div>

          <div className="form-grid-3">
            {/* Card Number */}
            <div className="form-group">
              <label className="input-label">Card Number (Masked)</label>
              <input
                type="text"
                className="input-field font-mono"
                value={formData.cc_num}
                onChange={(e) => handleInputChange('cc_num', e.target.value)}
                placeholder="Credit Card Number"
              />
            </div>

            {/* DOB */}
            <div className="form-group">
              <label className="input-label">Date of Birth</label>
              <input
                type="date"
                className="input-field font-mono"
                value={formData.dob}
                onChange={(e) => handleInputChange('dob', e.target.value)}
              />
            </div>

            {/* Job */}
            <div className="form-group">
              <label className="input-label">Occupation / Job</label>
              <input
                type="text"
                className="input-field"
                value={formData.job}
                onChange={(e) => handleInputChange('job', e.target.value)}
                placeholder="e.g. Cytogeneticist"
              />
            </div>
          </div>

          {/* Section 3: Geolocation Telemetry */}
          <div className="form-divider"></div>
          <div className="form-section-header">
            <div className="section-title-wrap">
              <MapPin size={18} className="text-accent-cyan" />
              <h4>Spatial Coordinates & Geolocation</h4>
            </div>
            <div className={`distance-metric-badge ${distanceKm > 500 ? 'dist-anomaly' : 'dist-normal'}`}>
              <span>Distance: {distanceKm.toLocaleString()} km</span>
            </div>
          </div>

          <div className="geo-fields-box">
            {/* Cardholder location */}
            <div className="geo-column">
              <div className="geo-col-title">Cardholder Home Coordinates</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="input-label">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="input-field font-mono"
                    value={formData.lat}
                    onChange={(e) => handleInputChange('lat', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="input-field font-mono"
                    value={formData.long}
                    onChange={(e) => handleInputChange('long', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="form-grid-3" style={{ marginTop: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="City"
                  className="input-field text-xs"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="State"
                  className="input-field text-xs"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Zip"
                  className="input-field text-xs"
                  value={formData.zip}
                  onChange={(e) => handleInputChange('zip', e.target.value)}
                />
              </div>
            </div>

            {/* Merchant location */}
            <div className="geo-column">
              <div className="geo-col-title">Merchant Point-of-Sale Coordinates</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="input-label">Merch Lat</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="input-field font-mono"
                    value={formData.merch_lat}
                    onChange={(e) => handleInputChange('merch_lat', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Merch Long</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="input-field font-mono"
                    value={formData.merch_long}
                    onChange={(e) => handleInputChange('merch_long', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="city-pop-info">
                <span>City Population: <strong>{(formData.city_pop || 0).toLocaleString()}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="form-actions-row">
            <button 
              type="submit" 
              className="btn-primary evaluate-btn"
              disabled={isSubmitting}
              id="btn-evaluate-transaction"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Running AI Inference...</span>
                </>
              ) : (
                <>
                  <Activity size={18} />
                  <span>Evaluate with AI Model</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Prediction Results Panel */}
        <div className="results-panel glass-panel">
          <div className="results-header">
            <h4>Inference & Risk Assessment</h4>
            {prediction && (
              <span className="badge badge-cyan font-mono">
                {prediction.latency_ms} ms Latency
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="ping-result-box fail" role="alert">
              <AlertTriangle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {!prediction ? (
            <div className="results-empty-state">
              <div className="empty-icon-shield">
                <ShieldAlert size={48} className="text-accent-cyan" />
              </div>
              <h5>Ready for Evaluation</h5>
              <p>
                Select a preset scenario above or configure the transaction details, then click <strong>"Evaluate with AI Model"</strong>.
              </p>
              <div className="empty-hints">
                <div className="hint-pill">✓ Spatial Haversine Distance</div>
                <div className="hint-pill">✓ Category Propensity</div>
                <div className="hint-pill">✓ Nocturnal Timing Detection</div>
              </div>
            </div>
          ) : (
            <div className="prediction-content">
              {/* Decision Banner */}
              <div className={`decision-banner decision-${prediction.decision.toLowerCase()}`}>
                <div className="decision-icon">
                  {prediction.decision === 'BLOCK' ? (
                    <ShieldAlert size={32} />
                  ) : prediction.decision === 'REVIEW' ? (
                    <AlertTriangle size={32} />
                  ) : (
                    <ShieldCheck size={32} />
                  )}
                </div>
                <div className="decision-text">
                  <div className="decision-label">
                    {prediction.decision === 'BLOCK'
                      ? 'FRAUD DETECTED • TRANSACTION BLOCKED'
                      : prediction.decision === 'REVIEW'
                      ? 'SUSPICIOUS ACTIVITY • 2FA REVIEW REQUIRED'
                      : 'TRANSACTION APPROVED • LOW RISK'}
                  </div>
                  <div className="decision-subtext">
                    {prediction.decision === 'BLOCK'
                      ? 'Severe risk thresholds exceeded. High probability of fraudulent charge.'
                      : prediction.decision === 'REVIEW'
                      ? 'Anomalous behavioral signals detected. Step-up authentication advised.'
                      : 'Transaction metrics align with standard cardholder profile and norms.'}
                  </div>
                </div>
              </div>

              {/* Gauge & Metrics Summary */}
              <div className="gauge-metrics-row">
                {/* Risk Gauge Circle */}
                <div className="risk-gauge-box">
                  <div className="gauge-svg-wrapper">
                    <svg viewBox="0 0 120 120" className="gauge-svg">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        className="gauge-bg-circle"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        className={`gauge-value-circle stroke-${prediction.risk_level.toLowerCase()}`}
                        style={{
                          strokeDasharray: 314,
                          strokeDashoffset: 314 - (314 * prediction.risk_score) / 100
                        }}
                      />
                    </svg>
                    <div className="gauge-center-text">
                      <span className="gauge-number">{prediction.risk_score}</span>
                      <span className="gauge-label">RISK SCORE</span>
                    </div>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="metrics-column">
                  <div className="metric-item">
                    <span className="metric-label">Fraud Probability</span>
                    <span className="metric-value font-mono">
                      {(prediction.fraud_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Spatial Distance</span>
                    <span className="metric-value font-mono">
                      {prediction.distance_km.toLocaleString()} km
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Inference Mode</span>
                    <span className="metric-value font-mono text-cyan">
                      {prediction.mode === 'live_backend' ? 'Python API' : 'Simulation Engine'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explainable AI / SHAP Attribution */}
              <div className="explainability-section">
                <div className="explain-header">
                  <span className="explain-title">Feature Attribution & Risk Drivers:</span>
                </div>
                <div className="factors-list">
                  {prediction.explanation && prediction.explanation.length > 0 ? (
                    prediction.explanation.map((item, idx) => (
                      <div key={idx} className={`factor-item factor-${item.severity}`}>
                        <div className="factor-info">
                          <span className="factor-name">{item.factor}</span>
                        </div>
                        <span className={`factor-impact impact-${item.severity}`}>
                          {item.impact}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="factor-item factor-safe">
                      <span className="factor-name">No anomalous variance detected</span>
                      <span className="factor-impact impact-safe">Normal</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Model Diagnostics (Live Isolation Forest + Autoencoder Metrics) */}
              {prediction.model_diagnostics && (
                <div className="model-diagnostics-card" style={{
                  marginTop: '1rem',
                  background: 'rgba(10, 16, 30, 0.65)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Model Engine Diagnostics (backend/Model)
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>Ensemble Telemetry</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Isolation Forest Score</div>
                      <div className="font-mono" style={{ fontWeight: 700, marginTop: '2px' }}>
                        {prediction.model_diagnostics.isolation_forest_score}
                      </div>
                      <div style={{ fontSize: '0.68rem', marginTop: '3px' }}>
                        Threshold: &lt; {prediction.model_diagnostics.isolation_forest_threshold?.toFixed(4)}
                        <span style={{ 
                          marginLeft: '6px', 
                          color: prediction.model_diagnostics.isolation_forest_anomaly ? 'var(--status-fraud)' : 'var(--status-safe)',
                          fontWeight: 700
                        }}>
                          [{prediction.model_diagnostics.isolation_forest_anomaly ? 'ANOMALY' : 'NORMAL'}]
                        </span>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Autoencoder Neural MSE</div>
                      <div className="font-mono" style={{ fontWeight: 700, marginTop: '2px' }}>
                        {prediction.model_diagnostics.autoencoder_recon_error}
                      </div>
                      <div style={{ fontSize: '0.68rem', marginTop: '3px' }}>
                        Threshold: &gt; {prediction.model_diagnostics.autoencoder_threshold?.toFixed(5)}
                        <span style={{ 
                          marginLeft: '6px', 
                          color: prediction.model_diagnostics.autoencoder_anomaly ? 'var(--status-fraud)' : 'var(--status-safe)',
                          fontWeight: 700
                        }}>
                          [{prediction.model_diagnostics.autoencoder_anomaly ? 'ANOMALY' : 'NORMAL'}]
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
