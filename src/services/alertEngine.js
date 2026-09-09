const Alert = require("../models/Alert");

// Reasonable defaults for a Langstroth-style hive brood nest.
// These are simple, tunable thresholds for MVP - not medical/scientific guarantees.
const THRESHOLDS = {
  temperatureHighC: 36,
  temperatureLowC: 30,
  humidityHighPct: 70,
  humidityLowPct: 40,
  weightDropPctWarn: 5,
  weightDropPctHigh: 8,
};

/**
 * Evaluates a new reading (optionally against the previous one for the same hive)
 * and creates Alert documents for anything out of range. Detection + suggestion only -
 * nothing here triggers any automated control action.
 */
async function evaluateReading(reading, previousReading) {
  const alerts = [];

  if (reading.temperatureC > THRESHOLDS.temperatureHighC) {
    alerts.push({
      type: "temperature",
      severity: "medium",
      message: `Hive temperature high (${reading.temperatureC}°C).`,
      suggestedAction: "Check ventilation and shade; ensure entrance isn't obstructed.",
    });
  } else if (reading.temperatureC < THRESHOLDS.temperatureLowC) {
    alerts.push({
      type: "temperature",
      severity: "medium",
      message: `Hive temperature low (${reading.temperatureC}°C).`,
      suggestedAction: "Check hive insulation and colony strength; consider reducing entrance size.",
    });
  }

  if (reading.humidityPct > THRESHOLDS.humidityHighPct) {
    alerts.push({
      type: "humidity",
      severity: "low",
      message: `Hive humidity high (${reading.humidityPct}%).`,
      suggestedAction: "Improve airflow; check for water ingress near the hive.",
    });
  } else if (reading.humidityPct < THRESHOLDS.humidityLowPct) {
    alerts.push({
      type: "humidity",
      severity: "low",
      message: `Hive humidity low (${reading.humidityPct}%).`,
      suggestedAction: "Consider adding a nearby water source for the colony.",
    });
  }

  if (previousReading && previousReading.weightKg && reading.weightKg) {
    const dropPct =
      ((previousReading.weightKg - reading.weightKg) / previousReading.weightKg) * 100;
    if (dropPct >= THRESHOLDS.weightDropPctHigh) {
      alerts.push({
        type: "weight_drop",
        severity: "high",
        message: `Hive weight dropped ${dropPct.toFixed(1)}% since last reading.`,
        suggestedAction: "Inspect for disease, swarming, or robbing as soon as possible.",
      });
    } else if (dropPct >= THRESHOLDS.weightDropPctWarn) {
      alerts.push({
        type: "weight_drop",
        severity: "medium",
        message: `Hive weight dropped ${dropPct.toFixed(1)}% since last reading.`,
        suggestedAction: "Monitor closely; schedule an inspection in the next few days.",
      });
    }
  }

  if (!alerts.length) return [];

  const docs = alerts.map((a) => ({
    ...a,
    hive: reading.hive,
    farm: reading.farm,
    sourceReading: reading._id,
  }));

  return Alert.insertMany(docs);
}

module.exports = { evaluateReading, THRESHOLDS };
