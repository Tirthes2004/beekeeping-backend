const mongoose = require("mongoose");
const { Schema } = mongoose;

const FarmSchema = new Schema(
  {
    farmCode: { type: String, required: true, unique: true }, // e.g. FRM-0001
    keeper: { type: Schema.Types.ObjectId, ref: "Keeper", required: true },
    name: { type: String },
    location: {
      area: { type: String },
      state: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    hiveCount: { type: Number, default: 0 },
    environmentType: {
      type: String,
      enum: ["hot", "cold", "temperate", "humid", "mixed"],
      default: "mixed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Farm", FarmSchema);
