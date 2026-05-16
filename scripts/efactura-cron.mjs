#!/usr/bin/env node
// ─────────────────────────────────────────────
// e-Factura ANAF cron entry point
//
// Call this every 2–5 minutes from your scheduler:
//   node scripts/efactura-cron.mjs
//
// Runs two ticks:
//   /submit/tick — picks queued submissions, generates UBL XML,
//                  uploads to ANAF SPV, stores uploadId
//   /poll/tick   — polls in-flight submissions, marks accepted/rejected
//
// Env:
//   API_BASE_URL   default http://localhost:4000
//   WORKER_TOKEN   shared secret (required in prod, optional in dev)
//
// Suggested cron line:
//   */3 * * * * cd /app && node scripts/efactura-cron.mjs >> /var/log/openportal-efactura.log 2>&1
// ─────────────────────────────────────────────

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const WORKER_TOKEN = process.env.WORKER_TOKEN || "";

const headers = {
  "Content-Type": "application/json",
  ...(WORKER_TOKEN ? { "x-worker-token": WORKER_TOKEN } : {}),
};

async function tick(path, body = {}) {
  const url = `${API_BASE_URL}/api/v1/internal/efactura${path}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const ms = Date.now() - t0;
    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error(`[efactura-cron] ${path} FAIL (${res.status}) ${ms}ms`, data);
      return false;
    }
    console.log(`[efactura-cron] ${path} OK ${ms}ms`, JSON.stringify(data.data));
    return true;
  } catch (err) {
    console.error(`[efactura-cron] ${path} EXCEPTION`, err.message);
    return false;
  }
}

async function main() {
  console.log(`[efactura-cron] tick @ ${new Date().toISOString()}`);
  const r1 = await tick("/submit/tick");
  const r2 = await tick("/poll/tick");
  const ok = r1 && r2;
  console.log(`[efactura-cron] finished — ${ok ? "OK" : "PARTIAL"}`);
  process.exit(ok ? 0 : 1);
}

main();
