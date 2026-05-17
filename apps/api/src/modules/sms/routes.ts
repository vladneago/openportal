import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, tenantSmsSettings, smsSends, tenants } from "@openportal/db";
import { and, eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";
import { sendSms } from "../../lib/sms";
import { renderTestSms } from "../../lib/sms-templates";
import { getSmsUsageThisMonth } from "../../lib/plan-limits";

// ─────────────────────────────────────────────
// /api/v1/sms — provider settings + test send + log
// ─────────────────────────────────────────────

export const smsRoutes = new Hono();
smsRoutes.use("*", requireAuth);

// ─────────────────────────────────────────────
// GET /settings — return provider config (token hidden)
// ─────────────────────────────────────────────

smsRoutes.get("/settings", async (c) => {
  const tenantId = c.get("tenantId");
  const [row] = await db
    .select()
    .from(tenantSmsSettings)
    .where(eq(tenantSmsSettings.tenantId, tenantId))
    .limit(1);

  if (!row) {
    return c.json({
      success: true,
      data: {
        provider: "stub",
        enabled: false,
        fromIdentifier: "",
        hasTwilioCreds: false,
        hasVonageCreds: false,
        lastTestAt: null,
        lastTestStatus: null,
        lastTestError: null,
      },
    });
  }

  return c.json({
    success: true,
    data: {
      id: row.id,
      provider: row.provider,
      enabled: row.enabled,
      fromIdentifier: row.fromIdentifier ?? "",
      // Mask secrets — only expose presence
      hasTwilioCreds: Boolean(row.twilioAccountSid && row.twilioAuthToken),
      hasVonageCreds: Boolean(row.vonageApiKey && row.vonageApiSecret),
      lastTestAt: row.lastTestAt,
      lastTestStatus: row.lastTestStatus,
      lastTestError: row.lastTestError,
    },
  });
});

// ─────────────────────────────────────────────
// PUT /settings — upsert provider config
// ─────────────────────────────────────────────

const settingsSchema = z.object({
  provider: z.enum(["twilio", "vonage", "stub"]),
  enabled: z.boolean().default(false),
  fromIdentifier: z.string().max(32).optional().nullable(),
  twilioAccountSid: z.string().max(64).optional().nullable(),
  twilioAuthToken: z.string().max(128).optional().nullable(),
  vonageApiKey: z.string().max(64).optional().nullable(),
  vonageApiSecret: z.string().max(128).optional().nullable(),
});

smsRoutes.put("/settings", zValidator("json", settingsSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");

  const [existing] = await db
    .select({ id: tenantSmsSettings.id })
    .from(tenantSmsSettings)
    .where(eq(tenantSmsSettings.tenantId, tenantId))
    .limit(1);

  // Only persist secret if the body provides a non-empty value — empty
  // strings preserve the existing value (UI sends empty for "unchanged").
  const updates: Record<string, unknown> = {
    provider: body.provider,
    enabled: body.enabled,
    fromIdentifier: body.fromIdentifier ?? null,
    updatedAt: new Date(),
  };
  if (body.twilioAccountSid) updates.twilioAccountSid = body.twilioAccountSid;
  if (body.twilioAuthToken) updates.twilioAuthToken = body.twilioAuthToken;
  if (body.vonageApiKey) updates.vonageApiKey = body.vonageApiKey;
  if (body.vonageApiSecret) updates.vonageApiSecret = body.vonageApiSecret;

  if (existing) {
    await db.update(tenantSmsSettings).set(updates).where(eq(tenantSmsSettings.id, existing.id));
  } else {
    await db.insert(tenantSmsSettings).values({ tenantId, ...updates });
  }

  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// POST /test — send a one-off test message
// ─────────────────────────────────────────────

const testSchema = z.object({
  toPhone: z.string().min(7).max(32),
});

smsRoutes.post("/test", zValidator("json", testSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");

  const [tenant] = await db
    .select({ name: tenants.name })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const result = await sendSms({
    tenantId,
    to: body.toPhone,
    body: renderTestSms(tenant?.name ?? "OpenPortal"),
    type: "test",
  });

  // Record on settings row for the UI
  await db
    .update(tenantSmsSettings)
    .set({
      lastTestAt: new Date(),
      lastTestStatus: result.status,
      lastTestError: result.error ?? null,
      updatedAt: new Date(),
    })
    .where(eq(tenantSmsSettings.tenantId, tenantId));

  return c.json({ success: result.success, data: result });
});

// ─────────────────────────────────────────────
// GET /log — recent SMS sends for audit
// ─────────────────────────────────────────────

smsRoutes.get("/log", async (c) => {
  const tenantId = c.get("tenantId");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);

  const rows = await db
    .select()
    .from(smsSends)
    .where(eq(smsSends.tenantId, tenantId))
    .orderBy(desc(smsSends.createdAt))
    .limit(limit);

  return c.json({ success: true, data: rows });
});

// ─────────────────────────────────────────────
// GET /summary — quota + counts for dashboard
// ─────────────────────────────────────────────

smsRoutes.get("/summary", async (c) => {
  const tenantId = c.get("tenantId");

  const [counts] = await db
    .select({
      sent: sql<number>`count(*) filter (where status = 'sent')::int`,
      stub: sql<number>`count(*) filter (where status = 'stub')::int`,
      failed: sql<number>`count(*) filter (where status = 'failed')::int`,
      skipped: sql<number>`count(*) filter (where status = 'skipped')::int`,
    })
    .from(smsSends)
    .where(eq(smsSends.tenantId, tenantId));

  const sentThisMonth = await getSmsUsageThisMonth(tenantId);

  return c.json({ success: true, data: { ...counts, sentThisMonth } });
});

// suppress unused import warning when not in use here
void and;
void AppError;
