const express = require("express");
const router = express.Router();
const SensorReading = require("../models/SensorReading");
const { evaluateReading } = require("../services/alertEngine");

// POST /api/sensors/readings - manually log a reading (keeper's manual-entry mode)
router.post("/readings", async (req, res) => {
  try {
    const previousReading = await SensorReading.findOne({ hive: req.body.hive }).sort({
      recordedAt: -1,
    });
    const reading = await SensorReading.create({ ...req.body, source: req.body.source || "manual" });
    const alerts = await evaluateReading(reading, previousReading);
    res.status(201).json({ reading, alertsCreated: alerts.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/sensors/readings/:hiveId?limit=50
router.get("/readings/:hiveId", async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const readings = await SensorReading.find({ hive: req.params.hiveId })
    .sort({ recordedAt: -1 })
    .limit(limit);
  res.json(readings);
});

// GET /api/sensors/latest/:hiveId
router.get("/latest/:hiveId", async (req, res) => {
  const reading = await SensorReading.findOne({ hive: req.params.hiveId }).sort({ recordedAt: -1 });
  if (!reading) return res.status(404).json({ error: "No readings yet for this hive" });
  res.json(reading);
});

module.exports = router;
