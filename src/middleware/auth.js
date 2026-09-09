const jwt = require("jsonwebtoken");

/**
 * Verifies the Authorization: Bearer <token> header issued by
 * POST /api/auth/verify-otp, and attaches { keeperId, phone } to req.auth.
 * Each device that logs in gets its own independently-valid token - there's
 * no single-device restriction, so a keeper can be logged in on several
 * phones/devices at once, each with its own token.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing or invalid Authorization header" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { keeperId: decoded.keeperId, phone: decoded.phone };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };
