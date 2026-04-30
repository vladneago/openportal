import { Hono } from "hono";
import { db, managedEvents, eventSessions, eventRegistrations } from "@openportal/db";
import { eq, and, desc, asc, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

export const eventsRoutes = new Hono();
eventsRoutes.use("*", requireAuth);

eventsRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(managedEvents).where(eq(managedEvents.tenantId, tenantId)).orderBy(desc(managedEvents.startDate));
  const withStats = await Promise.all(results.map(async (e) => {
    const [rc] = await db.select({ count: count() }).from(eventRegistrations).where(eq(eventRegistrations.eventId, e.id));
    const [sc] = await db.select({ count: count() }).from(eventSessions).where(eq(eventSessions.eventId, e.id));
    return { ...e, registrationCount: rc?.count || 0, sessionCount: sc?.count || 0 };
  }));
  return c.json({ success: true, data: withStats });
});

eventsRoutes.post("/", async (c) => {
  const tenantId = c.get("tenantId"); const user = c.get("user"); const body = await c.req.json();
  const slug = body.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 100);
  const [event] = await db.insert(managedEvents).values({
    tenantId, title: body.title, slug, description: body.description || null,
    eventType: body.eventType || "conference", startDate: new Date(body.startDate),
    endDate: new Date(body.endDate), location: body.location || null,
    isVirtual: body.isVirtual || false, maxAttendees: body.maxAttendees || null,
    ticketPrice: body.ticketPrice || 0, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: event }, 201);
});

eventsRoutes.get("/:id", async (c) => {
  const tenantId = c.get("tenantId"); const id = c.req.param("id");
  const [event] = await db.select().from(managedEvents).where(and(eq(managedEvents.id, id), eq(managedEvents.tenantId, tenantId))).limit(1);
  if (!event) return c.json({ success: false, error: { code: "NOT_FOUND", message: "Event not found" } }, 404);
  const sessions = await db.select().from(eventSessions).where(eq(eventSessions.eventId, id)).orderBy(asc(eventSessions.startAt));
  const registrations = await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, id)).orderBy(desc(eventRegistrations.registeredAt));
  return c.json({ success: true, data: { ...event, sessions, registrations } });
});

eventsRoutes.post("/:id/publish", async (c) => {
  await db.update(managedEvents).set({ status: "published", updatedAt: new Date() }).where(eq(managedEvents.id, c.req.param("id")));
  return c.json({ success: true });
});

eventsRoutes.delete("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(managedEvents).where(and(eq(managedEvents.id, c.req.param("id")), eq(managedEvents.tenantId, tenantId)));
  return c.json({ success: true });
});

// Sessions
eventsRoutes.post("/:id/sessions", async (c) => {
  const body = await c.req.json();
  const [session] = await db.insert(eventSessions).values({
    eventId: c.req.param("id"), title: body.title, description: body.description || null,
    speakerName: body.speakerName || null, speakerBio: body.speakerBio || null,
    startAt: new Date(body.startAt), endAt: new Date(body.endAt), room: body.room || null,
  }).returning();
  return c.json({ success: true, data: session }, 201);
});

// Registrations
eventsRoutes.post("/:id/register", async (c) => {
  const body = await c.req.json();
  const [reg] = await db.insert(eventRegistrations).values({
    eventId: c.req.param("id"), attendeeName: body.attendeeName, attendeeEmail: body.attendeeEmail,
    attendeePhone: body.attendeePhone || null, attendeeCompany: body.attendeeCompany || null,
    ticketType: body.ticketType || "standard", userId: body.userId || null,
  }).returning();
  return c.json({ success: true, data: reg }, 201);
});

eventsRoutes.post("/registrations/:id/checkin", async (c) => {
  await db.update(eventRegistrations).set({ status: "checked_in", checkedInAt: new Date() }).where(eq(eventRegistrations.id, c.req.param("id")));
  return c.json({ success: true });
});
