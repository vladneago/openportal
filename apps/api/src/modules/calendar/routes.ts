import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, calendarEvents, eventAttendees, users } from "@openportal/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const calendarRoutes = new Hono();
calendarRoutes.use("*", requireAuth);

// GET /calendar/events?start=ISO&end=ISO
calendarRoutes.get("/events", async (c) => {
  const tenantId = c.get("tenantId");
  const start = c.req.query("start");
  const end = c.req.query("end");

  const conditions: any[] = [eq(calendarEvents.tenantId, tenantId)];
  if (start) conditions.push(gte(calendarEvents.startAt, new Date(start)));
  if (end) conditions.push(lte(calendarEvents.startAt, new Date(end)));

  const results = await db.select().from(calendarEvents).where(and(...conditions)).orderBy(calendarEvents.startAt);

  // Get attendees for each event
  const withAttendees = await Promise.all(results.map(async (evt) => {
    const attendees = await db.select({
      id: eventAttendees.id, userId: eventAttendees.userId, status: eventAttendees.status,
      userName: users.displayName, userFirstName: users.firstName, userLastName: users.lastName,
    }).from(eventAttendees)
      .innerJoin(users, eq(eventAttendees.userId, users.id))
      .where(eq(eventAttendees.eventId, evt.id));
    return { ...evt, attendees };
  }));

  return c.json({ success: true, data: withAttendees });
});

// POST /calendar/events
const createEventSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  type: z.enum(["meeting", "task", "reminder", "event", "out_of_office"]).default("event"),
  color: z.string().max(7).optional(),
  startAt: z.string(), // ISO date
  endAt: z.string(),
  allDay: z.boolean().default(false),
  attendeeIds: z.array(z.string().uuid()).optional(),
  meetingUrl: z.string().optional(),
});

calendarRoutes.post("/events", zValidator("json", createEventSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const result = await db.transaction(async (tx) => {
    const [event] = await tx.insert(calendarEvents).values({
      tenantId, title: body.title, description: body.description || null,
      location: body.location || null, type: body.type, color: body.color || "#6366F1",
      startAt: new Date(body.startAt), endAt: new Date(body.endAt), allDay: body.allDay,
      meetingUrl: body.meetingUrl || null, createdBy: user.id,
    }).returning();

    // Add creator as attendee
    await tx.insert(eventAttendees).values({ eventId: event!.id, userId: user.id, status: "accepted" });

    // Add other attendees
    if (body.attendeeIds?.length) {
      for (const uid of body.attendeeIds) {
        if (uid !== user.id) {
          await tx.insert(eventAttendees).values({ eventId: event!.id, userId: uid, status: "pending" });
        }
      }
    }
    return event!;
  });

  return c.json({ success: true, data: result }, 201);
});

// GET /calendar/events/:id
calendarRoutes.get("/events/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const [event] = await db.select().from(calendarEvents).where(and(eq(calendarEvents.id, id), eq(calendarEvents.tenantId, tenantId))).limit(1);
  if (!event) throw new AppError(404, "NOT_FOUND", "Event not found");

  const attendees = await db.select({
    id: eventAttendees.id, userId: eventAttendees.userId, status: eventAttendees.status,
    userName: users.displayName,
  }).from(eventAttendees)
    .innerJoin(users, eq(eventAttendees.userId, users.id))
    .where(eq(eventAttendees.eventId, id));

  return c.json({ success: true, data: { ...event, attendees } });
});

// PATCH /calendar/events/:id
calendarRoutes.patch("/events/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = await c.req.json();

  const updateData: any = { updatedAt: new Date() };
  if (body.title) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.location !== undefined) updateData.location = body.location;
  if (body.startAt) updateData.startAt = new Date(body.startAt);
  if (body.endAt) updateData.endAt = new Date(body.endAt);
  if (body.color) updateData.color = body.color;
  if (body.allDay !== undefined) updateData.allDay = body.allDay;

  const [updated] = await db.update(calendarEvents).set(updateData)
    .where(and(eq(calendarEvents.id, id), eq(calendarEvents.tenantId, tenantId))).returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Event not found");
  return c.json({ success: true, data: updated });
});

// DELETE /calendar/events/:id
calendarRoutes.delete("/events/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  await db.delete(calendarEvents).where(and(eq(calendarEvents.id, id), eq(calendarEvents.tenantId, tenantId)));
  return c.json({ success: true, data: { message: "Event deleted" } });
});

// POST /calendar/events/:id/respond — RSVP
calendarRoutes.post("/events/:id/respond", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const { status } = await c.req.json();

  await db.update(eventAttendees)
    .set({ status, respondedAt: new Date() })
    .where(and(eq(eventAttendees.eventId, id), eq(eventAttendees.userId, user.id)));
  return c.json({ success: true });
});
