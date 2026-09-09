const OtpCode = require("../models/OtpCode");

/**
 * Mocked OTP delivery: generates a 6-digit code, saves it with a short expiry,
 * and logs it to the server console instead of sending a real SMS. Swap the
 * body of sendOtp() for a real SMS gateway call (e.g. Twilio, MSG91) later -
 * callers (authRoutes.js) don't need to change.
 */
async function sendOtp(phone, purpose = "login", registrationData) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const minutes = parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 5;
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  await OtpCode.create({ phone, code, purpose, registrationData, expiresAt });

  // --- MOCK DELIVERY: replace this with a real SMS API call later ---
  console.log(`[otpService] MOCK SMS to ${phone}: your OTP is ${code} (expires in ${minutes} min)`);
  // --------------------------------------------------------------------

  return { expiresInMinutes: minutes };
}

async function verifyOtp(phone, code, purpose = "login") {
  const record = await OtpCode.findOne({ phone, code, purpose, consumed: false }).sort({ expiresAt: -1 });
  if (!record || record.expiresAt < new Date()) return null;

  record.consumed = true;
  await record.save();
  return record;
}

module.exports = { sendOtp, verifyOtp };
