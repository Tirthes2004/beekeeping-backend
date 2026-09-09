const mongoose = require("mongoose");
const { Schema } = mongoose;

const HiveSchema = new Schema(
  {
    hiveCode: { type: String, required: true, unique: true }, // e.g. HV-0001
    farm: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    hiveType: { type: String, default: "Langstroth" },
    installedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "inactive", "swarmed"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hive", HiveSchema);
