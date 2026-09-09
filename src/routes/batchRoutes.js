const express = require("express");
const router = express.Router();
const Batch = require("../models/Batch");

// POST /api/batches - create a new honey batch for a harvest
router.post("/", async (req, res) => {
  try {
    const batch = await Batch.create(req.body);
    res.status(201).json(batch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/batches?farmId=&keeperId=
router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.farmId) filter.farm = req.query.farmId;
  if (req.query.keeperId) filter.keeper = req.query.keeperId;
  const batches = await Batch.find(filter).sort({ createdAt: -1 });
  res.json(batches);
});

// GET /api/batches/:id
router.get("/:id", async (req, res) => {
  const batch = await Batch.findById(req.params.id).populate("farm").populate("keeper");
  if (!batch) return res.status(404).json({ error: "Batch not found" });
  res.json(batch);
});

// PATCH /api/batches/:id - e.g. update price
router.patch("/:id", async (req, res) => {
  const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!batch) return res.status(404).json({ error: "Batch not found" });
  res.json(batch);
});

module.exports = router;
