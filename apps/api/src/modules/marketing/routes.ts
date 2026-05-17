import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  db,
  marketingCampaigns,
  marketingRecipients,
  bookingCustomers,
  tenants,
} from "@openportal/db";
import { and, eq, desc, count, sql, gte, lt, isNotNull, inArray } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";
import { renderCampaignEmail, type RenderVars } from "../../lib/marketing-render";
import { sendMail } from "../../lib/mailer";
import { getEmailQuotaThisMonth, assertEmailQuota } from "../../lib/plan-limits";

// ─────────────────────────────────────────────
// /api/v1/marketing — campaigns CRUD + send
// ─────────────────────────────────────────────

export const marketingRoutes = new Hono();
marketingRoutes.use("*", requireAuth);

// ─────────────────────────────────────────────
// GET /campaigns — list with status filter
// ─────────────────────────────────────────────

marketingRoutes.get("/campaigns", async (c) => {
  const tenantId = c.get("tenantId");
  const status = c.req.query("status");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);

  const conds = [eq(marketingCampaigns.tenantId, tenantId)];
  if (status) {
    conds.push(
      eq(
        marketingCampaigns.status,
        status as "draft" | "scheduled" | "sending" | "sent" | "paused" | "failed",
      ),
    );
  }

  const rows = await db
    .select()
    .from(marketingCampaigns)
    .where(and(...conds))
    .orderBy(desc(marketingCampaigns.createdAt))
    .limit(limit);

  return c.json({ success: true, data: rows });
});

// ─────────────────────────────────────────────
// GET /campaigns/summary — quota + counts for dashboard
// ─────────────────────────────────────────────

marketingRoutes.get("/campaigns/summary", async (c) => {
  const tenantId = c.get("tenantId");

  const [counts] = await db
    .select({
      drafts: sql<number>`count(*) filter (where status = 'draft' and is_automation = false)::int`,
      scheduled: sql<number>`count(*) filter (where status = 'scheduled')::int`,
      sent: sql<number>`count(*) filter (where status = 'sent')::int`,
      automations: sql<number>`count(*) filter (where is_automation = true)::int`,
      automationsActive: sql<number>`count(*) filter (where is_automation = true and automation_active = true)::int`,
    })
    .from(marketingCampaigns)
    .where(eq(marketingCampaigns.tenantId, tenantId));

  const sentThisMonth = await getEmailQuotaThisMonth(tenantId);

  return c.json({ success: true, data: { ...counts, sentThisMonth } });
});

// ─────────────────────────────────────────────
// GET /campaigns/:id — detail
// ─────────────────────────────────────────────

marketingRoutes.get("/campaigns/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [row] = await db
    .select()
    .from(marketingCampaigns)
    .where(and(eq(marketingCampaigns.tenantId, tenantId), eq(marketingCampaigns.id, id)))
    .limit(1);
  if (!row) throw new AppError(404, "NOT_FOUND", "Campaign not found");

  return c.json({ success: true, data: row });
});

// ─────────────────────────────────────────────
// GET /campaigns/:id/recipients — recipient log
// ─────────────────────────────────────────────

marketingRoutes.get("/campaigns/:id/recipients", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const limit = Math.min(parseInt(c.req.query("limit") || "200"), 1000);

  const rows = await db
    .select()
    .from(marketingRecipients)
    .where(and(eq(marketingRecipients.tenantId, tenantId), eq(marketingRecipients.campaignId, id)))
    .orderBy(desc(marketingRecipients.createdAt))
    .limit(limit);

  return c.json({ success: true, data: rows });
});

// ─────────────────────────────────────────────
// POST /campaigns — create draft
// ─────────────────────────────────────────────

const campaignBodySchema = z.object({
  name: z.string().min(2).max(200),
  subject: z.string().min(2).max(300),
  body: z.string().min(2).max(20000),
  previewText: z.string().max(200).optional().nullable(),
  fromName: z.string().max(200).optional().nullable(),
  replyTo: z.string().email().optional().nullable(),
  targetType: z.enum([
    "all_with_consent",
    "segment_recent",
    "segment_dormant",
    "segment_top_spenders",
    "segment_tag",
    "manual",
  ]).default("all_with_consent"),
  targetParams: z.record(z.string(), z.unknown()).optional(),
  scheduledFor: z.string().datetime().optional().nullable(),
  isAutomation: z.boolean().optional(),
  automationType: z.enum(["birthday", "comeback", "post_visit", "new_customer"]).optional().nullable(),
  automationParams: z.record(z.string(), z.unknown()).optional(),
  automationActive: z.boolean().optional(),
});

marketingRoutes.post("/campaigns", zValidator("json", campaignBodySchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const isAutomation = body.isAutomation === true;
  const [row] = await db
    .insert(marketingCampaigns)
    .values({
      tenantId,
      name: body.name,
      subject: body.subject,
      body: body.body,
      previewText: body.previewText ?? null,
      fromName: body.fromName ?? null,
      replyTo: body.replyTo ?? null,
      targetType: body.targetType,
      targetParams: body.targetParams ?? {},
      // Automation campaigns sit at status 'sending' indefinitely; the existing
      // drain worker picks up queued recipients that automations enqueue daily.
      status: isAutomation ? "sending" : body.scheduledFor ? "scheduled" : "draft",
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
      isAutomation,
      automationType: isAutomation ? body.automationType ?? null : null,
      automationParams: body.automationParams ?? {},
      automationActive: body.automationActive ?? true,
      createdBy: user.id,
    })
    .returning();

  return c.json({ success: true, data: row }, 201);
});

// ─────────────────────────────────────────────
// PATCH /campaigns/:id — edit while not sent
// ─────────────────────────────────────────────

marketingRoutes.patch("/campaigns/:id", zValidator("json", campaignBodySchema.partial()), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [existing] = await db
    .select({ status: marketingCampaigns.status, isAutomation: marketingCampaigns.isAutomation })
    .from(marketingCampaigns)
    .where(and(eq(marketingCampaigns.tenantId, tenantId), eq(marketingCampaigns.id, id)))
    .limit(1);
  if (!existing) throw new AppError(404, "NOT_FOUND", "Campaign not found");
  // Automations sit at 'sending' permanently — they're always editable.
  if (!existing.isAutomation && (existing.status === "sent" || existing.status === "sending")) {
    throw new AppError(400, "CAMPAIGN_LOCKED", "O campanie deja trimisă nu mai poate fi editată");
  }

  const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.scheduledFor) {
    updates.scheduledFor = new Date(body.scheduledFor);
    updates.status = "scheduled";
  }

  const [row] = await db
    .update(marketingCampaigns)
    .set(updates)
    .where(and(eq(marketingCampaigns.tenantId, tenantId), eq(marketingCampaigns.id, id)))
    .returning();

  return c.json({ success: true, data: row });
});

// ─────────────────────────────────────────────
// DELETE /campaigns/:id — only while draft
// ─────────────────────────────────────────────

marketingRoutes.delete("/campaigns/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [existing] = await db
    .select({ status: marketingCampaigns.status, isAutomation: marketingCampaigns.isAutomation })
    .from(marketingCampaigns)
    .where(and(eq(marketingCampaigns.tenantId, tenantId), eq(marketingCampaigns.id, id)))
    .limit(1);
  if (!existing) throw new AppError(404, "NOT_FOUND", "Campaign not found");
  if (!existing.isAutomation && (existing.status === "sending" || existing.status === "sent")) {
    throw new AppError(400, "CAMPAIGN_LOCKED", "O campanie în trimitere sau deja trimisă nu poate fi ștearsă");
  }

  await db.delete(marketingCampaigns).where(eq(marketingCampaigns.id, id));
  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// POST /campaigns/:id/preview — render with sample vars
// ─────────────────────────────────────────────

marketingRoutes.post("/campaigns/:id/preview", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [campaign] = await db
    .select()
    .from(marketingCampaigns)
    .where(and(eq(marketingCampaigns.tenantId, tenantId), eq(marketingCampaigns.id, id)))
    .limit(1);
  if (!campaign) throw new AppError(404, "NOT_FOUND", "Campaign not found");

  const [tenant] = await db
    .select({ name: tenants.name, primaryColor: tenants.primaryColor })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const businessName = tenant?.name || "Afacerea ta";
  const brandColor = tenant?.primaryColor || "#6366F1";

  const sampleVars: RenderVars = {
    firstName: "Maria",
    lastName: "Popescu",
    fullName: "Maria Popescu",
    businessName,
    bookingLink: process.env.WEB_BASE_URL || "http://localhost:3000",
    unsubscribeLink: "#",
    currentYear: String(new Date().getFullYear()),
  };

  const rendered = renderCampaignEmail({
    subject: campaign.subject,
    body: campaign.body,
    previewText: campaign.previewText,
    fromName: campaign.fromName || businessName,
    businessName,
    brandColor,
    vars: sampleVars,
  });

  return c.json({ success: true, data: rendered });
});

// ─────────────────────────────────────────────
// POST /campaigns/:id/audience — preview targeted recipients count
// ─────────────────────────────────────────────

marketingRoutes.post("/campaigns/:id/audience", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [campaign] = await db
    .select()
    .from(marketingCampaigns)
    .where(and(eq(marketingCampaigns.tenantId, tenantId), eq(marketingCampaigns.id, id)))
    .limit(1);
  if (!campaign) throw new AppError(404, "NOT_FOUND", "Campaign not found");

  const customers = await resolveAudience(
    tenantId,
    campaign.targetType,
    (campaign.targetParams || {}) as Record<string, unknown>,
  );

  const eligible = customers.filter((c) => c.email && c.emailConsent);
  return c.json({
    success: true,
    data: {
      total: customers.length,
      eligible: eligible.length,
      withoutEmail: customers.filter((c) => !c.email).length,
      withoutConsent: customers.filter((c) => c.email && !c.emailConsent).length,
      sample: eligible.slice(0, 5).map((c) => ({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
      })),
    },
  });
});

// ─────────────────────────────────────────────
// POST /campaigns/:id/send-now — kick off send
//
// Resolves audience, inserts recipient rows (queued), then synchronously
// processes them up to a limit. For larger lists, the worker tick
// continues processing in background.
// ─────────────────────────────────────────────

const sendNowSchema = z.object({
  inlineLimit: z.number().int().min(0).max(500).default(50),
}).optional();

marketingRoutes.post("/campaigns/:id/send-now", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const parsed = sendNowSchema?.safeParse(body);
  const inlineLimit = parsed?.success ? parsed.data?.inlineLimit ?? 50 : 50;

  const [campaign] = await db
    .select()
    .from(marketingCampaigns)
    .where(and(eq(marketingCampaigns.tenantId, tenantId), eq(marketingCampaigns.id, id)))
    .limit(1);
  if (!campaign) throw new AppError(404, "NOT_FOUND", "Campaign not found");
  if (campaign.status === "sent" || campaign.status === "sending") {
    throw new AppError(400, "ALREADY_RUNNING", "Campania e deja în trimitere sau finalizată");
  }

  // Resolve audience
  const audience = await resolveAudience(
    tenantId,
    campaign.targetType,
    (campaign.targetParams || {}) as Record<string, unknown>,
  );

  // Enforce plan quota
  const eligibleEstimate = audience.filter((a) => a.email && a.emailConsent).length;
  await assertEmailQuota(tenantId, eligibleEstimate);

  // Insert recipients (idempotent via unique index on campaign×customer)
  const now = new Date();
  await db
    .update(marketingCampaigns)
    .set({ status: "sending", startedAt: now, updatedAt: now })
    .where(eq(marketingCampaigns.id, campaign.id));

  for (const customer of audience) {
    const hasEmail = Boolean(customer.email);
    const hasConsent = customer.emailConsent;
    await db
      .insert(marketingRecipients)
      .values({
        tenantId,
        campaignId: campaign.id,
        customerId: customer.id,
        emailAddress: customer.email || "",
        customerName: [customer.firstName, customer.lastName].filter(Boolean).join(" ") || null,
        status: !hasEmail ? "skipped" : !hasConsent ? "skipped" : "queued",
        skipReason: !hasEmail ? "no_email" : !hasConsent ? "no_consent" : null,
      })
      .onConflictDoNothing();
  }

  // Process inline up to inlineLimit
  const result = await processQueuedRecipients(tenantId, campaign.id, inlineLimit);

  return c.json({
    success: true,
    data: {
      campaignId: campaign.id,
      totalAudience: audience.length,
      eligible: eligibleEstimate,
      ...result,
    },
  });
});

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

interface AudienceRow {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  emailConsent: boolean;
}

export async function resolveAudience(
  tenantId: string,
  targetType: string,
  params: Record<string, unknown>,
): Promise<AudienceRow[]> {
  if (targetType === "manual") {
    const ids = Array.isArray(params.customerIds) ? (params.customerIds as string[]) : [];
    if (ids.length === 0) return [];
    return db
      .select({
        id: bookingCustomers.id,
        firstName: bookingCustomers.firstName,
        lastName: bookingCustomers.lastName,
        email: bookingCustomers.email,
        emailConsent: bookingCustomers.emailConsent,
      })
      .from(bookingCustomers)
      .where(and(eq(bookingCustomers.tenantId, tenantId), inArray(bookingCustomers.id, ids)));
  }

  if (targetType === "segment_tag") {
    const tag = typeof params.tag === "string" ? params.tag : null;
    if (!tag) return [];
    return db
      .select({
        id: bookingCustomers.id,
        firstName: bookingCustomers.firstName,
        lastName: bookingCustomers.lastName,
        email: bookingCustomers.email,
        emailConsent: bookingCustomers.emailConsent,
      })
      .from(bookingCustomers)
      .where(and(eq(bookingCustomers.tenantId, tenantId), sql`${bookingCustomers.tags}::jsonb ? ${tag}`));
  }

  if (targetType === "segment_recent") {
    const days = typeof params.withinDays === "number" ? params.withinDays : 30;
    const since = new Date(Date.now() - days * 86400_000);
    return db
      .select({
        id: bookingCustomers.id,
        firstName: bookingCustomers.firstName,
        lastName: bookingCustomers.lastName,
        email: bookingCustomers.email,
        emailConsent: bookingCustomers.emailConsent,
      })
      .from(bookingCustomers)
      .where(and(eq(bookingCustomers.tenantId, tenantId), gte(bookingCustomers.lastVisitAt, since)));
  }

  if (targetType === "segment_dormant") {
    const days = typeof params.olderThanDays === "number" ? params.olderThanDays : 60;
    const cutoff = new Date(Date.now() - days * 86400_000);
    return db
      .select({
        id: bookingCustomers.id,
        firstName: bookingCustomers.firstName,
        lastName: bookingCustomers.lastName,
        email: bookingCustomers.email,
        emailConsent: bookingCustomers.emailConsent,
      })
      .from(bookingCustomers)
      .where(
        and(
          eq(bookingCustomers.tenantId, tenantId),
          isNotNull(bookingCustomers.lastVisitAt),
          lt(bookingCustomers.lastVisitAt, cutoff),
        ),
      );
  }

  if (targetType === "segment_top_spenders") {
    const top = typeof params.topN === "number" ? Math.min(params.topN, 500) : 50;
    return db
      .select({
        id: bookingCustomers.id,
        firstName: bookingCustomers.firstName,
        lastName: bookingCustomers.lastName,
        email: bookingCustomers.email,
        emailConsent: bookingCustomers.emailConsent,
      })
      .from(bookingCustomers)
      .where(eq(bookingCustomers.tenantId, tenantId))
      .orderBy(desc(bookingCustomers.totalSpent))
      .limit(top);
  }

  // Default: all_with_consent
  return db
    .select({
      id: bookingCustomers.id,
      firstName: bookingCustomers.firstName,
      lastName: bookingCustomers.lastName,
      email: bookingCustomers.email,
      emailConsent: bookingCustomers.emailConsent,
    })
    .from(bookingCustomers)
    .where(and(eq(bookingCustomers.tenantId, tenantId), eq(bookingCustomers.emailConsent, true)));
}

export async function processQueuedRecipients(
  tenantId: string,
  campaignId: string,
  limit: number,
): Promise<{ sent: number; failed: number; remaining: number }> {
  const [campaign] = await db
    .select()
    .from(marketingCampaigns)
    .where(and(eq(marketingCampaigns.tenantId, tenantId), eq(marketingCampaigns.id, campaignId)))
    .limit(1);
  if (!campaign) return { sent: 0, failed: 0, remaining: 0 };

  const [tenant] = await db
    .select({ name: tenants.name, primaryColor: tenants.primaryColor })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const businessName = tenant?.name || "Afacerea ta";
  const brandColor = tenant?.primaryColor || "#6366F1";
  const webBase = process.env.WEB_BASE_URL || "http://localhost:3000";

  const queued = await db
    .select()
    .from(marketingRecipients)
    .where(
      and(
        eq(marketingRecipients.campaignId, campaignId),
        eq(marketingRecipients.status, "queued"),
      ),
    )
    .limit(limit);

  let sent = 0;
  let failed = 0;

  for (const r of queued) {
    const fullName = r.customerName || "Client";
    const parts = fullName.split(/\s+/);
    const firstName = parts[0] || fullName;
    const lastName = parts.slice(1).join(" ");

    const vars: RenderVars = {
      firstName,
      lastName,
      fullName,
      businessName,
      bookingLink: `${webBase}/programari`,
      unsubscribeLink: `${webBase}/unsubscribe/${encodeURIComponent(r.id)}`,
      currentYear: String(new Date().getFullYear()),
    };

    const rendered = renderCampaignEmail({
      subject: campaign.subject,
      body: campaign.body,
      previewText: campaign.previewText,
      fromName: campaign.fromName || businessName,
      businessName,
      brandColor,
      vars,
    });

    const mailResult = await sendMail({
      to: r.emailAddress,
      subject: rendered.subject,
      html: rendered.html,
      replyTo: campaign.replyTo ?? undefined,
    });

    if (mailResult.success) {
      await db
        .update(marketingRecipients)
        .set({ status: "sent", sentAt: new Date(), messageId: mailResult.messageId ?? null })
        .where(eq(marketingRecipients.id, r.id));
      sent++;
    } else {
      await db
        .update(marketingRecipients)
        .set({ status: "failed", errorMessage: mailResult.error ?? "send failed" })
        .where(eq(marketingRecipients.id, r.id));
      failed++;
    }
  }

  // Recompute totals + status
  const [agg] = await db
    .select({
      total: sql<number>`count(*)::int`,
      sentCount: sql<number>`count(*) filter (where status = 'sent')::int`,
      failedCount: sql<number>`count(*) filter (where status = 'failed')::int`,
      skippedCount: sql<number>`count(*) filter (where status = 'skipped')::int`,
      queuedCount: sql<number>`count(*) filter (where status = 'queued')::int`,
    })
    .from(marketingRecipients)
    .where(eq(marketingRecipients.campaignId, campaignId));

  const remaining = agg.queuedCount;
  const allDone = remaining === 0;

  await db
    .update(marketingCampaigns)
    .set({
      totalRecipients: agg.total,
      totalSent: agg.sentCount,
      totalFailed: agg.failedCount,
      totalSkipped: agg.skippedCount,
      completedAt: allDone ? new Date() : null,
      status: allDone ? "sent" : "sending",
      updatedAt: new Date(),
    })
    .where(eq(marketingCampaigns.id, campaignId));

  return { sent, failed, remaining };
}
