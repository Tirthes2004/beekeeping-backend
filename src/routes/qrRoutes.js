const express = require("express");
const router = express.Router();
const Batch = require("../models/Batch");
const LabReport = require("../models/LabReport");
const { generateBatchQr } = require("../utils/qrGenerator");

// POST /api/qr/generate/:batchId - generate QR only after a passing/available report
router.post("/generate/:batchId", async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.batchId);
    if (!batch) return res.status(404).json({ error: "Batch not found" });

    const { publicUrl, dataUrl } = await generateBatchQr(batch._id);
    batch.qrPublicUrl = publicUrl;
    batch.status = "qr_generated";
    await batch.save();

    res.json({ publicUrl, qrImageDataUrl: dataUrl });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/qr/scan/:batchId - public, no-auth endpoint for end customers scanning the QR
router.get("/scan/:batchId", async (req, res) => {
  const batch = await Batch.findById(req.params.batchId).populate("farm", "name location").populate(
    "keeper",
    "name keeperCode"
  );
  if (!batch) return res.status(404).json({ error: "Batch not found" });
  const report = await LabReport.findOne({ batch: batch._id });

  res.json({
    batchCode: batch.batchCode,
    harvestDate: batch.harvestDate,
    quantityKg: batch.quantityKg,
    priceInrPerKg: batch.priceInrPerKg,
    keeper: batch.keeper ? { name: batch.keeper.name, keeperCode: batch.keeper.keeperCode } : null,
    farm: batch.farm ? { name: batch.farm.name, location: batch.farm.location } : null,
    labReport: report
      ? {
          labName: report.labName,
          testedDate: report.testedDate,
          overallResult: report.overallResult,
          pollenFloralSource: report.pollenFloralSource,
          moisturePct: report.moisturePct,
          c4SugarTestResult: report.c4SugarTestResult,
          isMock: report.isMock,
        }
      : null,
  });
});

module.exports = router;
