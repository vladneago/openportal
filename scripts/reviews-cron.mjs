#!/usr/bin/env node
// ─────────────────────────────────────────────
// Review request cron entry point
//
// Call this once daily (e.g., morning):
//   node scripts/reviews-cron.mjs
//
// Looks for appointments completed >24h ago with email consent, no
// existing review row, and sends a "How was it?" email containing a
// one-time public review link.
//
// Env:
//   API_BASE_URL   default http://localhost:4000
//   WORKER_TOKEN   shared secret (required in prod, optional in dev)
//
// Suggested cron line:
//   0 10 * * * cd /app && node scripts/reviews-cron.mjs >> /var/log/openportal-reviews.log 2>&1
// ─────────────────────────────────────────────

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const WORKER_TOKEN = process.env.WORKER_TOKEN || "";

const headers = {
  "Content-Type": "application/json",
  ...(WORKER_TOKEN ? { "x-worker-token": WORKER_TOKEN } : {}),
};

async function tick() {
  const url = `${API_BASE_URL}/api/v1/internal/reviews/request/tick`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });
    const ms = Date.now() - t0;
    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error(`[reviews-cron] FAIL (${res.status}) ${ms}ms`, data);
      return false;
    }
    console.log(`[reviews-cron] OK ${ms}ms`, JSON.stringify(data.data));
    return true;
  } catch (err) {
    console.error(`[reviews-cron] EXCEPTION`, err.message);
    return false;
  }
}

(async () => {
  console.log(`[reviews-cron] tick @ ${new Date().toISOString()}`);
  const ok = await tick();
  console.log(`[reviews-cron] finished — ${ok ? "OK" : "FAIL"}`);
  process.exit(ok ? 0 : 1);
})();
