const QRCode = require("qrcode");

/**
 * Generates a QR code (as a base64 data URL) that encodes the public scan URL
 * for a given batch. The frontend/printer can render this data URL directly as
 * an <img>, or you can adapt this to output a PNG buffer for label printing.
 */
async function generateBatchQr(batchId) {
  const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:5000";
  const publicUrl = `${baseUrl}/api/qr/scan/${batchId}`;
  const dataUrl = await QRCode.toDataURL(publicUrl, { errorCorrectionLevel: "M", margin: 2 });
  return { publicUrl, dataUrl };
}

module.exports = { generateBatchQr };
