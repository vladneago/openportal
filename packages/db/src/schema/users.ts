import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "owner",       // Tenant owner — full control
  "admin",       // Administrator — manage users, settings
  "member",      // Regular member — create/edit content
  "guest",       // Guest — read-only access to shared content
]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
  "suspended",
  "pending",     // Invited but hasn't accepted yet
]);

// ─────────────────────────────────────────────
// USERS — Users belong to a tenant
// ─────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  
  // Authentication
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash"), // null if using SSO/OIDC
  emailVerified: boolean("email_verified").notNull().default(false),
  
  // Profile
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 200 }),
  avatar: text("avatar"),              // URL to avatar image
  jobTitle: varchar("job_title", { length: 200 }),
  department: varchar("department", { length: 200 }),
  phone: varchar("phone", { length: 50 }),
  timezone: varchar("timezone", { length: 50 }).default("Europe/Bucharest"),
  locale: varchar("locale", { length: 10 }).default("ro"),
  
  // Role & Status
  role: userRoleEnum("role").notNull().default("member"),
  status: userStatusEnum("status").notNull().default("active"),
  
  // Security
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  
  // Preferences
  preferences: jsonb("preferences").$type<Record<string, unknown>>().default({}),
  
  // External identity (for SSO/OIDC)
  externalId: varchar("external_id", { length: 255 }),
  externalProvider: varchar("external_provider", { length: 100 }),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Email must be unique within a tenant
  uniqueIndex("users_tenant_email_idx").on(table.tenantId, table.email),
]);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ─────────────────────────────────────────────
// SESSIONS — User sessions for authentication
// ─────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  
  // Session data
  token: text("token").notNull().unique(),
  refreshToken: text("refresh_token").unique(),
  
  // Device info
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  
  // Expiration
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// ─────────────────────────────────────────────
// INVITATIONS — Invite users to a tenant
// ─────────────────────────────────────────────

export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  
  email: varchar("email", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("member"),
  token: text("token").notNull().unique(),
  
  invitedBy: uuid("invited_by").notNull().references(() => users.id),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
