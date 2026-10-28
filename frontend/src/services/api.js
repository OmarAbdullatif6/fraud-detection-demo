/**
 * API Service for Fraud Detection AI Backend
 * Decoupled client-side architecture with automatic mock simulation fallback.
 */

// Configurable base URL: can be overridden via Vite env or dynamic setting in UI
let currentApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function getApiBaseUrl() {
  return currentApiBaseUrl;
}

export function setApiBaseUrl(newUrl) {
  currentApiBaseUrl = newUrl.replace(/\/+$/, '');
  return currentApiBaseUrl;
}

/**
 * Calculate distance in km between two lat/long points using the Haversine formula
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Derive age from DOB string and Transaction Date
 */
export function calculateAge(dobStr, transDateStr) {
  if (!dobStr) return null;
  const birthDate = new Date(dobStr);
  const refDate = transDateStr ? new Date(transDateStr) : new Date();
  let age = refDate.getFullYear() - birthDate.getFullYear();
  const m = refDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return isNaN(age) ? null : age;
}

/**
 * Check if the Python backend is live and responding
 */
export async function checkBackendStatus() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1800);

  try {
    const response = await fetch(`${currentApiBaseUrl}/api/health`, {
      signal: controller.signal
    });
    if (response.ok) {
      const data = await response.json();
      return { online: true, details: data, url: currentApiBaseUrl };
    }
  } catch {
    // Backend offline / unreachable
  } finally {
    clearTimeout(timeoutId);
  }
  return { online: false, details: null, url: currentApiBaseUrl };
}

async function postJson(path, payload, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${currentApiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      let detail = `Request failed with status ${response.status}`;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail || detail;
      } catch {
        // Keep the HTTP status message when the server does not return JSON.
      }

      const error = new Error(detail);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('The backend request timed out. Check that the model service is running and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Intelligent client-side AI simulation model
 * Replicates the feature weighting learned from fraudTest.csv
 */
export function simulatePrediction(tx) {
  const amt = parseFloat(tx.amt) || 0;
  const lat1 = parseFloat(tx.lat) || 0;
  const lon1 = parseFloat(tx.long) || 0;
  const lat2 = parseFloat(tx.merch_lat) || 0;
  const lon2 = parseFloat(tx.merch_long) || 0;

  const distanceKm = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  const age = calculateAge(tx.dob, tx.trans_date_trans_time);

  let hour = 12;
  if (tx.trans_date_trans_time) {
    const parts = tx.trans_date_trans_time.split(' ');
    if (parts.length > 1) {
      hour = parseInt(parts[1].split(':')[0], 10) || 12;
    }
  }

  // Feature scoring logic based on Kaggle fraud dataset distributions
  let baseScore = 4.0;
  const factors = [];

  // 1. Transaction Amount Analysis
  if (amt > 800) {
    baseScore += 46;
    factors.push({
      factor: `Abnormally high amount ($${amt.toLocaleString()})`,
      impact: '+46%',
      severity: 'high'
    });
  } else if (amt > 350) {
    baseScore += 24;
    factors.push({
      factor: `Elevated transaction amount ($${amt.toLocaleString()})`,
      impact: '+24%',
      severity: 'medium'
    });
  } else if (amt > 150) {
    baseScore += 10;
    factors.push({
      factor: `Above median transaction size ($${amt.toLocaleString()})`,
      impact: '+10%',
      severity: 'low'
    });
  } else {
    factors.push({
      factor: `Transaction amount within standard profile ($${amt.toFixed(2)})`,
      impact: '-8%',
      severity: 'safe'
    });
    baseScore -= 8;
  }

  // 2. Geographic / Haversine Distance Analysis
  if (distanceKm > 1000) {
    baseScore += 38;
    factors.push({
      factor: `Extreme geolocation disparity (${distanceKm.toLocaleString()} km)`,
      impact: '+38%',
      severity: 'high'
    });
  } else if (distanceKm > 250) {
    baseScore += 20;
    factors.push({
      factor: `Interstate distance anomaly (${distanceKm.toLocaleString()} km)`,
      impact: '+20%',
      severity: 'medium'
    });
  } else if (distanceKm < 15) {
    baseScore -= 6;
    factors.push({
      factor: `Merchant in local cardholder perimeter (${distanceKm} km)`,
      impact: '-6%',
      severity: 'safe'
    });
  }

  // 3. Category Fraud Propensity
  const highRiskCategories = ['shopping_net', 'misc_net', 'travel'];
  const moderateRisk = ['shopping_pos', 'grocery_net'];
  const safeCategories = ['grocery_pos', 'food_dining', 'gas_transport'];

  if (highRiskCategories.includes(tx.category)) {
    baseScore += 16;
    factors.push({
      factor: `High fraud-incidence channel: ${tx.category.replace('_', ' ')}`,
      impact: '+16%',
      severity: 'medium'
    });
  } else if (moderateRisk.includes(tx.category)) {
    baseScore += 8;
  } else if (safeCategories.includes(tx.category)) {
    baseScore -= 5;
    factors.push({
      factor: `Low historical fraud category: ${tx.category.replace('_', ' ')}`,
      impact: '-5%',
      severity: 'safe'
    });
  }

  // 4. Temporal / Nocturnal Anomaly
  if (hour >= 23 || hour <= 4) {
    baseScore += 18;
    factors.push({
      factor: `Nocturnal transaction time (${hour}:00 window)`,
      impact: '+18%',
      severity: 'medium'
    });
  }

  // Clamp risk score to [1.2, 99.4]
  const finalRisk = Math.min(Math.max(baseScore, 1.2), 99.4);
  const isFraud = finalRisk >= 65 ? 1 : 0;
  const riskLevel = finalRisk >= 75 ? 'HIGH' : finalRisk >= 40 ? 'MEDIUM' : 'LOW';
  const decision = finalRisk >= 75 ? 'BLOCK' : finalRisk >= 40 ? 'REVIEW' : 'APPROVE';

  return {
    is_fraud: isFraud,
    fraud_probability: parseFloat((finalRisk / 100).toFixed(4)),
    risk_score: parseFloat(finalRisk.toFixed(1)),
    risk_level: riskLevel,
    decision: decision,
    distance_km: distanceKm,
    cardholder_age: age,
    explanation: factors,
    latency_ms: Math.floor(12 + Math.random() * 15),
    mode: 'simulation'
  };
}

/**
 * Predict a single transaction
 * Tries live backend first, falls back gracefully to simulation
 */
export async function predictTransaction(txData, forceMock = false) {
  if (!forceMock) {
    try {
      const result = await postJson('/api/predict', txData, 15000);
      return { ...result, mode: 'live_backend' };
    } catch (error) {
      if (error.status || error.name !== 'TypeError') {
        throw error;
      }
      // Keep the documented offline demo mode when the backend cannot be reached.
    }
  }

  return simulatePrediction(txData);
}

/**
 * Submit a batch to the model service, or use the documented offline simulation.
 */
export async function predictBatch(transactions, forceMock = false) {
  if (!forceMock) {
    try {
      const modelInputs = transactions.map((transaction) => Object.fromEntries(
        Object.entries(transaction).filter(([key]) => (
          key !== 'id' && key !== 'ground_truth_is_fraud'
        ))
      ));
      const response = await postJson(
        '/api/batch-predict',
        { transactions: modelInputs },
        60000
      );
      if (!Array.isArray(response.results) || response.results.length !== transactions.length) {
        throw new Error('The backend returned an incomplete batch prediction response.');
      }
      const items = transactions.map((transaction, index) => ({
        ...transaction,
        prediction: { ...response.results[index], mode: 'live_backend' }
      }));

      return {
        total: response.total_processed,
        fraudCount: response.fraud_detected,
        cleanCount: response.total_processed - response.fraud_detected,
        fraudRate: response.fraud_rate_percent.toFixed(1),
        flaggedAmount: response.total_amount_flagged.toFixed(2),
        items
      };
    } catch (error) {
      if (error.status || error.name !== 'TypeError') {
        throw error;
      }
      // Keep the documented offline demo mode when the backend cannot be reached.
    }
  }

  const results = transactions.map((transaction) => ({
    ...transaction,
    prediction: { ...simulatePrediction(transaction), mode: 'simulation' }
  }));
  const fraudCount = results.filter((item) => item.prediction.is_fraud === 1).length;
  const flaggedAmount = results.reduce((total, item) => (
    item.prediction.is_fraud === 1 ? total + (parseFloat(item.amt) || 0) : total
  ), 0);

  return {
    total: transactions.length,
    fraudCount,
    cleanCount: transactions.length - fraudCount,
    fraudRate: transactions.length ? ((fraudCount / transactions.length) * 100).toFixed(1) : 0,
    flaggedAmount: flaggedAmount.toFixed(2),
    items: results
  };
}
