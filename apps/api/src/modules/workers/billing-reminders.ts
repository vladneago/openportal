import { Hono } from "hono";
import { z } from "zod";
import {
  db,
  billingInvoices,
  tenantAnafCredentials,
  tenants,
} from "@openportal/db";
import { and, eq, gt, isNull, lt, lte, or, sql } from "drizzle-orm";
import { renderInvoiceReminder, sendMail } from "../../lib/mailer";

// ─────────────────────────────────────────────
// Invoice payment reminder + overdue auto-marker
//
// Run daily (or every 6h). Two ticks:
//
//   POST /mark-overdue/tick — flips status to "overdue" for invoices
//                             past their due_date with amount_due > 0.
//
//   POST /reminders/tick    — sends an email reminder to customers for
//                             unpaid invoices. Cadence:
//                               • first reminder 1 day past due
//                               • repeat every 7 days
//                               • cap at 5 reminders per invoice
//                             Only sent if customer_email is present.
//
// Auth via WORKER_TOKEN (same as booking workers).
// ─────────────────────────────────────────────

export const billingReminderRoutes = new Hono();

billingReminderRoutes.use("*", async (c, next) => {
  const expected = process.env.WORKER_TOKEN;
  if (!expected) return next();
  const got = c.req.header("x-worker-token") || c.req.query("token");
  if (got !== expected) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid worker token" } }, 401);
  }
  return next();
});

const tickSchema = z.object({
  now: z.string().datetime().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

// ─────────────────────────────────────────────
// POST /mark-overdue/tick
// ─────────────────────────────────────────────

billingReminderRoutes.post("/mark-overdue/tick", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = tickSchema.safeParse(body);
  const now = parsed.success && parsed.data.now ? new Date(parsed.data.now) : new Date();
  const todayIso = now.toISOString().slice(0, 10);

  const updated = await db
    .update(billingInvoices)
    .set({ status: "overdue", updatedAt: now })
    .where(
      and(
        sql`${billingInvoices.dueDate} IS NOT NULL`,
        lt(billingInvoices.dueDate, todayIso),
        sql`${billingInvoices.amountDue}::numeric > 0`,
        sql`${billingInvoices.status} IN ('issued','sent','viewed','partially_paid')`,
      ),
    )
    .returning({ id: billingInvoices.id });

  return c.json({
    success: true,
    data: { now: now.toISOString(), markedOverdue: updated.length },
  });
});

// ─────────────────────────────────────────────
// POST /reminders/tick
// ─────────────────────────────────────────────

billingReminderRoutes.post("/reminders/tick", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = tickSchema.safeParse(body);
  const now = parsed.success && parsed.data.now ? new Date(parsed.data.now) : new Date();
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 200;
  const todayIso = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400_000);

  const candidates = await db
    .select()
    .from(billingInvoices)
    .where(
      and(
        sql`${billingInvoices.dueDate} IS NOT NULL`,
        lt(billingInvoices.dueDate, todayIso),
        sql`${billingInvoices.amountDue}::numeric > 0`,
        sql`${billingInvoices.status} IN ('issued','sent','viewed','partially_paid','overdue')`,
        sql`${billingInvoices.customerEmail} IS NOT NULL`,
        lt(billingInvoices.reminderCount, 5),
        or(
          isNull(billingInvoices.lastReminderSentAt),
          lt(billingInvoices.lastReminderSentAt, sevenDaysAgo),
        ),
      ),
    )
    .limit(limit);

  let sent = 0;
  let skipped = 0;
  const errors: Array<{ invoiceId: string; message: string }> = [];

  for (const inv of candidates) {
    try {
      if (!inv.customerEmail) {
        skipped++;
        continue;
      }

      // Compute days overdue
      const due = new Date((inv.dueDate || inv.issueDate) + "T00:00:00Z");
      const daysOverdue = Math.floor((now.getTime() - due.getTime()) / 86400_000);

      // Fetch tenant brand color
      const [tenant] = await db
        .select({ name: tenants.name, primaryColor: tenants.primaryColor })
        .from(tenants)
        .where(eq(tenants.id, inv.tenantId))
        .limit(1);

      // Fetch issuer IBAN (prefer invoice snapshot, fall back to ANAF creds)
      let iban = inv.issuerIban;
      let bank = inv.issuerBank;
      if (!iban) {
        const [creds] = await db
          .select({ iban: tenantAnafCredentials.iban, bank: tenantAnafCredentials.bank })
          .from(tenantAnafCredentials)
          .where(eq(tenantAnafCredentials.tenantId, inv.tenantId))
          .limit(1);
        iban = creds?.iban ?? null;
        bank = creds?.bank ?? null;
      }

      const { subject, html } = renderInvoiceReminder({
        customerName: inv.customerName,
        documentNumber: inv.documentNumber,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        amountDue: Number(inv.amountDue).toFixed(2),
        currency: inv.currency,
        businessName: inv.issuerName || tenant?.name || "OpenPortal",
        businessIban: iban,
        businessBank: bank,
        paymentUrl: null,
        daysOverdue,
        brandColor: tenant?.primaryColor || "#6366F1",
      });

      const result = await sendMail({
        to: inv.customerEmail,
        subject,
        html,
      });

      if (result.success) {
        await db
          .update(billingInvoices)
          .set({
            lastReminderSentAt: now,
            reminderCount: inv.reminderCount + 1,
            updatedAt: now,
          })
          .where(eq(billingInvoices.id, inv.id));
        sent++;
      } else {
        errors.push({ invoiceId: inv.id, message: result.error ?? "send failed" });
        skipped++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ invoiceId: inv.id, message });
      skipped++;
    }
  }

  return c.json({
    success: true,
    data: {
      now: now.toISOString(),
      candidates: candidates.length,
      sent,
      skipped,
      errors: errors.slice(0, 10),
    },
  });
});

// ─────────────────────────────────────────────
// GET /status — diagnostic
// ─────────────────────────────────────────────

billingReminderRoutes.get("/status", async (c) => {
  const today = new Date().toISOString().slice(0, 10);

  const [unpaid] = await db
    .select({
      total: sql<number>`count(*)::int`,
      overdueCount: sql<number>`count(*) filter (where ${billingInvoices.dueDate} < ${today})::int`,
      withEmail: sql<number>`count(*) filter (where ${billingInvoices.customerEmail} is not null)::int`,
      remindable: sql<number>`count(*) filter (where ${billingInvoices.customerEmail} is not null and ${billingInvoices.reminderCount} < 5)::int`,
    })
    .from(billingInvoices)
    .where(
      and(
        sql`${billingInvoices.amountDue}::numeric > 0`,
        sql`${billingInvoices.status} IN ('issued','sent','viewed','partially_paid','overdue')`,
      ),
    );

  return c.json({ success: true, data: unpaid });
});
