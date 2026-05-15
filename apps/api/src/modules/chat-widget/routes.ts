import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  db,
  chatWidgets,
  chatWidgetConversations,
  chatWidgetMessages,
  chatKnowledgeSources,
} from "@openportal/db";
import { and, eq, sql, desc, asc, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";
import { randomBytes, createHash } from "crypto";

export const chatWidgetRoutes = new Hono();

// Public routes (no auth) for the embedded widget
const publicRoutes = new Hono();
const authedRoutes = new Hono();
authedRoutes.use("*", requireAuth);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function generatePublicKey(): string {
  return "cw_" + randomBytes(24).toString("hex");
}

function generateSessionId(): string {
  return "s_" + randomBytes(16).toString("hex");
}

function hashContent(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 32);
}

// ─────────────────────────────────────────────
// ADMIN: WIDGETS
// ─────────────────────────────────────────────

const widgetCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  siteId: z.string().uuid().optional(),
  primaryColor: z.string().max(7).optional(),
  textColor: z.string().max(7).optional(),
  position: z.string().max(32).optional(),
  bubbleIconUrl: z.string().url().optional(),
  headerImageUrl: z.string().url().optional(),
  greetingMessage: z.string().max(1000).optional(),
  awayMessage: z.string().max(1000).optional(),
  offlineCollectEmail: z.boolean().default(true),
  showAvatar: z.boolean().default(true),
  agentName: z.string().max(100).optional(),
  agentAvatarUrl: z.string().url().optional(),
  aiEnabled: z.boolean().default(true),
  aiModel: z.string().max(100).optional(),
  aiSystemPrompt: z.string().max(20000).optional(),
  aiTemperature: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  aiMaxTokens: z.number().int().positive().optional(),
  aiIndustry: z.string().max(64).optional(),
  aiLanguages: z.array(z.string()).default(["ro", "en"]),
  toolBooking: z.boolean().default(true),
  toolPriceList: z.boolean().default(true),
  toolEscalate: z.boolean().default(true),
  toolKnowledgeBase: z.boolean().default(true),
  workingHours: z
    .array(z.object({ dayOfWeek: z.number(), start: z.string(), end: z.string() }))
    .default([]),
  timezone: z.string().max(64).optional(),
  allowedDomains: z.array(z.string()).default([]),
  enabledChannels: z.array(z.string()).default(["website"]),
  isActive: z.boolean().default(true),
});

authedRoutes.get("/widgets", async (c) => {
  const tenantId = c.get("tenantId");
  const rows = await db
    .select()
    .from(chatWidgets)
    .where(eq(chatWidgets.tenantId, tenantId))
    .orderBy(desc(chatWidgets.updatedAt));
  return c.json({ success: true, data: rows });
});

authedRoutes.get("/widgets/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const [row] = await db
    .select()
    .from(chatWidgets)
    .where(and(eq(chatWidgets.tenantId, tenantId), eq(chatWidgets.id, id)))
    .limit(1);
  if (!row) throw new AppError(404, "NOT_FOUND", "Widget not found");
  return c.json({ success: true, data: row });
});

authedRoutes.post("/widgets", zValidator("json", widgetCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const [row] = await db
    .insert(chatWidgets)
    .values({
      tenantId,
      publicKey: generatePublicKey(),
      name: body.name,
      description: body.description ?? null,
      siteId: body.siteId ?? null,
      primaryColor: body.primaryColor ?? "#6366F1",
      textColor: body.textColor ?? "#FFFFFF",
      position: body.position ?? "bottom-right",
      bubbleIconUrl: body.bubbleIconUrl ?? null,
      headerImageUrl: body.headerImageUrl ?? null,
      greetingMessage: body.greetingMessage ?? "Bună! Cu ce te pot ajuta?",
      awayMessage: body.awayMessage ?? "Suntem offline. Lasă-ne un mesaj și revenim cât putem de repede.",
      offlineCollectEmail: body.offlineCollectEmail,
      showAvatar: body.showAvatar,
      agentName: body.agentName ?? "Asistent",
      agentAvatarUrl: body.agentAvatarUrl ?? null,
      aiEnabled: body.aiEnabled,
      aiModel: body.aiModel ?? "claude-haiku-4-5-20251001",
      aiSystemPrompt: body.aiSystemPrompt ?? null,
      aiTemperature: body.aiTemperature ?? "0.70",
      aiMaxTokens: body.aiMaxTokens ?? 1024,
      aiIndustry: body.aiIndustry ?? null,
      aiLanguages: body.aiLanguages,
      toolBooking: body.toolBooking,
      toolPriceList: body.toolPriceList,
      toolEscalate: body.toolEscalate,
      toolKnowledgeBase: body.toolKnowledgeBase,
      workingHours: body.workingHours,
      timezone: body.timezone ?? "Europe/Bucharest",
      allowedDomains: body.allowedDomains,
      enabledChannels: body.enabledChannels,
      isActive: body.isActive,
      createdBy: user.id,
    })
    .returning();

  return c.json({ success: true, data: row }, 201);
});

authedRoutes.patch("/widgets/:id", zValidator("json", widgetCreateSchema.partial()), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [row] = await db
    .update(chatWidgets)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(chatWidgets.tenantId, tenantId), eq(chatWidgets.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Widget not found");
  return c.json({ success: true, data: row });
});

authedRoutes.delete("/widgets/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(chatWidgets)
    .where(and(eq(chatWidgets.tenantId, tenantId), eq(chatWidgets.id, id)))
    .returning({ id: chatWidgets.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Widget not found");
  return c.json({ success: true });
});

// Regenerate public key (rotation for security)
authedRoutes.post("/widgets/:id/regenerate-key", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [row] = await db
    .update(chatWidgets)
    .set({ publicKey: generatePublicKey(), updatedAt: new Date() })
    .where(and(eq(chatWidgets.tenantId, tenantId), eq(chatWidgets.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Widget not found");
  return c.json({ success: true, data: { publicKey: row.publicKey } });
});

// ─────────────────────────────────────────────
// ADMIN: CONVERSATIONS
// ─────────────────────────────────────────────

authedRoutes.get("/conversations", async (c) => {
  const tenantId = c.get("tenantId");
  const widgetId = c.req.query("widgetId");
  const status = c.req.query("status");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);
  const offset = parseInt(c.req.query("offset") || "0");

  const conds = [eq(chatWidgetConversations.tenantId, tenantId)];
  if (widgetId) conds.push(eq(chatWidgetConversations.widgetId, widgetId));
  if (status) {
    conds.push(
      eq(chatWidgetConversations.status, status as "open" | "ai_handling" | "human_handling" | "queued" | "resolved" | "abandoned" | "spam"),
    );
  }

  const rows = await db
    .select()
    .from(chatWidgetConversations)
    .where(and(...conds))
    .orderBy(desc(chatWidgetConversations.updatedAt))
    .limit(limit)
    .offset(offset);

  const totalRow = await db
    .select({ total: count() })
    .from(chatWidgetConversations)
    .where(and(...conds));

  return c.json({
    success: true,
    data: rows,
    meta: { total: Number(totalRow[0]?.total || 0), limit, offset },
  });
});

authedRoutes.get("/conversations/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [conv] = await db
    .select()
    .from(chatWidgetConversations)
    .where(and(eq(chatWidgetConversations.tenantId, tenantId), eq(chatWidgetConversations.id, id)))
    .limit(1);

  if (!conv) throw new AppError(404, "NOT_FOUND", "Conversation not found");

  const messages = await db
    .select()
    .from(chatWidgetMessages)
    .where(eq(chatWidgetMessages.conversationId, id))
    .orderBy(asc(chatWidgetMessages.createdAt));

  return c.json({ success: true, data: { ...conv, messages } });
});

authedRoutes.patch(
  "/conversations/:id",
  zValidator(
    "json",
    z.object({
      status: z
        .enum(["open", "ai_handling", "human_handling", "queued", "resolved", "abandoned", "spam"])
        .optional(),
      assignedAgentId: z.string().uuid().nullable().optional(),
      tags: z.array(z.string()).optional(),
      customerSentiment: z.string().max(32).optional(),
      resolutionType: z.string().max(64).optional(),
    }),
  ),
  async (c) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.assignedAgentId) updates.assignedAt = new Date();
    if (body.status === "resolved") updates.resolvedAt = new Date();

    const [row] = await db
      .update(chatWidgetConversations)
      .set(updates)
      .where(and(eq(chatWidgetConversations.tenantId, tenantId), eq(chatWidgetConversations.id, id)))
      .returning();

    if (!row) throw new AppError(404, "NOT_FOUND", "Conversation not found");
    return c.json({ success: true, data: row });
  },
);

// Admin sends a message as the agent (takes over from AI)
authedRoutes.post(
  "/conversations/:id/messages",
  zValidator(
    "json",
    z.object({
      content: z.string().min(1).max(20000),
      role: z.enum(["agent", "system"]).default("agent"),
    }),
  ),
  async (c) => {
    const tenantId = c.get("tenantId");
    const user = c.get("user");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const [conv] = await db
      .select()
      .from(chatWidgetConversations)
      .where(and(eq(chatWidgetConversations.tenantId, tenantId), eq(chatWidgetConversations.id, id)))
      .limit(1);

    if (!conv) throw new AppError(404, "NOT_FOUND", "Conversation not found");

    const result = await db.transaction(async (tx) => {
      const [msg] = await tx
        .insert(chatWidgetMessages)
        .values({
          tenantId,
          conversationId: id,
          role: body.role,
          content: body.content,
          agentUserId: body.role === "agent" ? user.id : null,
        })
        .returning();

      await tx
        .update(chatWidgetConversations)
        .set({
          status: "human_handling",
          messageCount: sql`${chatWidgetConversations.messageCount} + 1`,
          lastMessageAt: new Date(),
          assignedAgentId: conv.assignedAgentId ?? user.id,
          assignedAt: conv.assignedAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(chatWidgetConversations.id, id));

      return msg;
    });

    return c.json({ success: true, data: result }, 201);
  },
);

// ─────────────────────────────────────────────
// ADMIN: KNOWLEDGE SOURCES
// ─────────────────────────────────────────────

const knowledgeCreateSchema = z.object({
  widgetId: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  sourceType: z.enum(["manual", "url", "pdf", "docx", "markdown", "csv", "faq", "service_catalog", "product_catalog"]).default("manual"),
  content: z.string().max(500000).optional(),
  sourceUrl: z.string().url().optional(),
  fileUrl: z.string().url().optional(),
  fileSize: z.number().int().nonnegative().optional(),
  syncFrequency: z.string().max(32).optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

authedRoutes.get("/knowledge", async (c) => {
  const tenantId = c.get("tenantId");
  const widgetId = c.req.query("widgetId");

  const conds = [eq(chatKnowledgeSources.tenantId, tenantId)];
  if (widgetId) conds.push(eq(chatKnowledgeSources.widgetId, widgetId));

  const rows = await db
    .select()
    .from(chatKnowledgeSources)
    .where(and(...conds))
    .orderBy(desc(chatKnowledgeSources.updatedAt));

  return c.json({ success: true, data: rows });
});

authedRoutes.post("/knowledge", zValidator("json", knowledgeCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const [row] = await db
    .insert(chatKnowledgeSources)
    .values({
      tenantId,
      widgetId: body.widgetId ?? null,
      title: body.title,
      sourceType: body.sourceType,
      content: body.content ?? null,
      sourceUrl: body.sourceUrl ?? null,
      fileUrl: body.fileUrl ?? null,
      fileSize: body.fileSize ?? null,
      status: "pending",
      contentHash: body.content ? hashContent(body.content) : null,
      syncFrequency: body.syncFrequency ?? null,
      tags: body.tags,
      isActive: body.isActive,
      createdBy: user.id,
    })
    .returning();

  return c.json({ success: true, data: row }, 201);
});

authedRoutes.patch("/knowledge/:id", zValidator("json", knowledgeCreateSchema.partial()), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.content !== undefined) {
    updates.contentHash = body.content ? hashContent(body.content) : null;
    updates.status = "pending";
  }

  const [row] = await db
    .update(chatKnowledgeSources)
    .set(updates)
    .where(and(eq(chatKnowledgeSources.tenantId, tenantId), eq(chatKnowledgeSources.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Knowledge source not found");
  return c.json({ success: true, data: row });
});

authedRoutes.delete("/knowledge/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(chatKnowledgeSources)
    .where(and(eq(chatKnowledgeSources.tenantId, tenantId), eq(chatKnowledgeSources.id, id)))
    .returning({ id: chatKnowledgeSources.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Knowledge source not found");
  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// PUBLIC: Widget endpoint (resolves public key, returns config)
// ─────────────────────────────────────────────

publicRoutes.get(
  "/widget",
  zValidator("query", z.object({ key: z.string().min(1) })),
  async (c) => {
    const { key } = c.req.valid("query");

    const [widget] = await db
      .select({
        id: chatWidgets.id,
        publicKey: chatWidgets.publicKey,
        name: chatWidgets.name,
        primaryColor: chatWidgets.primaryColor,
        textColor: chatWidgets.textColor,
        position: chatWidgets.position,
        bubbleIconUrl: chatWidgets.bubbleIconUrl,
        headerImageUrl: chatWidgets.headerImageUrl,
        greetingMessage: chatWidgets.greetingMessage,
        awayMessage: chatWidgets.awayMessage,
        showAvatar: chatWidgets.showAvatar,
        agentName: chatWidgets.agentName,
        agentAvatarUrl: chatWidgets.agentAvatarUrl,
        aiEnabled: chatWidgets.aiEnabled,
        offlineCollectEmail: chatWidgets.offlineCollectEmail,
        workingHours: chatWidgets.workingHours,
        timezone: chatWidgets.timezone,
        isActive: chatWidgets.isActive,
        allowedDomains: chatWidgets.allowedDomains,
      })
      .from(chatWidgets)
      .where(and(eq(chatWidgets.publicKey, key), eq(chatWidgets.isActive, true)))
      .limit(1);

    if (!widget) throw new AppError(404, "WIDGET_NOT_FOUND", "Widget not found or inactive");
    return c.json({ success: true, data: widget });
  },
);

// PUBLIC: start or resume a conversation
publicRoutes.post(
  "/conversations",
  zValidator(
    "json",
    z.object({
      publicKey: z.string(),
      sessionId: z.string().optional(),
      visitorEmail: z.string().email().optional(),
      visitorName: z.string().max(200).optional(),
      visitorPhone: z.string().max(32).optional(),
      pageUrl: z.string().optional(),
      pageTitle: z.string().max(500).optional(),
      referrer: z.string().optional(),
      userAgent: z.string().optional(),
    }),
  ),
  async (c) => {
    const body = c.req.valid("json");

    const [widget] = await db
      .select()
      .from(chatWidgets)
      .where(and(eq(chatWidgets.publicKey, body.publicKey), eq(chatWidgets.isActive, true)))
      .limit(1);

    if (!widget) throw new AppError(404, "WIDGET_NOT_FOUND", "Widget not found or inactive");

    const sessionId = body.sessionId ?? generateSessionId();

    // Try to resume existing conversation in this session
    const [existing] = await db
      .select()
      .from(chatWidgetConversations)
      .where(
        and(
          eq(chatWidgetConversations.widgetId, widget.id),
          eq(chatWidgetConversations.sessionId, sessionId),
        ),
      )
      .limit(1);

    if (existing) {
      return c.json({ success: true, data: existing });
    }

    const [conv] = await db
      .insert(chatWidgetConversations)
      .values({
        tenantId: widget.tenantId,
        widgetId: widget.id,
        sessionId,
        visitorEmail: body.visitorEmail ?? null,
        visitorName: body.visitorName ?? null,
        visitorPhone: body.visitorPhone ?? null,
        channel: "website",
        status: widget.aiEnabled ? "ai_handling" : "open",
        pageUrl: body.pageUrl ?? null,
        pageTitle: body.pageTitle ?? null,
        referrer: body.referrer ?? null,
        userAgent: body.userAgent ?? null,
      })
      .returning();

    await db
      .update(chatWidgets)
      .set({ conversationCount: sql`${chatWidgets.conversationCount} + 1` })
      .where(eq(chatWidgets.id, widget.id));

    // Insert greeting message
    if (widget.greetingMessage) {
      await db.insert(chatWidgetMessages).values({
        tenantId: widget.tenantId,
        conversationId: conv!.id,
        role: "assistant",
        content: widget.greetingMessage,
      });
    }

    return c.json({ success: true, data: conv }, 201);
  },
);

// PUBLIC: visitor sends a message
publicRoutes.post(
  "/conversations/:id/messages",
  zValidator(
    "json",
    z.object({
      publicKey: z.string(),
      sessionId: z.string(),
      content: z.string().min(1).max(20000),
    }),
  ),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const [conv] = await db
      .select()
      .from(chatWidgetConversations)
      .where(
        and(
          eq(chatWidgetConversations.id, id),
          eq(chatWidgetConversations.sessionId, body.sessionId),
        ),
      )
      .limit(1);

    if (!conv) throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");

    const [widget] = await db
      .select()
      .from(chatWidgets)
      .where(and(eq(chatWidgets.id, conv.widgetId), eq(chatWidgets.publicKey, body.publicKey)))
      .limit(1);

    if (!widget) throw new AppError(403, "INVALID_KEY", "Public key does not match");

    const result = await db.transaction(async (tx) => {
      const [msg] = await tx
        .insert(chatWidgetMessages)
        .values({
          tenantId: conv.tenantId,
          conversationId: id,
          role: "user",
          content: body.content,
        })
        .returning();

      await tx
        .update(chatWidgetConversations)
        .set({
          messageCount: sql`${chatWidgetConversations.messageCount} + 1`,
          firstMessageAt: conv.firstMessageAt ?? new Date(),
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(chatWidgetConversations.id, id));

      await tx
        .update(chatWidgets)
        .set({ messageCount: sql`${chatWidgets.messageCount} + 1` })
        .where(eq(chatWidgets.id, widget.id));

      return msg;
    });

    return c.json({ success: true, data: result }, 201);
  },
);

// PUBLIC: poll for new messages (simple long-poll alternative to WebSockets in MVP)
publicRoutes.get(
  "/conversations/:id/messages",
  zValidator(
    "query",
    z.object({
      publicKey: z.string(),
      sessionId: z.string(),
      since: z.string().optional(),
    }),
  ),
  async (c) => {
    const id = c.req.param("id");
    const { publicKey, sessionId, since } = c.req.valid("query");

    const [conv] = await db
      .select()
      .from(chatWidgetConversations)
      .where(and(eq(chatWidgetConversations.id, id), eq(chatWidgetConversations.sessionId, sessionId)))
      .limit(1);

    if (!conv) throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");

    const [widget] = await db
      .select({ id: chatWidgets.id })
      .from(chatWidgets)
      .where(and(eq(chatWidgets.id, conv.widgetId), eq(chatWidgets.publicKey, publicKey)))
      .limit(1);

    if (!widget) throw new AppError(403, "INVALID_KEY", "Public key does not match");

    const conds = [eq(chatWidgetMessages.conversationId, id)];
    if (since) {
      conds.push(sql`${chatWidgetMessages.createdAt} > ${new Date(since)}`);
    }

    const messages = await db
      .select()
      .from(chatWidgetMessages)
      .where(and(...conds))
      .orderBy(asc(chatWidgetMessages.createdAt))
      .limit(100);

    return c.json({ success: true, data: messages });
  },
);

// Mount public + authed routes
chatWidgetRoutes.route("/public", publicRoutes);
chatWidgetRoutes.route("/", authedRoutes);
