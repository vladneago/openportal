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
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ═════════════════════════════════════════════════════════════════
// HR — Workday / SAP SuccessFactors-grade
//
// Modules:
//   1. Organization (legal entities, locations, departments, cost centers)
//   2. Positions, Job Catalog, Job Profiles, Pay Grades
//   3. Employees (workers, contingent workers), Personal Data
//   4. Employment & Job History
//   5. Compensation (salary, bonus, equity, allowances)
//   6. Benefits (health, retirement, life)
//   7. Time & Attendance (timesheets, schedules)
//   8. Time-Off / Absence (leave types, balances, accruals, requests)
//   9. Payroll (runs, payslips, deductions, taxes)
//  10. Performance (goals, reviews, 360, calibration)
//  11. Learning (courses, learning paths, certifications)
//  12. Recruitment / ATS (jobs, candidates, interviews, offers)
//  13. Onboarding / Offboarding
//  14. Succession & Career Planning
//  15. Workforce Planning & Analytics
//  16. Employee Self-Service & Documents
//  17. Surveys & Engagement
//  18. Compliance (GDPR, contracts, mandatory training)
// ═════════════════════════════════════════════════════════════════

// ═══════════════ 1. ORGANIZATION ═══════════════

export const legalEntities = pgTable("legal_entities", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 255 }).notNull(),
  legalName: varchar("legal_name", { length: 300 }),
  registrationNumber: varchar("registration_number", { length: 100 }), // CUI/Reg.Com
  taxId: varchar("tax_id", { length: 100 }),
  vatNumber: varchar("vat_number", { length: 50 }),
  ein: varchar("ein", { length: 50 }),
  industryCode: varchar("industry_code", { length: 20 }), // CAEN/NAICS
  countryCode: varchar("country_code", { length: 4 }).notNull(),

  // Address
  addressStreet: varchar("address_street", { length: 300 }),
  addressCity: varchar("address_city", { length: 200 }),
  addressState: varchar("address_state", { length: 200 }),
  addressPostalCode: varchar("address_postal_code", { length: 30 }),
  addressCountry: varchar("address_country", { length: 100 }),

  // Banking & finance
  bankAccount: varchar("bank_account", { length: 100 }),
  bankName: varchar("bank_name", { length: 200 }),
  bankBic: varchar("bank_bic", { length: 30 }),
  defaultCurrency: varchar("default_currency", { length: 8 }).default("RON"),
  fiscalYearStart: varchar("fiscal_year_start", { length: 10 }).default("01-01"),

  // Payroll
  payrollFrequency: varchar("payroll_frequency", { length: 20 }).default("monthly"),
  payrollProvider: varchar("payroll_provider", { length: 100 }),
  payrollRunDay: integer("payroll_run_day").default(28),

  // Compliance / labor
  laborLawJurisdiction: varchar("labor_law_jurisdiction", { length: 100 }),
  workWeekHours: numeric("work_week_hours", { precision: 5, scale: 2 }).default("40"),
  unionRecognized: boolean("union_recognized").notNull().default(false),
  cbaApplicable: boolean("cba_applicable").notNull().default(false),

  // Settings
  logo: text("logo"),
  primaryContactUserId: uuid("primary_contact").references(() => users.id),
  hrContactUserId: uuid("hr_contact").references(() => users.id),

  isActive: boolean("is_active").notNull().default(true),
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type LegalEntity = typeof legalEntities.$inferSelect;

export const locations = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  legalEntityId: uuid("legal_entity_id").references(() => legalEntities.id, { onDelete: "set null" }),

  code: varchar("code", { length: 30 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  type: varchar("type", { length: 30 }).default("office"), // office, warehouse, store, factory, remote, virtual

  street: varchar("street", { length: 300 }),
  city: varchar("city", { length: 200 }),
  state: varchar("state", { length: 200 }),
  postalCode: varchar("postal_code", { length: 30 }),
  country: varchar("country", { length: 100 }),

  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  timezone: varchar("timezone", { length: 60 }).default("Europe/Bucharest"),

  capacity: integer("capacity"),
  parking: boolean("parking").default(false),
  accessibility: boolean("accessibility").default(false),

  managerId: uuid("manager_id"),
  isHeadquarters: boolean("is_headquarters").default(false),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("locations_tenant_code_idx").on(table.tenantId, table.code),
]);

export type Location = typeof locations.$inferSelect;

export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  legalEntityId: uuid("legal_entity_id").references(() => legalEntities.id, { onDelete: "set null" }),
  parentDepartmentId: uuid("parent_department_id").references((): any => departments.id, { onDelete: "set null" }),

  code: varchar("code", { length: 30 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),

  type: varchar("type", { length: 30 }), // line, support, shared_service, project
  function: varchar("function", { length: 100 }), // engineering, finance, hr, sales, operations
  costCenter: varchar("cost_center", { length: 50 }),

  headcountBudget: integer("headcount_budget"),
  currentHeadcount: integer("current_headcount").default(0),
  budgetAnnual: numeric("budget_annual", { precision: 14, scale: 2 }),
  budgetCurrency: varchar("budget_currency", { length: 8 }).default("RON"),

  managerEmployeeId: uuid("manager_employee_id"),
  hrBusinessPartnerId: uuid("hr_business_partner_id"),

  path: text("path").default("/"),
  depth: integer("depth").default(0),

  isActive: boolean("is_active").notNull().default(true),
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("departments_tenant_code_idx").on(table.tenantId, table.code),
  index("departments_parent_idx").on(table.parentDepartmentId),
]);

export type Department = typeof departments.$inferSelect;

export const costCenters = pgTable("cost_centers", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  legalEntityId: uuid("legal_entity_id").references(() => legalEntities.id, { onDelete: "set null" }),
  parentId: uuid("parent_id").references((): any => costCenters.id, { onDelete: "set null" }),

  code: varchar("code", { length: 30 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),

  glAccount: varchar("gl_account", { length: 50 }),
  budgetAnnual: numeric("budget_annual", { precision: 14, scale: 2 }),
  actualYtd: numeric("actual_ytd", { precision: 14, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("RON"),

  ownerId: uuid("owner_id"),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("cost_centers_tenant_code_idx").on(table.tenantId, table.code),
]);

// ═══════════════ 2. JOB CATALOG & POSITIONS ═══════════════

export const jobFamilies = pgTable("job_families", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  code: varchar("code", { length: 30 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  function: varchar("function", { length: 100 }),

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("job_families_tenant_code_idx").on(table.tenantId, table.code),
]);

export const jobProfiles = pgTable("job_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  jobFamilyId: uuid("job_family_id").references(() => jobFamilies.id, { onDelete: "set null" }),

  code: varchar("code", { length: 30 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  shortDescription: varchar("short_description", { length: 500 }),
  fullDescription: text("full_description"),

  level: varchar("level", { length: 30 }), // junior, mid, senior, lead, principal, staff, manager, director, vp, c_level
  flsa: varchar("flsa", { length: 30 }), // exempt, non_exempt
  occupationCode: varchar("occupation_code", { length: 30 }), // SOC/COR/ISCO
  responsibilities: jsonb("responsibilities").$type<string[]>().default([]),
  requirements: jsonb("requirements").$type<string[]>().default([]),
  qualifications: jsonb("qualifications").$type<string[]>().default([]),
  skillsRequired: jsonb("skills_required").$type<Array<{ skill: string; level: number; required: boolean }>>().default([]),
  competencies: jsonb("competencies").$type<Array<{ name: string; level: number }>>().default([]),

  payGradeId: uuid("pay_grade_id"),
  career_tier: varchar("career_tier", { length: 30 }),
  managementLevel: integer("management_level").default(0),

  // EEOC / category
  eeoCategory: varchar("eeo_category", { length: 60 }),
  workersComp: varchar("workers_comp", { length: 30 }),

  isActive: boolean("is_active").notNull().default(true),
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("job_profiles_tenant_code_idx").on(table.tenantId, table.code),
]);

export type JobProfile = typeof jobProfiles.$inferSelect;

export const payGrades = pgTable("pay_grades", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  legalEntityId: uuid("legal_entity_id").references(() => legalEntities.id, { onDelete: "set null" }),

  code: varchar("code", { length: 30 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),

  minSalary: numeric("min_salary", { precision: 14, scale: 2 }),
  midSalary: numeric("mid_salary", { precision: 14, scale: 2 }),
  maxSalary: numeric("max_salary", { precision: 14, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("RON"),
  payFrequency: varchar("pay_frequency", { length: 20 }).default("annual"), // hourly, monthly, annual

  bonusTargetPercent: numeric("bonus_target_percent", { precision: 5, scale: 2 }),
  equityEligible: boolean("equity_eligible").default(false),

  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("pay_grades_tenant_code_idx").on(table.tenantId, table.code),
]);

export const positions = pgTable("positions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  legalEntityId: uuid("legal_entity_id").references(() => legalEntities.id, { onDelete: "set null" }),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
  jobProfileId: uuid("job_profile_id").references(() => jobProfiles.id, { onDelete: "set null" }),
  reportsToPositionId: uuid("reports_to_position_id").references((): any => positions.id, { onDelete: "set null" }),

  positionNumber: varchar("position_number", { length: 30 }).notNull(),
  businessTitle: varchar("business_title", { length: 300 }),
  workShift: varchar("work_shift", { length: 50 }),

  type: varchar("type", { length: 30 }).default("regular"), // regular, fixed_term, seasonal, contractor
  ftePercent: numeric("fte_percent", { precision: 5, scale: 2 }).default("100"),
  hoursPerWeek: numeric("hours_per_week", { precision: 5, scale: 2 }).default("40"),
  scheduleType: varchar("schedule_type", { length: 30 }), // full_time, part_time

  isHeadcount: boolean("is_headcount").default(true),
  isManager: boolean("is_manager").default(false),

  // Status
  status: varchar("status", { length: 30 }).notNull().default("vacant"), // vacant, filled, frozen, closed
  occupiedByEmployeeId: uuid("occupied_by_employee_id"),
  vacatedAt: timestamp("vacated_at", { withTimezone: true }),

  // Budget
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: uuid("approved_by"),
  budgetSalary: numeric("budget_salary", { precision: 14, scale: 2 }),

  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("positions_tenant_number_idx").on(table.tenantId, table.positionNumber),
  index("positions_status_idx").on(table.tenantId, table.status),
  index("positions_dept_idx").on(table.departmentId),
]);

export type Position = typeof positions.$inferSelect;

// ═══════════════ 3. EMPLOYEES (WORKERS) ═══════════════

export const employmentTypeEnum = pgEnum("employment_type", [
  "regular",
  "fixed_term",
  "intern",
  "apprentice",
  "seasonal",
  "contractor",
  "consultant",
  "agency",
  "temp",
]);

export const workerStatusEnum = pgEnum("worker_status", [
  "active",
  "leave_of_absence",
  "suspended",
  "terminated",
  "retired",
  "deceased",
  "pre_hire",
  "candidate",
]);

export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  legalEntityId: uuid("legal_entity_id").references(() => legalEntities.id, { onDelete: "set null" }),

  // Identifiers
  employeeNumber: varchar("employee_number", { length: 30 }).notNull(),
  badgeNumber: varchar("badge_number", { length: 30 }),
  externalId: varchar("external_id", { length: 100 }),
  workerType: employmentTypeEnum("worker_type").notNull().default("regular"),

  // Personal — Names
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  preferredName: varchar("preferred_name", { length: 100 }),
  formerLastName: varchar("former_last_name", { length: 100 }),
  prefix: varchar("prefix", { length: 30 }),
  suffix: varchar("suffix", { length: 30 }),
  fullLegalName: varchar("full_legal_name", { length: 300 }),

  // Demographics
  gender: varchar("gender", { length: 30 }),
  pronouns: varchar("pronouns", { length: 30 }),
  dateOfBirth: date("date_of_birth"),
  birthCity: varchar("birth_city", { length: 200 }),
  birthCountry: varchar("birth_country", { length: 100 }),
  nationality: varchar("nationality", { length: 100 }),
  ethnicity: varchar("ethnicity", { length: 100 }),
  maritalStatus: varchar("marital_status", { length: 30 }),
  hasDisability: boolean("has_disability").default(false),
  disabilityDetails: text("disability_details"),
  isMilitaryVeteran: boolean("is_military_veteran").default(false),
  bloodType: varchar("blood_type", { length: 10 }),

  // Government IDs (encrypted in production)
  nationalId: text("national_id"), // CNP / SSN
  passportNumber: varchar("passport_number", { length: 50 }),
  passportCountry: varchar("passport_country", { length: 100 }),
  passportExpiresAt: date("passport_expires_at"),
  driverLicenseNumber: varchar("driver_license_number", { length: 50 }),
  driverLicenseClass: varchar("driver_license_class", { length: 30 }),
  driverLicenseExpiresAt: date("driver_license_expires_at"),
  workPermitNumber: varchar("work_permit_number", { length: 50 }),
  workPermitExpiresAt: date("work_permit_expires_at"),
  visaStatus: varchar("visa_status", { length: 100 }),
  visaExpiresAt: date("visa_expires_at"),

  // Contact (work)
  workEmail: varchar("work_email", { length: 255 }),
  workPhone: varchar("work_phone", { length: 50 }),
  workMobile: varchar("work_mobile", { length: 50 }),
  workExtension: varchar("work_extension", { length: 20 }),

  // Contact (personal)
  personalEmail: varchar("personal_email", { length: 255 }),
  personalPhone: varchar("personal_phone", { length: 50 }),
  personalMobile: varchar("personal_mobile", { length: 50 }),

  // Profile
  photoUrl: text("photo_url"),
  bio: text("bio"),
  skills: jsonb("skills").$type<Array<{ name: string; level: number; years?: number; endorsedBy?: string[] }>>().default([]),
  languages: jsonb("languages").$type<Array<{ language: string; proficiency: "basic" | "intermediate" | "advanced" | "native" }>>().default([]),
  interests: jsonb("interests").$type<string[]>().default([]),
  socialLinks: jsonb("social_links").$type<{ linkedin?: string; twitter?: string; github?: string; website?: string }>().default({}),

  // Status & lifecycle
  status: workerStatusEnum("status").notNull().default("active"),
  hireDate: date("hire_date"),
  originalHireDate: date("original_hire_date"),
  rehireDate: date("rehire_date"),
  serviceDate: date("service_date"),
  probationEndDate: date("probation_end_date"),
  contractEndDate: date("contract_end_date"),
  retirementEligibleDate: date("retirement_eligible_date"),
  terminationDate: date("termination_date"),
  terminationReason: varchar("termination_reason", { length: 100 }),
  terminationType: varchar("termination_type", { length: 30 }), // voluntary, involuntary, retirement, mutual
  isRehirable: boolean("is_rehirable"),

  // Current position summary (denormalized for speed)
  currentPositionId: uuid("current_position_id").references(() => positions.id, { onDelete: "set null" }),
  currentJobTitle: varchar("current_job_title", { length: 300 }),
  currentDepartmentId: uuid("current_department_id").references(() => departments.id, { onDelete: "set null" }),
  currentLocationId: uuid("current_location_id").references(() => locations.id, { onDelete: "set null" }),
  currentManagerId: uuid("current_manager_id").references((): any => employees.id, { onDelete: "set null" }),

  // Compensation summary
  currentSalary: numeric("current_salary", { precision: 14, scale: 2 }),
  currentSalaryCurrency: varchar("current_salary_currency", { length: 8 }),
  currentSalaryFrequency: varchar("current_salary_frequency", { length: 20 }),

  // Onboarding
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  emailGenerated: boolean("email_generated").default(false),
  itEquipmentAssigned: boolean("it_equipment_assigned").default(false),

  // Settings
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("ro"),
  timezone: varchar("timezone", { length: 60 }).default("Europe/Bucharest"),
  workScheduleId: uuid("work_schedule_id"),
  isPublicProfile: boolean("is_public_profile").default(true),

  // Custom data
  customFields: jsonb("custom_fields").$type<Record<string, unknown>>().default({}),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("employees_tenant_number_idx").on(table.tenantId, table.employeeNumber),
  index("employees_status_idx").on(table.tenantId, table.status),
  index("employees_dept_idx").on(table.currentDepartmentId),
  index("employees_manager_idx").on(table.currentManagerId),
  index("employees_user_idx").on(table.userId),
]);

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

// Personal addresses
export const employeeAddresses = pgTable("employee_addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  type: varchar("type", { length: 30 }).notNull().default("home"), // home, work, mailing, billing, emergency, temporary
  isPrimary: boolean("is_primary").default(false),

  street1: varchar("street1", { length: 300 }),
  street2: varchar("street2", { length: 300 }),
  city: varchar("city", { length: 200 }),
  state: varchar("state", { length: 200 }),
  postalCode: varchar("postal_code", { length: 30 }),
  country: varchar("country", { length: 100 }),

  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("emp_addr_emp_idx").on(table.employeeId),
]);

// Emergency contacts
export const emergencyContacts = pgTable("emergency_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  relationship: varchar("relationship", { length: 60 }),
  isPrimary: boolean("is_primary").default(false),
  phonePrimary: varchar("phone_primary", { length: 50 }),
  phoneSecondary: varchar("phone_secondary", { length: 50 }),
  email: varchar("email", { length: 255 }),
  street: varchar("street", { length: 300 }),
  city: varchar("city", { length: 200 }),
  country: varchar("country", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Dependents (children, spouse, etc. for benefits)
export const dependents = pgTable("dependents", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  relationship: varchar("relationship", { length: 30 }).notNull(), // spouse, child, domestic_partner, parent
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender", { length: 30 }),
  nationalId: text("national_id"),
  isStudent: boolean("is_student").default(false),
  isDisabled: boolean("is_disabled").default(false),

  // Coverage flags
  isCoveredHealth: boolean("is_covered_health").default(false),
  isCoveredDental: boolean("is_covered_dental").default(false),
  isCoveredVision: boolean("is_covered_vision").default(false),
  isCoveredLife: boolean("is_covered_life").default(false),
  isTaxDependent: boolean("is_tax_dependent").default(false),

  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Bank/payment accounts
export const employeePaymentMethods = pgTable("employee_payment_methods", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  type: varchar("type", { length: 30 }).default("bank_account"), // bank_account, paypal, check, prepaid_card
  isPrimary: boolean("is_primary").default(false),
  splitPercent: numeric("split_percent", { precision: 5, scale: 2 }).default("100"),
  splitAmount: numeric("split_amount", { precision: 14, scale: 2 }),

  bankName: varchar("bank_name", { length: 200 }),
  bankAccountHolder: varchar("bank_account_holder", { length: 200 }),
  iban: varchar("iban", { length: 60 }),
  accountNumber: varchar("account_number", { length: 60 }),
  routingNumber: varchar("routing_number", { length: 30 }),
  swiftBic: varchar("swift_bic", { length: 30 }),
  accountType: varchar("account_type", { length: 30 }), // checking, savings

  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Tax info
export const employeeTaxInfo = pgTable("employee_tax_info", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  countryCode: varchar("country_code", { length: 4 }).notNull(),
  region: varchar("region", { length: 100 }),
  taxResidency: varchar("tax_residency", { length: 100 }),
  filingStatus: varchar("filing_status", { length: 30 }),
  exemptions: integer("exemptions").default(0),
  dependentsCount: integer("dependents_count").default(0),
  additionalWithholding: numeric("additional_withholding", { precision: 10, scale: 2 }),
  isExempt: boolean("is_exempt").default(false),
  taxIdNumber: varchar("tax_id_number", { length: 60 }),

  // Romania-specific
  isPersoanaCuHandicap: boolean("is_persoana_cu_handicap").default(false),
  numarPersoaneInIntretinere: integer("numar_persoane_in_intretinere").default(0),

  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════ 4. EMPLOYMENT HISTORY ═══════════════

export const employmentHistoryReasonEnum = pgEnum("employment_history_reason", [
  "hire",
  "rehire",
  "promotion",
  "demotion",
  "lateral",
  "transfer",
  "reorganization",
  "data_change",
  "name_change",
  "job_change",
  "manager_change",
  "department_change",
  "location_change",
  "compensation_change",
  "fte_change",
  "leave_start",
  "leave_end",
  "suspension",
  "termination",
  "retirement",
  "deceased",
  "title_change",
  "contract_extension",
]);

export const employmentHistory = pgTable("employment_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  effectiveDate: date("effective_date").notNull(),
  endDate: date("end_date"),
  reason: employmentHistoryReasonEnum("reason").notNull(),

  // Snapshot of role at this point
  positionId: uuid("position_id").references(() => positions.id),
  jobProfileId: uuid("job_profile_id").references(() => jobProfiles.id),
  jobTitle: varchar("job_title", { length: 300 }),
  legalEntityId: uuid("legal_entity_id").references(() => legalEntities.id),
  departmentId: uuid("department_id").references(() => departments.id),
  locationId: uuid("location_id").references(() => locations.id),
  managerEmployeeId: uuid("manager_employee_id").references((): any => employees.id),
  workerType: employmentTypeEnum("worker_type"),
  ftePercent: numeric("fte_percent", { precision: 5, scale: 2 }),
  hoursPerWeek: numeric("hours_per_week", { precision: 5, scale: 2 }),

  // Compensation snapshot
  baseSalary: numeric("base_salary", { precision: 14, scale: 2 }),
  salaryCurrency: varchar("salary_currency", { length: 8 }),
  salaryFrequency: varchar("salary_frequency", { length: 20 }),

  notes: text("notes"),
  attachments: jsonb("attachments").$type<string[]>().default([]),

  initiatedBy: uuid("initiated_by").references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("emp_hist_employee_eff_idx").on(table.employeeId, table.effectiveDate),
]);

// ═══════════════ 5. COMPENSATION ═══════════════

export const compensationPlans = pgTable("compensation_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  effectiveDate: date("effective_date").notNull(),
  endDate: date("end_date"),
  reason: varchar("reason", { length: 60 }), // hire, merit, promotion, market_adjustment, equity_grant, bonus_payout

  // Base
  baseSalary: numeric("base_salary", { precision: 14, scale: 2 }).notNull(),
  baseCurrency: varchar("base_currency", { length: 8 }).default("RON"),
  payFrequency: varchar("pay_frequency", { length: 20 }).default("monthly"), // hourly, monthly, annual
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 4 }),

  // Variable
  bonusTargetPercent: numeric("bonus_target_percent", { precision: 5, scale: 2 }),
  bonusTargetAmount: numeric("bonus_target_amount", { precision: 14, scale: 2 }),
  bonusPlan: varchar("bonus_plan", { length: 100 }),
  commissionPlan: varchar("commission_plan", { length: 100 }),

  // Equity
  equityShares: integer("equity_shares"),
  equityType: varchar("equity_type", { length: 30 }), // stock_options, rsu, performance_shares, espp
  equityVestSchedule: jsonb("equity_vest_schedule").$type<Array<{ date: string; shares: number }>>(),
  equityCliffDate: date("equity_cliff_date"),

  // Allowances
  carAllowance: numeric("car_allowance", { precision: 10, scale: 2 }),
  housingAllowance: numeric("housing_allowance", { precision: 10, scale: 2 }),
  mealAllowance: numeric("meal_allowance", { precision: 10, scale: 2 }),
  transportAllowance: numeric("transport_allowance", { precision: 10, scale: 2 }),
  phoneAllowance: numeric("phone_allowance", { precision: 10, scale: 2 }),
  otherAllowances: jsonb("other_allowances").$type<Array<{ type: string; amount: number; currency: string }>>().default([]),

  // Compensation ratio
  compaRatio: numeric("compa_ratio", { precision: 5, scale: 2 }),
  rangePenetration: numeric("range_penetration", { precision: 5, scale: 2 }),

  // Status
  status: varchar("status", { length: 30 }).default("active"), // proposed, approved, active, expired
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),

  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("comp_plans_emp_idx").on(table.employeeId, table.effectiveDate),
]);

export const bonuses = pgTable("bonuses", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  type: varchar("type", { length: 30 }).notNull(), // signing, retention, referral, performance, spot, holiday
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("RON"),

  performancePeriod: varchar("performance_period", { length: 50 }),
  reason: text("reason"),
  payoutDate: date("payout_date"),
  isPaid: boolean("is_paid").default(false),

  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ═══════════════ 6. BENEFITS ═══════════════

export const benefitPlans = pgTable("benefit_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  legalEntityId: uuid("legal_entity_id").references(() => legalEntities.id, { onDelete: "set null" }),

  code: varchar("code", { length: 30 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 30 }).notNull(), // health, dental, vision, life, ad_d, ltd, std, retirement, fsa, hsa, commuter, education, wellness, other
  type: varchar("type", { length: 30 }), // hmo, ppo, hdhp, etc.
  carrier: varchar("carrier", { length: 200 }),
  policyNumber: varchar("policy_number", { length: 100 }),
  description: text("description"),
  summaryDocumentUrl: text("summary_doc_url"),

  // Eligibility
  eligibilityWaitDays: integer("eligibility_wait_days").default(0),
  minHoursPerWeek: numeric("min_hours_per_week", { precision: 5, scale: 2 }),
  eligibleEmployeeTypes: jsonb("eligible_employee_types").$type<string[]>().default([]),

  // Cost
  employeeMonthlyCost: numeric("employee_monthly_cost", { precision: 10, scale: 2 }),
  employerMonthlyCost: numeric("employer_monthly_cost", { precision: 10, scale: 2 }),
  costPerDependent: numeric("cost_per_dependent", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("RON"),

  enrollmentOpensAt: date("enrollment_opens_at"),
  enrollmentClosesAt: date("enrollment_closes_at"),
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("benefit_plans_tenant_code_idx").on(table.tenantId, table.code),
]);

export const benefitEnrollments = pgTable("benefit_enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  benefitPlanId: uuid("benefit_plan_id").notNull().references(() => benefitPlans.id, { onDelete: "cascade" }),

  coverageLevel: varchar("coverage_level", { length: 30 }).default("employee_only"), // employee_only, employee_spouse, employee_children, family
  coveredDependentIds: jsonb("covered_dependent_ids").$type<string[]>().default([]),

  electionAmount: numeric("election_amount", { precision: 14, scale: 2 }),
  contributionAmount: numeric("contribution_amount", { precision: 14, scale: 2 }),
  contributionFrequency: varchar("contribution_frequency", { length: 20 }).default("monthly"),
  beneficiaries: jsonb("beneficiaries").$type<Array<{ name: string; relationship: string; percentage: number; isPrimary: boolean }>>().default([]),

  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),

  status: varchar("status", { length: 30 }).default("active"), // pending, active, waived, cancelled, expired
  reason: varchar("reason", { length: 60 }), // open_enrollment, life_event, new_hire

  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("benefit_enroll_emp_idx").on(table.employeeId),
]);

// ═══════════════ 7. TIME-OFF / ABSENCE ═══════════════

export const leaveTypeEnum = pgEnum("leave_type", [
  "annual_vacation",
  "sick",
  "personal",
  "bereavement",
  "jury_duty",
  "military",
  "maternity",
  "paternity",
  "adoption",
  "parental",
  "unpaid",
  "compensatory",
  "study",
  "sabbatical",
  "marriage",
  "religious",
  "voting",
  "covid_19",
  "remote_work",
  "training",
  "other",
]);

export const leavePolicies = pgTable("leave_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  legalEntityId: uuid("legal_entity_id").references(() => legalEntities.id, { onDelete: "set null" }),

  code: varchar("code", { length: 30 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  type: leaveTypeEnum("type").notNull(),
  description: text("description"),

  // Accrual
  accrualType: varchar("accrual_type", { length: 30 }).default("annual_grant"), // annual_grant, monthly_accrual, hourly_accrual, anniversary, none
  accrualAmount: numeric("accrual_amount", { precision: 8, scale: 2 }),
  accrualUnit: varchar("accrual_unit", { length: 10 }).default("days"), // days, hours
  accrualCap: numeric("accrual_cap", { precision: 8, scale: 2 }),
  accrualResetDay: varchar("accrual_reset_day", { length: 10 }), // 01-01

  // Carry over
  allowCarryOver: boolean("allow_carry_over").default(true),
  maxCarryOverDays: numeric("max_carry_over_days", { precision: 8, scale: 2 }),
  carryOverExpiresOn: varchar("carry_over_expires_on", { length: 10 }),

  // Payout
  isPaid: boolean("is_paid").default(true),
  paidAtPercent: numeric("paid_at_percent", { precision: 5, scale: 2 }).default("100"),

  // Constraints
  minDaysAdvanceNotice: integer("min_days_advance_notice").default(0),
  maxConsecutiveDays: integer("max_consecutive_days"),
  requiresApproval: boolean("requires_approval").default(true),
  requiresMedicalCertificate: boolean("requires_medical_cert").default(false),
  requiresMedicalAfterDays: integer("requires_medical_after_days"),

  // Eligibility
  minTenureDays: integer("min_tenure_days").default(0),
  eligibleWorkerTypes: jsonb("eligible_worker_types").$type<string[]>().default([]),
  proRateForPartTime: boolean("pro_rate_for_part_time").default(true),

  // Approval workflow
  approvalChain: jsonb("approval_chain").$type<Array<{ level: number; role: string; required: boolean }>>().default([]),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("leave_policies_tenant_code_idx").on(table.tenantId, table.code),
]);

export const leaveBalances = pgTable("leave_balances", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  leavePolicyId: uuid("leave_policy_id").notNull().references(() => leavePolicies.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),

  earned: numeric("earned", { precision: 8, scale: 2 }).notNull().default("0"),
  used: numeric("used", { precision: 8, scale: 2 }).notNull().default("0"),
  pending: numeric("pending", { precision: 8, scale: 2 }).notNull().default("0"),
  carriedOver: numeric("carried_over", { precision: 8, scale: 2 }).notNull().default("0"),
  adjustment: numeric("adjustment", { precision: 8, scale: 2 }).notNull().default("0"),
  available: numeric("available", { precision: 8, scale: 2 }).notNull().default("0"),

  asOfDate: date("as_of_date").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("leave_balances_emp_pol_yr_idx").on(table.employeeId, table.leavePolicyId, table.year),
]);

export const leaveRequestStatusEnum = pgEnum("leave_request_status", [
  "draft",
  "pending",
  "in_review",
  "approved",
  "rejected",
  "cancelled",
  "withdrawn",
  "completed",
]);

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  leavePolicyId: uuid("leave_policy_id").notNull().references(() => leavePolicies.id, { onDelete: "cascade" }),

  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isHalfDayStart: boolean("is_half_day_start").default(false),
  isHalfDayEnd: boolean("is_half_day_end").default(false),
  totalDays: numeric("total_days", { precision: 6, scale: 2 }).notNull(),
  totalHours: numeric("total_hours", { precision: 8, scale: 2 }),

  reason: text("reason"),
  attachments: jsonb("attachments").$type<Array<{ name: string; url: string }>>().default([]),
  destinationCountry: varchar("destination_country", { length: 100 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 50 }),
  delegatedToEmployeeId: uuid("delegated_to_employee_id").references((): any => employees.id),
  outOfOfficeMessage: text("out_of_office_message"),

  status: leaveRequestStatusEnum("status").notNull().default("pending"),
  approverEmployeeId: uuid("approver_employee_id").references((): any => employees.id),
  approvalChain: jsonb("approval_chain").$type<Array<{ level: number; approverId: string; status: string; comment?: string; decidedAt?: string }>>().default([]),
  decisionAt: timestamp("decision_at", { withTimezone: true }),
  decisionNotes: text("decision_notes"),

  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelReason: text("cancel_reason"),

  // Conflicts
  conflictsCheckedAt: timestamp("conflicts_checked_at", { withTimezone: true }),
  hasOverlap: boolean("has_overlap").default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("leave_req_emp_idx").on(table.employeeId, table.startDate),
  index("leave_req_status_idx").on(table.tenantId, table.status),
]);

export type LeaveRequest = typeof leaveRequests.$inferSelect;

// Holidays calendar
export const holidays = pgTable("holidays", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  legalEntityId: uuid("legal_entity_id").references(() => legalEntities.id, { onDelete: "cascade" }),
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  date: date("date").notNull(),
  type: varchar("type", { length: 30 }).default("national"), // national, religious, regional, company
  isObserved: boolean("is_observed").default(true),
  isPaid: boolean("is_paid").default(true),
  description: text("description"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("holidays_date_idx").on(table.tenantId, table.date),
]);

// ═══════════════ 8. TIME & ATTENDANCE ═══════════════

export const workSchedules = pgTable("work_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 30 }).default("fixed"), // fixed, rotating, flexible, on_call

  totalHoursPerWeek: numeric("total_hours_per_week", { precision: 5, scale: 2 }).default("40"),
  daysPerWeek: integer("days_per_week").default(5),

  pattern: jsonb("pattern").$type<Array<{
    dayOfWeek: number;
    isWorkDay: boolean;
    startTime?: string;
    endTime?: string;
    breakMinutes?: number;
    totalMinutes?: number;
  }>>().notNull().default([]),

  rotationDays: integer("rotation_days"),
  appliesFrom: date("applies_from"),
  appliesTo: date("applies_to"),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const timesheets = pgTable("timesheets", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),

  totalHours: numeric("total_hours", { precision: 8, scale: 2 }).default("0"),
  regularHours: numeric("regular_hours", { precision: 8, scale: 2 }).default("0"),
  overtimeHours: numeric("overtime_hours", { precision: 8, scale: 2 }).default("0"),
  doubleTimeHours: numeric("double_time_hours", { precision: 8, scale: 2 }).default("0"),
  holidayHours: numeric("holiday_hours", { precision: 8, scale: 2 }).default("0"),
  pto_Hours: numeric("pto_hours", { precision: 8, scale: 2 }).default("0"),
  sickHours: numeric("sick_hours", { precision: 8, scale: 2 }).default("0"),

  status: varchar("status", { length: 30 }).default("open"), // open, submitted, approved, rejected, paid
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),

  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("timesheets_emp_period_idx").on(table.employeeId, table.periodStart),
]);

export const timeEntries = pgTable("time_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  timesheetId: uuid("timesheet_id").notNull().references(() => timesheets.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  date: date("date").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  breakMinutes: integer("break_minutes").default(0),
  totalMinutes: integer("total_minutes").notNull().default(0),

  type: varchar("type", { length: 30 }).default("regular"), // regular, overtime, holiday, pto, sick, training
  projectId: uuid("project_id"),
  taskId: uuid("task_id"),
  costCenterId: uuid("cost_center_id"),
  notes: text("notes"),

  // Punch-in/punch-out
  clockInLocation: jsonb("clock_in_location").$type<{ lat: number; lng: number }>(),
  clockOutLocation: jsonb("clock_out_location").$type<{ lat: number; lng: number }>(),
  clockInIp: varchar("clock_in_ip", { length: 45 }),
  clockOutIp: varchar("clock_out_ip", { length: 45 }),

  isManualEntry: boolean("is_manual_entry").default(false),
  approvedBy: uuid("approved_by").references(() => users.id),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("time_entries_emp_date_idx").on(table.employeeId, table.date),
]);

// ═══════════════ 9. PAYROLL ═══════════════

export const payrollRuns = pgTable("payroll_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  legalEntityId: uuid("legal_entity_id").notNull().references(() => legalEntities.id, { onDelete: "cascade" }),

  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  payDate: date("pay_date").notNull(),
  type: varchar("type", { length: 30 }).default("regular"), // regular, off_cycle, bonus, correction
  frequency: varchar("frequency", { length: 20 }).default("monthly"),

  status: varchar("status", { length: 30 }).default("draft"), // draft, calculated, in_review, approved, processed, paid, cancelled

  totalGross: numeric("total_gross", { precision: 16, scale: 2 }).default("0"),
  totalNet: numeric("total_net", { precision: 16, scale: 2 }).default("0"),
  totalEmployerCost: numeric("total_employer_cost", { precision: 16, scale: 2 }).default("0"),
  totalDeductions: numeric("total_deductions", { precision: 16, scale: 2 }).default("0"),
  totalEmployeeContributions: numeric("total_emp_contrib", { precision: 16, scale: 2 }).default("0"),
  totalEmployerContributions: numeric("total_emr_contrib", { precision: 16, scale: 2 }).default("0"),
  totalTax: numeric("total_tax", { precision: 16, scale: 2 }).default("0"),

  employeeCount: integer("employee_count").default(0),
  currency: varchar("currency", { length: 8 }).default("RON"),

  calculatedAt: timestamp("calculated_at", { withTimezone: true }),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),

  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("payroll_run_period_idx").on(table.legalEntityId, table.periodStart, table.type),
]);

export const payslips = pgTable("payslips", {
  id: uuid("id").defaultRandom().primaryKey(),
  payrollRunId: uuid("payroll_run_id").notNull().references(() => payrollRuns.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),

  // Identification
  payslipNumber: varchar("payslip_number", { length: 60 }).notNull().unique(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  payDate: date("pay_date").notNull(),

  // Hours
  regularHours: numeric("regular_hours", { precision: 8, scale: 2 }).default("0"),
  overtimeHours: numeric("overtime_hours", { precision: 8, scale: 2 }).default("0"),
  ptoHours: numeric("pto_hours", { precision: 8, scale: 2 }).default("0"),

  // Earnings
  baseSalary: numeric("base_salary", { precision: 14, scale: 2 }).default("0"),
  hourlyEarnings: numeric("hourly_earnings", { precision: 14, scale: 2 }).default("0"),
  overtimeEarnings: numeric("overtime_earnings", { precision: 14, scale: 2 }).default("0"),
  bonusEarnings: numeric("bonus_earnings", { precision: 14, scale: 2 }).default("0"),
  commissionEarnings: numeric("commission_earnings", { precision: 14, scale: 2 }).default("0"),
  allowanceEarnings: numeric("allowance_earnings", { precision: 14, scale: 2 }).default("0"),
  otherEarnings: numeric("other_earnings", { precision: 14, scale: 2 }).default("0"),
  grossEarnings: numeric("gross_earnings", { precision: 14, scale: 2 }).default("0"),

  // Deductions
  socialSecurityDeduction: numeric("ss_deduction", { precision: 12, scale: 2 }).default("0"),
  healthInsuranceDeduction: numeric("health_deduction", { precision: 12, scale: 2 }).default("0"),
  unemploymentDeduction: numeric("unemployment_deduction", { precision: 12, scale: 2 }).default("0"),
  pensionDeduction: numeric("pension_deduction", { precision: 12, scale: 2 }).default("0"),
  incomeTax: numeric("income_tax", { precision: 12, scale: 2 }).default("0"),
  voluntaryDeductions: numeric("voluntary_deductions", { precision: 12, scale: 2 }).default("0"),
  garnishments: numeric("garnishments", { precision: 12, scale: 2 }).default("0"),
  totalDeductions: numeric("total_deductions", { precision: 14, scale: 2 }).default("0"),

  // Net
  netPay: numeric("net_pay", { precision: 14, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 8 }).default("RON"),

  // Employer cost
  employerSocialSecurity: numeric("emr_ss", { precision: 12, scale: 2 }).default("0"),
  employerHealth: numeric("emr_health", { precision: 12, scale: 2 }).default("0"),
  employerUnemployment: numeric("emr_unemp", { precision: 12, scale: 2 }).default("0"),
  employerPension: numeric("emr_pension", { precision: 12, scale: 2 }).default("0"),
  totalEmployerCost: numeric("total_employer_cost", { precision: 14, scale: 2 }).default("0"),

  // Detailed breakdown
  earningsLines: jsonb("earnings_lines").$type<Array<{ code: string; description: string; rate?: number; quantity?: number; amount: number }>>().default([]),
  deductionLines: jsonb("deduction_lines").$type<Array<{ code: string; description: string; amount: number }>>().default([]),
  ytdAccumulators: jsonb("ytd_accumulators").$type<Record<string, number>>().default({}),

  // Payment
  paymentMethod: varchar("payment_method", { length: 30 }).default("bank_transfer"),
  bankAccount: varchar("bank_account", { length: 60 }),
  paymentReference: varchar("payment_reference", { length: 100 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),

  // Storage
  pdfUrl: text("pdf_url"),
  status: varchar("status", { length: 30 }).default("draft"), // draft, finalized, sent, viewed
  sentAt: timestamp("sent_at", { withTimezone: true }),
  viewedAt: timestamp("viewed_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("payslips_emp_period_idx").on(table.employeeId, table.periodStart),
]);

export type Payslip = typeof payslips.$inferSelect;
