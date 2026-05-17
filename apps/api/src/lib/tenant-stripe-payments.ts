import Stripe from "stripe";
import {
  db,
  tenantStripePayments,
  billingInvoices,
  billingPayments,
  bookingAppointments,
} from "@openportal/db";
import { and, eq } from "drizzle-orm";

// ─────────────────────────────────────────────
// Tenant Stripe payments — per-invoice Payment Links
//
// Each tenant brings their own Stripe account (no Connect OAuth in this
// MVP — owners paste a Restricted API Key into /settings/stripe-payments).
// Money flows directly from customer → tenant; the platform never
// touches it.
//
// Flow:
//   1. Owner enters API key + webhook secret on /settings/stripe-payments
//   2. On any unpaid invoice, the UI calls POST /invoices/:id/payment-link
//   3. We create a Stripe Product + Price for this invoice and wrap it
//      in a Payment Link with metadata={tenantId, invoiceId}
//   4. The owner sends the URL to the customer (or our UI does)
//   5. Customer pays via Stripe Checkout
//   6. Stripe webhook hits /public/billing/stripe-payments/webhook/:tenantId
//      → we verify signature with the tenant's webhookSecret, insert a
//      billingPayments row, and mark the invoice paid
// ─────────────────────────────────────────────

export async function getTenantStripeConfig(tenantId: string) {
  const [row] = await db
    .select()
    .from(tenantStripePayments)
    .where(eq(tenantStripePayments.tenantId, tenantId))
    .limit(1);
  return row ?? null;
}

export function buildStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

export async function getTenantStripe(tenantId: string): Promise<Stripe | null> {
  const cfg = await getTenantStripeConfig(tenantId);
  if (!cfg || !cfg.enabled || !cfg.secretKey) return null;
  return buildStripeClient(cfg.secretKey);
}

// ─────────────────────────────────────────────
// Test the API key — calls Stripe accounts.retrieve to verify auth
// and caches the account info for the settings UI.
// ─────────────────────────────────────────────

export async function testTenantStripeKey(
  tenantId: string,
  secretKey: string,
): Promise<{
  ok: boolean;
  accountId?: string;
  country?: string;
  defaultCurrency?: string;
  error?: string;
}> {
  try {
    const stripe = buildStripeClient(secretKey);
    const acct = await stripe.accounts.retrieve();
    return {
      ok: true,
      accountId: acct.id,
      country: acct.country ?? undefined,
      defaultCurrency: acct.default_currency ?? undefined,
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ─────────────────────────────────────────────
// Create a Payment Link for an invoice
// ─────────────────────────────────────────────

export async function createInvoicePaymentLink(
  tenantId: string,
  invoiceId: string,
  options?: { successUrl?: string },
): Promise<{
  url: string;
  paymentLinkId: string;
}> {
  const stripe = await getTenantStripe(tenantId);
  if (!stripe) {
    throw new Error("Stripe payments not configured for this tenant");
  }

  const [invoice] = await db
    .select()
    .from(billingInvoices)
    .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.id, invoiceId)))
    .limit(1);
  if (!invoice) throw new Error("Invoice not found");

  if (invoice.status === "paid") {
    throw new Error("Invoice is already paid");
  }

  // Re-use existing link if amount hasn't changed (we don't track amount
  // changes; for now just return the cached URL if present).
  if (invoice.stripePaymentLinkId && invoice.stripePaymentLinkUrl) {
    return {
      url: invoice.stripePaymentLinkUrl,
      paymentLinkId: invoice.stripePaymentLinkId,
    };
  }

  // Resolve outstanding amount in minor units
  const amountDue = Number(invoice.amountDue || invoice.totalAmount);
  if (!(amountDue > 0)) {
    throw new Error("Invoice has no outstanding amount");
  }
  const unitAmount = Math.round(amountDue * 100);
  const currency = (invoice.currency || "RON").toLowerCase();

  const customerLabel = invoice.customerName || "Client";

  const productName = `Factura ${invoice.documentNumber}`;
  const description = `Plată factură ${invoice.documentNumber} — ${customerLabel}`.slice(0, 200);

  // Create product + price ad-hoc
  const price = await stripe.prices.create({
    currency,
    unit_amount: unitAmount,
    product_data: {
      name: productName,
    },
  });

  const successUrl = options?.successUrl
    || `${process.env.WEB_BASE_URL || "http://localhost:3000"}/i/paid?invoice=${invoice.documentNumber}`;

  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: {
      tenantId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.documentNumber,
    },
    after_completion: {
      type: "redirect",
      redirect: { url: successUrl },
    },
    payment_intent_data: {
      description,
      metadata: {
        tenantId,
        invoiceId: invoice.id,
      },
    },
  });

  await db
    .update(billingInvoices)
    .set({
      stripePaymentLinkId: link.id,
      stripePaymentLinkUrl: link.url,
      updatedAt: new Date(),
    })
    .where(eq(billingInvoices.id, invoice.id));

  return { url: link.url, paymentLinkId: link.id };
}

// ─────────────────────────────────────────────
// Mark an invoice paid from a completed Stripe Checkout session
// ─────────────────────────────────────────────

export async function markInvoicePaidFromSession(
  tenantId: string,
  invoiceId: string,
  session: Stripe.Checkout.Session,
): Promise<{ alreadyApplied: boolean }> {
  const [invoice] = await db
    .select()
    .from(billingInvoices)
    .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.id, invoiceId)))
    .limit(1);
  if (!invoice) throw new Error("Invoice not found");

  // Idempotency — same session already applied?
  if (invoice.stripeCheckoutSessionId === session.id && invoice.status === "paid") {
    return { alreadyApplied: true };
  }

  const amountReceived = (session.amount_total ?? 0) / 100;
  if (!(amountReceived > 0)) {
    throw new Error("Session has no amount");
  }

  // Insert payment row
  await db.insert(billingPayments).values({
    tenantId,
    invoiceId: invoice.id,
    amount: String(amountReceived),
    currency: (session.currency || invoice.currency || "RON").toUpperCase(),
    method: "stripe",
    externalId: session.id,
    externalStatus: session.payment_status ?? null,
    paidAt: new Date((session.created || Date.now() / 1000) * 1000),
    notes: `Stripe Checkout session ${session.id}`,
  });

  // Recompute totals
  const newTotalPaid = Number(invoice.totalPaid || 0) + amountReceived;
  const totalAmount = Number(invoice.totalAmount);
  const newAmountDue = Math.max(0, totalAmount - newTotalPaid);
  const fullyPaid = newAmountDue <= 0.005;

  await db
    .update(billingInvoices)
    .set({
      totalPaid: String(newTotalPaid),
      amountDue: String(newAmountDue),
      status: fullyPaid ? "paid" : invoice.status,
      paidAt: fullyPaid ? new Date() : invoice.paidAt,
      stripeCheckoutSessionId: session.id,
      updatedAt: new Date(),
    })
    .where(eq(billingInvoices.id, invoice.id));

  return { alreadyApplied: false };
}

// ─────────────────────────────────────────────
// Appointment deposit — Stripe Checkout Session for booking deposits
//
// Used by the public booking widget when a service has requiresDeposit=true.
// The appointment is created in `pending` status and locked into the
// calendar with a short hold. The webhook flips it to `confirmed` once
// the deposit clears.
//
// We use a one-shot Checkout Session (not a Payment Link) because the
// session is tied to a single appointment + single buyer and we control
// the success URL.
// ─────────────────────────────────────────────

export async function createAppointmentDepositSession(
  tenantId: string,
  appointmentId: string,
  options: {
    serviceName: string;
    depositAmount: number;
    currency: string;
    customerEmail?: string | null;
    successUrl: string;
    cancelUrl: string;
  },
): Promise<{ url: string; sessionId: string }> {
  const stripe = await getTenantStripe(tenantId);
  if (!stripe) {
    throw new Error("Stripe payments not configured for this tenant");
  }

  if (!(options.depositAmount > 0)) {
    throw new Error("Deposit amount must be positive");
  }

  const unitAmount = Math.round(options.depositAmount * 100);
  const currency = options.currency.toLowerCase();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: {
            name: `Avans ${options.serviceName}`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    customer_email: options.customerEmail ?? undefined,
    metadata: {
      tenantId,
      appointmentId,
      kind: "appointment_deposit",
    },
    payment_intent_data: {
      description: `Avans pentru programare — ${options.serviceName}`,
      metadata: {
        tenantId,
        appointmentId,
        kind: "appointment_deposit",
      },
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return { url: session.url, sessionId: session.id };
}

export async function markAppointmentDepositPaidFromSession(
  tenantId: string,
  appointmentId: string,
  session: import("stripe").Stripe.Checkout.Session,
): Promise<{ alreadyApplied: boolean }> {
  const [appt] = await db
    .select()
    .from(bookingAppointments)
    .where(
      and(
        eq(bookingAppointments.tenantId, tenantId),
        eq(bookingAppointments.id, appointmentId),
      ),
    )
    .limit(1);
  if (!appt) throw new Error("Appointment not found");

  // Idempotency — deposit already applied?
  if (Number(appt.depositPaid) > 0 && appt.status === "confirmed") {
    return { alreadyApplied: true };
  }

  const amountReceived = (session.amount_total ?? 0) / 100;
  if (!(amountReceived > 0)) {
    throw new Error("Session has no amount");
  }

  await db
    .update(bookingAppointments)
    .set({
      status: "confirmed",
      depositPaid: String(amountReceived),
      totalPaid: String(Number(appt.totalPaid || 0) + amountReceived),
      paymentStatus: "deposit_paid",
      updatedAt: new Date(),
    })
    .where(eq(bookingAppointments.id, appt.id));

  return { alreadyApplied: false };
}

// ─────────────────────────────────────────────
// Webhook signature verification — uses Stripe SDK
// ─────────────────────────────────────────────

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string,
): Stripe.Event {
  // Stripe SDK lets us build a minimal client just for the constructEvent
  // helper — no API call needed.
  const stripe = buildStripeClient(webhookSecret); // secret doesn't matter for this op
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
