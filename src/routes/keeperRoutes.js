const express = require("express");
const router = express.Router();
const Keeper = require("../models/Keeper");
const Farm = require("../models/Farm");
const otpService = require("../services/otpService");

function registrationData(body) {
  return {
    keeperCode: body.keeperCode,
    name: body.name,
    phone: body.phone,
    email: body.email,
    address: body.address,
  };
}

// POST /api/keepers - validate keeper details and send a registration OTP
router.post("/", async (req, res) => {
  try {
    const data = registrationData(req.body);
    await new Keeper(data).validate();

    const existingKeeper = await Keeper.findOne({
      $or: [{ keeperCode: data.keeperCode }, { phone: data.phone }],
    });
    if (existingKeeper) {
      return res.status(409).json({ error: "A keeper is already registered with this keeper code or phone number" });
    }

    const result = await otpService.sendOtp(data.phone, "registration", data);
    res.status(202).json({
      message: "Registration OTP sent (check server console in this prototype)",
      ...result,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/keepers/verify-registration - body: { phone, code }
router.post("/verify-registration", async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: "phone and code are required" });

    const otp = await otpService.verifyOtp(phone, code, "registration");
    if (!otp) return res.status(401).json({ error: "Invalid or expired OTP" });

    const keeper = await Keeper.create(otp.registrationData);
    res.status(201).json(keeper);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/keepers - list all keepers
router.get("/", async (_req, res) => {
  const keepers = await Keeper.find().sort({ createdAt: -1 });
  res.json(keepers);
});

// GET /api/keepers/:id
router.get("/:id", async (req, res) => {
  const keeper = await Keeper.findById(req.params.id);
  if (!keeper) return res.status(404).json({ error: "Keeper not found" });
  res.json(keeper);
});

// GET /api/keepers/by-code/:keeperCode/farms - "portal 2 login" lookup by the
// human-friendly keeperCode (e.g. KPR-0001) instead of the raw MongoDB _id.
// NOTE: this is ID lookup only, not authentication - anyone who knows a
// keeperCode can currently see this data. Add a real login step (e.g. phone
// + OTP) before this goes anywhere beyond a prototype.
router.get("/by-code/:keeperCode/farms", async (req, res) => {
  const keeper = await Keeper.findOne({ keeperCode: req.params.keeperCode });
  if (!keeper) return res.status(404).json({ error: "Keeper not found" });
  const farms = await Farm.find({ keeper: keeper._id }).sort({ createdAt: -1 });
  res.json({ keeper, farms });
});

// GET /api/keepers/:id/farms - all farms belonging to this keeper (one keeper, many farms)
router.get("/:id/farms", async (req, res) => {
  const keeper = await Keeper.findById(req.params.id);
  if (!keeper) return res.status(404).json({ error: "Keeper not found" });
  const farms = await Farm.find({ keeper: req.params.id }).sort({ createdAt: -1 });
  res.json({ keeper, farms });
});

// PATCH /api/keepers/:id
router.patch("/:id", async (req, res) => {
  const keeper = await Keeper.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!keeper) return res.status(404).json({ error: "Keeper not found" });
  res.json(keeper);
});

module.exports = router;
