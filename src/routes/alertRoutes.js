const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");

// GET /api/alerts?farmId=&hiveId=&status=open
router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.farmId) filter.farm = req.query.farmId;
  if (req.query.hiveId) filter.hive = req.query.hiveId;
  if (req.query.status) filter.status = req.query.status;
  const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json(alerts);
});

// PATCH /api/alerts/:id/resolve
router.patch("/:id/resolve", async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(req.params.id, { status: "resolved" }, { new: true });
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  res.json(alert);
});

module.exports = router;
