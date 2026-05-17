import { Hono } from "hono";
import { z } from "zod";
import {
  db,
  marketingCampaigns,
} from "@openportal/db";
import { and, eq, lte, sql } from "drizzle-orm";
import { processQueuedRecipients, resolveAudience } from "../marketing/routes";
import { marketingRecipients } from "@openportal/db";

// ─────────────────────────────────────────────
// Marketing campaign worker
//
// Two ticks:
//   POST /scheduled/tick — picks scheduled campaigns whose
//                          scheduled_for ≤ now, expands audience into
//                          marketingRecipients rows, transitions to
//                          sending.
//   POST /drain/tick     — picks sending campaigns and processes a
//                          batch of queued recipients each.
//
// In production both can be scheduled at the same time (e.g., every
// 2 minutes); the cron script below calls them sequentially.
// ─────────────────────────────────────────────

export const marketingWorkerRoutes = new Hono();

marketingWorkerRoutes.use("*", async (c, next) => {
  const expected = process.env.WORKER_TOKEN;
  if (!expected) return next();
  const got = c.req.header("x-worker-token") || c.req.query("token");
  if (got !== expected) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid worker token" } }, 401);
  }
  return next();
});

const tickSchema = z.object({
  limit: z.number().int().positive().max(500).optional(),
  batchPerCampaign: z.number().int().positive().max(200).optional(),
});

// ─────────────────────────────────────────────
// POST /scheduled/tick
// ─────────────────────────────────────────────

marketingWorkerRoutes.post("/scheduled/tick", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = tickSchema.safeParse(body);
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 20;

  const now = new Date();

  const due = await db
    .select()
    .from(marketingCampaigns)
    .where(
      and(
        eq(marketingCampaigns.status, "scheduled"),
        sql`${marketingCampaigns.scheduledFor} IS NOT NULL`,
        lte(marketingCampaigns.scheduledFor, now),
      ),
    )
    .limit(limit);

  let started = 0;
  for (const campaign of due) {
    try {
      // Expand audience -> recipient rows
      const audience = await resolveAudience(
        campaign.tenantId,
        campaign.targetType,
        (campaign.targetParams || {}) as Record<string, unknown>,
      );

      for (const customer of audience) {
        const hasEmail = Boolean(customer.email);
        const hasConsent = customer.emailConsent;
        await db
          .insert(marketingRecipients)
          .values({
            tenantId: campaign.tenantId,
            campaignId: campaign.id,
            customerId: customer.id,
            emailAddress: customer.email || "",
            customerName: [customer.firstName, customer.lastName].filter(Boolean).join(" ") || null,
            status: !hasEmail ? "skipped" : !hasConsent ? "skipped" : "queued",
            skipReason: !hasEmail ? "no_email" : !hasConsent ? "no_consent" : null,
          })
          .onConflictDoNothing();
      }

      await db
        .update(marketingCampaigns)
        .set({ status: "sending", startedAt: now, updatedAt: now })
        .where(eq(marketingCampaigns.id, campaign.id));
      started++;
    } catch (err) {
      console.error("[marketing-worker] failed to start campaign", campaign.id, err);
      await db
        .update(marketingCampaigns)
        .set({ status: "failed", updatedAt: now })
        .where(eq(marketingCampaigns.id, campaign.id));
    }
  }

  return c.json({ success: true, data: { candidates: due.length, started } });
});

// ─────────────────────────────────────────────
// POST /drain/tick
// ─────────────────────────────────────────────

marketingWorkerRoutes.post("/drain/tick", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = tickSchema.safeParse(body);
  const batchPerCampaign = parsed.success && parsed.data.batchPerCampaign ? parsed.data.batchPerCampaign : 50;

  const sending = await db
    .select({ id: marketingCampaigns.id, tenantId: marketingCampaigns.tenantId })
    .from(marketingCampaigns)
    .where(eq(marketingCampaigns.status, "sending"))
    .limit(50);

  let processed = 0;
  let totalSent = 0;
  let totalFailed = 0;
  for (const c of sending) {
    const result = await processQueuedRecipients(c.tenantId, c.id, batchPerCampaign);
    totalSent += result.sent;
    totalFailed += result.failed;
    processed++;
  }

  return c.json({ success: true, data: { campaigns: processed, sent: totalSent, failed: totalFailed } });
});

// ─────────────────────────────────────────────
// GET /status — diagnostic
// ─────────────────────────────────────────────

marketingWorkerRoutes.get("/status", async (c) => {
  const [row] = await db
    .select({
      draft: sql<number>`count(*) filter (where status = 'draft')::int`,
      scheduled: sql<number>`count(*) filter (where status = 'scheduled')::int`,
      sending: sql<number>`count(*) filter (where status = 'sending')::int`,
      sent: sql<number>`count(*) filter (where status = 'sent')::int`,
      failed: sql<number>`count(*) filter (where status = 'failed')::int`,
    })
    .from(marketingCampaigns);

  return c.json({ success: true, data: row });
});
