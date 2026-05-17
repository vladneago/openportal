import { db, bookingAppointments, bookingCustomers, bookingServices, bookingResources, tenants } from "@openportal/db";
import { eq } from "drizzle-orm";
import {
  sendMail,
  renderBookingConfirmation,
  renderBookingCancellation,
  renderBookingReminder,
} from "./mailer";
import { sendSms } from "./sms";
import {
  renderBookingConfirmationSms,
  renderBookingReminder24hSms,
  renderBookingReminder2hSms,
  renderBookingCancelledSms,
} from "./sms-templates";

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

    const tenantSettings = (row.tenant.settings || {}) as {
      contactPhone?: string;
      contactAddress?: string;
      brandColor?: string;
    };

    const customerName = `${row.customer.firstName}${row.customer.lastName ? " " + row.customer.lastName : ""}`;
    const webBaseUrl = process.env.WEB_BASE_URL || "http://localhost:3000";
    const cancellationUrl = `${webBaseUrl}/b/${row.appointment.bookingCode}`;

    // Email channel
    if (row.customer.email && row.customer.emailConsent) {
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
        cancellationUrl,
        brandColor: tenantSettings.brandColor,
      });

      const result = await sendMail({ to: row.customer.email, subject, html });
      if (result.success) {
        await db
          .update(bookingAppointments)
          .set({ confirmationSentAt: new Date() })
          .where(eq(bookingAppointments.id, appointmentId));
      }
    }

    // SMS channel — runs in parallel to email when customer has phone+consent
    if (row.customer.phone && row.customer.smsConsent) {
      const body = renderBookingConfirmationSms({
        businessName: row.tenant.name,
        customerFirstName: row.customer.firstName,
        serviceName: row.service.name,
        startAt: row.appointment.startAt,
        bookingCode: row.appointment.bookingCode,
        cancellationUrl,
      });
      const r = await sendSms({
        tenantId: row.appointment.tenantId,
        to: row.customer.phone,
        body,
        type: "booking_confirmation",
        customerId: row.customer.id,
        appointmentId: row.appointment.id,
      });
      if (r.success) {
        await db
          .update(bookingAppointments)
          .set({ smsConfirmationSentAt: new Date() })
          .where(eq(bookingAppointments.id, appointmentId));
      }
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

    const tenantSettings = (row.tenant.settings || {}) as { brandColor?: string };
    const customerName = `${row.customer.firstName}${row.customer.lastName ? " " + row.customer.lastName : ""}`;

    if (row.customer.email && row.customer.emailConsent) {
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
    }

    if (row.customer.phone && row.customer.smsConsent) {
      const body = renderBookingCancelledSms(
        {
          businessName: row.tenant.name,
          customerFirstName: row.customer.firstName,
          serviceName: row.service.name,
          startAt: row.appointment.startAt,
          bookingCode: row.appointment.bookingCode,
        },
        reason ?? row.appointment.cancellationReason,
      );
      await sendSms({
        tenantId: row.appointment.tenantId,
        to: row.customer.phone,
        body,
        type: "booking_cancelled",
        customerId: row.customer.id,
        appointmentId: row.appointment.id,
      });
    }
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

    const tenantSettings = (row.tenant.settings || {}) as {
      contactPhone?: string;
      contactAddress?: string;
      brandColor?: string;
    };

    const customerName = `${row.customer.firstName}${row.customer.lastName ? " " + row.customer.lastName : ""}`;
    const webBaseUrl = process.env.WEB_BASE_URL || "http://localhost:3000";
    const cancellationUrl = `${webBaseUrl}/b/${row.appointment.bookingCode}`;

    let emailSent = false;
    let smsSent = false;

    if (row.customer.email && row.customer.emailConsent) {
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
        cancellationUrl,
      });

      const result = await sendMail({ to: row.customer.email, subject, html });
      emailSent = result.success;
    }

    if (row.customer.phone && row.customer.smsConsent) {
      const body =
        variant === "24h"
          ? renderBookingReminder24hSms({
              businessName: row.tenant.name,
              customerFirstName: row.customer.firstName,
              serviceName: row.service.name,
              startAt: row.appointment.startAt,
              bookingCode: row.appointment.bookingCode,
              cancellationUrl,
            })
          : renderBookingReminder2hSms({
              businessName: row.tenant.name,
              customerFirstName: row.customer.firstName,
              serviceName: row.service.name,
              startAt: row.appointment.startAt,
              bookingCode: row.appointment.bookingCode,
            });

      const r = await sendSms({
        tenantId: row.appointment.tenantId,
        to: row.customer.phone,
        body,
        type: variant === "24h" ? "booking_reminder_24h" : "booking_reminder_2h",
        customerId: row.customer.id,
        appointmentId: row.appointment.id,
      });
      smsSent = r.success;
    }

    if (!emailSent && !smsSent) {
      return { sent: false, reason: "no_channel_delivered" };
    }

    // Track per-channel timestamps so the worker doesn't re-fire
    // (the worker's WHERE-clauses still gate on the email-side columns;
    // adding SMS-only flips is a future refinement).
    const update: Record<string, Date> = {
      reminderSentAt: new Date(),
    };
    if (variant === "24h") {
      update.reminder24hSentAt = new Date();
      if (smsSent) update.smsReminder24hSentAt = new Date();
    } else {
      update.reminder2hSentAt = new Date();
      if (smsSent) update.smsReminder2hSentAt = new Date();
    }

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
