require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./src/config/db");
const { startSimulator } = require("./src/services/sensorSimulator");

const keeperRoutes = require("./src/routes/keeperRoutes");
const farmRoutes = require("./src/routes/farmRoutes");
const hiveRoutes = require("./src/routes/hiveRoutes");
const sensorRoutes = require("./src/routes/sensorRoutes");
const alertRoutes = require("./src/routes/alertRoutes");
const yieldRoutes = require("./src/routes/yieldRoutes");
const batchRoutes = require("./src/routes/batchRoutes");
const labRoutes = require("./src/routes/labRoutes");
const qrRoutes = require("./src/routes/qrRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "beekeeping-backend", mode: "prototype" });
});

// Portal 1 - Productivity & Health Dashboard
app.use("/api/keepers", keeperRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api/hives", hiveRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/yield", yieldRoutes);

// Portal 2 - Brand & QR Traceability
app.use("/api/batches", batchRoutes);
app.use("/api/lab", labRoutes);
app.use("/api/qr", qrRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] beekeeping-backend running on port ${PORT}`);
    startSimulator();
  });
})();
