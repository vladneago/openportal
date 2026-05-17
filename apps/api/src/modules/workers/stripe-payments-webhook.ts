import { Hono } from "hono";
import { db, tenantStripePayments } from "@openportal/db";
import { eq } from "drizzle-orm";
import {
  verifyWebhookSignature,
  markInvoicePaidFromSession,
  markAppointmentDepositPaidFromSession,
} from "../../lib/tenant-stripe-payments";
import { notifyBookingConfirmed } from "../../lib/booking-notifications";

// ─────────────────────────────────────────────
// Stripe webhook for per-tenant payment links (public, signature-verified)
//
// URL: POST /api/v1/public/billing/stripe-payments/webhook/:tenantId
// Each tenant configures this URL in their own Stripe dashboard with
// their own webhook signing secret. The path identifies which tenant's
// secret to use for verification. We currently care about:
//
//   checkout.session.completed   — paid via Payment Link → mark invoice
//
// All other events are acknowledged (200) but ignored.
// ─────────────────────────────────────────────

export const stripePaymentsWebhookRoutes = new Hono();

stripePaymentsWebhookRoutes.post("/webhook/:tenantId", async (c) => {
  const tenantId = c.req.param("tenantId");

  const [cfg] = await db
    .select()
    .from(tenantStripePayments)
    .where(eq(tenantStripePayments.tenantId, tenantId))
    .limit(1);

  if (!cfg || !cfg.webhookSecret) {
    // Don't reveal whether the tenant exists; 400 is generic enough.
    return c.json({ success: false, error: { code: "NO_WEBHOOK_SECRET" } }, 400);
  }

  const signature = c.req.header("stripe-signature") || "";
  const rawBody = await c.req.text();

  let event;
  try {
    event = verifyWebhookSignature(rawBody, signature, cfg.webhookSecret);
  } catch (err) {
    return c.json(
      { success: false, error: { code: "INVALID_SIGNATURE", message: (err as Error).message } },
      400,
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as import("stripe").Stripe.Checkout.Session;
      const metadataTenantId = (session.metadata?.tenantId || "").toString();
      const kind = (session.metadata?.kind || "").toString();

      if (metadataTenantId && metadataTenantId !== tenantId) {
        // Mismatch — tenant in URL doesn't match metadata. Reject.
        return c.json(
          { success: false, error: { code: "TENANT_MISMATCH" } },
          400,
        );
      }

      if (session.payment_status !== "paid") {
        return c.json({ success: true, data: { ignored: "not_paid" } });
      }

      if (kind === "appointment_deposit") {
        const appointmentId = (session.metadata?.appointmentId || "").toString();
        if (!appointmentId) {
          return c.json({ success: true, data: { ignored: "no_appointment_id" } });
        }
        const result = await markAppointmentDepositPaidFromSession(tenantId, appointmentId, session);
        if (!result.alreadyApplied) {
          // Fire confirmation email + SMS now that deposit cleared
          notifyBookingConfirmed(appointmentId).catch(() => {});
        }
      } else {
        const invoiceId = (session.metadata?.invoiceId || "").toString();
        if (!invoiceId) {
          return c.json({ success: true, data: { ignored: "no_invoice_id" } });
        }
        await markInvoicePaidFromSession(tenantId, invoiceId, session);
      }
    }
    // Other event types are acknowledged for free
    return c.json({ success: true, data: { type: event.type } });
  } catch (err) {
    console.error("[stripe-payments-webhook] handler failed", err);
    return c.json(
      { success: false, error: { code: "HANDLER_FAILED", message: (err as Error).message } },
      500,
    );
  }
});
