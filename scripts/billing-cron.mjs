#!/usr/bin/env node
// ─────────────────────────────────────────────
// Billing cron entry point
//
// Call this once daily (e.g., at 9 AM):
//   node scripts/billing-cron.mjs
//
// Runs:
//   /mark-overdue/tick — flips past-due unpaid invoices to "overdue"
//   /reminders/tick    — sends payment reminders (1d+ overdue, weekly cadence, cap 5)
//
// Env:
//   API_BASE_URL   default http://localhost:4000
//   WORKER_TOKEN   shared secret (required in prod, optional in dev)
//
// Suggested cron line:
//   0 9 * * * cd /app && node scripts/billing-cron.mjs >> /var/log/openportal-billing.log 2>&1
// ─────────────────────────────────────────────

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const WORKER_TOKEN = process.env.WORKER_TOKEN || "";

const headers = {
  "Content-Type": "application/json",
  ...(WORKER_TOKEN ? { "x-worker-token": WORKER_TOKEN } : {}),
};

async function tick(path, body = {}) {
  const url = `${API_BASE_URL}/api/v1/internal/billing${path}`;
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
      console.error(`[billing-cron] ${path} FAIL (${res.status}) ${ms}ms`, data);
      return false;
    }
    console.log(`[billing-cron] ${path} OK ${ms}ms`, JSON.stringify(data.data));
    return true;
  } catch (err) {
    console.error(`[billing-cron] ${path} EXCEPTION`, err.message);
    return false;
  }
}

async function main() {
  console.log(`[billing-cron] tick @ ${new Date().toISOString()}`);
  const r1 = await tick("/mark-overdue/tick");
  const r2 = await tick("/reminders/tick");
  const ok = r1 && r2;
  console.log(`[billing-cron] finished — ${ok ? "OK" : "PARTIAL"}`);
  process.exit(ok ? 0 : 1);
}

main();
