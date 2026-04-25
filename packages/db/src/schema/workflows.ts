import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ─────────────────────────────────────────────
// WORKFLOWS
// ─────────────────────────────────────────────

export const workflowStatusEnum = pgEnum("workflow_status", ["draft", "active", "paused", "archived"]);

export const workflows = pgTable("workflows", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: workflowStatusEnum("workflow_status").notNull().default("draft"),

  // Trigger config
  trigger: jsonb("trigger").$type<{
    type: "manual" | "on_create" | "on_update" | "on_delete" | "scheduled" | "form_submit" | "document_upload";
    resourceType?: string; // "document", "table_row", "page", "form"
    resourceId?: string;
    schedule?: string; // cron expression for scheduled
  }>().notNull().default({ type: "manual" }),

  // Steps as ordered array of actions
  steps: jsonb("steps").$type<Array<{
    id: string;
    type: "send_email" | "send_notification" | "create_item" | "update_item" | "approval" | "delay" | "condition" | "webhook";
    label: string;
    config: Record<string, unknown>;
  }>>().notNull().default([]),

  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Workflow = typeof workflows.$inferSelect;

// ─────────────────────────────────────────────
// WORKFLOW INSTANCES — Running/completed executions
// ─────────────────────────────────────────────

export const instanceStatusEnum = pgEnum("instance_status", ["running", "completed", "failed", "cancelled", "waiting_approval"]);

export const workflowInstances = pgTable("workflow_instances", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  status: instanceStatusEnum("instance_status").notNull().default("running"),
  currentStepIndex: integer("current_step_index").notNull().default(0),

  // Context data passed between steps
  context: jsonb("context").$type<Record<string, unknown>>().default({}),

  // Execution log
  log: jsonb("log").$type<Array<{
    stepId: string;
    status: "completed" | "failed" | "skipped";
    result?: unknown;
    error?: string;
    timestamp: string;
  }>>().default([]),

  triggeredBy: uuid("triggered_by").references(() => users.id),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  index("workflow_instances_workflow_idx").on(table.workflowId),
  index("workflow_instances_status_idx").on(table.tenantId, table.status),
]);

export type WorkflowInstance = typeof workflowInstances.$inferSelect;
