import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ─────────────────────────────────────────────
// CHAT CHANNELS
// ─────────────────────────────────────────────

export const channelTypeEnum = pgEnum("channel_type", ["public", "private", "direct"]);

export const chatChannels = pgTable("chat_channels", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }),
  description: text("description"),
  type: channelTypeEnum("type").notNull().default("public"),
  icon: varchar("icon", { length: 10 }).default("#"),

  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ChatChannel = typeof chatChannels.$inferSelect;

// ─────────────────────────────────────────────
// CHANNEL MEMBERS
// ─────────────────────────────────────────────

export const channelMembers = pgTable("channel_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  channelId: uuid("channel_id").notNull().references(() => chatChannels.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastReadAt: timestamp("last_read_at", { withTimezone: true }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("channel_members_channel_user_idx").on(table.channelId, table.userId),
]);

// ─────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  channelId: uuid("channel_id").notNull().references(() => chatChannels.id, { onDelete: "cascade" }),
  
  body: text("body").notNull(),
  
  // Thread support
  parentId: uuid("parent_id").references((): any => chatMessages.id, { onDelete: "cascade" }),
  
  // Attachments
  attachments: jsonb("attachments").$type<Array<{ name: string; url: string; type: string; size: number }>>().default([]),
  
  // Reactions
  reactions: jsonb("reactions").$type<Record<string, string[]>>().default({}), // { "👍": ["user-id-1", "user-id-2"] }
  
  isEdited: boolean("is_edited").notNull().default(false),
  
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("chat_messages_channel_created_idx").on(table.channelId, table.createdAt),
  index("chat_messages_parent_idx").on(table.parentId),
]);

export type ChatMessage = typeof chatMessages.$inferSelect;
