const mongoose = require("mongoose");
const { Schema } = mongoose;

const BatchSchema = new Schema(
  {
    batchCode: { type: String, required: true, unique: true }, // e.g. BATCH-0001
    farm: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    keeper: { type: Schema.Types.ObjectId, ref: "Keeper", required: true },
    harvestDate: { type: Date, default: Date.now },
    quantityKg: { type: Number, required: true },
    floralSourceClaimed: { type: String }, // keeper's claim, verified later by lab pollen analysis
    priceInrPerKg: { type: Number },
    status: {
      type: String,
      enum: ["created", "submitted_for_testing", "tested", "qr_generated"],
      default: "created",
    },
    qrPublicUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Batch", BatchSchema);
