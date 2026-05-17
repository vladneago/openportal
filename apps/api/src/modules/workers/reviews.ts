import { Hono } from "hono";
import { z } from "zod";
import {
  db,
  bookingAppointments,
  bookingReviews,
  bookingCustomers,
  bookingResources,
  bookingServices,
  tenants,
} from "@openportal/db";
import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { sendMail } from "../../lib/mailer";

// ─────────────────────────────────────────────
// Review request worker
//
// Runs on cron (suggested daily). Finds completed appointments where:
//   - end_at < NOW() - 24h
//   - status = 'completed'
//   - customer has email + email consent
//   - no existing booking_reviews row for the appointment
// Creates a pending review row with a one-time token and emails the
// customer the public link to /r/[token].
//
// Auth: WORKER_TOKEN (same as other workers).
// ─────────────────────────────────────────────

export const reviewWorkerRoutes = new Hono();

reviewWorkerRoutes.use("*", async (c, next) => {
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
  limit: z.number().int().positive().max(500).optional(),
  graceHours: z.number().int().min(1).max(168).optional(),
});

const WEB_BASE_URL = process.env.WEB_BASE_URL || "http://localhost:3000";

reviewWorkerRoutes.post("/request/tick", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = tickSchema.safeParse(body);
  const now = parsed.success && parsed.data.now ? new Date(parsed.data.now) : new Date();
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 100;
  const graceHours = parsed.success && parsed.data.graceHours ? parsed.data.graceHours : 24;

  const cutoff = new Date(now.getTime() - graceHours * 60 * 60_000);
  // Don't ask for reviews on appointments older than 14 days (probably already moved on)
  const horizon = new Date(now.getTime() - 14 * 86400_000);

  // Pull completed appointments without a review yet
  const candidates = await db
    .select({
      appointmentId: bookingAppointments.id,
      tenantId: bookingAppointments.tenantId,
      customerId: bookingAppointments.customerId,
      resourceId: bookingAppointments.resourceId,
      serviceId: bookingAppointments.serviceId,
      endAt: bookingAppointments.endAt,
      customerFirstName: bookingCustomers.firstName,
      customerLastName: bookingCustomers.lastName,
      customerEmail: bookingCustomers.email,
      customerEmailConsent: bookingCustomers.emailConsent,
      serviceName: bookingServices.name,
      resourceName: bookingResources.name,
      tenantName: tenants.name,
      tenantPrimaryColor: tenants.primaryColor,
    })
    .from(bookingAppointments)
    .innerJoin(bookingCustomers, eq(bookingCustomers.id, bookingAppointments.customerId))
    .innerJoin(bookingResources, eq(bookingResources.id, bookingAppointments.resourceId))
    .innerJoin(bookingServices, eq(bookingServices.id, bookingAppointments.serviceId))
    .innerJoin(tenants, eq(tenants.id, bookingAppointments.tenantId))
    .leftJoin(bookingReviews, eq(bookingReviews.appointmentId, bookingAppointments.id))
    .where(
      and(
        eq(bookingAppointments.status, "completed"),
        lt(bookingAppointments.endAt, cutoff),
        sql`${bookingAppointments.endAt} > ${horizon}`,
        isNull(bookingReviews.id),
        sql`${bookingCustomers.email} IS NOT NULL`,
        eq(bookingCustomers.emailConsent, true),
      ),
    )
    .limit(limit);

  let sent = 0;
  let skipped = 0;
  const errors: Array<{ appointmentId: string; message: string }> = [];

  for (const row of candidates) {
    try {
      const token = generateToken();
      const customerName = [row.customerFirstName, row.customerLastName].filter(Boolean).join(" ").trim();

      const [review] = await db
        .insert(bookingReviews)
        .values({
          tenantId: row.tenantId,
          appointmentId: row.appointmentId,
          customerId: row.customerId,
          resourceId: row.resourceId,
          serviceId: row.serviceId,
          customerName: customerName || null,
          customerEmail: row.customerEmail,
          serviceName: row.serviceName,
          resourceName: row.resourceName,
          token,
          status: "pending",
          requestSentAt: now,
        })
        .onConflictDoNothing({ target: bookingReviews.appointmentId })
        .returning();

      if (!review) {
        // Race: another worker beat us. Skip.
        skipped++;
        continue;
      }

      const reviewUrl = `${WEB_BASE_URL}/r/${encodeURIComponent(token)}`;
      const { subject, html } = renderReviewRequestEmail({
        customerName: customerName || "client drag",
        businessName: row.tenantName,
        serviceName: row.serviceName,
        resourceName: row.resourceName,
        reviewUrl,
        brandColor: row.tenantPrimaryColor || "#6366F1",
      });

      const mailResult = await sendMail({
        to: row.customerEmail!,
        subject,
        html,
      });

      if (!mailResult.success) {
        skipped++;
        errors.push({ appointmentId: row.appointmentId, message: mailResult.error || "send failed" });
        // Roll back the row so we retry next tick
        await db.delete(bookingReviews).where(eq(bookingReviews.id, review.id));
        continue;
      }

      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ appointmentId: row.appointmentId, message });
      skipped++;
    }
  }

  return c.json({
    success: true,
    data: {
      now: now.toISOString(),
      cutoff: cutoff.toISOString(),
      candidates: candidates.length,
      sent,
      skipped,
      errors: errors.slice(0, 10),
    },
  });
});

reviewWorkerRoutes.get("/status", async (c) => {
  const [row] = await db
    .select({
      pending: sql<number>`count(*) filter (where status = 'pending')::int`,
      submitted: sql<number>`count(*) filter (where status = 'submitted')::int`,
      published: sql<number>`count(*) filter (where status = 'published')::int`,
      hidden: sql<number>`count(*) filter (where status = 'hidden')::int`,
    })
    .from(bookingReviews);
  return c.json({ success: true, data: row });
});

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

interface ReviewRequestEmailData {
  customerName: string;
  businessName: string;
  serviceName: string;
  resourceName: string;
  reviewUrl: string;
  brandColor: string;
}

function renderReviewRequestEmail(data: ReviewRequestEmailData): { subject: string; html: string } {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const subject = `Cum a fost vizita ta la ${data.businessName}?`;

  const html = `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;background:white;border-radius:14px;overflow:hidden;border:1px solid #E2E8F0;">
      <tr><td style="background:${esc(data.brandColor)};color:white;padding:20px 24px;">
        <h1 style="margin:0;font-size:20px;font-weight:600;">Mulțumim că ne-ai vizitat!</h1>
      </td></tr>
      <tr><td style="padding:24px;">
        <p style="margin:0 0 12px;font-size:14px;color:#0F172A;">Bună ${esc(data.customerName)},</p>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.55;">
          Sperăm că ai fost mulțumit/ă de <strong>${esc(data.serviceName)}</strong> cu ${esc(data.resourceName)} la <strong>${esc(data.businessName)}</strong>.
        </p>
        <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.55;">
          Ne ajută enorm dacă lași o scurtă recenzie — durează 30 de secunde și ne dă șansa să fim mai buni.
        </p>
        <p style="text-align:center;margin:24px 0;">
          <a href="${esc(data.reviewUrl)}" style="display:inline-block;background:${esc(data.brandColor)};color:white;padding:13px 26px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
            Lasă o recenzie ★★★★★
          </a>
        </p>
        <p style="margin:24px 0 0;font-size:12px;color:#94A3B8;line-height:1.5;text-align:center;">
          Link-ul e valabil 30 de zile și e personal pentru tine.
        </p>
      </td></tr>
      <tr><td style="background:#F8FAFC;padding:16px 24px;border-top:1px solid #E2E8F0;font-size:11px;color:#94A3B8;text-align:center;">
        Email automat de la ${esc(data.businessName)} prin OpenPortal.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}
