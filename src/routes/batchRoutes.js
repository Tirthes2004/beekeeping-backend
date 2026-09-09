const express = require("express");
const router = express.Router();
const Batch = require("../models/Batch");
const Farm = require("../models/Farm");

// POST /api/batches - create a new honey batch for a harvest
// Enforces that the given farm actually belongs to the given keeper (the
// common-ID mapping set up in Farm.keeper) before allowing the batch to be created.
router.post("/", async (req, res) => {
  try {
    const { farm: farmId, keeper: keeperId } = req.body;
    if (!farmId || !keeperId) {
      return res.status(400).json({ error: "Both farm and keeper are required" });
    }

    const farm = await Farm.findById(farmId);
    if (!farm) return res.status(404).json({ error: "Farm not found" });
    if (farm.keeper.toString() !== keeperId.toString()) {
      return res.status(403).json({ error: "This farm does not belong to the given keeper" });
    }

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
