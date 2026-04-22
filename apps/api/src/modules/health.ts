import { Hono } from "hono";
import { db } from "@openportal/db";
import { sql } from "drizzle-orm";

export const healthRoutes = new Hono();

healthRoutes.get("/", async (c) => {
  const checks: Record<string, "ok" | "error"> = {};

  // Check PostgreSQL
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");

  return c.json({
    status: allOk ? "healthy" : "degraded",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    checks,
  }, allOk ? 200 : 503);
});
