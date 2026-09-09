const mongoose = require("mongoose");
const { Schema } = mongoose;

const LabReportSchema = new Schema(
  {
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, unique: true },
    labName: { type: String, default: "KVIC Regional Testing Lab (mock)" },
    sampleId: { type: String, required: true },
    testedDate: { type: Date },

    // Standard honey quality parameters
    moisturePct: { type: Number },
    hmfMgPerKg: { type: Number }, // Hydroxymethylfurfural - heating/age/adulteration marker
    reducingSugarPct: { type: Number },
    sucrosePct: { type: Number },
    fructoseGlucoseRatio: { type: Number },
    c4SugarTestResult: { type: String, enum: ["pass", "fail", "not_tested"], default: "not_tested" },
    diastaseActivity: { type: Number }, // enzyme activity, freshness indicator
    pollenFloralSource: { type: String }, // lab-verified floral source

    overallResult: { type: String, enum: ["pass", "fail", "pending"], default: "pending" },
    isMock: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LabReport", LabReportSchema);
