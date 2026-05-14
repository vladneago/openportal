import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { sites } from "./sites";
import { bookingCustomers } from "./booking";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const chatWidgetChannelEnum = pgEnum("chat_widget_channel", [
  "website",
  "whatsapp",
  "facebook",
  "instagram",
  "telegram",
  "sms",
  "email",
  "api",
]);

export const chatConversationStatusEnum = pgEnum("chat_conversation_status", [
  "open",
  "ai_handling",
  "human_handling",
  "queued",
  "resolved",
  "abandoned",
  "spam",
]);

export const chatMessageRoleEnum = pgEnum("chat_message_role", [
  "user",
  "assistant",
  "system",
  "agent",
  "tool",
]);

export const chatKnowledgeSourceTypeEnum = pgEnum("chat_knowledge_source_type", [
  "manual",
  "url",
  "pdf",
  "docx",
  "markdown",
  "csv",
  "faq",
  "service_catalog",
  "product_catalog",
]);

export const chatKnowledgeStatusEnum = pgEnum("chat_knowledge_status", [
  "pending",
  "indexing",
  "ready",
  "failed",
  "stale",
]);

// ─────────────────────────────────────────────
// WIDGETS (configuration per tenant/site)
// ─────────────────────────────────────────────

export const chatWidgets = pgTable("chat_widgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),

  // Public key used in <script src="...?id=publicKey">
  publicKey: varchar("public_key", { length: 64 }).notNull(),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),

  // Visual config
  primaryColor: varchar("primary_color", { length: 7 }).default("#6366F1"),
  textColor: varchar("text_color", { length: 7 }).default("#FFFFFF"),
  position: varchar("position", { length: 32 }).default("bottom-right"),
  bubbleIconUrl: text("bubble_icon_url"),
  headerImageUrl: text("header_image_url"),

  // Behaviour
  greetingMessage: text("greeting_message").default("Bună! Cu ce te pot ajuta?"),
  awayMessage: text("away_message").default("Suntem offline. Lasă-ne un mesaj și revenim cât putem de repede."),
  offlineCollectEmail: boolean("offline_collect_email").notNull().default(true),
  showAvatar: boolean("show_avatar").notNull().default(true),
  agentName: varchar("agent_name", { length: 100 }).default("Asistent"),
  agentAvatarUrl: text("agent_avatar_url"),

  // AI configuration
  aiEnabled: boolean("ai_enabled").notNull().default(true),
  aiModel: varchar("ai_model", { length: 100 }).default("claude-haiku-4-5-20251001"),
  aiSystemPrompt: text("ai_system_prompt"),
  aiTemperature: numeric("ai_temperature", { precision: 3, scale: 2 }).default("0.70"),
  aiMaxTokens: integer("ai_max_tokens").default(1024),
  aiIndustry: varchar("ai_industry", { length: 64 }),
  aiLanguages: jsonb("ai_languages").$type<string[]>().default(["ro", "en"]),

  // Tools / function calling
  toolBooking: boolean("tool_booking").notNull().default(true),
  toolPriceList: boolean("tool_price_list").notNull().default(true),
  toolEscalate: boolean("tool_escalate").notNull().default(true),
  toolKnowledgeBase: boolean("tool_knowledge_base").notNull().default(true),

  // Working hours
  workingHours: jsonb("working_hours").$type<Array<{
    dayOfWeek: number;
    start: string;
    end: string;
  }>>().default([]),
  timezone: varchar("timezone", { length: 64 }).default("Europe/Bucharest"),

  // Embed restrictions
  allowedDomains: jsonb("allowed_domains").$type<string[]>().default([]),

  // Channels
  enabledChannels: jsonb("enabled_channels").$type<string[]>().default(["website"]),

  // Stats
  conversationCount: integer("conversation_count").notNull().default(0),
  messageCount: integer("message_count").notNull().default(0),

  isActive: boolean("is_active").notNull().default(true),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("chat_widgets_public_key_idx").on(table.publicKey),
  index("chat_widgets_tenant_idx").on(table.tenantId),
  index("chat_widgets_site_idx").on(table.siteId),
]);

export type ChatWidget = typeof chatWidgets.$inferSelect;
export type NewChatWidget = typeof chatWidgets.$inferInsert;

// ─────────────────────────────────────────────
// CONVERSATIONS
// ─────────────────────────────────────────────

export const chatWidgetConversations = pgTable("chat_widget_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  widgetId: uuid("widget_id").notNull().references(() => chatWidgets.id, { onDelete: "cascade" }),

  // Visitor identification
  sessionId: varchar("session_id", { length: 128 }).notNull(),
  visitorEmail: varchar("visitor_email", { length: 320 }),
  visitorName: varchar("visitor_name", { length: 200 }),
  visitorPhone: varchar("visitor_phone", { length: 32 }),

  // If we resolve the visitor to a known customer
  customerId: uuid("customer_id").references(() => bookingCustomers.id, { onDelete: "set null" }),

  channel: chatWidgetChannelEnum("channel").notNull().default("website"),
  status: chatConversationStatusEnum("status").notNull().default("open"),

  // Context
  pageUrl: text("page_url"),
  pageTitle: varchar("page_title", { length: 500 }),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 64 }),
  country: varchar("country", { length: 2 }),

  // Assignment
  assignedAgentId: uuid("assigned_agent_id").references(() => users.id),
  assignedAt: timestamp("assigned_at", { withTimezone: true }),

  // Tagging
  tags: jsonb("tags").$type<string[]>().default([]),
  customerSentiment: varchar("customer_sentiment", { length: 32 }),

  // Metrics
  messageCount: integer("message_count").notNull().default(0),
  totalTokensUsed: integer("total_tokens_used").notNull().default(0),
  estimatedCostCents: integer("estimated_cost_cents").notNull().default(0),

  firstMessageAt: timestamp("first_message_at", { withTimezone: true }),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),

  // Resolution
  resolutionType: varchar("resolution_type", { length: 64 }),
  customerRating: integer("customer_rating"),
  customerFeedback: text("customer_feedback"),

  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("chat_conversations_session_idx").on(table.widgetId, table.sessionId),
  index("chat_conversations_tenant_status_idx").on(table.tenantId, table.status, table.updatedAt),
  index("chat_conversations_widget_idx").on(table.widgetId, table.updatedAt),
  index("chat_conversations_agent_idx").on(table.assignedAgentId),
  index("chat_conversations_customer_idx").on(table.customerId),
]);

export type ChatWidgetConversation = typeof chatWidgetConversations.$inferSelect;
export type NewChatWidgetConversation = typeof chatWidgetConversations.$inferInsert;

// ─────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────

export const chatWidgetMessages = pgTable("chat_widget_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").notNull().references(() => chatWidgetConversations.id, { onDelete: "cascade" }),

  role: chatMessageRoleEnum("role").notNull(),
  content: text("content").notNull(),

  // For tool calls / function calls
  toolName: varchar("tool_name", { length: 100 }),
  toolInput: jsonb("tool_input").$type<Record<string, unknown>>(),
  toolOutput: jsonb("tool_output").$type<Record<string, unknown>>(),

  // Author when role is "agent"
  agentUserId: uuid("agent_user_id").references(() => users.id),

  // AI metadata
  modelUsed: varchar("model_used", { length: 100 }),
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  latencyMs: integer("latency_ms"),

  // Attachments
  attachments: jsonb("attachments").$type<Array<{
    url: string;
    filename: string;
    mimeType: string;
    size: number;
  }>>().default([]),

  // Citations from knowledge base
  citations: jsonb("citations").$type<Array<{
    sourceId: string;
    title: string;
    snippet: string;
  }>>().default([]),

  // Delivery tracking
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  readAt: timestamp("read_at", { withTimezone: true }),

  // Moderation
  isFlagged: boolean("is_flagged").notNull().default(false),
  flaggedReason: varchar("flagged_reason", { length: 200 }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("chat_messages_conversation_idx").on(table.conversationId, table.createdAt),
  index("chat_messages_tenant_time_idx").on(table.tenantId, table.createdAt),
]);

export type ChatWidgetMessage = typeof chatWidgetMessages.$inferSelect;
export type NewChatWidgetMessage = typeof chatWidgetMessages.$inferInsert;

// ─────────────────────────────────────────────
// KNOWLEDGE BASE (sources used for AI context / RAG)
// ─────────────────────────────────────────────

export const chatKnowledgeSources = pgTable("chat_knowledge_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  widgetId: uuid("widget_id").references(() => chatWidgets.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 300 }).notNull(),
  sourceType: chatKnowledgeSourceTypeEnum("source_type").notNull().default("manual"),

  // Content (for manual / faq / md)
  content: text("content"),

  // External source
  sourceUrl: text("source_url"),
  fileUrl: text("file_url"),
  fileSize: integer("file_size"),

  // Chunking + embeddings
  status: chatKnowledgeStatusEnum("status").notNull().default("pending"),
  chunkCount: integer("chunk_count").notNull().default(0),
  // Embeddings can be stored externally (pgvector future); for now keep a hash
  contentHash: varchar("content_hash", { length: 64 }),

  // Refresh
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  syncFrequency: varchar("sync_frequency", { length: 32 }),

  errorMessage: text("error_message"),

  tags: jsonb("tags").$type<string[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("chat_knowledge_tenant_status_idx").on(table.tenantId, table.status),
  index("chat_knowledge_widget_idx").on(table.widgetId),
]);

export type ChatKnowledgeSource = typeof chatKnowledgeSources.$inferSelect;
export type NewChatKnowledgeSource = typeof chatKnowledgeSources.$inferInsert;
