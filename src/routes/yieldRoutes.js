const express = require("express");
const router = express.Router();
const Farm = require("../models/Farm");
const Hive = require("../models/Hive");
const SensorReading = require("../models/SensorReading");
const { predictYield, predictDiseaseRisk } = require("../services/mlService");

// POST /api/yield/estimate  body: { farmId, season }
router.post("/estimate", async (req, res) => {
  try {
    const { farmId, season } = req.body;
    const farm = await Farm.findById(farmId);
    if (!farm) return res.status(404).json({ error: "Farm not found" });

    const hives = await Hive.find({ farm: farmId, status: "active" });
    let avgWeightTrendKgPerWeek = 0;
    if (hives.length) {
      const trends = await Promise.all(
        hives.map(async (h) => {
          const readings = await SensorReading.find({ hive: h._id }).sort({ recordedAt: -1 }).limit(20);
          if (readings.length < 2) return 0;
          const newest = readings[0];
          const oldest = readings[readings.length - 1];
          const days =
            (new Date(newest.recordedAt) - new Date(oldest.recordedAt)) / (1000 * 60 * 60 * 24) || 1;
          const deltaKg = (newest.weightKg || 0) - (oldest.weightKg || 0);
          return (deltaKg / days) * 7;
        })
      );
      avgWeightTrendKgPerWeek = trends.reduce((a, b) => a + b, 0) / trends.length;
    }

    const result = await predictYield({
      hiveCount: farm.hiveCount,
      environmentType: farm.environmentType,
      region: farm.location?.state,
      season,
      avgWeightTrendKgPerWeek,
    });

    res.json({ farmId, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/yield/disease-risk/:hiveId - detection only, no control action taken
router.get("/disease-risk/:hiveId", async (req, res) => {
  try {
    const readings = await SensorReading.find({ hive: req.params.hiveId })
      .sort({ recordedAt: -1 })
      .limit(15);
    const result = await predictDiseaseRisk(readings);
    res.json({ hiveId: req.params.hiveId, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
