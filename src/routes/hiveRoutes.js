const express = require("express");
const router = express.Router();
const Hive = require("../models/Hive");
const Farm = require("../models/Farm");

// POST /api/hives - add a hive to a farm (also bumps farm.hiveCount)
router.post("/", async (req, res) => {
  try {
    const hive = await Hive.create(req.body);
    await Farm.findByIdAndUpdate(hive.farm, { $inc: { hiveCount: 1 } });
    res.status(201).json(hive);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/hives?farmId=...
router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.farmId) filter.farm = req.query.farmId;
  const hives = await Hive.find(filter).sort({ createdAt: -1 });
  res.json(hives);
});

// GET /api/hives/:id
router.get("/:id", async (req, res) => {
  const hive = await Hive.findById(req.params.id);
  if (!hive) return res.status(404).json({ error: "Hive not found" });
  res.json(hive);
});

module.exports = router;
