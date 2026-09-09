const mongoose = require("mongoose");
const { Schema } = mongoose;

const SensorReadingSchema = new Schema(
  {
    hive: { type: Schema.Types.ObjectId, ref: "Hive", required: true },
    farm: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    temperatureC: { type: Number, required: true },
    humidityPct: { type: Number, required: true },
    weightKg: { type: Number }, // hive weight, useful proxy for nectar flow/honey accumulation
    source: { type: String, enum: ["manual", "simulated", "device"], default: "manual" },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SensorReadingSchema.index({ hive: 1, recordedAt: -1 });

module.exports = mongoose.model("SensorReading", SensorReadingSchema);
