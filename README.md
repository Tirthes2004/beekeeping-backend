# Beekeeping Platform — Backend Prototype

Node.js + Express + MongoDB backend for a two-portal beekeeping platform:

1. **Productivity & Health Dashboard** — hive sensor data (temperature, humidity, weight)
   feeds a rule-based alert engine (disease-risk / anomaly detection only — no automated
   environment control) and a yield estimator.
2. **Brand & QR Traceability** — keepers create honey batches, submit them for lab
   testing, and generate a QR code that end customers can scan to see quality/floral
   source/price.

This is a **prototype**: real IoT hardware and real lab access are both mocked so the
whole flow can be demoed end-to-end without either dependency. Both mocked pieces are
built behind clean service interfaces so they can be swapped for real integrations
later without touching the rest of the app.

## What's mocked, and where

| Real dependency | Mocked by | Swap point |
|---|---|---|
| IoT hive sensors | `src/services/sensorSimulator.js` — cron job generating synthetic readings (with occasional injected anomalies) | Replace with an MQTT/device-gateway listener that writes to the same `SensorReading` model |
| Lab testing (e.g. KVIC) | `src/services/mockLabService.js` — seeded report templates, simulated turnaround delay | Replace internals with a real HTTP call to the lab's API; routes (`labRoutes.js`) don't change |
| ML model (disease risk / yield) | `src/services/mlService.js` — calls `ML_SERVICE_URL` if set, else falls back to a simple heuristic | Point `ML_SERVICE_URL` at a real FastAPI service implementing the two documented endpoints |

## Setup

```bash
npm install
cp .env.example .env   # edit MONGO_URI etc. as needed
npm run dev             # or: npm start
```

Requires a running MongoDB instance (local or Atlas) — set `MONGO_URI` accordingly.

The sensor simulator starts automatically on boot (every 2 minutes by default,
configurable via `SIMULATOR_INTERVAL_CRON`; set `SIMULATOR_ENABLED=false` to disable).

## API Endpoints

### Auth — phone + OTP login (multi-device)

Login is phone-number + OTP based (no password), which suits a mostly-mobile,
rural/semi-urban keeper audience better than passwords. OTP delivery is
**mocked** — codes are logged to the server console instead of sent via SMS,
same "mock now, swap later" pattern as the lab/IoT services (real integration
point: `src/services/otpService.js`).

- `POST /api/auth/request-otp` — body: `{ phone }`. Phone must already belong
  to a registered Keeper. Generates and "sends" (console-logs) a 6-digit code,
  valid for `OTP_EXPIRES_MINUTES` (default 5).
- `POST /api/auth/verify-otp` — body: `{ phone, code }`. On success, returns
  `{ token, keeper }`. The token is a JWT valid for `JWT_EXPIRES_IN` (default 30 days).
- `GET /api/auth/me` — requires `Authorization: Bearer <token>`. Returns the
  logged-in keeper plus their farms, without the caller needing to know their
  own database ID.

**Multi-device:** each `verify-otp` call issues an independent token, so a
keeper can be logged in on several phones/devices simultaneously — logging in
on a new device doesn't invalidate any other device's session. Set `JWT_SECRET`
in `.env` before using auth routes (a startup warning fires if it's missing).

The earlier `GET /api/keepers/:id/farms` and `GET /api/keepers/by-code/:keeperCode/farms`
endpoints still work (useful for admin/demo lookups) but are unauthenticated —
prefer `GET /api/auth/me` for anything acting as the logged-in keeper.

### Portal 1 — Productivity & Health

**Keepers**
- `POST /api/keepers` — register a keeper
- `GET /api/keepers` — list keepers
- `GET /api/keepers/:id`
- `GET /api/keepers/:id/farms` — all farms belonging to this keeper (one keeper, many farms)
- `GET /api/keepers/by-code/:keeperCode/farms` — same, looked up by the human-friendly `keeperCode` (e.g. `KPR-0001`) instead of the raw MongoDB `_id`. This is the natural fit for a Portal 2 "login by keeper ID" screen.
- `PATCH /api/keepers/:id`

> **No authentication yet.** All keeper/farm lookups above are ID lookups only — there's no password or OTP check. Anyone who knows a `keeperCode` can currently pull that keeper's farms. Fine for a prototype demo; add a real login step (phone + OTP is the natural fit for this audience) before using this beyond a demo.

**Farms**
- `POST /api/farms` — create a farm (linked to a keeper)
- `GET /api/farms?keeperId=...`
- `GET /api/farms/:id`
- `PATCH /api/farms/:id`

**Hives**
- `POST /api/hives` — add a hive to a farm
- `GET /api/hives?farmId=...`
- `GET /api/hives/:id`

**Sensor readings**
- `POST /api/sensors/readings` — manual reading entry (also runs the alert engine)
- `GET /api/sensors/readings/:hiveId?limit=50`
- `GET /api/sensors/latest/:hiveId`

**Alerts** (detection + suggested action only, no control actions)
- `GET /api/alerts?farmId=&hiveId=&status=open`
- `PATCH /api/alerts/:id/resolve`

**Yield & disease risk (ML-backed, with heuristic fallback)**
- `POST /api/yield/estimate` — body: `{ farmId, season }`
- `GET /api/yield/disease-risk/:hiveId`

### Portal 2 — Brand & QR Traceability

**Batches**
- `POST /api/batches` — create a harvest batch (rejects if the given `farm` doesn't actually belong to the given `keeper`)
- `GET /api/batches?farmId=&keeperId=`
- `GET /api/batches/:id`
- `PATCH /api/batches/:id` — e.g. update price

**Lab testing**
- `POST /api/lab/submit/:batchId` — submit sample for testing (simulated turnaround)
- `GET /api/lab/report/:batchId` — fetch report once ready

**QR**
- `POST /api/qr/generate/:batchId` — generates QR image (data URL) + public scan URL
- `GET /api/qr/scan/:batchId` — **public**, no-auth endpoint for end customers scanning the QR

## Data model summary

```
Keeper 1---* Farm 1---* Hive 1---* SensorReading
                              \--* Alert
Farm 1---* Batch 1---1 LabReport
```

## Demo script suggestion

1. Create a Keeper, a Farm under them, and 2-3 Hives under that farm.
2. Log in as that keeper: `POST /api/auth/request-otp` with their phone, check
   the server console for the mocked code, then `POST /api/auth/verify-otp`
   to get a token. Use `GET /api/auth/me` (with `Authorization: Bearer <token>`)
   to show their farms without passing any ID manually — this is what a real
   login screen would call.
3. Let the simulator run a few ticks (or lower `SIMULATOR_INTERVAL_CRON` to `*/1 * * * *`
   for a faster demo) — watch `GET /api/sensors/latest/:hiveId` update and occasional
   `GET /api/alerts` entries appear.
3. Call `POST /api/yield/estimate` to show the yield projection.
4. Create a Batch for the farm, `POST /api/lab/submit/:batchId`, wait a few seconds,
   then `GET /api/lab/report/:batchId`.
5. `POST /api/qr/generate/:batchId`, then open the returned `publicUrl` (or hit
   `GET /api/qr/scan/:batchId`) to show the customer-facing view.
