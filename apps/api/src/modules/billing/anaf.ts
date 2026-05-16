import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, tenantAnafCredentials, billingInvoices, billingInvoiceLines } from "@openportal/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";
import {
  anafEnabled,
  getAuthorizeUrl,
  exchangeAuthCode,
  getAnafCreds,
  upsertAnafCreds,
} from "../../lib/anaf";
import { generateUblXml } from "../../lib/ubl-invoice";
import { randomBytes } from "node:crypto";

// ─────────────────────────────────────────────
// /api/v1/billing/anaf — ANAF e-Factura settings + OAuth flow
// (Authenticated. Per-tenant credentials and OAuth wiring.)
// ─────────────────────────────────────────────

export const anafRoutes = new Hono();

// Encode/decode "state" for OAuth — we round-trip tenantId + nonce so
// the callback can resolve which tenant authorized.
function encodeState(tenantId: string): string {
  const nonce = randomBytes(8).toString("hex");
  return Buffer.from(JSON.stringify({ tenantId, nonce, ts: Date.now() })).toString("base64url");
}
function decodeState(state: string): { tenantId: string; nonce: string; ts: number } | null {
  try {
    return JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// GET /settings — auth required
// ─────────────────────────────────────────────

const settingsAuthed = new Hono();
settingsAuthed.use("*", requireAuth);

settingsAuthed.get("/settings", async (c) => {
  const tenantId = c.get("tenantId");
  const creds = await getAnafCreds(tenantId);

  return c.json({
    success: true,
    data: {
      anafEnabled,
      connected: Boolean(creds?.isActive && creds.accessToken),
      environment: creds?.environment ?? "test",
      cui: creds?.cui ?? null,
      legalName: creds?.legalName ?? null,
      registrationNumber: creds?.registrationNumber ?? null,
      address: creds?.address ?? null,
      city: creds?.city ?? null,
      county: creds?.county ?? null,
      countryCode: creds?.countryCode ?? "RO",
      iban: creds?.iban ?? null,
      bank: creds?.bank ?? null,
      tokenExpiresAt: creds?.tokenExpiresAt?.toISOString() ?? null,
      lastConnectedAt: creds?.lastConnectedAt?.toISOString() ?? null,
      lastErrorMessage: creds?.lastErrorMessage ?? null,
    },
  });
});

// Save issuer fiscal identity (does NOT change OAuth tokens)
const updateSettingsSchema = z.object({
  cui: z.string().min(2).max(32),
  registrationNumber: z.string().max(64).optional().nullable(),
  legalName: z.string().min(2).max(300),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  county: z.string().max(120).optional().nullable(),
  countryCode: z.string().length(2).optional().nullable(),
  postalCode: z.string().max(16).optional().nullable(),
  iban: z.string().max(64).optional().nullable(),
  bank: z.string().max(200).optional().nullable(),
  environment: z.enum(["test", "prod"]).optional(),
});

settingsAuthed.put("/settings", zValidator("json", updateSettingsSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");
  await upsertAnafCreds(tenantId, {
    cui: body.cui,
    registrationNumber: body.registrationNumber ?? null,
    legalName: body.legalName,
    address: body.address ?? null,
    city: body.city ?? null,
    county: body.county ?? null,
    countryCode: body.countryCode ?? "RO",
    postalCode: body.postalCode ?? null,
    iban: body.iban ?? null,
    bank: body.bank ?? null,
    environment: body.environment ?? "test",
  });
  return c.json({ success: true });
});

// Build OAuth authorize URL (returns it; client opens in popup/redirect)
settingsAuthed.post("/oauth/start", async (c) => {
  const tenantId = c.get("tenantId");

  // Dev stub: no ANAF_CLIENT_ID → instantly mark as connected with stub tokens
  if (!anafEnabled) {
    const now = new Date();
    await upsertAnafCreds(tenantId, {
      accessToken: `stub_access_${Date.now()}`,
      refreshToken: `stub_refresh_${Date.now()}`,
      tokenExpiresAt: new Date(now.getTime() + 86400_000 * 365),
      tokenType: "Bearer",
      scope: "efactura",
      isActive: true,
      lastConnectedAt: now,
      lastErrorMessage: null,
    });
    return c.json({
      success: true,
      data: {
        stub: true,
        message: "ANAF_CLIENT_ID not configured — connected locally with stub tokens",
      },
    });
  }

  const state = encodeState(tenantId);
  const url = getAuthorizeUrl(state);
  return c.json({ success: true, data: { stub: false, authorizeUrl: url, state } });
});

// Manually disconnect
settingsAuthed.post("/oauth/disconnect", async (c) => {
  const tenantId = c.get("tenantId");
  const creds = await getAnafCreds(tenantId);
  if (creds) {
    await db
      .update(tenantAnafCredentials)
      .set({
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(tenantAnafCredentials.id, creds.id));
  }
  return c.json({ success: true });
});

// Preview the UBL XML for an invoice (does not submit)
settingsAuthed.get("/preview-xml/:invoiceId", async (c) => {
  const tenantId = c.get("tenantId");
  const invoiceId = c.req.param("invoiceId");

  const [invoice] = await db
    .select()
    .from(billingInvoices)
    .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.id, invoiceId)))
    .limit(1);
  if (!invoice) throw new AppError(404, "INVOICE_NOT_FOUND", "Invoice not found");
  if (!invoice.issuerTaxId) throw new AppError(400, "ISSUER_CUI_MISSING", "Issuer CUI is required for e-Factura");

  const lines = await db
    .select()
    .from(billingInvoiceLines)
    .where(eq(billingInvoiceLines.invoiceId, invoice.id));
  if (lines.length === 0) throw new AppError(400, "EMPTY_INVOICE", "Invoice has no lines");

  const xml = generateUblXml({ invoice, lines });
  c.header("Content-Type", "application/xml; charset=utf-8");
  return c.body(xml);
});

// ─────────────────────────────────────────────
// GET /oauth/callback — UNAUTHENTICATED (ANAF redirects here)
// We use `state` to identify the tenant. After successful token
// exchange, redirect back to the settings page.
// ─────────────────────────────────────────────

const WEB_BASE_URL = process.env.WEB_BASE_URL || "http://localhost:3000";

anafRoutes.get("/oauth/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const errParam = c.req.query("error");

  if (errParam) {
    return c.redirect(`${WEB_BASE_URL}/settings/anaf?error=${encodeURIComponent(errParam)}`);
  }
  if (!code || !state) {
    return c.redirect(`${WEB_BASE_URL}/settings/anaf?error=missing_params`);
  }

  const decoded = decodeState(state);
  if (!decoded) {
    return c.redirect(`${WEB_BASE_URL}/settings/anaf?error=invalid_state`);
  }

  try {
    const tokens = await exchangeAuthCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const now = new Date();
    await upsertAnafCreds(decoded.tenantId, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      tokenExpiresAt: expiresAt,
      tokenType: tokens.token_type,
      scope: tokens.scope ?? null,
      isActive: true,
      lastConnectedAt: now,
      lastErrorAt: null,
      lastErrorMessage: null,
    });
    return c.redirect(`${WEB_BASE_URL}/settings/anaf?connected=1`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await upsertAnafCreds(decoded.tenantId, {
      lastErrorAt: new Date(),
      lastErrorMessage: message,
    });
    return c.redirect(`${WEB_BASE_URL}/settings/anaf?error=${encodeURIComponent(message.slice(0, 200))}`);
  }
});

// Mount authed routes
anafRoutes.route("/", settingsAuthed);
