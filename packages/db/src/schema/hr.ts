import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const jobStatusEnum = pgEnum("job_status", ["draft", "open", "closed"]);
export const applicationStatusEnum = pgEnum("application_status", ["new", "screening", "interview", "offer", "hired", "rejected"]);
export const leaveStatusEnum = pgEnum("leave_status", ["pending", "approved", "rejected"]);
export const leaveTypeEnum = pgEnum("leave_type", ["vacation", "sick", "personal", "maternity", "paternity", "unpaid"]);

// ─── JOB POSTINGS (ATS) ───

export const jobPostings = pgTable("job_postings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  department: varchar("department", { length: 200 }),
  location: varchar("location", { length: 300 }),
  type: varchar("type", { length: 50 }).default("full-time"), // full-time, part-time, contract, remote
  description: text("description"),
  requirements: text("requirements"),
  salaryRange: varchar("salary_range", { length: 100 }),
  status: jobStatusEnum("job_status").notNull().default("draft"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type JobPosting = typeof jobPostings.$inferSelect;

// ─── APPLICATIONS ───

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").notNull().references(() => jobPostings.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  candidateName: varchar("candidate_name", { length: 300 }).notNull(),
  candidateEmail: varchar("candidate_email", { length: 255 }).notNull(),
  candidatePhone: varchar("candidate_phone", { length: 50 }),
  resumeUrl: text("resume_url"),
  coverLetter: text("cover_letter"),
  status: applicationStatusEnum("application_status").notNull().default("new"),
  notes: text("notes"),
  rating: integer("rating"), // 1-5
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("applications_job_status_idx").on(table.jobId, table.status),
]);

export type Application = typeof applications.$inferSelect;

// ─── LEAVE REQUESTS ───

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: leaveTypeEnum("type").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("leave_status").notNull().default("pending"),
  approvedBy: uuid("approved_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("leave_requests_user_idx").on(table.userId),
]);

export type LeaveRequest = typeof leaveRequests.$inferSelect;
