import { Hono } from "hono";
import { db, notifications } from "@openportal/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

export const notificationRoutes = new Hono();
notificationRoutes.use("*", requireAuth);

// GET /notifications — List user's notifications
notificationRoutes.get("/", async (c) => {
  const user = c.get("user");
  const limit = parseInt(c.req.query("limit") || "20");
  const results = await db.select().from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  return c.json({ success: true, data: results });
});

// GET /notifications/unread-count
notificationRoutes.get("/unread-count", async (c) => {
  const user = c.get("user");
  const [result] = await db.select({ count: count() }).from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
  return c.json({ success: true, data: { count: result?.count || 0 } });
});

// POST /notifications/:id/read — Mark as read
notificationRoutes.post("/:id/read", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  await db.update(notifications).set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
  return c.json({ success: true });
});

// POST /notifications/read-all — Mark all as read
notificationRoutes.post("/read-all", async (c) => {
  const user = c.get("user");
  await db.update(notifications).set({ read: true })
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
  return c.json({ success: true });
});
