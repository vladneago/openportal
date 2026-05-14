import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  jsonb,
  pgEnum,
  integer,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { employees } from "./hr";

// ═════════════════════════════════════════════════════════════════
// HR — Performance, Learning, Recruitment, Onboarding, Surveys
// ═════════════════════════════════════════════════════════════════

// ═══════════════ 10. PERFORMANCE MANAGEMENT ═══════════════

export const performanceCycles = pgTable("performance_cycles", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 30 }).default("annual"), // annual, biannual, quarterly, project, probation
  year: integer("year").notNull(),

  goalSettingStart: date("goal_setting_start"),
  goalSettingEnd: date("goal_setting_end"),
  midYearStart: date("mid_year_start"),
  midYearEnd: date("mid_year_end"),
  selfReviewStart: date("self_review_start"),
  selfReviewEnd: date("self_review_end"),
  managerReviewStart: date("manager_review_start"),
  managerReviewEnd: date("manager_review_end"),
  calibrationStart: date("calibration_start"),
  calibrationEnd: date("calibration_end"),
  conversationStart: date("conversation_start"),
  conversationEnd: date("conversation_end"),

  ratingScaleId: uuid("rating_scale_id"),
  ratingMethod: varchar("rating_method", { length: 30 }).default("5_point"), // 5_point, 3_point, 9_box, narrative

  reviewTemplateId: uuid("review_template_id"),

  isActive: boolean("is_active").default(true),
  isCompleted: boolean("is_completed").default(false),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const goalCategoryEnum = pgEnum("goal_category", [
  "performance",
  "development",
  "okr_objective",
  "okr_key_result",
  "team",
  "company",
  "stretch",
  "behavioral",
  "competency",
]);

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  performanceCycleId: uuid("performance_cycle_id").references(() => performanceCycles.id, { onDelete: "set null" }),
  parentGoalId: uuid("parent_goal_id").references((): any => goals.id, { onDelete: "set null" }),

  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  category: goalCategoryEnum("category").notNull().default("performance"),

  // SMART
  specific: text("specific"),
  measurable: text("measurable"),
  achievable: text("achievable"),
  relevant: text("relevant"),
  timebound: text("timebound"),

  // Tracking
  metricType: varchar("metric_type", { length: 30 }), // numeric, percent, currency, boolean, milestone
  metricUnit: varchar("metric_unit", { length: 30 }),
  startValue: numeric("start_value", { precision: 14, scale: 4 }),
  targetValue: numeric("target_value", { precision: 14, scale: 4 }),
  currentValue: numeric("current_value", { precision: 14, scale: 4 }),
  progressPercent: integer("progress_percent").default(0),
  weight: numeric("weight", { precision: 5, scale: 2 }).default("1"),

  startDate: date("start_date"),
  dueDate: date("due_date"),
  completedDate: date("completed_date"),

  status: varchar("status", { length: 30 }).default("draft"), // draft, active, on_track, at_risk, off_track, completed, cancelled, deferred
  alignment: varchar("alignment", { length: 30 }), // company, team, individual

  isPublic: boolean("is_public").default(false),
  isStretchGoal: boolean("is_stretch_goal").default(false),

  rating: integer("rating"),
  selfRating: integer("self_rating"),
  managerRating: integer("manager_rating"),
  comments: text("comments"),

  alignedToEmployeeIds: jsonb("aligned_to_employee_ids").$type<string[]>().default([]),
  watcherIds: jsonb("watcher_ids").$type<string[]>().default([]),

  createdBy: uuid("created_by").references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("goals_emp_cycle_idx").on(table.employeeId, table.performanceCycleId),
  index("goals_status_idx").on(table.tenantId, table.status),
]);

export type Goal = typeof goals.$inferSelect;

export const goalUpdates = pgTable("goal_updates", {
  id: uuid("id").defaultRandom().primaryKey(),
  goalId: uuid("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),

  newValue: numeric("new_value", { precision: 14, scale: 4 }),
  newProgressPercent: integer("new_progress_percent"),
  newStatus: varchar("new_status", { length: 30 }),
  comment: text("comment"),
  attachments: jsonb("attachments").$type<string[]>().default([]),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Performance reviews
export const reviewTemplates = pgTable("review_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  reviewType: varchar("review_type", { length: 30 }).default("annual"), // annual, mid_year, probation, project, exit, 360, peer, manager, self

  sections: jsonb("sections").$type<Array<{
    id: string;
    title: string;
    description?: string;
    weight?: number;
    questions: Array<{
      id: string;
      type: "rating" | "text" | "multi_choice" | "single_choice" | "matrix" | "competency_rating" | "goal_assessment";
      text: string;
      isRequired: boolean;
      options?: any[];
      ratingScaleId?: string;
    }>;
  }>>().notNull().default([]),

  applicableTo: jsonb("applicable_to").$type<{ workerTypes?: string[]; departments?: string[] }>().default({}),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  performanceCycleId: uuid("performance_cycle_id").references(() => performanceCycles.id, { onDelete: "set null" }),
  reviewTemplateId: uuid("review_template_id").references(() => reviewTemplates.id, { onDelete: "set null" }),

  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  reviewerId: uuid("reviewer_id").references(() => employees.id, { onDelete: "set null" }),
  reviewType: varchar("review_type", { length: 30 }).notNull(),

  status: varchar("status", { length: 30 }).default("not_started"), // not_started, in_progress, submitted, acknowledged, calibrated, finalized
  responses: jsonb("responses").$type<Record<string, unknown>>().default({}),

  // Ratings
  overallRating: numeric("overall_rating", { precision: 3, scale: 2 }),
  performanceRating: numeric("performance_rating", { precision: 3, scale: 2 }),
  potentialRating: numeric("potential_rating", { precision: 3, scale: 2 }),
  finalRating: numeric("final_rating", { precision: 3, scale: 2 }),
  ratingLabel: varchar("rating_label", { length: 60 }),

  // 9-box position
  nineBoxPerformance: integer("nine_box_performance"),
  nineBoxPotential: integer("nine_box_potential"),

  strengths: text("strengths"),
  developmentAreas: text("development_areas"),
  achievements: text("achievements"),
  managerComments: text("manager_comments"),
  employeeComments: text("employee_comments"),
  hrComments: text("hr_comments"),

  meritIncreaseRecommendation: numeric("merit_increase_rec", { precision: 5, scale: 2 }),
  bonusRecommendation: numeric("bonus_recommendation", { precision: 12, scale: 2 }),
  promotionRecommended: boolean("promotion_recommended").default(false),

  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  calibratedAt: timestamp("calibrated_at", { withTimezone: true }),
  calibratedBy: uuid("calibrated_by").references(() => users.id),
  finalizedAt: timestamp("finalized_at", { withTimezone: true }),

  conversationDate: date("conversation_date"),
  conversationNotes: text("conversation_notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("reviews_emp_cycle_idx").on(table.employeeId, table.performanceCycleId),
  index("reviews_reviewer_idx").on(table.reviewerId),
]);

export type Review = typeof reviews.$inferSelect;

// 360 feedback
export const feedbackRequests = pgTable("feedback_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  subjectEmployeeId: uuid("subject_employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  reviewerEmployeeId: uuid("reviewer_employee_id").references(() => employees.id, { onDelete: "set null" }),
  reviewerEmail: varchar("reviewer_email", { length: 255 }),
  relationship: varchar("relationship", { length: 30 }), // self, manager, peer, direct_report, customer, vendor

  reviewTemplateId: uuid("review_template_id").references(() => reviewTemplates.id, { onDelete: "set null" }),
  cycleName: varchar("cycle_name", { length: 200 }),
  responses: jsonb("responses").$type<Record<string, unknown>>().default({}),
  isAnonymous: boolean("is_anonymous").default(true),

  status: varchar("status", { length: 30 }).default("pending"),
  requestedBy: uuid("requested_by").references(() => users.id),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  dueAt: timestamp("due_at", { withTimezone: true }),

  remindersSent: integer("reminders_sent").default(0),
  declinedReason: text("declined_reason"),
});

// Calibration sessions
export const calibrationSessions = pgTable("calibration_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  performanceCycleId: uuid("performance_cycle_id").references(() => performanceCycles.id, { onDelete: "set null" }),

  name: varchar("name", { length: 200 }).notNull(),
  scope: jsonb("scope").$type<{ departmentIds?: string[]; managerIds?: string[]; legalEntityIds?: string[] }>().default({}),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  facilitatorId: uuid("facilitator_id").references(() => employees.id),
  participantIds: jsonb("participant_ids").$type<string[]>().default([]),

  forcedDistribution: jsonb("forced_distribution").$type<Record<string, number>>(),
  status: varchar("status", { length: 30 }).default("scheduled"),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════ 11. LEARNING & DEVELOPMENT ═══════════════

export const learningCourses = pgTable("learning_courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  code: varchar("code", { length: 30 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 500 }),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  level: varchar("level", { length: 30 }), // beginner, intermediate, advanced
  language: varchar("language", { length: 10 }).default("ro"),
  thumbnailUrl: text("thumbnail_url"),
  trailerVideoUrl: text("trailer_video_url"),

  format: varchar("format", { length: 30 }).default("self_paced"), // self_paced, instructor_led, virtual_classroom, blended, certification
  type: varchar("type", { length: 30 }).default("internal"), // internal, external, vendor

  durationMinutes: integer("duration_minutes"),
  hoursToComplete: numeric("hours_to_complete", { precision: 6, scale: 2 }),
  ceuCredits: numeric("ceu_credits", { precision: 5, scale: 2 }),
  cpdCredits: numeric("cpd_credits", { precision: 5, scale: 2 }),

  // Cost
  costPerSeat: numeric("cost_per_seat", { precision: 10, scale: 2 }),
  costCurrency: varchar("cost_currency", { length: 8 }),
  vendor: varchar("vendor", { length: 200 }),

  // Content
  modules: jsonb("modules").$type<Array<{
    id: string;
    title: string;
    type: "video" | "document" | "quiz" | "assignment" | "scorm" | "xapi" | "live" | "discussion";
    durationMinutes?: number;
    contentUrl?: string;
    isRequired: boolean;
    order: number;
  }>>().notNull().default([]),

  prerequisites: jsonb("prerequisites").$type<string[]>().default([]),
  competencies: jsonb("competencies").$type<string[]>().default([]),
  skills: jsonb("skills").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  targetAudience: jsonb("target_audience").$type<{ departments?: string[]; jobProfiles?: string[]; levels?: string[] }>().default({}),

  // Compliance
  isMandatory: boolean("is_mandatory").default(false),
  isCompliance: boolean("is_compliance").default(false),
  complianceFramework: varchar("compliance_framework", { length: 100 }), // GDPR, ISO27001, SOX, HIPAA
  recurrenceMonths: integer("recurrence_months"),

  // Quality / engagement
  averageRating: numeric("average_rating", { precision: 3, scale: 2 }),
  ratingCount: integer("rating_count").default(0),
  enrollmentCount: integer("enrollment_count").default(0),
  completionRate: numeric("completion_rate", { precision: 5, scale: 2 }),

  // Lifecycle
  status: varchar("status", { length: 30 }).default("draft"), // draft, published, archived, retired
  publishedAt: timestamp("published_at", { withTimezone: true }),

  // SCORM/xAPI
  scormPackageUrl: text("scorm_package_url"),
  xapiActivityId: varchar("xapi_activity_id", { length: 255 }),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("learning_courses_tenant_code_idx").on(table.tenantId, table.code),
]);

export type LearningCourse = typeof learningCourses.$inferSelect;

export const learningPaths = pgTable("learning_paths", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 300 }).notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  category: varchar("category", { length: 100 }),

  courseIds: jsonb("course_ids").$type<Array<{ courseId: string; isRequired: boolean; order: number }>>().notNull().default([]),
  totalDurationMinutes: integer("total_duration_minutes"),

  targetCompetencies: jsonb("target_competencies").$type<string[]>().default([]),
  targetSkills: jsonb("target_skills").$type<string[]>().default([]),
  targetJobProfileIds: jsonb("target_job_profiles").$type<string[]>().default([]),

  isMandatory: boolean("is_mandatory").default(false),
  validityMonths: integer("validity_months"),
  badgeImageUrl: text("badge_image_url"),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const learningEnrollments = pgTable("learning_enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").references(() => learningCourses.id, { onDelete: "cascade" }),
  learningPathId: uuid("learning_path_id").references(() => learningPaths.id, { onDelete: "cascade" }),

  enrollmentType: varchar("enrollment_type", { length: 30 }).default("self"), // self, manager_assigned, mandatory, recommendation
  status: varchar("status", { length: 30 }).default("not_started"), // not_started, in_progress, completed, failed, expired, dropped, waitlisted

  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  dueDate: date("due_date"),

  progressPercent: integer("progress_percent").default(0),
  timeSpentMinutes: integer("time_spent_minutes").default(0),
  score: numeric("score", { precision: 5, scale: 2 }),
  passingScore: numeric("passing_score", { precision: 5, scale: 2 }),
  passed: boolean("passed"),
  attempts: integer("attempts").default(0),

  certificateUrl: text("certificate_url"),
  certificateNumber: varchar("certificate_number", { length: 100 }),

  rating: integer("rating"),
  feedback: text("feedback"),

  // SCORM data
  scormSessionData: jsonb("scorm_session_data").$type<Record<string, unknown>>(),

  assignedBy: uuid("assigned_by").references(() => users.id),
  cost: numeric("cost", { precision: 10, scale: 2 }),
}, (table) => [
  index("enrollments_emp_idx").on(table.employeeId),
  index("enrollments_course_idx").on(table.courseId),
]);

export type LearningEnrollment = typeof learningEnrollments.$inferSelect;

// Certifications (external & internal)
export const certifications = pgTable("certifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 300 }).notNull(),
  issuer: varchar("issuer", { length: 200 }),
  certificationNumber: varchar("certification_number", { length: 100 }),
  certificationUrl: text("certification_url"),
  documentUrl: text("document_url"),

  issuedDate: date("issued_date"),
  expiresDate: date("expires_date"),
  isExpiring: boolean("is_expiring").default(false),

  category: varchar("category", { length: 100 }),
  level: varchar("level", { length: 30 }),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: uuid("verified_by").references(() => users.id),

  cost: numeric("cost", { precision: 10, scale: 2 }),
  reimbursed: boolean("reimbursed").default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("certifications_emp_idx").on(table.employeeId),
]);

// Skills inventory (org-wide)
export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  type: varchar("type", { length: 30 }).default("technical"), // technical, soft, leadership, language, domain
  isActive: boolean("is_active").default(true),
  parentSkillId: uuid("parent_skill_id").references((): any => skills.id),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("skills_tenant_name_idx").on(table.tenantId, table.name),
]);

export const employeeSkills = pgTable("employee_skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),

  level: integer("level").notNull(), // 1-5
  yearsOfExperience: numeric("years_experience", { precision: 4, scale: 1 }),
  isPrimary: boolean("is_primary").default(false),
  endorsements: integer("endorsements").default(0),
  selfAssessed: boolean("self_assessed").default(true),
  managerVerified: boolean("manager_verified").default(false),
  lastUsedDate: date("last_used_date"),

  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("emp_skills_emp_skill_idx").on(table.employeeId, table.skillId),
]);

// ═══════════════ 12. RECRUITMENT / ATS ═══════════════

export const requisitionStatusEnum = pgEnum("requisition_status", [
  "draft",
  "pending_approval",
  "approved",
  "open",
  "on_hold",
  "filled",
  "cancelled",
  "closed",
]);

export const jobRequisitions = pgTable("job_requisitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  requisitionNumber: varchar("requisition_number", { length: 30 }).notNull(),
  positionId: uuid("position_id"),
  jobProfileId: uuid("job_profile_id"),
  legalEntityId: uuid("legal_entity_id"),
  departmentId: uuid("department_id"),
  locationId: uuid("location_id"),
  hiringManagerId: uuid("hiring_manager_id").references(() => employees.id),
  recruiterId: uuid("recruiter_id").references(() => employees.id),
  costCenterId: uuid("cost_center_id"),

  numberOfOpenings: integer("number_of_openings").default(1),
  filledCount: integer("filled_count").default(0),
  isReplacement: boolean("is_replacement").default(false),
  replacingEmployeeId: uuid("replacing_employee_id").references(() => employees.id),
  reason: varchar("reason", { length: 100 }),

  budgetSalaryMin: numeric("budget_salary_min", { precision: 14, scale: 2 }),
  budgetSalaryMax: numeric("budget_salary_max", { precision: 14, scale: 2 }),
  budgetCurrency: varchar("budget_currency", { length: 8 }),

  status: requisitionStatusEnum("status").notNull().default("draft"),
  approvalChain: jsonb("approval_chain").$type<Array<{ approverId: string; status: string; comment?: string }>>().default([]),

  targetStartDate: date("target_start_date"),
  targetCloseDate: date("target_close_date"),
  daysToFill: integer("days_to_fill"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("requisitions_tenant_num_idx").on(table.tenantId, table.requisitionNumber),
]);

export type JobRequisition = typeof jobRequisitions.$inferSelect;

export const jobPostings = pgTable("job_postings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  requisitionId: uuid("requisition_id").references(() => jobRequisitions.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  department: varchar("department", { length: 200 }),
  location: varchar("location", { length: 300 }),
  workArrangement: varchar("work_arrangement", { length: 30 }).default("on_site"), // on_site, hybrid, remote
  type: varchar("type", { length: 50 }).default("full_time"),
  experienceLevel: varchar("experience_level", { length: 30 }),

  externalTitle: varchar("external_title", { length: 500 }),
  description: text("description"),
  responsibilities: text("responsibilities"),
  requirements: text("requirements"),
  niceToHave: text("nice_to_have"),
  whatWeOffer: text("what_we_offer"),
  benefitsHighlights: text("benefits_highlights"),
  aboutCompany: text("about_company"),
  applicationProcess: text("application_process"),

  salaryMin: numeric("salary_min", { precision: 14, scale: 2 }),
  salaryMax: numeric("salary_max", { precision: 14, scale: 2 }),
  salaryCurrency: varchar("salary_currency", { length: 8 }),
  salaryFrequency: varchar("salary_frequency", { length: 20 }),
  showSalary: boolean("show_salary").default(false),

  status: varchar("status", { length: 30 }).default("draft"), // draft, open, paused, closed, filled
  publishedAt: timestamp("published_at", { withTimezone: true }),
  closingDate: date("closing_date"),

  // Distribution
  internalOnly: boolean("internal_only").default(false),
  publishToCareerSite: boolean("publish_to_career_site").default(true),
  publishToLinkedin: boolean("publish_to_linkedin").default(false),
  publishToIndeed: boolean("publish_to_indeed").default(false),
  customJobBoards: jsonb("custom_job_boards").$type<string[]>().default([]),

  // Application form config
  applicationFields: jsonb("application_fields").$type<Array<{ field: string; required: boolean; label?: string }>>().default([]),
  requireResume: boolean("require_resume").default(true),
  requireCoverLetter: boolean("require_cover_letter").default(false),
  screeningQuestions: jsonb("screening_questions").$type<Array<{
    id: string;
    question: string;
    type: string;
    required: boolean;
    options?: string[];
    knockOut?: { answer: string; eliminate: boolean };
  }>>().default([]),

  // Stats
  viewCount: integer("view_count").default(0),
  applicationCount: integer("application_count").default(0),
  shareCount: integer("share_count").default(0),

  // SEO
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),

  // Diversity
  equalOpportunityStatement: text("equal_opportunity_statement"),
  diversityCommitment: text("diversity_commitment"),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("job_postings_tenant_slug_idx").on(table.tenantId, table.slug),
]);

export type JobPosting = typeof jobPostings.$inferSelect;

export const candidates = pgTable("candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  portfolioUrl: text("portfolio_url"),
  websiteUrl: text("website_url"),

  city: varchar("city", { length: 200 }),
  country: varchar("country", { length: 100 }),
  timezone: varchar("timezone", { length: 60 }),
  willRelocate: boolean("will_relocate").default(false),
  workAuthorization: varchar("work_authorization", { length: 100 }),
  visaSponsorshipNeeded: boolean("visa_sponsorship_needed").default(false),

  currentJobTitle: varchar("current_job_title", { length: 200 }),
  currentCompany: varchar("current_company", { length: 200 }),
  yearsOfExperience: integer("years_of_experience"),
  currentSalary: numeric("current_salary", { precision: 14, scale: 2 }),
  expectedSalary: numeric("expected_salary", { precision: 14, scale: 2 }),
  salaryCurrency: varchar("salary_currency", { length: 8 }),
  noticeWeeks: integer("notice_weeks"),

  resumeUrl: text("resume_url"),
  resumeText: text("resume_text"),
  parsedResume: jsonb("parsed_resume").$type<Record<string, unknown>>(),

  skills: jsonb("skills").$type<string[]>().default([]),
  education: jsonb("education").$type<Array<{ school: string; degree: string; field: string; startYear: number; endYear?: number }>>().default([]),
  workHistory: jsonb("work_history").$type<Array<{ company: string; title: string; startDate: string; endDate?: string; description?: string }>>().default([]),
  languages: jsonb("languages").$type<Array<{ language: string; proficiency: string }>>().default([]),

  source: varchar("source", { length: 100 }),
  sourceDetails: jsonb("source_details").$type<Record<string, unknown>>(),
  referrerEmployeeId: uuid("referrer_employee_id").references(() => employees.id),

  // GDPR
  consentToContact: boolean("consent_to_contact").default(false),
  consentToProcess: boolean("consent_to_process").default(false),
  consentExpiresAt: timestamp("consent_expires_at", { withTimezone: true }),

  // Talent pool
  isTalentPool: boolean("is_talent_pool").default(false),
  talentPoolTags: jsonb("talent_pool_tags").$type<string[]>().default([]),

  // Notes
  internalNotes: text("internal_notes"),
  starRating: integer("star_rating"),
  isHidden: boolean("is_hidden").default(false),
  blockedReason: text("blocked_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("candidates_tenant_email_idx").on(table.tenantId, table.email),
  index("candidates_talent_pool_idx").on(table.tenantId, table.isTalentPool),
]);

export type Candidate = typeof candidates.$inferSelect;

export const applicationStatusEnum = pgEnum("application_status", [
  "applied",
  "screening",
  "phone_screen",
  "assessment",
  "interview_round_1",
  "interview_round_2",
  "interview_round_3",
  "interview_round_4",
  "panel",
  "case_study",
  "reference_check",
  "background_check",
  "offer_pending",
  "offer_extended",
  "offer_accepted",
  "offer_declined",
  "offer_withdrawn",
  "hired",
  "rejected",
  "withdrew",
  "ghost",
  "on_hold",
]);

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  jobPostingId: uuid("job_posting_id").notNull().references(() => jobPostings.id, { onDelete: "cascade" }),
  requisitionId: uuid("requisition_id").references(() => jobRequisitions.id, { onDelete: "set null" }),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),

  status: applicationStatusEnum("status").notNull().default("applied"),
  pipelineStageId: uuid("pipeline_stage_id"),

  resumeUrl: text("resume_url"),
  coverLetter: text("cover_letter"),
  responses: jsonb("responses").$type<Record<string, unknown>>().default({}),

  appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow(),
  source: varchar("source", { length: 100 }),
  sourceDetails: jsonb("source_details").$type<Record<string, unknown>>(),
  referrerEmployeeId: uuid("referrer_employee_id").references(() => employees.id),

  matchScore: numeric("match_score", { precision: 5, scale: 2 }),
  knockOutPassed: boolean("knock_out_passed").default(true),

  // Disqualification / withdrawal
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  rejectionReason: varchar("rejection_reason", { length: 100 }),
  rejectionStage: varchar("rejection_stage", { length: 60 }),
  rejectedBy: uuid("rejected_by").references(() => users.id),

  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  withdrawnReason: text("withdrawn_reason"),

  // Hire
  hiredAt: timestamp("hired_at", { withTimezone: true }),
  startDate: date("start_date"),
  hiredEmployeeId: uuid("hired_employee_id").references(() => employees.id),

  // Notes
  notes: text("notes"),
  isFavorite: boolean("is_favorite").default(false),
  starRating: integer("star_rating"),
  tags: jsonb("tags").$type<string[]>().default([]),

  ownerEmployeeId: uuid("owner_employee_id").references(() => employees.id),
  collaboratorIds: jsonb("collaborator_ids").$type<string[]>().default([]),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("applications_job_status_idx").on(table.jobPostingId, table.status),
  index("applications_candidate_idx").on(table.candidateId),
]);

export type Application = typeof applications.$inferSelect;

// Interview rounds
export const interviews = pgTable("interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),

  round: integer("round").notNull().default(1),
  type: varchar("type", { length: 30 }).default("video"), // phone, video, in_person, panel, technical, behavioral, case_study
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes").default(45),

  meetingUrl: text("meeting_url"),
  location: text("location"),
  meetingId: varchar("meeting_id", { length: 100 }),
  passcode: varchar("passcode", { length: 30 }),

  interviewerIds: jsonb("interviewer_ids").$type<string[]>().notNull().default([]),
  primaryInterviewerId: uuid("primary_interviewer_id").references(() => employees.id),

  scorecardTemplateId: uuid("scorecard_template_id"),
  status: varchar("status", { length: 30 }).default("scheduled"), // scheduled, completed, no_show, cancelled, rescheduled

  // Feedback aggregate
  recommendation: varchar("recommendation", { length: 30 }), // strong_hire, hire, no_decision, no_hire, strong_no_hire
  averageScore: numeric("average_score", { precision: 3, scale: 2 }),

  notes: text("notes"),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  recordingUrl: text("recording_url"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("interviews_application_idx").on(table.applicationId),
]);

export const interviewFeedback = pgTable("interview_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  interviewId: uuid("interview_id").notNull().references(() => interviews.id, { onDelete: "cascade" }),
  interviewerId: uuid("interviewer_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  recommendation: varchar("recommendation", { length: 30 }).notNull(),
  overallScore: numeric("overall_score", { precision: 3, scale: 2 }),
  strengths: text("strengths"),
  concerns: text("concerns"),
  notes: text("notes"),

  competencyScores: jsonb("competency_scores").$type<Record<string, number>>().default({}),
  responses: jsonb("responses").$type<Record<string, unknown>>().default({}),

  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("intvw_feedback_unique_idx").on(table.interviewId, table.interviewerId),
]);

export const offers = pgTable("offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),

  offerNumber: varchar("offer_number", { length: 30 }).notNull(),
  jobProfileId: uuid("job_profile_id"),
  positionId: uuid("position_id"),
  legalEntityId: uuid("legal_entity_id"),
  locationId: uuid("location_id"),
  managerId: uuid("manager_id").references(() => employees.id),

  startDate: date("start_date"),
  workerType: varchar("worker_type", { length: 30 }),

  baseSalary: numeric("base_salary", { precision: 14, scale: 2 }).notNull(),
  salaryCurrency: varchar("salary_currency", { length: 8 }),
  salaryFrequency: varchar("salary_frequency", { length: 20 }),
  signingBonus: numeric("signing_bonus", { precision: 14, scale: 2 }),
  relocationBonus: numeric("relocation_bonus", { precision: 14, scale: 2 }),
  variableComp: jsonb("variable_comp").$type<Record<string, unknown>>(),
  equity: jsonb("equity").$type<Record<string, unknown>>(),
  benefitsSummary: text("benefits_summary"),

  status: varchar("status", { length: 30 }).default("draft"), // draft, pending_approval, approved, sent, viewed, accepted, declined, expired, rescinded
  approvalChain: jsonb("approval_chain").$type<Array<{ approverId: string; status: string }>>().default([]),

  letterTemplateId: uuid("letter_template_id"),
  letterUrl: text("letter_url"),
  letterContent: text("letter_content"),

  sentAt: timestamp("sent_at", { withTimezone: true }),
  viewedAt: timestamp("viewed_at", { withTimezone: true }),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  signedDocumentUrl: text("signed_document_url"),

  declinedReason: varchar("declined_reason", { length: 200 }),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════ 13. ONBOARDING / OFFBOARDING ═══════════════

export const onboardingPlans = pgTable("onboarding_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  durationDays: integer("duration_days").default(90),

  applicableTo: jsonb("applicable_to").$type<{ workerTypes?: string[]; departments?: string[]; jobProfileIds?: string[]; locationIds?: string[] }>().default({}),

  tasks: jsonb("tasks").$type<Array<{
    id: string;
    title: string;
    description?: string;
    category: "paperwork" | "it_setup" | "training" | "introduction" | "tour" | "buddy" | "compliance" | "benefits" | "policy" | "other";
    assignedToRole: "new_hire" | "manager" | "hr" | "it" | "buddy" | "facilities";
    dueDays: number; // days from start date
    isRequired: boolean;
    requiresApproval?: boolean;
    documentTemplateId?: string;
    courseId?: string;
    formId?: string;
  }>>().notNull().default([]),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const onboardingTasks = pgTable("onboarding_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  onboardingPlanId: uuid("onboarding_plan_id").references(() => onboardingPlans.id, { onDelete: "set null" }),

  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 30 }),
  assignedToEmployeeId: uuid("assigned_to_employee_id").references(() => employees.id),
  assignedToRole: varchar("assigned_to_role", { length: 30 }),

  dueDate: date("due_date"),
  status: varchar("status", { length: 30 }).default("not_started"), // not_started, in_progress, completed, blocked, skipped
  completedAt: timestamp("completed_at", { withTimezone: true }),
  completedBy: uuid("completed_by").references(() => users.id),

  formResponseId: uuid("form_response_id"),
  documentUploadedUrl: text("document_uploaded_url"),

  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("onboarding_tasks_emp_idx").on(table.employeeId),
]);

export const offboardingPlans = pgTable("offboarding_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  applicableTo: jsonb("applicable_to").$type<{ terminationTypes?: string[]; departments?: string[] }>().default({}),
  tasks: jsonb("tasks").$type<Array<{
    id: string;
    title: string;
    category: "knowledge_transfer" | "exit_interview" | "equipment_return" | "access_revocation" | "final_pay" | "documentation" | "other";
    assignedToRole: string;
    dueDaysBeforeLastDay: number;
    isRequired: boolean;
  }>>().notNull().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const offboardingTasks = pgTable("offboarding_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  offboardingPlanId: uuid("offboarding_plan_id").references(() => offboardingPlans.id, { onDelete: "set null" }),

  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 30 }),
  assignedToEmployeeId: uuid("assigned_to_employee_id").references(() => employees.id),

  dueDate: date("due_date"),
  status: varchar("status", { length: 30 }).default("not_started"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  completedBy: uuid("completed_by").references(() => users.id),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("offboarding_tasks_emp_idx").on(table.employeeId),
]);

export const exitInterviews = pgTable("exit_interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  conductedAt: timestamp("conducted_at", { withTimezone: true }),
  conductedBy: uuid("conducted_by").references(() => employees.id),

  reasonForLeaving: varchar("reason_for_leaving", { length: 100 }),
  reasonDetails: text("reason_details"),
  destinationCompany: varchar("destination_company", { length: 200 }),
  destinationRole: varchar("destination_role", { length: 200 }),

  responses: jsonb("responses").$type<Record<string, unknown>>().default({}),
  overallSatisfaction: integer("overall_satisfaction"), // 1-5
  wouldRecommend: boolean("would_recommend"),
  wouldReturn: boolean("would_return"),
  isAnonymous: boolean("is_anonymous").default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════ 14. SUCCESSION & CAREER PLANNING ═══════════════

export const successionPlans = pgTable("succession_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  positionId: uuid("position_id").references(() => employees.id),
  jobProfileId: uuid("job_profile_id"),
  incumbentEmployeeId: uuid("incumbent_employee_id").references(() => employees.id),
  criticality: varchar("criticality", { length: 20 }).default("medium"), // low, medium, high, critical
  riskOfLoss: varchar("risk_of_loss", { length: 20 }).default("low"),
  impactOfLoss: varchar("impact_of_loss", { length: 20 }).default("medium"),

  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const successors = pgTable("successors", {
  id: uuid("id").defaultRandom().primaryKey(),
  successionPlanId: uuid("succession_plan_id").notNull().references(() => successionPlans.id, { onDelete: "cascade" }),
  candidateEmployeeId: uuid("candidate_employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  readiness: varchar("readiness", { length: 30 }), // ready_now, 1_2_years, 3_5_years, emergency_only
  rank: integer("rank"),
  developmentNeeds: text("development_needs"),
  developmentPlan: text("development_plan"),

  isInternal: boolean("is_internal").default(true),
  externalNotes: text("external_notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════ 15. SURVEYS & ENGAGEMENT ═══════════════

export const surveyCampaigns = pgTable("survey_campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 300 }).notNull(),
  type: varchar("type", { length: 30 }).default("engagement"), // engagement, pulse, exit, onboarding, manager, custom, enps
  description: text("description"),

  questions: jsonb("questions").$type<Array<{
    id: string;
    text: string;
    type: "rating" | "scale" | "single_choice" | "multi_choice" | "text" | "long_text" | "nps" | "matrix" | "ranking";
    isRequired: boolean;
    options?: any[];
    scaleMin?: number;
    scaleMax?: number;
    scaleLabels?: { min: string; max: string };
    category?: string;
  }>>().notNull().default([]),

  isAnonymous: boolean("is_anonymous").default(true),
  showResultsToEmployees: boolean("show_results_to_employees").default(false),

  audienceFilter: jsonb("audience_filter").$type<Record<string, unknown>>().default({}),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  reminderSchedule: jsonb("reminder_schedule").$type<{ days: number[] }>().default({ days: [3, 7] }),

  status: varchar("status", { length: 30 }).default("draft"),
  totalRecipients: integer("total_recipients").default(0),
  responseCount: integer("response_count").default(0),
  responseRate: numeric("response_rate", { precision: 5, scale: 2 }),
  enpsScore: numeric("enps_score", { precision: 5, scale: 2 }),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const surveyResponses = pgTable("survey_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  surveyCampaignId: uuid("survey_campaign_id").notNull().references(() => surveyCampaigns.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
  respondentToken: varchar("respondent_token", { length: 64 }),

  responses: jsonb("responses").$type<Record<string, unknown>>().notNull().default({}),
  comments: text("comments"),
  isComplete: boolean("is_complete").default(false),

  // Demographics for slicing (if not anonymous)
  departmentId: uuid("department_id"),
  legalEntityId: uuid("legal_entity_id"),
  locationId: uuid("location_id"),
  tenureYears: integer("tenure_years"),

  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
}, (table) => [
  index("survey_resp_campaign_idx").on(table.surveyCampaignId),
]);

// ═══════════════ 16. EMPLOYEE DOCUMENTS ═══════════════

export const employeeDocuments = pgTable("employee_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 500 }).notNull(),
  category: varchar("category", { length: 60 }).notNull(), // contract, addendum, payslip, performance, certificate, id_doc, medical, immigration, training, equipment, policy, signed_form, other
  documentType: varchar("document_type", { length: 100 }),
  description: text("description"),
  url: text("url").notNull(),
  storageKey: text("storage_key"),
  mimeType: varchar("mime_type", { length: 200 }),
  sizeBytes: integer("size_bytes"),

  isConfidential: boolean("is_confidential").default(true),
  isVisibleToEmployee: boolean("is_visible_to_employee").default(true),
  requiresSignature: boolean("requires_signature").default(false),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  signedDocumentUrl: text("signed_document_url"),

  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),
  expiresAt: date("expires_at"),
  isExpiringSoon: boolean("is_expiring_soon").default(false),

  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("emp_docs_emp_cat_idx").on(table.employeeId, table.category),
]);

// Disciplinary actions
export const disciplinaryActions = pgTable("disciplinary_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  type: varchar("type", { length: 30 }).notNull(), // verbal_warning, written_warning, final_warning, suspension, demotion, pip, termination
  reason: varchar("reason", { length: 200 }).notNull(),
  description: text("description"),
  incidentDate: date("incident_date"),
  actionDate: date("action_date").notNull(),

  expectedImprovements: text("expected_improvements"),
  consequencesOfNonImprovement: text("consequences_of_non_improvement"),
  reviewDate: date("review_date"),

  acknowledgedByEmployee: boolean("acknowledged_by_employee").default(false),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  employeeStatement: text("employee_statement"),

  documentUrl: text("document_url"),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),

  managerId: uuid("manager_id").references(() => employees.id),
  hrPartnerId: uuid("hr_partner_id").references(() => employees.id),
  isConfidential: boolean("is_confidential").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("disc_actions_emp_idx").on(table.employeeId),
]);

// Grievances
export const grievances = pgTable("grievances", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  caseNumber: varchar("case_number", { length: 30 }).notNull(),
  reporterEmployeeId: uuid("reporter_employee_id").references(() => employees.id),
  isAnonymous: boolean("is_anonymous").default(false),
  category: varchar("category", { length: 60 }).notNull(), // harassment, discrimination, retaliation, safety, ethics, policy_violation, fraud, other
  severity: varchar("severity", { length: 20 }).default("medium"),

  subject: varchar("subject", { length: 300 }).notNull(),
  description: text("description").notNull(),
  involvedPartyIds: jsonb("involved_party_ids").$type<string[]>().default([]),
  witnessIds: jsonb("witness_ids").$type<string[]>().default([]),
  attachments: jsonb("attachments").$type<string[]>().default([]),

  status: varchar("status", { length: 30 }).default("open"), // open, investigating, mediating, resolved, escalated, closed
  assignedToEmployeeId: uuid("assigned_to_employee_id").references(() => employees.id),
  resolutionNotes: text("resolution_notes"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("grievances_tenant_case_idx").on(table.tenantId, table.caseNumber),
]);

// Workforce planning headcount snapshots
export const headcountSnapshots = pgTable("headcount_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  asOfDate: date("as_of_date").notNull(),

  totalHeadcount: integer("total_headcount").default(0),
  fteCount: numeric("fte_count", { precision: 10, scale: 2 }).default("0"),
  byDepartment: jsonb("by_department").$type<Record<string, number>>().default({}),
  byLocation: jsonb("by_location").$type<Record<string, number>>().default({}),
  byJobProfile: jsonb("by_job_profile").$type<Record<string, number>>().default({}),
  byGender: jsonb("by_gender").$type<Record<string, number>>().default({}),
  byTenureBucket: jsonb("by_tenure_bucket").$type<Record<string, number>>().default({}),
  byAgeGroup: jsonb("by_age_group").$type<Record<string, number>>().default({}),

  hiresInPeriod: integer("hires_in_period").default(0),
  terminationsInPeriod: integer("terminations_in_period").default(0),
  voluntaryTurnoverPercent: numeric("voluntary_turnover_percent", { precision: 5, scale: 2 }),
  involuntaryTurnoverPercent: numeric("involuntary_turnover_percent", { precision: 5, scale: 2 }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("headcount_tenant_date_idx").on(table.tenantId, table.asOfDate),
]);

// Mandatory training matrix
export const trainingRequirements = pgTable("training_requirements", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 300 }).notNull(),
  description: text("description"),
  courseId: uuid("course_id").references(() => learningCourses.id, { onDelete: "set null" }),

  appliesToWorkerTypes: jsonb("applies_to_worker_types").$type<string[]>().default([]),
  appliesToDepartments: jsonb("applies_to_departments").$type<string[]>().default([]),
  appliesToJobProfiles: jsonb("applies_to_job_profiles").$type<string[]>().default([]),
  appliesToLegalEntities: jsonb("applies_to_legal_entities").$type<string[]>().default([]),

  triggerType: varchar("trigger_type", { length: 30 }).default("hire"), // hire, role_change, annual, custom
  dueWithinDays: integer("due_within_days").default(30),
  recurrenceMonths: integer("recurrence_months"),

  isCompliance: boolean("is_compliance").default(true),
  framework: varchar("framework", { length: 100 }),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
