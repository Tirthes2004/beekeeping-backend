const express = require("express");
const router = express.Router();
const Keeper = require("../models/Keeper");

// POST /api/keepers - register a new keeper
router.post("/", async (req, res) => {
  try {
    const keeper = await Keeper.create(req.body);
    res.status(201).json(keeper);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/keepers - list all keepers
router.get("/", async (_req, res) => {
  const keepers = await Keeper.find().sort({ createdAt: -1 });
  res.json(keepers);
});

// GET /api/keepers/:id
router.get("/:id", async (req, res) => {
  const keeper = await Keeper.findById(req.params.id);
  if (!keeper) return res.status(404).json({ error: "Keeper not found" });
  res.json(keeper);
});

// PATCH /api/keepers/:id
router.patch("/:id", async (req, res) => {
  const keeper = await Keeper.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!keeper) return res.status(404).json({ error: "Keeper not found" });
  res.json(keeper);
});

module.exports = router;
