const mongoose = require("mongoose");
const { Schema } = mongoose;

const AlertSchema = new Schema(
  {
    hive: { type: Schema.Types.ObjectId, ref: "Hive", required: true },
    farm: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    type: {
      type: String,
      enum: ["temperature", "humidity", "weight_drop", "disease_risk"],
      required: true,
    },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    message: { type: String, required: true },
    suggestedAction: { type: String },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
    sourceReading: { type: Schema.Types.ObjectId, ref: "SensorReading" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", AlertSchema);
