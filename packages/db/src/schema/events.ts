import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const eventStatusEnum = pgEnum("event_mgmt_status", ["draft", "published", "live", "completed", "cancelled"]);
export const registrationStatusEnum = pgEnum("registration_status", ["registered", "confirmed", "checked_in", "cancelled"]);

export const managedEvents = pgTable("managed_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  description: text("description"),
  status: eventStatusEnum("event_mgmt_status").notNull().default("draft"),
  eventType: varchar("event_type", { length: 100 }).default("conference"), // conference, workshop, webinar, meetup, training
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  location: varchar("location", { length: 500 }),
  isVirtual: boolean("is_virtual").notNull().default(false),
  meetingUrl: text("meeting_url"),
  maxAttendees: integer("max_attendees"),
  coverImage: text("cover_image"),
  ticketPrice: integer("ticket_price").default(0), // cents, 0 = free
  currency: varchar("currency", { length: 3 }).default("RON"),
  settings: jsonb("settings").$type<{
    requireApproval?: boolean;
    showAttendeeList?: boolean;
    enableNetworking?: boolean;
    certificateEnabled?: boolean;
  }>().default({}),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ManagedEvent = typeof managedEvents.$inferSelect;

export const eventSessions = pgTable("event_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => managedEvents.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  speakerName: varchar("speaker_name", { length: 300 }),
  speakerBio: text("speaker_bio"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  room: varchar("room", { length: 200 }),
  order: integer("order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const eventRegistrations = pgTable("event_registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => managedEvents.id, { onDelete: "cascade" }),
  attendeeName: varchar("attendee_name", { length: 300 }).notNull(),
  attendeeEmail: varchar("attendee_email", { length: 255 }).notNull(),
  attendeePhone: varchar("attendee_phone", { length: 50 }),
  attendeeCompany: varchar("attendee_company", { length: 300 }),
  ticketType: varchar("ticket_type", { length: 100 }).default("standard"),
  status: registrationStatusEnum("registration_status").notNull().default("registered"),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  userId: uuid("user_id").references(() => users.id),
  registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("event_registrations_event_idx").on(table.eventId),
]);
