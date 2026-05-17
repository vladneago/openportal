#!/usr/bin/env node
// ─────────────────────────────────────────────
// Marketing campaign cron entry point
//
// Call every 2-3 minutes:
//   node scripts/marketing-cron.mjs
//
// Runs:
//   /scheduled/tick — promotes due scheduled campaigns to sending,
//                     expands audience into recipient rows
//   /drain/tick     — processes a batch of queued recipients per
//                     in-flight campaign
//
// Env:
//   API_BASE_URL   default http://localhost:4000
//   WORKER_TOKEN   shared secret (required in prod, optional in dev)
// ─────────────────────────────────────────────

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const WORKER_TOKEN = process.env.WORKER_TOKEN || "";

const headers = {
  "Content-Type": "application/json",
  ...(WORKER_TOKEN ? { "x-worker-token": WORKER_TOKEN } : {}),
};

async function tick(path, body = {}) {
  const url = `${API_BASE_URL}/api/v1/internal/marketing${path}`;
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
      console.error(`[marketing-cron] ${path} FAIL (${res.status}) ${ms}ms`, data);
      return false;
    }
    console.log(`[marketing-cron] ${path} OK ${ms}ms`, JSON.stringify(data.data));
    return true;
  } catch (err) {
    console.error(`[marketing-cron] ${path} EXCEPTION`, err.message);
    return false;
  }
}

// Automation tick runs less frequently (once per day is enough — most
// triggers are date-based and idempotent). The dedup log makes calling
// it on every cron pass safe though, so we just do it every tick.
(async () => {
  console.log(`[marketing-cron] tick @ ${new Date().toISOString()}`);
  const r1 = await tick("/scheduled/tick");
  const r2 = await tick("/automations/tick");
  const r3 = await tick("/drain/tick");
  const ok = r1 && r2 && r3;
  console.log(`[marketing-cron] finished — ${ok ? "OK" : "PARTIAL"}`);
  process.exit(ok ? 0 : 1);
})();
