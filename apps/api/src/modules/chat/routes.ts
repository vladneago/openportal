import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, chatChannels, channelMembers, chatMessages, users } from "@openportal/db";
import { eq, and, desc, asc, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const chatRoutes = new Hono();
chatRoutes.use("*", requireAuth);

// ─── CHANNELS ───

chatRoutes.get("/channels", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(chatChannels).where(eq(chatChannels.tenantId, tenantId)).orderBy(asc(chatChannels.name));
  const withCounts = await Promise.all(results.map(async (ch) => {
    const [mc] = await db.select({ count: count() }).from(chatMessages).where(eq(chatMessages.channelId, ch.id));
    const [memCount] = await db.select({ count: count() }).from(channelMembers).where(eq(channelMembers.channelId, ch.id));
    return { ...ch, messageCount: mc?.count || 0, memberCount: memCount?.count || 0 };
  }));
  return c.json({ success: true, data: withCounts });
});

const createChannelSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  type: z.enum(["public", "private", "direct"]).default("public"),
  icon: z.string().max(10).optional(),
});

chatRoutes.post("/channels", zValidator("json", createChannelSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const slug = body.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");

  const result = await db.transaction(async (tx) => {
    const [channel] = await tx.insert(chatChannels).values({
      tenantId, name: body.name, slug, description: body.description || null,
      type: body.type, icon: body.icon || "#", createdBy: user.id,
    }).returning();

    await tx.insert(channelMembers).values({ channelId: channel!.id, userId: user.id });
    return channel!;
  });

  return c.json({ success: true, data: result }, 201);
});

chatRoutes.delete("/channels/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  await db.delete(chatChannels).where(and(eq(chatChannels.id, id), eq(chatChannels.tenantId, tenantId)));
  return c.json({ success: true, data: { message: "Channel deleted" } });
});

// ─── MESSAGES ───

chatRoutes.get("/channels/:channelId/messages", async (c) => {
  const channelId = c.req.param("channelId");
  const limit = parseInt(c.req.query("limit") || "50");

  const results = await db.select({
    id: chatMessages.id, body: chatMessages.body, parentId: chatMessages.parentId,
    attachments: chatMessages.attachments, reactions: chatMessages.reactions,
    isEdited: chatMessages.isEdited, createdAt: chatMessages.createdAt,
    createdBy: chatMessages.createdBy,
    authorName: users.displayName, authorFirstName: users.firstName, authorLastName: users.lastName,
  }).from(chatMessages)
    .innerJoin(users, eq(chatMessages.createdBy, users.id))
    .where(eq(chatMessages.channelId, channelId))
    .orderBy(asc(chatMessages.createdAt))
    .limit(limit);

  return c.json({ success: true, data: results });
});

const sendMessageSchema = z.object({
  body: z.string().min(1).max(10000),
  parentId: z.string().uuid().optional(),
});

chatRoutes.post("/channels/:channelId/messages", zValidator("json", sendMessageSchema), async (c) => {
  const user = c.get("user");
  const channelId = c.req.param("channelId");
  const body = c.req.valid("json");

  const [msg] = await db.insert(chatMessages).values({
    channelId, body: body.body, parentId: body.parentId || null, createdBy: user.id,
  }).returning();

  return c.json({ success: true, data: msg }, 201);
});

chatRoutes.delete("/messages/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  await db.delete(chatMessages).where(and(eq(chatMessages.id, id), eq(chatMessages.createdBy, user.id)));
  return c.json({ success: true, data: { message: "Message deleted" } });
});

// ─── REACTIONS ───

chatRoutes.post("/messages/:id/react", async (c) => {
  const user = c.get("user");
  const msgId = c.req.param("id");
  const { emoji } = await c.req.json();

  const [msg] = await db.select().from(chatMessages).where(eq(chatMessages.id, msgId)).limit(1);
  if (!msg) throw new AppError(404, "NOT_FOUND", "Message not found");

  const reactions = (msg.reactions || {}) as Record<string, string[]>;
  if (!reactions[emoji]) reactions[emoji] = [];

  const idx = reactions[emoji].indexOf(user.id);
  if (idx > -1) reactions[emoji].splice(idx, 1);
  else reactions[emoji].push(user.id);

  if (reactions[emoji].length === 0) delete reactions[emoji];

  await db.update(chatMessages).set({ reactions }).where(eq(chatMessages.id, msgId));
  return c.json({ success: true });
});
