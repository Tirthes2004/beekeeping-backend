const { v4: uuidv4 } = require("uuid");
const LabReport = require("../models/LabReport");
const Batch = require("../models/Batch");

// Seeded report templates covering a mix of pass/fail results and floral sources,
// modeled on real Indian honey-quality parameters (FSSAI-style panel).
const TEMPLATES = [
  {
    moisturePct: 18.2,
    hmfMgPerKg: 8.4,
    reducingSugarPct: 71.5,
    sucrosePct: 2.1,
    fructoseGlucoseRatio: 1.23,
    c4SugarTestResult: "pass",
    diastaseActivity: 22.1,
    pollenFloralSource: "Mustard",
    overallResult: "pass",
  },
  {
    moisturePct: 19.8,
    hmfMgPerKg: 12.6,
    reducingSugarPct: 68.9,
    sucrosePct: 3.4,
    fructoseGlucoseRatio: 1.05,
    c4SugarTestResult: "pass",
    diastaseActivity: 18.7,
    pollenFloralSource: "Multiflora",
    overallResult: "pass",
  },
  {
    moisturePct: 24.1,
    hmfMgPerKg: 41.2,
    reducingSugarPct: 58.2,
    sucrosePct: 9.8,
    fructoseGlucoseRatio: 0.81,
    c4SugarTestResult: "fail",
    diastaseActivity: 6.3,
    pollenFloralSource: "Litchi",
    overallResult: "fail",
  },
  {
    moisturePct: 17.5,
    hmfMgPerKg: 5.1,
    reducingSugarPct: 73.8,
    sucrosePct: 1.4,
    fructoseGlucoseRatio: 1.31,
    c4SugarTestResult: "pass",
    diastaseActivity: 26.4,
    pollenFloralSource: "Eucalyptus",
    overallResult: "pass",
  },
  {
    moisturePct: 22.6,
    hmfMgPerKg: 35.9,
    reducingSugarPct: 61.0,
    sucrosePct: 7.2,
    fructoseGlucoseRatio: 0.89,
    c4SugarTestResult: "fail",
    diastaseActivity: 9.1,
    pollenFloralSource: "Sunflower",
    overallResult: "fail",
  },
];

/**
 * Simulates submitting a batch sample to a lab. Mimics real turnaround by resolving
 * the report after a short delay instead of instantly. Swap this module's internals
 * for a real HTTP call to KVIC/NABL lab APIs later - callers (routes) don't change.
 */
async function submitSample(batchId, { delayMs = 5000 } = {}) {
  const batch = await Batch.findById(batchId);
  if (!batch) throw new Error("Batch not found");

  batch.status = "submitted_for_testing";
  await batch.save();

  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const sampleId = `SMPL-${uuidv4().slice(0, 8).toUpperCase()}`;

  // Simulate lab processing time asynchronously; in a real integration this
  // would instead be a webhook/callback or a polled status endpoint.
  setTimeout(async () => {
    try {
      await LabReport.findOneAndUpdate(
        { batch: batchId },
        {
          batch: batchId,
          sampleId,
          testedDate: new Date(),
          ...template,
          isMock: true,
        },
        { upsert: true, new: true }
      );
      await Batch.findByIdAndUpdate(batchId, { status: "tested" });
      console.log(`[mockLabService] report ready for batch ${batchId} (${sampleId})`);
    } catch (err) {
      console.error("[mockLabService] failed to finalize report:", err.message);
    }
  }, delayMs);

  return { sampleId, status: "submitted_for_testing", etaMs: delayMs };
}

async function getReport(batchId) {
  return LabReport.findOne({ batch: batchId });
}

module.exports = { submitSample, getReport };
