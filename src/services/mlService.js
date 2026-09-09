const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

/**
 * Wraps calls to an external ML microservice (intended to be FastAPI).
 * If ML_SERVICE_URL is not set, or the service is unreachable/errors,
 * every function falls back to a simple internal heuristic so the
 * rest of the app (and demos) keep working without a live ML service.
 *
 * Expected FastAPI contract (implement these when ready):
 *   POST {ML_SERVICE_URL}/predict/disease-risk
 *     body: { readings: [{temperatureC, humidityPct, weightKg, recordedAt}, ...] }
 *     resp: { riskLevel: "low"|"medium"|"high", confidence: 0-1, notes: string }
 *
 *   POST {ML_SERVICE_URL}/predict/yield
 *     body: { hiveCount, environmentType, region, season, avgWeightTrendKgPerWeek }
 *     resp: { estimatedYieldKg: number, confidence: 0-1 }
 */

async function predictDiseaseRisk(readings) {
  if (ML_SERVICE_URL) {
    try {
      const { data } = await axios.post(
        `${ML_SERVICE_URL}/predict/disease-risk`,
        { readings },
        { timeout: 4000 }
      );
      return { ...data, source: "ml_service" };
    } catch (err) {
      console.warn("[mlService] disease-risk call failed, falling back:", err.message);
    }
  }
  return heuristicDiseaseRisk(readings);
}

async function predictYield(params) {
  if (ML_SERVICE_URL) {
    try {
      const { data } = await axios.post(`${ML_SERVICE_URL}/predict/yield`, params, {
        timeout: 4000,
      });
      return { ...data, source: "ml_service" };
    } catch (err) {
      console.warn("[mlService] yield call failed, falling back:", err.message);
    }
  }
  return heuristicYield(params);
}

// ---- Fallback heuristics (used when no ML service is configured/reachable) ----

function heuristicDiseaseRisk(readings) {
  if (!readings || readings.length < 2) {
    return { riskLevel: "low", confidence: 0.3, notes: "Not enough data yet.", source: "heuristic" };
  }
  const sorted = [...readings].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const weightDropPct =
    first.weightKg && last.weightKg ? ((first.weightKg - last.weightKg) / first.weightKg) * 100 : 0;

  let riskLevel = "low";
  let notes = "Readings within expected range.";
  if (weightDropPct > 8) {
    riskLevel = "high";
    notes = "Sharp hive weight drop detected — possible disease, swarming, or robbing. Inspect soon.";
  } else if (weightDropPct > 4 || last.temperatureC > 36 || last.humidityPct > 70) {
    riskLevel = "medium";
    notes = "Mild anomaly detected in weight/temperature/humidity. Recommend inspection.";
  }
  return { riskLevel, confidence: 0.5, notes, source: "heuristic" };
}

function heuristicYield({ hiveCount = 0, environmentType = "mixed", avgWeightTrendKgPerWeek = 0 }) {
  // Very rough placeholder formula: base per-hive yield adjusted by environment and observed trend.
  const baseYieldPerHiveKg = { hot: 18, cold: 10, temperate: 22, humid: 14, mixed: 16 }[environmentType] ?? 16;
  const trendAdjustment = avgWeightTrendKgPerWeek * 4; // rough seasonal projection
  const estimatedYieldKg = Math.max(0, hiveCount * baseYieldPerHiveKg + trendAdjustment);
  return { estimatedYieldKg: Math.round(estimatedYieldKg * 10) / 10, confidence: 0.4, source: "heuristic" };
}

module.exports = { predictDiseaseRisk, predictYield };
