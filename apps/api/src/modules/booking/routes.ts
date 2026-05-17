import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  db,
  bookingCustomers,
  bookingResources,
  bookingServices,
  bookingAvailability,
  bookingBlockedSlots,
  bookingAppointments,
  billingInvoices,
} from "@openportal/db";
import { and, eq, gte, lte, lt, gt, ne, sql, desc, asc, count, inArray, or } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";
import { notifyBookingConfirmed, notifyBookingCancelled } from "../../lib/booking-notifications";
import { assertCanCreateResource } from "../../lib/plan-limits";

export const bookingRoutes = new Hono();
bookingRoutes.use("*", requireAuth);

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

function dayOfWeekFromDate(d: Date): number {
  return d.getUTCDay();
}

function toTimeOfDay(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

// ─────────────────────────────────────────────
// RESOURCES
// ─────────────────────────────────────────────

const resourceCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["staff", "room", "equipment", "vehicle", "other"]).default("staff"),
  description: z.string().max(2000).optional(),
  color: z.string().max(7).optional(),
  avatarUrl: z.string().url().optional(),
  userId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  capacity: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  isBookableOnline: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

bookingRoutes.get("/resources", async (c) => {
  const tenantId = c.get("tenantId");
  const onlyActive = c.req.query("active") === "true";

  const conds = [eq(bookingResources.tenantId, tenantId)];
  if (onlyActive) conds.push(eq(bookingResources.isActive, true));

  const rows = await db
    .select()
    .from(bookingResources)
    .where(and(...conds))
    .orderBy(asc(bookingResources.sortOrder), asc(bookingResources.name));

  return c.json({ success: true, data: rows });
});

bookingRoutes.get("/resources/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [row] = await db
    .select()
    .from(bookingResources)
    .where(and(eq(bookingResources.tenantId, tenantId), eq(bookingResources.id, id)))
    .limit(1);

  if (!row) throw new AppError(404, "NOT_FOUND", "Resource not found");
  return c.json({ success: true, data: row });
});

bookingRoutes.post("/resources", zValidator("json", resourceCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");

  await assertCanCreateResource(tenantId);

  const [row] = await db
    .insert(bookingResources)
    .values({
      tenantId,
      name: body.name,
      type: body.type,
      description: body.description ?? null,
      color: body.color ?? "#6366F1",
      avatarUrl: body.avatarUrl ?? null,
      userId: body.userId ?? null,
      siteId: body.siteId ?? null,
      capacity: body.capacity,
      isActive: body.isActive,
      isBookableOnline: body.isBookableOnline,
      sortOrder: body.sortOrder,
    })
    .returning();

  return c.json({ success: true, data: row }, 201);
});

const resourceUpdateSchema = resourceCreateSchema.partial();

bookingRoutes.patch("/resources/:id", zValidator("json", resourceUpdateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [row] = await db
    .update(bookingResources)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(bookingResources.tenantId, tenantId), eq(bookingResources.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Resource not found");
  return c.json({ success: true, data: row });
});

bookingRoutes.delete("/resources/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(bookingResources)
    .where(and(eq(bookingResources.tenantId, tenantId), eq(bookingResources.id, id)))
    .returning({ id: bookingResources.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Resource not found");
  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────

const serviceCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Lowercase letters, digits and hyphens only"),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  imageUrl: z.string().url().optional(),
  color: z.string().max(7).optional(),
  durationMinutes: z.number().int().positive().default(60),
  bufferAfterMinutes: z.number().int().nonnegative().default(0),
  bufferBeforeMinutes: z.number().int().nonnegative().default(0),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Format: 100 or 100.50").default("0"),
  currency: z.string().length(3).default("RON"),
  vatRate: z.string().regex(/^\d+(\.\d{1,2})?$/).default("19.00"),
  requiresDeposit: z.boolean().default(false),
  depositAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  isActive: z.boolean().default(true),
  isBookableOnline: z.boolean().default(true),
  maxAdvanceBookingDays: z.number().int().positive().default(60),
  minAdvanceBookingHours: z.number().int().nonnegative().default(2),
  eligibleResourceIds: z.array(z.string().uuid()).default([]),
  sortOrder: z.number().int().default(0),
  siteId: z.string().uuid().optional(),
});

bookingRoutes.get("/services", async (c) => {
  const tenantId = c.get("tenantId");
  const onlyActive = c.req.query("active") === "true";
  const category = c.req.query("category");

  const conds = [eq(bookingServices.tenantId, tenantId)];
  if (onlyActive) conds.push(eq(bookingServices.isActive, true));
  if (category) conds.push(eq(bookingServices.category, category));

  const rows = await db
    .select()
    .from(bookingServices)
    .where(and(...conds))
    .orderBy(asc(bookingServices.sortOrder), asc(bookingServices.name));

  return c.json({ success: true, data: rows });
});

bookingRoutes.get("/services/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [row] = await db
    .select()
    .from(bookingServices)
    .where(and(eq(bookingServices.tenantId, tenantId), eq(bookingServices.id, id)))
    .limit(1);

  if (!row) throw new AppError(404, "NOT_FOUND", "Service not found");
  return c.json({ success: true, data: row });
});

bookingRoutes.post("/services", zValidator("json", serviceCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");

  const [row] = await db
    .insert(bookingServices)
    .values({
      tenantId,
      name: body.name,
      slug: body.slug,
      description: body.description ?? null,
      category: body.category ?? null,
      imageUrl: body.imageUrl ?? null,
      color: body.color ?? "#10B981",
      durationMinutes: body.durationMinutes,
      bufferAfterMinutes: body.bufferAfterMinutes,
      bufferBeforeMinutes: body.bufferBeforeMinutes,
      price: body.price,
      currency: body.currency,
      vatRate: body.vatRate,
      requiresDeposit: body.requiresDeposit,
      depositAmount: body.depositAmount,
      isActive: body.isActive,
      isBookableOnline: body.isBookableOnline,
      maxAdvanceBookingDays: body.maxAdvanceBookingDays,
      minAdvanceBookingHours: body.minAdvanceBookingHours,
      eligibleResourceIds: body.eligibleResourceIds,
      sortOrder: body.sortOrder,
      siteId: body.siteId ?? null,
    })
    .returning();

  return c.json({ success: true, data: row }, 201);
});

bookingRoutes.patch("/services/:id", zValidator("json", serviceCreateSchema.partial()), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [row] = await db
    .update(bookingServices)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(bookingServices.tenantId, tenantId), eq(bookingServices.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Service not found");
  return c.json({ success: true, data: row });
});

bookingRoutes.delete("/services/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(bookingServices)
    .where(and(eq(bookingServices.tenantId, tenantId), eq(bookingServices.id, id)))
    .returning({ id: bookingServices.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Service not found");
  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// AVAILABILITY (weekly schedule per resource)
// ─────────────────────────────────────────────

const availabilityCreateSchema = z.object({
  resourceId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Format: HH:MM or HH:MM:SS"),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  effectiveUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isActive: z.boolean().default(true),
});

bookingRoutes.get("/availability", async (c) => {
  const tenantId = c.get("tenantId");
  const resourceId = c.req.query("resourceId");

  const conds = [eq(bookingAvailability.tenantId, tenantId)];
  if (resourceId) conds.push(eq(bookingAvailability.resourceId, resourceId));

  const rows = await db
    .select()
    .from(bookingAvailability)
    .where(and(...conds))
    .orderBy(asc(bookingAvailability.dayOfWeek), asc(bookingAvailability.startTime));

  return c.json({ success: true, data: rows });
});

bookingRoutes.post("/availability", zValidator("json", availabilityCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");

  if (body.startTime >= body.endTime) {
    throw new AppError(400, "INVALID_RANGE", "startTime must be before endTime");
  }

  const [row] = await db
    .insert(bookingAvailability)
    .values({
      tenantId,
      resourceId: body.resourceId,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      effectiveFrom: body.effectiveFrom ?? null,
      effectiveUntil: body.effectiveUntil ?? null,
      isActive: body.isActive,
    })
    .returning();

  return c.json({ success: true, data: row }, 201);
});

bookingRoutes.patch("/availability/:id", zValidator("json", availabilityCreateSchema.partial()), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [row] = await db
    .update(bookingAvailability)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(bookingAvailability.tenantId, tenantId), eq(bookingAvailability.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Availability rule not found");
  return c.json({ success: true, data: row });
});

bookingRoutes.delete("/availability/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(bookingAvailability)
    .where(and(eq(bookingAvailability.tenantId, tenantId), eq(bookingAvailability.id, id)))
    .returning({ id: bookingAvailability.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Availability rule not found");
  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// BLOCKED SLOTS (vacations, breaks, custom closures)
// ─────────────────────────────────────────────

const blockedSlotSchema = z.object({
  resourceId: z.string().uuid().optional(),
  startAt: z.string(),
  endAt: z.string(),
  reason: z.string().max(200).optional(),
  isAllDay: z.boolean().default(false),
});

bookingRoutes.get("/blocked-slots", async (c) => {
  const tenantId = c.get("tenantId");
  const resourceId = c.req.query("resourceId");
  const from = c.req.query("from");
  const to = c.req.query("to");

  const conds = [eq(bookingBlockedSlots.tenantId, tenantId)];
  if (resourceId) conds.push(eq(bookingBlockedSlots.resourceId, resourceId));
  if (from) conds.push(gte(bookingBlockedSlots.endAt, new Date(from)));
  if (to) conds.push(lte(bookingBlockedSlots.startAt, new Date(to)));

  const rows = await db
    .select()
    .from(bookingBlockedSlots)
    .where(and(...conds))
    .orderBy(asc(bookingBlockedSlots.startAt));

  return c.json({ success: true, data: rows });
});

bookingRoutes.post("/blocked-slots", zValidator("json", blockedSlotSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const [row] = await db
    .insert(bookingBlockedSlots)
    .values({
      tenantId,
      resourceId: body.resourceId ?? null,
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
      reason: body.reason ?? null,
      isAllDay: body.isAllDay,
      createdBy: user.id,
    })
    .returning();

  return c.json({ success: true, data: row }, 201);
});

bookingRoutes.delete("/blocked-slots/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(bookingBlockedSlots)
    .where(and(eq(bookingBlockedSlots.tenantId, tenantId), eq(bookingBlockedSlots.id, id)))
    .returning({ id: bookingBlockedSlots.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Blocked slot not found");
  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────

const customerCreateSchema = z.object({
  firstName: z.string().min(1).max(120),
  lastName: z.string().max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(32).optional(),
  language: z.string().max(8).default("ro"),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).default([]),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  marketingConsent: z.boolean().default(false),
  smsConsent: z.boolean().default(true),
  emailConsent: z.boolean().default(true),
});

bookingRoutes.get("/customers", async (c) => {
  const tenantId = c.get("tenantId");
  const search = c.req.query("search");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);
  const offset = parseInt(c.req.query("offset") || "0");

  const conds = [eq(bookingCustomers.tenantId, tenantId)];
  if (search) {
    const like = `%${search.toLowerCase()}%`;
    conds.push(
      or(
        sql`LOWER(${bookingCustomers.firstName}) LIKE ${like}`,
        sql`LOWER(${bookingCustomers.lastName}) LIKE ${like}`,
        sql`LOWER(${bookingCustomers.email}) LIKE ${like}`,
        sql`${bookingCustomers.phone} LIKE ${`%${search}%`}`,
      )!,
    );
  }

  const rows = await db
    .select()
    .from(bookingCustomers)
    .where(and(...conds))
    .orderBy(desc(bookingCustomers.lastVisitAt), asc(bookingCustomers.firstName))
    .limit(limit)
    .offset(offset);

  const totalRow = await db.select({ total: count() }).from(bookingCustomers).where(and(...conds));

  return c.json({
    success: true,
    data: rows,
    meta: { total: Number(totalRow[0]?.total || 0), limit, offset },
  });
});

bookingRoutes.get("/customers/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [row] = await db
    .select()
    .from(bookingCustomers)
    .where(and(eq(bookingCustomers.tenantId, tenantId), eq(bookingCustomers.id, id)))
    .limit(1);

  if (!row) throw new AppError(404, "NOT_FOUND", "Customer not found");
  return c.json({ success: true, data: row });
});

// ─────────────────────────────────────────────
// GET /customers/:id/profile
// Full customer profile: identity + computed lifetime stats
// (visits, no-show rate, avg spend, favorite service) + appointment
// history + invoice history.
// ─────────────────────────────────────────────

bookingRoutes.get("/customers/:id/profile", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [customer] = await db
    .select()
    .from(bookingCustomers)
    .where(and(eq(bookingCustomers.tenantId, tenantId), eq(bookingCustomers.id, id)))
    .limit(1);

  if (!customer) throw new AppError(404, "NOT_FOUND", "Customer not found");

  // Pull all appointments for this customer, newest first.
  const appointments = await db
    .select({
      id: bookingAppointments.id,
      bookingCode: bookingAppointments.bookingCode,
      startAt: bookingAppointments.startAt,
      endAt: bookingAppointments.endAt,
      status: bookingAppointments.status,
      channel: bookingAppointments.channel,
      priceSnapshot: bookingAppointments.priceSnapshot,
      currencySnapshot: bookingAppointments.currencySnapshot,
      totalPaid: bookingAppointments.totalPaid,
      paymentStatus: bookingAppointments.paymentStatus,
      customerNote: bookingAppointments.customerNote,
      internalNote: bookingAppointments.internalNote,
      cancelledAt: bookingAppointments.cancelledAt,
      cancellationReason: bookingAppointments.cancellationReason,
      serviceId: bookingServices.id,
      serviceName: bookingServices.name,
      serviceColor: bookingServices.color,
      serviceDuration: bookingServices.durationMinutes,
      resourceId: bookingResources.id,
      resourceName: bookingResources.name,
    })
    .from(bookingAppointments)
    .innerJoin(bookingServices, eq(bookingServices.id, bookingAppointments.serviceId))
    .innerJoin(bookingResources, eq(bookingResources.id, bookingAppointments.resourceId))
    .where(
      and(
        eq(bookingAppointments.tenantId, tenantId),
        eq(bookingAppointments.customerId, id),
      ),
    )
    .orderBy(desc(bookingAppointments.startAt))
    .limit(200);

  // Pull related invoices (customer link OR by-customer email match)
  const invoices = await db
    .select({
      id: billingInvoices.id,
      documentNumber: billingInvoices.documentNumber,
      status: billingInvoices.status,
      issueDate: billingInvoices.issueDate,
      dueDate: billingInvoices.dueDate,
      totalAmount: billingInvoices.totalAmount,
      totalPaid: billingInvoices.totalPaid,
      amountDue: billingInvoices.amountDue,
      currency: billingInvoices.currency,
      type: billingInvoices.type,
    })
    .from(billingInvoices)
    .where(
      and(
        eq(billingInvoices.tenantId, tenantId),
        eq(billingInvoices.customerId, id),
      ),
    )
    .orderBy(desc(billingInvoices.issueDate))
    .limit(100);

  // Compute lifetime stats from the live appointments table
  const completed = appointments.filter((a) =>
    ["completed", "checked_in", "in_progress"].includes(a.status),
  );
  const cancelledByCustomer = appointments.filter((a) => a.status === "cancelled").length;
  const noShows = appointments.filter((a) => a.status === "no_show").length;
  const totalSpent = completed.reduce((sum, a) => sum + Number(a.priceSnapshot), 0);
  const lifetimeValue = appointments.reduce((sum, a) => sum + Number(a.totalPaid), 0);
  const avgSpend = completed.length > 0 ? totalSpent / completed.length : 0;
  const upcoming = appointments.filter(
    (a) => a.startAt.getTime() > Date.now() && ["pending", "confirmed", "checked_in"].includes(a.status),
  );

  // Favorite service (highest count among completed)
  const serviceTally = new Map<string, { id: string; name: string; color: string; count: number; revenue: number }>();
  for (const a of completed) {
    const cur = serviceTally.get(a.serviceId);
    if (cur) {
      cur.count++;
      cur.revenue += Number(a.priceSnapshot);
    } else {
      serviceTally.set(a.serviceId, {
        id: a.serviceId,
        name: a.serviceName,
        color: a.serviceColor ?? "#6366F1",
        count: 1,
        revenue: Number(a.priceSnapshot),
      });
    }
  }
  const favoriteServices = Array.from(serviceTally.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Time between visits — mean delta between completed appointments
  const completedAsc = [...completed].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime(),
  );
  let avgDaysBetween: number | null = null;
  if (completedAsc.length >= 2) {
    const deltas: number[] = [];
    for (let i = 1; i < completedAsc.length; i++) {
      deltas.push(
        (completedAsc[i].startAt.getTime() - completedAsc[i - 1].startAt.getTime()) / 86400_000,
      );
    }
    avgDaysBetween = deltas.reduce((s, d) => s + d, 0) / deltas.length;
  }

  // Outstanding invoiced amount
  const outstanding = invoices
    .filter((i) => ["issued", "sent", "viewed", "partially_paid", "overdue"].includes(i.status))
    .reduce((s, i) => s + Number(i.amountDue), 0);

  return c.json({
    success: true,
    data: {
      customer,
      stats: {
        totalAppointments: appointments.length,
        completed: completed.length,
        upcoming: upcoming.length,
        cancelled: cancelledByCustomer,
        noShows,
        noShowRate: appointments.length > 0 ? noShows / appointments.length : 0,
        totalSpent: totalSpent.toFixed(2),
        lifetimeValue: lifetimeValue.toFixed(2),
        avgSpend: avgSpend.toFixed(2),
        avgDaysBetweenVisits: avgDaysBetween ? Math.round(avgDaysBetween * 10) / 10 : null,
        firstVisitAt: completedAsc[0]?.startAt.toISOString() ?? null,
        lastVisitAt: completed[0]?.startAt.toISOString() ?? null,
        favoriteServices,
        outstandingInvoiced: outstanding.toFixed(2),
      },
      appointments,
      invoices,
    },
  });
});

bookingRoutes.post("/customers", zValidator("json", customerCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");

  const [row] = await db
    .insert(bookingCustomers)
    .values({
      tenantId,
      firstName: body.firstName,
      lastName: body.lastName ?? null,
      email: body.email?.toLowerCase() ?? null,
      phone: body.phone ?? null,
      language: body.language,
      notes: body.notes ?? null,
      tags: body.tags,
      dateOfBirth: body.dateOfBirth ?? null,
      marketingConsent: body.marketingConsent,
      smsConsent: body.smsConsent,
      emailConsent: body.emailConsent,
    })
    .returning();

  return c.json({ success: true, data: row }, 201);
});

bookingRoutes.patch("/customers/:id", zValidator("json", customerCreateSchema.partial()), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [row] = await db
    .update(bookingCustomers)
    .set({
      ...body,
      email: body.email ? body.email.toLowerCase() : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(bookingCustomers.tenantId, tenantId), eq(bookingCustomers.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Customer not found");
  return c.json({ success: true, data: row });
});

bookingRoutes.delete("/customers/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(bookingCustomers)
    .where(and(eq(bookingCustomers.tenantId, tenantId), eq(bookingCustomers.id, id)))
    .returning({ id: bookingCustomers.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Customer not found");
  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// APPOINTMENTS — list, create with availability check, update, cancel
// ─────────────────────────────────────────────

bookingRoutes.get("/appointments", async (c) => {
  const tenantId = c.get("tenantId");
  const resourceId = c.req.query("resourceId");
  const customerId = c.req.query("customerId");
  const status = c.req.query("status");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const limit = Math.min(parseInt(c.req.query("limit") || "100"), 500);
  const offset = parseInt(c.req.query("offset") || "0");

  const conds = [eq(bookingAppointments.tenantId, tenantId)];
  if (resourceId) conds.push(eq(bookingAppointments.resourceId, resourceId));
  if (customerId) conds.push(eq(bookingAppointments.customerId, customerId));
  if (status) {
    conds.push(eq(bookingAppointments.status, status as "pending" | "confirmed" | "checked_in" | "in_progress" | "completed" | "cancelled" | "no_show" | "rescheduled"));
  }
  if (from) conds.push(gte(bookingAppointments.startAt, new Date(from)));
  if (to) conds.push(lte(bookingAppointments.startAt, new Date(to)));

  const rows = await db
    .select({
      appointment: bookingAppointments,
      customer: {
        id: bookingCustomers.id,
        firstName: bookingCustomers.firstName,
        lastName: bookingCustomers.lastName,
        email: bookingCustomers.email,
        phone: bookingCustomers.phone,
      },
      service: {
        id: bookingServices.id,
        name: bookingServices.name,
        durationMinutes: bookingServices.durationMinutes,
        color: bookingServices.color,
      },
      resource: {
        id: bookingResources.id,
        name: bookingResources.name,
        color: bookingResources.color,
      },
    })
    .from(bookingAppointments)
    .innerJoin(bookingCustomers, eq(bookingAppointments.customerId, bookingCustomers.id))
    .innerJoin(bookingServices, eq(bookingAppointments.serviceId, bookingServices.id))
    .innerJoin(bookingResources, eq(bookingAppointments.resourceId, bookingResources.id))
    .where(and(...conds))
    .orderBy(asc(bookingAppointments.startAt))
    .limit(limit)
    .offset(offset);

  const totalRow = await db.select({ total: count() }).from(bookingAppointments).where(and(...conds));

  return c.json({
    success: true,
    data: rows,
    meta: { total: Number(totalRow[0]?.total || 0), limit, offset },
  });
});

bookingRoutes.get("/appointments/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [row] = await db
    .select()
    .from(bookingAppointments)
    .where(and(eq(bookingAppointments.tenantId, tenantId), eq(bookingAppointments.id, id)))
    .limit(1);

  if (!row) throw new AppError(404, "NOT_FOUND", "Appointment not found");
  return c.json({ success: true, data: row });
});

const appointmentCreateSchema = z.object({
  customerId: z.string().uuid(),
  resourceId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startAt: z.string(),
  channel: z.enum(["admin", "widget", "phone", "walkin", "marketplace"]).default("admin"),
  status: z.enum(["pending", "confirmed", "checked_in", "in_progress", "completed", "cancelled", "no_show", "rescheduled"]).default("confirmed"),
  customerNote: z.string().max(2000).optional(),
  internalNote: z.string().max(2000).optional(),
  // Allow caller to override duration (otherwise pulled from service)
  durationMinutes: z.number().int().positive().optional(),
  skipConflictCheck: z.boolean().default(false),
});

bookingRoutes.post("/appointments", zValidator("json", appointmentCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  // 1. Verify service belongs to tenant and is active
  const [service] = await db
    .select()
    .from(bookingServices)
    .where(and(eq(bookingServices.tenantId, tenantId), eq(bookingServices.id, body.serviceId)))
    .limit(1);

  if (!service) throw new AppError(404, "SERVICE_NOT_FOUND", "Service not found");
  if (!service.isActive) throw new AppError(400, "SERVICE_INACTIVE", "Service is not active");

  // 2. Verify resource belongs to tenant
  const [resource] = await db
    .select()
    .from(bookingResources)
    .where(and(eq(bookingResources.tenantId, tenantId), eq(bookingResources.id, body.resourceId)))
    .limit(1);

  if (!resource) throw new AppError(404, "RESOURCE_NOT_FOUND", "Resource not found");
  if (!resource.isActive) throw new AppError(400, "RESOURCE_INACTIVE", "Resource is not active");

  // 3. Verify customer belongs to tenant
  const [customer] = await db
    .select()
    .from(bookingCustomers)
    .where(and(eq(bookingCustomers.tenantId, tenantId), eq(bookingCustomers.id, body.customerId)))
    .limit(1);

  if (!customer) throw new AppError(404, "CUSTOMER_NOT_FOUND", "Customer not found");

  // 4. Compute start/end
  const startAt = new Date(body.startAt);
  const durationMinutes = body.durationMinutes ?? service.durationMinutes;
  const endAt = new Date(startAt.getTime() + durationMinutes * 60_000);

  if (!body.skipConflictCheck) {
    // 5. Conflict check against existing appointments for the same resource
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
      throw new AppError(409, "BOOKING_CONFLICT", "Resource is already booked in that time range");
    }

    // 6. Conflict check against blocked slots (resource-specific or tenant-wide)
    const blocked = await db
      .select({ id: bookingBlockedSlots.id })
      .from(bookingBlockedSlots)
      .where(
        and(
          eq(bookingBlockedSlots.tenantId, tenantId),
          or(
            eq(bookingBlockedSlots.resourceId, body.resourceId),
            sql`${bookingBlockedSlots.resourceId} IS NULL`,
          )!,
          lt(bookingBlockedSlots.startAt, endAt),
          gt(bookingBlockedSlots.endAt, startAt),
        ),
      )
      .limit(1);

    if (blocked.length > 0) {
      throw new AppError(409, "BLOCKED_SLOT", "Resource is blocked in that time range");
    }
  }

  // 7. Generate a unique booking code (retry a few times if collision)
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

  // 8. Insert appointment + bump customer stats
  const [row] = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(bookingAppointments)
      .values({
        tenantId,
        bookingCode,
        customerId: body.customerId,
        resourceId: body.resourceId,
        serviceId: body.serviceId,
        startAt,
        endAt,
        status: body.status,
        channel: body.channel,
        priceSnapshot: service.price,
        currencySnapshot: service.currency,
        vatRateSnapshot: service.vatRate,
        customerNote: body.customerNote ?? null,
        internalNote: body.internalNote ?? null,
        createdBy: user.id,
      })
      .returning();

    await tx
      .update(bookingCustomers)
      .set({
        totalAppointments: sql`${bookingCustomers.totalAppointments} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(bookingCustomers.id, body.customerId));

    return [inserted!];
  });

  // Fire-and-forget email notification (only for confirmed bookings)
  if (row.status === "confirmed") {
    notifyBookingConfirmed(row.id).catch(() => {});
  }

  return c.json({ success: true, data: row }, 201);
});

const appointmentUpdateSchema = z.object({
  startAt: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  resourceId: z.string().uuid().optional(),
  status: z.enum(["pending", "confirmed", "checked_in", "in_progress", "completed", "cancelled", "no_show", "rescheduled"]).optional(),
  customerNote: z.string().max(2000).optional(),
  internalNote: z.string().max(2000).optional(),
  cancellationReason: z.string().max(2000).optional(),
});

bookingRoutes.patch("/appointments/:id", zValidator("json", appointmentUpdateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [current] = await db
    .select()
    .from(bookingAppointments)
    .where(and(eq(bookingAppointments.tenantId, tenantId), eq(bookingAppointments.id, id)))
    .limit(1);

  if (!current) throw new AppError(404, "NOT_FOUND", "Appointment not found");

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  const targetResourceId = body.resourceId ?? current.resourceId;
  const timeChanged = Boolean(body.startAt);
  const resourceChanged = Boolean(body.resourceId && body.resourceId !== current.resourceId);

  if (timeChanged || resourceChanged) {
    const newStart = body.startAt ? new Date(body.startAt) : current.startAt;
    const duration = body.durationMinutes ?? Math.round((current.endAt.getTime() - current.startAt.getTime()) / 60_000);
    const newEnd = new Date(newStart.getTime() + duration * 60_000);

    // Conflict check on the target resource (excluding self)
    const conflicts = await db
      .select({ id: bookingAppointments.id })
      .from(bookingAppointments)
      .where(
        and(
          eq(bookingAppointments.tenantId, tenantId),
          eq(bookingAppointments.resourceId, targetResourceId),
          ne(bookingAppointments.id, id),
          inArray(bookingAppointments.status, ["pending", "confirmed", "checked_in", "in_progress"]),
          lt(bookingAppointments.startAt, newEnd),
          gt(bookingAppointments.endAt, newStart),
        ),
      )
      .limit(1);

    if (conflicts.length > 0) {
      throw new AppError(409, "BOOKING_CONFLICT", "Resource is already booked in that new time range");
    }

    if (timeChanged) {
      updates.startAt = newStart;
      updates.endAt = newEnd;
    }
    if (resourceChanged) {
      updates.resourceId = targetResourceId;
    }
  }

  if (body.status) updates.status = body.status;
  if (body.customerNote !== undefined) updates.customerNote = body.customerNote;
  if (body.internalNote !== undefined) updates.internalNote = body.internalNote;

  if (body.status === "cancelled") {
    updates.cancelledAt = new Date();
    updates.cancelledBy = user.id;
    if (body.cancellationReason) updates.cancellationReason = body.cancellationReason;
  }

  const [row] = await db
    .update(bookingAppointments)
    .set(updates)
    .where(and(eq(bookingAppointments.tenantId, tenantId), eq(bookingAppointments.id, id)))
    .returning();

  // Fire-and-forget notifications based on status transition
  if (body.status === "cancelled" && current.status !== "cancelled") {
    notifyBookingCancelled(id, body.cancellationReason ?? null).catch(() => {});
  } else if (body.status === "confirmed" && current.status === "pending") {
    notifyBookingConfirmed(id).catch(() => {});
  }

  return c.json({ success: true, data: row });
});

bookingRoutes.delete("/appointments/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(bookingAppointments)
    .where(and(eq(bookingAppointments.tenantId, tenantId), eq(bookingAppointments.id, id)))
    .returning({ id: bookingAppointments.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Appointment not found");
  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// AVAILABILITY SLOTS — public-facing: which slots are open for a given service?
// ─────────────────────────────────────────────

const slotsQuerySchema = z.object({
  serviceId: z.string().uuid(),
  resourceId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

bookingRoutes.get("/slots", zValidator("query", slotsQuerySchema), async (c) => {
  const tenantId = c.get("tenantId");
  const { serviceId, resourceId, date } = c.req.valid("query");

  const [service] = await db
    .select()
    .from(bookingServices)
    .where(and(eq(bookingServices.tenantId, tenantId), eq(bookingServices.id, serviceId)))
    .limit(1);

  if (!service) throw new AppError(404, "SERVICE_NOT_FOUND", "Service not found");

  // Determine which resources can deliver this service
  let candidateResourceIds: string[];
  if (resourceId) {
    candidateResourceIds = [resourceId];
  } else if (service.eligibleResourceIds && service.eligibleResourceIds.length > 0) {
    candidateResourceIds = service.eligibleResourceIds;
  } else {
    // Any active resource for the tenant
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

  if (candidateResourceIds.length === 0) {
    return c.json({ success: true, data: [] });
  }

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);
  const dayOfWeek = dayStart.getUTCDay();

  // Fetch weekly availability rules for the day for these resources
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

  // Fetch existing appointments for the day for these resources
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

  // Fetch blocked slots for the day
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

  // Walk each resource's availability and generate slot candidates
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

    const [sh, sm] = rule.startTime.split(":").map((n) => parseInt(n, 10));
    const [eh, em] = rule.endTime.split(":").map((n) => parseInt(n, 10));
    const ruleStart = new Date(`${date}T${rule.startTime}`);
    const ruleEnd = new Date(`${date}T${rule.endTime}`);

    let cursor = new Date(ruleStart.getTime());

    while (cursor.getTime() + duration * 60_000 <= ruleEnd.getTime()) {
      const slotStart = new Date(cursor.getTime() - bufferBefore * 60_000);
      const slotEnd = new Date(cursor.getTime() + (duration + bufferAfter) * 60_000);

      // Check appointment conflict
      const apptConflict = appointments.some(
        (a) =>
          a.resourceId === rule.resourceId &&
          a.startAt.getTime() < slotEnd.getTime() &&
          a.endAt.getTime() > slotStart.getTime(),
      );
      // Check blocked slot conflict
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
