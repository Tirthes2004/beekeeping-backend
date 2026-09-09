const express = require("express");
const router = express.Router();
const Farm = require("../models/Farm");

// POST /api/farms - create a farm, linked to a keeper
router.post("/", async (req, res) => {
  try {
    const farm = await Farm.create(req.body);
    res.status(201).json(farm);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/farms?keeperId=... - list farms, optionally filtered by keeper
router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.keeperId) filter.keeper = req.query.keeperId;
  const farms = await Farm.find(filter).populate("keeper", "name keeperCode phone").sort({ createdAt: -1 });
  res.json(farms);
});

// GET /api/farms/:id
router.get("/:id", async (req, res) => {
  const farm = await Farm.findById(req.params.id).populate("keeper", "name keeperCode phone");
  if (!farm) return res.status(404).json({ error: "Farm not found" });
  res.json(farm);
});

// PATCH /api/farms/:id
router.patch("/:id", async (req, res) => {
  const farm = await Farm.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!farm) return res.status(404).json({ error: "Farm not found" });
  res.json(farm);
});

module.exports = router;
