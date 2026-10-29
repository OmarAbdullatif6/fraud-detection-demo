import React from 'react';

export default function ModelSelector({ value, onChange, availableModels, compact = false }) {
  const tabpfn = availableModels?.tabpfn;
  const tabpfnAvailable = Boolean(tabpfn?.available);

  return (
    <div className={`model-selector ${compact ? 'model-selector-compact' : ''}`}>
      <label className="input-label" htmlFor={compact ? 'batch-model' : 'single-model'}>
        Prediction Model
      </label>
      <select
        id={compact ? 'batch-model' : 'single-model'}
        className="input-field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="baseline">Baseline Ensemble</option>
        <option value="tabpfn" disabled={!tabpfnAvailable}>
          {tabpfnAvailable ? 'TabPFN 3.5' : 'TabPFN 3.5 (unavailable)'}
        </option>
      </select>
      {!tabpfnAvailable && (
        <span className="input-hint" role="status">
          TabPFN unavailable: {tabpfn?.reason || 'Connect the backend to check availability.'}
        </span>
      )}
    </div>
  );
}
