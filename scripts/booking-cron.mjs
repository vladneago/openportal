#!/usr/bin/env node
// ─────────────────────────────────────────────
// Booking cron entry point
//
// Call this every 5–10 minutes from your scheduler:
//   node scripts/booking-cron.mjs
//
// Env:
//   API_BASE_URL   default http://localhost:4000
//   WORKER_TOKEN   shared secret (required in prod, optional in dev)
//
// In prod, set up with system cron / Vercel Cron / GitHub Actions:
//   */5 * * * * cd /app && node scripts/booking-cron.mjs >> /var/log/openportal-cron.log 2>&1
// ─────────────────────────────────────────────

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const WORKER_TOKEN = process.env.WORKER_TOKEN || "";

const headers = {
  "Content-Type": "application/json",
  ...(WORKER_TOKEN ? { "x-worker-token": WORKER_TOKEN } : {}),
};

async function tick(path, body = {}) {
  const url = `${API_BASE_URL}/api/v1/internal/booking${path}`;
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
      console.error(`[cron] ${path} FAIL (${res.status}) ${ms}ms`, data);
      return false;
    }
    console.log(`[cron] ${path} OK ${ms}ms`, JSON.stringify(data.data));
    return true;
  } catch (err) {
    console.error(`[cron] ${path} EXCEPTION`, err.message);
    return false;
  }
}

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`[cron] booking tick started @ ${startedAt}`);

  const r1 = await tick("/reminders/tick");
  const r2 = await tick("/no-show/tick");

  const ok = r1 && r2;
  console.log(`[cron] booking tick finished — ${ok ? "OK" : "PARTIAL"}`);
  process.exit(ok ? 0 : 1);
}

main();
