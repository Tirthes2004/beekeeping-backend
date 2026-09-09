const cron = require("node-cron");
const Hive = require("../models/Hive");
const SensorReading = require("../models/SensorReading");
const { evaluateReading } = require("./alertEngine");

let lastWeightByHive = {}; // in-memory cache: hiveId -> last simulated weight, for a gentle trend

function randomInRange(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

/**
 * Generates one plausible reading for a hive: a mild daily temperature/humidity
 * pattern plus a slowly increasing weight (nectar accumulation), with a small
 * random chance of injecting an anomaly so the alert engine has something to catch
 * during a live demo.
 */
function generateReading(hive) {
  const hour = new Date().getHours();
  const isDaytime = hour >= 6 && hour <= 18;

  let temperatureC = isDaytime ? randomInRange(33, 35.5) : randomInRange(31, 33.5);
  let humidityPct = randomInRange(50, 62);

  const baseWeight = lastWeightByHive[hive._id] ?? randomInRange(20, 28);
  let weightKg = Math.round((baseWeight + randomInRange(-0.1, 0.3)) * 10) / 10;

  // ~8% chance of injecting a visible anomaly, useful for demoing the alert engine live
  const injectAnomaly = Math.random() < 0.08;
  if (injectAnomaly) {
    const anomalyType = Math.random();
    if (anomalyType < 0.34) temperatureC += randomInRange(3, 5);
    else if (anomalyType < 0.67) humidityPct += randomInRange(12, 20);
    else weightKg = Math.round(baseWeight * (1 - randomInRange(0.06, 0.12)) * 10) / 10;
  }

  lastWeightByHive[hive._id] = weightKg;

  return {
    hive: hive._id,
    farm: hive.farm,
    temperatureC,
    humidityPct,
    weightKg,
    source: "simulated",
    recordedAt: new Date(),
  };
}

async function runSimulationTick() {
  const hives = await Hive.find({ status: "active" });
  for (const hive of hives) {
    const previousReading = await SensorReading.findOne({ hive: hive._id }).sort({ recordedAt: -1 });
    const readingData = generateReading(hive);
    const saved = await SensorReading.create(readingData);
    try {
      await evaluateReading(saved, previousReading);
    } catch (err) {
      console.error(`[sensorSimulator] alert evaluation failed for hive ${hive._id}:`, err.message);
    }
  }
}

function startSimulator() {
  const cronExpr = process.env.SIMULATOR_INTERVAL_CRON || "*/2 * * * *";
  if (process.env.SIMULATOR_ENABLED === "false") {
    console.log("[sensorSimulator] disabled via SIMULATOR_ENABLED=false");
    return;
  }
  console.log(`[sensorSimulator] scheduled with cron "${cronExpr}"`);
  cron.schedule(cronExpr, () => {
    runSimulationTick().catch((err) => console.error("[sensorSimulator] tick failed:", err.message));
  });
}

module.exports = { startSimulator, runSimulationTick, generateReading };
