import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, tenantStripePayments } from "@openportal/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";
import {
  createInvoicePaymentLink,
  testTenantStripeKey,
  getTenantStripeConfig,
} from "../../lib/tenant-stripe-payments";

// ─────────────────────────────────────────────
// /api/v1/billing/stripe-payments — owner-facing config + actions
// ─────────────────────────────────────────────

export const stripePaymentsRoutes = new Hono();
stripePaymentsRoutes.use("*", requireAuth);

// ─────────────────────────────────────────────
// GET /settings — masked config + webhook URL hint
// ─────────────────────────────────────────────

stripePaymentsRoutes.get("/settings", async (c) => {
  const tenantId = c.get("tenantId");
  const row = await getTenantStripeConfig(tenantId);
  const webBaseUrl = process.env.API_BASE_URL || process.env.WEB_BASE_URL || "";
  const webhookPath = `/api/v1/public/billing/stripe-payments/webhook/${tenantId}`;

  if (!row) {
    return c.json({
      success: true,
      data: {
        provider: "none",
        mode: "test",
        enabled: false,
        hasSecretKey: false,
        hasWebhookSecret: false,
        accountId: null,
        accountCountry: null,
        accountDefaultCurrency: null,
        publishableKey: null,
        lastTestAt: null,
        lastTestStatus: null,
        lastTestError: null,
        webhookUrl: webBaseUrl ? `${webBaseUrl}${webhookPath}` : webhookPath,
      },
    });
  }

  return c.json({
    success: true,
    data: {
      id: row.id,
      mode: row.mode,
      enabled: row.enabled,
      hasSecretKey: Boolean(row.secretKey),
      hasWebhookSecret: Boolean(row.webhookSecret),
      accountId: row.accountId,
      accountCountry: row.accountCountry,
      accountDefaultCurrency: row.accountDefaultCurrency,
      publishableKey: row.publishableKey,
      lastTestAt: row.lastTestAt,
      lastTestStatus: row.lastTestStatus,
      lastTestError: row.lastTestError,
      webhookUrl: webBaseUrl ? `${webBaseUrl}${webhookPath}` : webhookPath,
    },
  });
});

// ─────────────────────────────────────────────
// PUT /settings — upsert credentials (empty strings preserve existing)
// ─────────────────────────────────────────────

const settingsSchema = z.object({
  mode: z.enum(["test", "live"]).default("test"),
  enabled: z.boolean().default(false),
  secretKey: z.string().max(200).optional().nullable(),
  publishableKey: z.string().max(200).optional().nullable(),
  webhookSecret: z.string().max(200).optional().nullable(),
});

stripePaymentsRoutes.put("/settings", zValidator("json", settingsSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");

  const [existing] = await db
    .select({ id: tenantStripePayments.id })
    .from(tenantStripePayments)
    .where(eq(tenantStripePayments.tenantId, tenantId))
    .limit(1);

  const updates: Record<string, unknown> = {
    mode: body.mode,
    enabled: body.enabled,
    updatedAt: new Date(),
  };
  if (body.secretKey) updates.secretKey = body.secretKey;
  if (body.publishableKey !== undefined && body.publishableKey !== null) {
    updates.publishableKey = body.publishableKey;
  }
  if (body.webhookSecret) updates.webhookSecret = body.webhookSecret;

  if (existing) {
    await db
      .update(tenantStripePayments)
      .set(updates)
      .where(eq(tenantStripePayments.id, existing.id));
  } else {
    await db.insert(tenantStripePayments).values({ tenantId, ...updates });
  }

  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// POST /test — verify the API key + cache account info
// ─────────────────────────────────────────────

stripePaymentsRoutes.post("/test", async (c) => {
  const tenantId = c.get("tenantId");
  const cfg = await getTenantStripeConfig(tenantId);
  if (!cfg || !cfg.secretKey) {
    throw new AppError(400, "NO_KEY", "Add your Stripe secret key first");
  }

  const result = await testTenantStripeKey(tenantId, cfg.secretKey);

  await db
    .update(tenantStripePayments)
    .set({
      lastTestAt: new Date(),
      lastTestStatus: result.ok ? "ok" : "failed",
      lastTestError: result.error ?? null,
      accountId: result.accountId ?? cfg.accountId,
      accountCountry: result.country ?? cfg.accountCountry,
      accountDefaultCurrency: result.defaultCurrency ?? cfg.accountDefaultCurrency,
      updatedAt: new Date(),
    })
    .where(eq(tenantStripePayments.tenantId, tenantId));

  return c.json({ success: result.ok, data: result });
});

// ─────────────────────────────────────────────
// POST /invoices/:id/payment-link — generate (or return cached) link
// ─────────────────────────────────────────────

stripePaymentsRoutes.post("/invoices/:id/payment-link", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  try {
    const result = await createInvoicePaymentLink(tenantId, id);
    return c.json({ success: true, data: result });
  } catch (err) {
    const msg = (err as Error).message;
    if (/Stripe payments not configured/.test(msg)) {
      throw new AppError(400, "STRIPE_NOT_CONFIGURED", "Configurează Stripe în Setări → Plăți online înainte să generezi un link de plată");
    }
    if (/Invoice is already paid/.test(msg)) {
      throw new AppError(400, "ALREADY_PAID", "Factura este deja achitată");
    }
    if (/Invoice has no outstanding amount/.test(msg)) {
      throw new AppError(400, "NO_OUTSTANDING_AMOUNT", "Factura nu are sumă restantă");
    }
    if (/Invoice not found/.test(msg)) {
      throw new AppError(404, "NOT_FOUND", "Factura nu există");
    }
    throw new AppError(500, "STRIPE_ERROR", msg);
  }
});
