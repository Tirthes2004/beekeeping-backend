const express = require("express");
const router = express.Router();
const mockLabService = require("../services/mockLabService");

// POST /api/lab/submit/:batchId - submit a batch sample for testing
router.post("/submit/:batchId", async (req, res) => {
  try {
    const result = await mockLabService.submitSample(req.params.batchId, {
      delayMs: req.body?.delayMs, // let the demo speed this up/down if needed
    });
    res.status(202).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/lab/report/:batchId - fetch the report once ready
router.get("/report/:batchId", async (req, res) => {
  const report = await mockLabService.getReport(req.params.batchId);
  if (!report) return res.status(404).json({ error: "Report not ready or not found yet" });
  res.json(report);
});

module.exports = router;
