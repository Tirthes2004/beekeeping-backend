const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Keeper = require("../models/Keeper");
const Farm = require("../models/Farm");
const otpService = require("../services/otpService");
const { requireAuth } = require("../middleware/auth");

// POST /api/auth/request-otp  body: { phone }
// Sends (mocked, logged to console) a one-time code to a phone already
// registered against a Keeper. Works from any device - no session state
// is tied to a specific device at this step.
router.post("/request-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "phone is required" });

    const keeper = await Keeper.findOne({ phone });
    if (!keeper) return res.status(404).json({ error: "No keeper registered with this phone number" });

    const result = await otpService.sendOtp(phone);
    res.json({ message: "OTP sent (check server console in this prototype)", ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/verify-otp  body: { phone, code }
// Verifies the code and issues a JWT. This is the actual "login" step -
// call this from any device to get that device its own valid token.
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: "phone and code are required" });

    const isValid = await otpService.verifyOtp(phone, code);
    if (!isValid) return res.status(401).json({ error: "Invalid or expired OTP" });

    const keeper = await Keeper.findOne({ phone });
    if (!keeper) return res.status(404).json({ error: "Keeper not found" });

    const token = jwt.sign(
      { keeperId: keeper._id.toString(), phone: keeper.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
    );

    res.json({ token, keeper });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/auth/me - the token-based equivalent of "GET /api/keepers/:id/farms",
// but derives the keeper from the logged-in token instead of a URL param, so
// the caller never has to know or pass their own database ID.
router.get("/me", requireAuth, async (req, res) => {
  const keeper = await Keeper.findById(req.auth.keeperId);
  if (!keeper) return res.status(404).json({ error: "Keeper not found" });
  const farms = await Farm.find({ keeper: keeper._id }).sort({ createdAt: -1 });
  res.json({ keeper, farms });
});

module.exports = router;
