import { db, bookingAppointments, bookingCustomers, bookingServices, bookingResources, tenants } from "@openportal/db";
import { eq } from "drizzle-orm";
import {
  sendMail,
  renderBookingConfirmation,
  renderBookingCancellation,
  renderBookingReminder,
} from "./mailer";

/**
 * Sends booking confirmation email to the customer (if they have email + consent).
 * Returns silently on failure — notifications are best-effort.
 */
export async function notifyBookingConfirmed(appointmentId: string): Promise<void> {
  try {
    const [row] = await db
      .select({
        appointment: bookingAppointments,
        customer: bookingCustomers,
        service: bookingServices,
        resource: bookingResources,
        tenant: tenants,
      })
      .from(bookingAppointments)
      .innerJoin(bookingCustomers, eq(bookingAppointments.customerId, bookingCustomers.id))
      .innerJoin(bookingServices, eq(bookingAppointments.serviceId, bookingServices.id))
      .innerJoin(bookingResources, eq(bookingAppointments.resourceId, bookingResources.id))
      .innerJoin(tenants, eq(bookingAppointments.tenantId, tenants.id))
      .where(eq(bookingAppointments.id, appointmentId))
      .limit(1);

    if (!row) return;
    if (!row.customer.email) return;
    if (!row.customer.emailConsent) return;

    const tenantSettings = (row.tenant.settings || {}) as {
      contactPhone?: string;
      contactAddress?: string;
      brandColor?: string;
    };

    const customerName = `${row.customer.firstName}${row.customer.lastName ? " " + row.customer.lastName : ""}`;

    const webBaseUrl = process.env.WEB_BASE_URL || "http://localhost:3000";

    const { subject, html } = renderBookingConfirmation({
      customerName,
      bookingCode: row.appointment.bookingCode,
      serviceName: row.service.name,
      resourceName: row.resource.name,
      startAt: row.appointment.startAt,
      durationMinutes: row.service.durationMinutes,
      price: row.appointment.priceSnapshot,
      currency: row.appointment.currencySnapshot,
      businessName: row.tenant.name,
      businessPhone: tenantSettings.contactPhone || null,
      businessAddress: tenantSettings.contactAddress || null,
      customerNote: row.appointment.customerNote,
      cancellationUrl: `${webBaseUrl}/b/${row.appointment.bookingCode}`,
      brandColor: tenantSettings.brandColor,
    });

    const result = await sendMail({
      to: row.customer.email,
      subject,
      html,
    });

    if (result.success) {
      await db
        .update(bookingAppointments)
        .set({ confirmationSentAt: new Date() })
        .where(eq(bookingAppointments.id, appointmentId));
    }
  } catch (err) {
    console.error("[notifications] booking confirmation failed:", err);
  }
}

/**
 * Sends a cancellation email to the customer.
 */
export async function notifyBookingCancelled(appointmentId: string, reason?: string | null): Promise<void> {
  try {
    const [row] = await db
      .select({
        appointment: bookingAppointments,
        customer: bookingCustomers,
        service: bookingServices,
        tenant: tenants,
      })
      .from(bookingAppointments)
      .innerJoin(bookingCustomers, eq(bookingAppointments.customerId, bookingCustomers.id))
      .innerJoin(bookingServices, eq(bookingAppointments.serviceId, bookingServices.id))
      .innerJoin(tenants, eq(bookingAppointments.tenantId, tenants.id))
      .where(eq(bookingAppointments.id, appointmentId))
      .limit(1);

    if (!row) return;
    if (!row.customer.email) return;
    if (!row.customer.emailConsent) return;

    const tenantSettings = (row.tenant.settings || {}) as { brandColor?: string };
    const customerName = `${row.customer.firstName}${row.customer.lastName ? " " + row.customer.lastName : ""}`;

    const { subject, html } = renderBookingCancellation({
      customerName,
      bookingCode: row.appointment.bookingCode,
      serviceName: row.service.name,
      startAt: row.appointment.startAt,
      businessName: row.tenant.name,
      reason: reason ?? row.appointment.cancellationReason,
      brandColor: tenantSettings.brandColor,
    });

    await sendMail({ to: row.customer.email, subject, html });
  } catch (err) {
    console.error("[notifications] booking cancellation failed:", err);
  }
}

/**
 * Sends a reminder email (24h or 2h before appointment).
 * Marks `reminder24hSentAt` / `reminder2hSentAt` on success to prevent duplicates.
 */
export async function notifyBookingReminder(
  appointmentId: string,
  variant: "24h" | "2h",
): Promise<{ sent: boolean; reason?: string }> {
  try {
    const [row] = await db
      .select({
        appointment: bookingAppointments,
        customer: bookingCustomers,
        service: bookingServices,
        resource: bookingResources,
        tenant: tenants,
      })
      .from(bookingAppointments)
      .innerJoin(bookingCustomers, eq(bookingAppointments.customerId, bookingCustomers.id))
      .innerJoin(bookingServices, eq(bookingAppointments.serviceId, bookingServices.id))
      .innerJoin(bookingResources, eq(bookingAppointments.resourceId, bookingResources.id))
      .innerJoin(tenants, eq(bookingAppointments.tenantId, tenants.id))
      .where(eq(bookingAppointments.id, appointmentId))
      .limit(1);

    if (!row) return { sent: false, reason: "not_found" };
    if (!row.customer.email) return { sent: false, reason: "no_email" };
    if (!row.customer.emailConsent) return { sent: false, reason: "no_consent" };

    const tenantSettings = (row.tenant.settings || {}) as {
      contactPhone?: string;
      contactAddress?: string;
      brandColor?: string;
    };

    const customerName = `${row.customer.firstName}${row.customer.lastName ? " " + row.customer.lastName : ""}`;
    const webBaseUrl = process.env.WEB_BASE_URL || "http://localhost:3000";

    const { subject, html } = renderBookingReminder({
      customerName,
      bookingCode: row.appointment.bookingCode,
      serviceName: row.service.name,
      resourceName: row.resource.name,
      startAt: row.appointment.startAt,
      businessName: row.tenant.name,
      businessPhone: tenantSettings.contactPhone || null,
      businessAddress: tenantSettings.contactAddress || null,
      brandColor: tenantSettings.brandColor,
      variant,
      cancellationUrl: `${webBaseUrl}/b/${row.appointment.bookingCode}`,
    });

    const result = await sendMail({
      to: row.customer.email,
      subject,
      html,
    });

    if (!result.success) {
      return { sent: false, reason: "send_failed" };
    }

    const update = variant === "24h"
      ? { reminder24hSentAt: new Date(), reminderSentAt: new Date() }
      : { reminder2hSentAt: new Date(), reminderSentAt: new Date() };

    await db
      .update(bookingAppointments)
      .set(update)
      .where(eq(bookingAppointments.id, appointmentId));

    return { sent: true };
  } catch (err) {
    console.error("[notifications] booking reminder failed:", err);
    return { sent: false, reason: "exception" };
  }
}
