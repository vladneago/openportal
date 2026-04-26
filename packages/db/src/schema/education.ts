import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ─────────────────────────────────────────────
// COURSES
// ─────────────────────────────────────────────

export const courseStatusEnum = pgEnum("course_status", ["draft", "published", "archived"]);
export const lessonTypeEnum = pgEnum("lesson_type", ["text", "video", "quiz", "assignment", "code"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["active", "completed", "dropped"]);

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  
  status: courseStatusEnum("course_status").notNull().default("draft"),
  isPublic: boolean("is_public").notNull().default(false),
  
  // Settings
  settings: jsonb("settings").$type<{
    requireEnrollment?: boolean;
    maxStudents?: number;
    certificateEnabled?: boolean;
    estimatedHours?: number;
    difficulty?: "beginner" | "intermediate" | "advanced";
    category?: string;
  }>().default({}),

  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("courses_tenant_slug_idx").on(table.tenantId, table.slug),
]);

export type Course = typeof courses.$inferSelect;

// ─────────────────────────────────────────────
// COURSE MODULES (Sections/Chapters)
// ─────────────────────────────────────────────

export const courseModules = pgTable("course_modules", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("course_modules_course_order_idx").on(table.courseId, table.order),
]);

export type CourseModule = typeof courseModules.$inferSelect;

// ─────────────────────────────────────────────
// LESSONS
// ─────────────────────────────────────────────

export const lessons = pgTable("lessons", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduleId: uuid("module_id").notNull().references(() => courseModules.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 500 }).notNull(),
  type: lessonTypeEnum("type").notNull().default("text"),
  content: jsonb("content").$type<any>().default(null), // TipTap JSON for text, URL for video, questions for quiz
  order: integer("order").notNull().default(0),
  
  durationMinutes: integer("duration_minutes").default(0),
  
  // For video lessons
  videoUrl: text("video_url"),
  
  // For quiz lessons
  quizConfig: jsonb("quiz_config").$type<{
    passingScore?: number;
    timeLimit?: number;
    shuffleQuestions?: boolean;
    questions?: Array<{
      id: string;
      question: string;
      type: "multiple_choice" | "true_false" | "short_answer";
      options?: string[];
      correctAnswer: string | number;
      points: number;
    }>;
  }>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("lessons_module_order_idx").on(table.moduleId, table.order),
]);

export type Lesson = typeof lessons.$inferSelect;

// ─────────────────────────────────────────────
// ENROLLMENTS
// ─────────────────────────────────────────────

export const enrollments = pgTable("enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  status: enrollmentStatusEnum("enrollment_status").notNull().default("active"),
  progress: integer("progress").notNull().default(0), // percentage 0-100
  
  completedLessons: jsonb("completed_lessons").$type<string[]>().default([]),
  
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("enrollments_course_user_idx").on(table.courseId, table.userId),
]);

export type Enrollment = typeof enrollments.$inferSelect;
