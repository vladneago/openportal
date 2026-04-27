import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const projectStatusEnum = pgEnum("project_status", ["planning", "active", "on_hold", "completed", "cancelled"]);
export const taskStatusEnum = pgEnum("task_status", ["backlog", "todo", "in_progress", "in_review", "done"]);
export const taskPriorityEnum = pgEnum("task_priority", ["urgent", "high", "medium", "low"]);

// ─── PROJECTS ───

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  description: text("description"),
  status: projectStatusEnum("project_status").notNull().default("planning"),
  color: varchar("color", { length: 7 }).default("#6366F1"),

  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),

  settings: jsonb("settings").$type<{
    budget?: number;
    currency?: string;
    clientName?: string;
  }>().default({}),

  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;

// ─── TASKS ───

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: taskStatusEnum("task_status").notNull().default("todo"),
  priority: taskPriorityEnum("task_priority").notNull().default("medium"),
  
  assigneeId: uuid("assignee_id").references(() => users.id),
  dueDate: timestamp("due_date", { withTimezone: true }),
  order: integer("order").notNull().default(0),

  // Time tracking
  estimatedHours: integer("estimated_hours"),
  loggedMinutes: integer("logged_minutes").notNull().default(0),

  tags: jsonb("tags").$type<string[]>().default([]),

  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("tasks_project_status_idx").on(table.projectId, table.status),
  index("tasks_assignee_idx").on(table.assigneeId),
]);

export type Task = typeof tasks.$inferSelect;

// ─── MILESTONES ───

export const milestones = pgTable("milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Milestone = typeof milestones.$inferSelect;
