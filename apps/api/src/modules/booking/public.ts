import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  db,
  bookingServices,
  bookingResources,
  bookingAvailability,
  bookingAppointments,
  bookingBlockedSlots,
  bookingCustomers,
  webSites,
} from "@openportal/db";
import { and, eq, gte, lte, lt, gt, inArray, or, sql } from "drizzle-orm";
import { AppError } from "../../middleware/error-handler";
import { notifyBookingConfirmed } from "../../lib/booking-notifications";

export const bookingPublicRoutes = new Hono();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function resolveTenantFromSite(siteId: string): Promise<string> {
  const [site] = await db
    .select({ tenantId: webSites.tenantId, status: webSites.status })
    .from(webSites)
    .where(eq(webSites.id, siteId))
    .limit(1);

  if (!site) throw new AppError(404, "SITE_NOT_FOUND", "Site not found");
  return site.tenantId;
}

// ─────────────────────────────────────────────
// GET /public/booking/slots?siteId=&serviceId=&date=YYYY-MM-DD&resourceId?
// Returns available appointment slots for a service on a given date.
// ─────────────────────────────────────────────

const slotsQuerySchema = z.object({
  siteId: z.string().uuid(),
  serviceId: z.string().uuid(),
  resourceId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

bookingPublicRoutes.get("/slots", zValidator("query", slotsQuerySchema), async (c) => {
  const { siteId, serviceId, resourceId, date } = c.req.valid("query");
  const tenantId = await resolveTenantFromSite(siteId);

  const [service] = await db
    .select()
    .from(bookingServices)
    .where(
      and(
        eq(bookingServices.tenantId, tenantId),
        eq(bookingServices.id, serviceId),
        eq(bookingServices.isActive, true),
        eq(bookingServices.isBookableOnline, true),
      ),
    )
    .limit(1);

  if (!service) throw new AppError(404, "SERVICE_NOT_FOUND", "Service not bookable online");

  // Resolve candidate resources
  let candidateResourceIds: string[];
  if (resourceId) {
    candidateResourceIds = [resourceId];
  } else if (service.eligibleResourceIds && service.eligibleResourceIds.length > 0) {
    candidateResourceIds = service.eligibleResourceIds;
  } else {
    const rs = await db
      .select({ id: bookingResources.id })
      .from(bookingResources)
      .where(
        and(
          eq(bookingResources.tenantId, tenantId),
          eq(bookingResources.isActive, true),
          eq(bookingResources.isBookableOnline, true),
        ),
      );
    candidateResourceIds = rs.map((r) => r.id);
  }

  if (candidateResourceIds.length === 0) return c.json({ success: true, data: [] });

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);
  const dayOfWeek = dayStart.getUTCDay();

  // Apply min advance booking window
  const minAdvance = service.minAdvanceBookingHours ?? 2;
  const earliestStart = new Date(Date.now() + minAdvance * 60 * 60 * 1000);

  const availabilityRules = await db
    .select()
    .from(bookingAvailability)
    .where(
      and(
        eq(bookingAvailability.tenantId, tenantId),
        eq(bookingAvailability.dayOfWeek, dayOfWeek),
        eq(bookingAvailability.isActive, true),
        inArray(bookingAvailability.resourceId, candidateResourceIds),
      ),
    );

  const appointments = await db
    .select({
      resourceId: bookingAppointments.resourceId,
      startAt: bookingAppointments.startAt,
      endAt: bookingAppointments.endAt,
    })
    .from(bookingAppointments)
    .where(
      and(
        eq(bookingAppointments.tenantId, tenantId),
        inArray(bookingAppointments.resourceId, candidateResourceIds),
        inArray(bookingAppointments.status, ["pending", "confirmed", "checked_in", "in_progress"]),
        gte(bookingAppointments.startAt, dayStart),
        lte(bookingAppointments.startAt, dayEnd),
      ),
    );

  const blockedSlots = await db
    .select()
    .from(bookingBlockedSlots)
    .where(
      and(
        eq(bookingBlockedSlots.tenantId, tenantId),
        or(
          inArray(bookingBlockedSlots.resourceId, candidateResourceIds),
          sql`${bookingBlockedSlots.resourceId} IS NULL`,
        )!,
        lt(bookingBlockedSlots.startAt, dayEnd),
        gt(bookingBlockedSlots.endAt, dayStart),
      ),
    );

  const slotIncrementMinutes = 15;
  const duration = service.durationMinutes;
  const bufferAfter = service.bufferAfterMinutes;
  const bufferBefore = service.bufferBeforeMinutes;

  const slots: Array<{
    resourceId: string;
    startAt: string;
    endAt: string;
  }> = [];

  for (const rule of availabilityRules) {
    if (rule.effectiveFrom && date < rule.effectiveFrom) continue;
    if (rule.effectiveUntil && date > rule.effectiveUntil) continue;

    const ruleStart = new Date(`${date}T${rule.startTime}`);
    const ruleEnd = new Date(`${date}T${rule.endTime}`);

    let cursor = new Date(ruleStart.getTime());

    while (cursor.getTime() + duration * 60_000 <= ruleEnd.getTime()) {
      // Enforce minAdvanceBookingHours
      if (cursor.getTime() < earliestStart.getTime()) {
        cursor = new Date(cursor.getTime() + slotIncrementMinutes * 60_000);
        continue;
      }

      const slotStart = new Date(cursor.getTime() - bufferBefore * 60_000);
      const slotEnd = new Date(cursor.getTime() + (duration + bufferAfter) * 60_000);

      const apptConflict = appointments.some(
        (a) =>
          a.resourceId === rule.resourceId &&
          a.startAt.getTime() < slotEnd.getTime() &&
          a.endAt.getTime() > slotStart.getTime(),
      );
      const blockedConflict = blockedSlots.some(
        (b) =>
          (b.resourceId === rule.resourceId || b.resourceId === null) &&
          b.startAt.getTime() < slotEnd.getTime() &&
          b.endAt.getTime() > slotStart.getTime(),
      );

      if (!apptConflict && !blockedConflict) {
        slots.push({
          resourceId: rule.resourceId,
          startAt: cursor.toISOString(),
          endAt: new Date(cursor.getTime() + duration * 60_000).toISOString(),
        });
      }

      cursor = new Date(cursor.getTime() + slotIncrementMinutes * 60_000);
    }
  }

  return c.json({ success: true, data: slots });
});

// ─────────────────────────────────────────────
// POST /public/booking/appointments
// Creates an appointment from the public widget. Auto-creates or finds the
// customer by phone (preferred) or email; bumps customer.totalAppointments.
// ─────────────────────────────────────────────

const publicAppointmentSchema = z.object({
  siteId: z.string().uuid(),
  serviceId: z.string().uuid(),
  resourceId: z.string().uuid(),
  startAt: z.string(),
  customer: z.object({
    firstName: z.string().min(1).max(120),
    lastName: z.string().max(120).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).max(32),
    note: z.string().max(2000).optional(),
    smsConsent: z.boolean().default(true),
    emailConsent: z.boolean().default(true),
    marketingConsent: z.boolean().default(false),
  }),
});

bookingPublicRoutes.post(
  "/appointments",
  zValidator("json", publicAppointmentSchema),
  async (c) => {
    const body = c.req.valid("json");
    const tenantId = await resolveTenantFromSite(body.siteId);

    // Validate service is active + online bookable
    const [service] = await db
      .select()
      .from(bookingServices)
      .where(
        and(
          eq(bookingServices.tenantId, tenantId),
          eq(bookingServices.id, body.serviceId),
          eq(bookingServices.isActive, true),
          eq(bookingServices.isBookableOnline, true),
        ),
      )
      .limit(1);
    if (!service) throw new AppError(400, "SERVICE_UNAVAILABLE", "Service not bookable online");

    // Validate resource is active + online bookable
    const [resource] = await db
      .select()
      .from(bookingResources)
      .where(
        and(
          eq(bookingResources.tenantId, tenantId),
          eq(bookingResources.id, body.resourceId),
          eq(bookingResources.isActive, true),
          eq(bookingResources.isBookableOnline, true),
        ),
      )
      .limit(1);
    if (!resource) throw new AppError(400, "RESOURCE_UNAVAILABLE", "Resource not bookable online");

    // Compute start/end
    const startAt = new Date(body.startAt);
    if (isNaN(startAt.getTime())) throw new AppError(400, "INVALID_DATE", "startAt must be a valid ISO date");

    // Enforce minAdvance
    const minAdvance = service.minAdvanceBookingHours ?? 2;
    if (startAt.getTime() < Date.now() + minAdvance * 60 * 60 * 1000) {
      throw new AppError(400, "TOO_SOON", `Programările trebuie făcute cu cel puțin ${minAdvance}h în avans`);
    }

    const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);

    // Conflict check
    const conflicts = await db
      .select({ id: bookingAppointments.id })
      .from(bookingAppointments)
      .where(
        and(
          eq(bookingAppointments.tenantId, tenantId),
          eq(bookingAppointments.resourceId, body.resourceId),
          inArray(bookingAppointments.status, ["pending", "confirmed", "checked_in", "in_progress"]),
          lt(bookingAppointments.startAt, endAt),
          gt(bookingAppointments.endAt, startAt),
        ),
      )
      .limit(1);

    if (conflicts.length > 0) {
      throw new AppError(409, "SLOT_TAKEN", "Acest interval tocmai a fost rezervat. Te rugăm alege altul.");
    }

    // Find or create customer
    let customerId: string | null = null;
    const cleanPhone = body.customer.phone.trim();
    const cleanEmail = body.customer.email?.trim().toLowerCase();

    // Try by phone first
    const [byPhone] = await db
      .select({ id: bookingCustomers.id })
      .from(bookingCustomers)
      .where(and(eq(bookingCustomers.tenantId, tenantId), eq(bookingCustomers.phone, cleanPhone)))
      .limit(1);

    if (byPhone) {
      customerId = byPhone.id;
    } else if (cleanEmail) {
      const [byEmail] = await db
        .select({ id: bookingCustomers.id })
        .from(bookingCustomers)
        .where(and(eq(bookingCustomers.tenantId, tenantId), eq(bookingCustomers.email, cleanEmail)))
        .limit(1);
      if (byEmail) customerId = byEmail.id;
    }

    if (!customerId) {
      const [created] = await db
        .insert(bookingCustomers)
        .values({
          tenantId,
          firstName: body.customer.firstName,
          lastName: body.customer.lastName ?? null,
          email: cleanEmail ?? null,
          phone: cleanPhone,
          smsConsent: body.customer.smsConsent,
          emailConsent: body.customer.emailConsent,
          marketingConsent: body.customer.marketingConsent,
        })
        .returning({ id: bookingCustomers.id });
      customerId = created!.id;
    }

    // Generate unique booking code
    let bookingCode = generateBookingCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const [existing] = await db
        .select({ id: bookingAppointments.id })
        .from(bookingAppointments)
        .where(and(eq(bookingAppointments.tenantId, tenantId), eq(bookingAppointments.bookingCode, bookingCode)))
        .limit(1);
      if (!existing) break;
      bookingCode = generateBookingCode();
    }

    const [appointment] = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(bookingAppointments)
        .values({
          tenantId,
          bookingCode,
          customerId: customerId!,
          resourceId: body.resourceId,
          serviceId: body.serviceId,
          startAt,
          endAt,
          status: "confirmed",
          channel: "widget",
          priceSnapshot: service.price,
          currencySnapshot: service.currency,
          vatRateSnapshot: service.vatRate,
          customerNote: body.customer.note ?? null,
        })
        .returning();

      await tx
        .update(bookingCustomers)
        .set({
          totalAppointments: sql`${bookingCustomers.totalAppointments} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(bookingCustomers.id, customerId!));

      return [inserted!];
    });

    // Fire-and-forget email confirmation
    notifyBookingConfirmed(appointment.id).catch(() => {});

    return c.json(
      {
        success: true,
        data: {
          id: appointment.id,
          bookingCode: appointment.bookingCode,
          startAt: appointment.startAt,
          endAt: appointment.endAt,
          status: appointment.status,
          serviceName: service.name,
          resourceName: resource.name,
          price: appointment.priceSnapshot,
          currency: appointment.currencySnapshot,
        },
      },
      201,
    );
  },
);

// ─────────────────────────────────────────────
// GET /public/booking/lookup?code=ABC12345
// Lets a customer view their booking details (no PII leakage — just the basics).
// ─────────────────────────────────────────────

bookingPublicRoutes.get("/lookup", async (c) => {
  const code = c.req.query("code");
  if (!code) throw new AppError(400, "MISSING_CODE", "code query parameter is required");

  const result = await db
    .select({
      appointment: bookingAppointments,
      service: {
        name: bookingServices.name,
        durationMinutes: bookingServices.durationMinutes,
      },
      resource: {
        name: bookingResources.name,
      },
    })
    .from(bookingAppointments)
    .innerJoin(bookingServices, eq(bookingAppointments.serviceId, bookingServices.id))
    .innerJoin(bookingResources, eq(bookingAppointments.resourceId, bookingResources.id))
    .where(eq(bookingAppointments.bookingCode, code.toUpperCase()))
    .limit(1);

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Programarea nu a fost găsită");

  const { appointment, service, resource } = result[0];
  return c.json({
    success: true,
    data: {
      bookingCode: appointment.bookingCode,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      status: appointment.status,
      serviceName: service.name,
      resourceName: resource.name,
      durationMinutes: service.durationMinutes,
      price: appointment.priceSnapshot,
      currency: appointment.currencySnapshot,
    },
  });
});
