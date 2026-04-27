import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "paid", "overdue", "cancelled"]);
export const expenseStatusEnum = pgEnum("expense_status", ["pending", "approved", "rejected", "reimbursed"]);

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  number: varchar("number", { length: 50 }).notNull(), // INV-2025-001
  clientName: varchar("client_name", { length: 500 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }),
  status: invoiceStatusEnum("invoice_status").notNull().default("draft"),
  issueDate: timestamp("issue_date", { withTimezone: true }).notNull().defaultNow(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  items: jsonb("items").$type<Array<{ description: string; quantity: number; unitPrice: number; total: number }>>().default([]),
  subtotal: integer("subtotal").notNull().default(0), // cents
  tax: integer("tax").notNull().default(0),
  total: integer("total").notNull().default(0),
  currency: varchar("currency", { length: 3 }).default("RON"),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
}, (table) => [
  index("invoices_tenant_status_idx").on(table.tenantId, table.status),
]);

export type Invoice = typeof invoices.$inferSelect;

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  amount: integer("amount").notNull(), // cents
  currency: varchar("currency", { length: 3 }).default("RON"),
  category: varchar("category", { length: 200 }), // travel, office, software, marketing
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  description: text("description"),
  receiptUrl: text("receipt_url"),
  status: expenseStatusEnum("expense_status").notNull().default("pending"),
  submittedBy: uuid("submitted_by").notNull().references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Expense = typeof expenses.$inferSelect;
