import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ─────────────────────────────────────────────
// CALENDAR EVENTS
// ─────────────────────────────────────────────

export const eventTypeEnum = pgEnum("event_type", ["meeting", "task", "reminder", "event", "out_of_office"]);
export const attendeeStatusEnum = pgEnum("attendee_status", ["pending", "accepted", "declined", "tentative"]);

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 500 }),

  type: eventTypeEnum("type").notNull().default("event"),
  color: varchar("color", { length: 7 }).default("#6366F1"),

  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  allDay: boolean("all_day").notNull().default(false),

  // Recurring
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceRule: jsonb("recurrence_rule").$type<{
    frequency?: "daily" | "weekly" | "monthly" | "yearly";
    interval?: number;
    daysOfWeek?: number[];
    endDate?: string;
    count?: number;
  }>(),

  // Video meeting link
  meetingUrl: text("meeting_url"),

  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("calendar_events_tenant_start_idx").on(table.tenantId, table.startAt),
]);

export type CalendarEvent = typeof calendarEvents.$inferSelect;

// ─────────────────────────────────────────────
// ATTENDEES
// ─────────────────────────────────────────────

export const eventAttendees = pgTable("event_attendees", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => calendarEvents.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: attendeeStatusEnum("status").notNull().default("pending"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
}, (table) => [
  index("event_attendees_event_idx").on(table.eventId),
  index("event_attendees_user_idx").on(table.userId),
]);

export type EventAttendee = typeof eventAttendees.$inferSelect;
