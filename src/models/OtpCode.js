const mongoose = require("mongoose");
const { Schema } = mongoose;

const OtpCodeSchema = new Schema({
  phone: { type: String, required: true },
  code: { type: String, required: true },
  purpose: { type: String, enum: ["login", "registration"], default: "login" },
  registrationData: { type: Schema.Types.Mixed },
  expiresAt: { type: Date, required: true },
  consumed: { type: Boolean, default: false },
});

// Auto-delete expired OTP documents from MongoDB once they pass their expiry.
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OtpCode", OtpCodeSchema);
