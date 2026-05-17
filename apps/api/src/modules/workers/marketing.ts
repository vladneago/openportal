import { Hono } from "hono";
import { z } from "zod";
import {
  db,
  marketingCampaigns,
  marketingRecipients,
  marketingAutomationRuns,
  bookingCustomers,
  bookingAppointments,
} from "@openportal/db";
import { and, eq, lte, sql, gte, lt, isNotNull } from "drizzle-orm";
import { processQueuedRecipients, resolveAudience } from "../marketing/routes";
import { assertEmailQuota } from "../../lib/plan-limits";

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
// POST /automations/tick
//
// Daily-ish (idempotent — safe to call multiple times). For every active
// automation campaign across tenants, finds matching customers and
// enqueues a recipient row. A dedup log (marketing_automation_runs) on
// (campaign, customer, triggerKey) makes re-firing impossible within the
// same occurrence (e.g., same birthday year).
//
// Trigger types:
//   birthday    — customer.dateOfBirth m/d == today
//   comeback    — customer.lastVisitAt ∈ [today - (N+windowDays), today - N]
//   post_visit  — appointments completed N days ago
//   new_customer — customers whose FIRST appointment was N days ago
// ─────────────────────────────────────────────

interface CandidateRow {
  customerId: string;
  email: string | null;
  firstName: string;
  lastName: string | null;
  emailConsent: boolean;
  triggerKey: string;
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function findBirthdayCandidates(tenantId: string): Promise<CandidateRow[]> {
  const year = new Date().getFullYear();
  // Match month/day against today (server local — RO).
  const rows = await db
    .select({
      id: bookingCustomers.id,
      email: bookingCustomers.email,
      firstName: bookingCustomers.firstName,
      lastName: bookingCustomers.lastName,
      emailConsent: bookingCustomers.emailConsent,
    })
    .from(bookingCustomers)
    .where(
      and(
        eq(bookingCustomers.tenantId, tenantId),
        isNotNull(bookingCustomers.dateOfBirth),
        sql`extract(month from ${bookingCustomers.dateOfBirth}) = extract(month from current_date)`,
        sql`extract(day from ${bookingCustomers.dateOfBirth}) = extract(day from current_date)`,
      ),
    );
  return rows.map((r) => ({
    customerId: r.id,
    email: r.email,
    firstName: r.firstName,
    lastName: r.lastName,
    emailConsent: r.emailConsent,
    triggerKey: `birthday:${year}`,
  }));
}

async function findComebackCandidates(
  tenantId: string,
  params: Record<string, unknown>,
): Promise<CandidateRow[]> {
  const days = typeof params.daysSinceLastVisit === "number" ? params.daysSinceLastVisit : 60;
  const windowDays = typeof params.windowDays === "number" ? params.windowDays : 7;
  const upper = new Date(Date.now() - days * 86400_000);
  const lower = new Date(Date.now() - (days + windowDays) * 86400_000);
  const rows = await db
    .select({
      id: bookingCustomers.id,
      email: bookingCustomers.email,
      firstName: bookingCustomers.firstName,
      lastName: bookingCustomers.lastName,
      emailConsent: bookingCustomers.emailConsent,
    })
    .from(bookingCustomers)
    .where(
      and(
        eq(bookingCustomers.tenantId, tenantId),
        isNotNull(bookingCustomers.lastVisitAt),
        gte(bookingCustomers.lastVisitAt, lower),
        lt(bookingCustomers.lastVisitAt, upper),
      ),
    );
  // Single comeback per customer per cycle (key on day-of-trigger)
  const key = `comeback:${todayKey()}`;
  return rows.map((r) => ({
    customerId: r.id,
    email: r.email,
    firstName: r.firstName,
    lastName: r.lastName,
    emailConsent: r.emailConsent,
    triggerKey: key,
  }));
}

async function findPostVisitCandidates(
  tenantId: string,
  params: Record<string, unknown>,
): Promise<CandidateRow[]> {
  const days = typeof params.daysAfterVisit === "number" ? params.daysAfterVisit : 3;
  const dayStart = new Date(Date.now() - days * 86400_000);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const rows = await db
    .select({
      appointmentId: bookingAppointments.id,
      customerId: bookingAppointments.customerId,
      email: bookingCustomers.email,
      firstName: bookingCustomers.firstName,
      lastName: bookingCustomers.lastName,
      emailConsent: bookingCustomers.emailConsent,
    })
    .from(bookingAppointments)
    .innerJoin(bookingCustomers, eq(bookingCustomers.id, bookingAppointments.customerId))
    .where(
      and(
        eq(bookingAppointments.tenantId, tenantId),
        eq(bookingAppointments.status, "completed"),
        gte(bookingAppointments.endAt, dayStart),
        lte(bookingAppointments.endAt, dayEnd),
      ),
    );
  return rows.map((r) => ({
    customerId: r.customerId,
    email: r.email,
    firstName: r.firstName,
    lastName: r.lastName,
    emailConsent: r.emailConsent,
    triggerKey: `post_visit:${r.appointmentId}`,
  }));
}

async function findNewCustomerCandidates(
  tenantId: string,
  params: Record<string, unknown>,
): Promise<CandidateRow[]> {
  const days = typeof params.daysAfterFirstVisit === "number" ? params.daysAfterFirstVisit : 7;
  const dayStart = new Date(Date.now() - days * 86400_000);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  // Find customers whose FIRST appointment.endAt fell on the target day.
  // Subquery returns first appointment per customer.
  const rows = await db.execute(sql`
    WITH first_appt AS (
      SELECT customer_id, MIN(end_at) AS first_end
      FROM booking_appointments
      WHERE tenant_id = ${tenantId} AND status = 'completed'
      GROUP BY customer_id
    )
    SELECT c.id, c.email, c.first_name, c.last_name, c.email_consent
    FROM first_appt fa
    JOIN booking_customers c ON c.id = fa.customer_id
    WHERE fa.first_end >= ${dayStart.toISOString()} AND fa.first_end <= ${dayEnd.toISOString()}
      AND c.tenant_id = ${tenantId}
  `);
  // drizzle execute returns { rows } in pg driver. Cast defensively.
  const list = (rows as unknown as { rows?: Array<Record<string, unknown>> }).rows
    ?? (Array.isArray(rows) ? (rows as unknown as Array<Record<string, unknown>>) : []);
  return list.map((r) => ({
    customerId: String(r.id),
    email: (r.email as string | null) ?? null,
    firstName: String(r.first_name ?? ""),
    lastName: (r.last_name as string | null) ?? null,
    emailConsent: Boolean(r.email_consent),
    triggerKey: `new_customer:${String(r.id)}`,
  }));
}

marketingWorkerRoutes.post("/automations/tick", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = tickSchema.safeParse(body);
  const drainBatch = parsed.success && parsed.data.batchPerCampaign ? parsed.data.batchPerCampaign : 50;

  const automations = await db
    .select()
    .from(marketingCampaigns)
    .where(
      and(
        eq(marketingCampaigns.isAutomation, true),
        eq(marketingCampaigns.automationActive, true),
      ),
    );

  let automationsConsidered = 0;
  let candidatesFound = 0;
  let enqueued = 0;
  let quotaSkipped = 0;
  let totalSent = 0;

  for (const campaign of automations) {
    automationsConsidered++;
    const automationType = campaign.automationType;
    if (!automationType) continue;
    const params = (campaign.automationParams || {}) as Record<string, unknown>;

    let candidates: CandidateRow[] = [];
    try {
      if (automationType === "birthday") {
        candidates = await findBirthdayCandidates(campaign.tenantId);
      } else if (automationType === "comeback") {
        candidates = await findComebackCandidates(campaign.tenantId, params);
      } else if (automationType === "post_visit") {
        candidates = await findPostVisitCandidates(campaign.tenantId, params);
      } else if (automationType === "new_customer") {
        candidates = await findNewCustomerCandidates(campaign.tenantId, params);
      }
    } catch (err) {
      console.error("[marketing-automation] candidate scan failed", campaign.id, err);
      continue;
    }

    candidatesFound += candidates.length;
    if (candidates.length === 0) continue;

    // Quota check before enqueueing. If we can't fit the whole cohort,
    // we still enqueue as many as we can — the worker will skip the rest.
    let allowed = candidates.length;
    try {
      await assertEmailQuota(campaign.tenantId, candidates.filter((x) => x.email && x.emailConsent).length);
    } catch {
      quotaSkipped += candidates.length;
      continue;
    }

    for (const cand of candidates) {
      if (allowed <= 0) break;
      // Try to insert dedup row first — unique index protects against double-fire.
      try {
        const hasEmail = Boolean(cand.email);
        const hasConsent = cand.emailConsent;
        const status: "queued" | "skipped" = !hasEmail ? "skipped" : !hasConsent ? "skipped" : "queued";
        const skipReason = !hasEmail ? "no_email" : !hasConsent ? "no_consent" : null;

        const [recipient] = await db
          .insert(marketingRecipients)
          .values({
            tenantId: campaign.tenantId,
            campaignId: campaign.id,
            customerId: cand.customerId,
            emailAddress: cand.email || "",
            customerName: [cand.firstName, cand.lastName].filter(Boolean).join(" ") || null,
            status,
            skipReason,
          })
          .onConflictDoNothing()
          .returning();

        if (!recipient) continue; // already exists from a previous run

        const [runRow] = await db
          .insert(marketingAutomationRuns)
          .values({
            tenantId: campaign.tenantId,
            campaignId: campaign.id,
            customerId: cand.customerId,
            triggerKey: cand.triggerKey,
            recipientId: recipient.id,
          })
          .onConflictDoNothing()
          .returning();

        if (!runRow) {
          // Dedup conflict — undo the recipient we just inserted (it's the
          // recipient unique conflict that would have hit anyway in a different shape).
          await db.delete(marketingRecipients).where(eq(marketingRecipients.id, recipient.id));
          continue;
        }

        enqueued++;
        allowed--;
      } catch (err) {
        console.error("[marketing-automation] enqueue failed", campaign.id, cand.customerId, err);
      }
    }

    // Mark when we last ran for this automation
    await db
      .update(marketingCampaigns)
      .set({ lastAutomationRunAt: new Date(), updatedAt: new Date() })
      .where(eq(marketingCampaigns.id, campaign.id));

    // Process drain inline for this campaign so emails go out today.
    if (enqueued > 0) {
      const result = await processQueuedRecipients(campaign.tenantId, campaign.id, drainBatch);
      totalSent += result.sent;
    }
  }

  return c.json({
    success: true,
    data: { automationsConsidered, candidatesFound, enqueued, quotaSkipped, sent: totalSent },
  });
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
      automations: sql<number>`count(*) filter (where is_automation = true)::int`,
      automationsActive: sql<number>`count(*) filter (where is_automation = true and automation_active = true)::int`,
    })
    .from(marketingCampaigns);

  return c.json({ success: true, data: row });
});
