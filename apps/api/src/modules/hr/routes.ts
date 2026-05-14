import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  db, users,
  legalEntities, locations, departments, costCenters,
  jobFamilies, jobProfiles, payGrades, positions,
  employees, employeeAddresses, emergencyContacts, dependents,
  employeePaymentMethods, employeeTaxInfo, employmentHistory,
  compensationPlans, bonuses, benefitPlans, benefitEnrollments,
  leavePolicies, leaveBalances, leaveRequests, holidays,
  workSchedules, timesheets, timeEntries,
  payrollRuns, payslips,
  performanceCycles, goals, goalUpdates, reviewTemplates, reviews,
  feedbackRequests, calibrationSessions,
  learningCourses, learningPaths, enrollments, certifications,
  skills, employeeSkills,
  jobRequisitions, jobPostings, candidates, applications,
  interviews, interviewFeedback, offers,
  onboardingPlans, onboardingTasks, offboardingPlans, offboardingTasks,
  exitInterviews, successionPlans, successors,
  surveyCampaigns, surveyResponses,
  employeeDocuments, disciplinaryActions, grievances,
  headcountSnapshots, trainingRequirements,
} from "@openportal/db";
import { eq, and, or, desc, asc, sql, inArray, count, isNull, gte, lte } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const hrRoutes = new Hono();
hrRoutes.use("*", requireAuth);

// ═══════════════════════════════════════════════════════════
// 1. ORGANIZATION — entities, locations, departments
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/legal-entities", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(legalEntities).where(eq(legalEntities.tenantId, tenantId));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/legal-entities", zValidator("json", z.object({
  name: z.string().min(1).max(255),
  legalName: z.string().optional(),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  vatNumber: z.string().optional(),
  countryCode: z.string().min(2).max(4),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressPostalCode: z.string().optional(),
  addressCountry: z.string().optional(),
  defaultCurrency: z.string().default("RON"),
  workWeekHours: z.number().default(40),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");
  const [e] = await db.insert(legalEntities).values({
    tenantId, ...body, workWeekHours: body.workWeekHours.toString(),
  }).returning();
  return c.json({ success: true, data: e }, 201);
});

hrRoutes.get("/locations", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(locations).where(eq(locations.tenantId, tenantId));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/locations", zValidator("json", z.object({
  legalEntityId: z.string().uuid().optional(),
  code: z.string().min(1).max(30),
  name: z.string().min(1).max(200),
  type: z.enum(["office", "warehouse", "store", "factory", "remote", "virtual"]).default("office"),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().default("Europe/Bucharest"),
  capacity: z.number().int().optional(),
  isHeadquarters: z.boolean().default(false),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");
  const [l] = await db.insert(locations).values({ tenantId, ...body }).returning();
  return c.json({ success: true, data: l }, 201);
});

hrRoutes.get("/departments", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(departments).where(eq(departments.tenantId, tenantId)).orderBy(departments.path);
  return c.json({ success: true, data: list });
});

hrRoutes.post("/departments", zValidator("json", z.object({
  legalEntityId: z.string().uuid().optional(),
  parentDepartmentId: z.string().uuid().optional(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  function: z.string().optional(),
  costCenter: z.string().optional(),
  headcountBudget: z.number().int().optional(),
  budgetAnnual: z.number().optional(),
  managerEmployeeId: z.string().uuid().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");
  let path = "/";
  let depth = 0;
  if (body.parentDepartmentId) {
    const [parent] = await db.select({ path: departments.path, depth: departments.depth })
      .from(departments).where(eq(departments.id, body.parentDepartmentId)).limit(1);
    if (parent) {
      path = `${parent.path}${body.parentDepartmentId}/`;
      depth = (parent.depth || 0) + 1;
    }
  }
  const [d] = await db.insert(departments).values({
    tenantId, ...body,
    budgetAnnual: body.budgetAnnual?.toString(), path, depth,
  }).returning();
  return c.json({ success: true, data: d }, 201);
});

hrRoutes.get("/cost-centers", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(costCenters).where(eq(costCenters.tenantId, tenantId));
  return c.json({ success: true, data: list });
});

// ═══════════════════════════════════════════════════════════
// 2. JOB CATALOG
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/job-families", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(jobFamilies).where(eq(jobFamilies.tenantId, tenantId));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/job-families", zValidator("json", z.object({
  code: z.string(), name: z.string(), description: z.string().optional(), function: z.string().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const [j] = await db.insert(jobFamilies).values({ tenantId, ...c.req.valid("json") }).returning();
  return c.json({ success: true, data: j }, 201);
});

hrRoutes.get("/job-profiles", async (c) => {
  const tenantId = c.get("tenantId");
  const familyId = c.req.query("familyId");
  const conds: any[] = [eq(jobProfiles.tenantId, tenantId)];
  if (familyId) conds.push(eq(jobProfiles.jobFamilyId, familyId));
  const list = await db.select().from(jobProfiles).where(and(...conds)).orderBy(jobProfiles.title);
  return c.json({ success: true, data: list });
});

hrRoutes.post("/job-profiles", zValidator("json", z.object({
  jobFamilyId: z.string().uuid().optional(),
  code: z.string(), title: z.string(),
  shortDescription: z.string().optional(),
  fullDescription: z.string().optional(),
  level: z.string().optional(),
  flsa: z.string().optional(),
  occupationCode: z.string().optional(),
  responsibilities: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  qualifications: z.array(z.string()).optional(),
  skillsRequired: z.array(z.any()).optional(),
  competencies: z.array(z.any()).optional(),
  payGradeId: z.string().uuid().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");
  const [jp] = await db.insert(jobProfiles).values({ tenantId, ...body }).returning();
  return c.json({ success: true, data: jp }, 201);
});

hrRoutes.get("/pay-grades", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(payGrades).where(eq(payGrades.tenantId, tenantId)).orderBy(payGrades.minSalary);
  return c.json({ success: true, data: list });
});

hrRoutes.post("/pay-grades", zValidator("json", z.object({
  legalEntityId: z.string().uuid().optional(),
  code: z.string(), name: z.string(),
  minSalary: z.number(), midSalary: z.number().optional(), maxSalary: z.number(),
  currency: z.string().default("RON"),
  payFrequency: z.string().default("annual"),
  bonusTargetPercent: z.number().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");
  const [g] = await db.insert(payGrades).values({
    tenantId, ...body,
    minSalary: body.minSalary.toString(),
    midSalary: body.midSalary?.toString(),
    maxSalary: body.maxSalary.toString(),
    bonusTargetPercent: body.bonusTargetPercent?.toString(),
  }).returning();
  return c.json({ success: true, data: g }, 201);
});

hrRoutes.get("/positions", async (c) => {
  const tenantId = c.get("tenantId");
  const status = c.req.query("status");
  const departmentId = c.req.query("departmentId");
  const conds: any[] = [eq(positions.tenantId, tenantId)];
  if (status) conds.push(eq(positions.status, status));
  if (departmentId) conds.push(eq(positions.departmentId, departmentId));
  const list = await db.select().from(positions).where(and(...conds));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/positions", zValidator("json", z.object({
  legalEntityId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  jobProfileId: z.string().uuid().optional(),
  reportsToPositionId: z.string().uuid().optional(),
  positionNumber: z.string(),
  businessTitle: z.string().optional(),
  type: z.string().default("regular"),
  ftePercent: z.number().default(100),
  hoursPerWeek: z.number().default(40),
  isManager: z.boolean().default(false),
  budgetSalary: z.number().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");
  const [p] = await db.insert(positions).values({
    tenantId, ...body,
    ftePercent: body.ftePercent.toString(),
    hoursPerWeek: body.hoursPerWeek.toString(),
    budgetSalary: body.budgetSalary?.toString(),
  }).returning();
  return c.json({ success: true, data: p }, 201);
});

// ═══════════════════════════════════════════════════════════
// 3. EMPLOYEES
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/employees", async (c) => {
  const tenantId = c.get("tenantId");
  const search = c.req.query("q");
  const status = c.req.query("status");
  const departmentId = c.req.query("departmentId");
  const managerId = c.req.query("managerId");
  const limit = parseInt(c.req.query("limit") || "100");
  const offset = parseInt(c.req.query("offset") || "0");

  const conds: any[] = [eq(employees.tenantId, tenantId)];
  if (status) conds.push(eq(employees.status, status as any));
  if (departmentId) conds.push(eq(employees.currentDepartmentId, departmentId));
  if (managerId) conds.push(eq(employees.currentManagerId, managerId));
  if (search) conds.push(sql`(${employees.firstName} ILIKE ${"%" + search + "%"} OR ${employees.lastName} ILIKE ${"%" + search + "%"} OR ${employees.workEmail} ILIKE ${"%" + search + "%"} OR ${employees.employeeNumber} ILIKE ${"%" + search + "%"})`);

  const list = await db.select({
    id: employees.id, employeeNumber: employees.employeeNumber, firstName: employees.firstName,
    lastName: employees.lastName, preferredName: employees.preferredName,
    workEmail: employees.workEmail, workPhone: employees.workPhone, photoUrl: employees.photoUrl,
    currentJobTitle: employees.currentJobTitle, currentDepartmentId: employees.currentDepartmentId,
    currentLocationId: employees.currentLocationId, currentManagerId: employees.currentManagerId,
    status: employees.status, hireDate: employees.hireDate,
    workerType: employees.workerType, isPublicProfile: employees.isPublicProfile,
  }).from(employees).where(and(...conds))
    .orderBy(employees.lastName, employees.firstName)
    .limit(limit).offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(employees).where(and(...conds));
  return c.json({ success: true, data: list, meta: { total: Number(total), limit, offset } });
});

hrRoutes.post("/employees", zValidator("json", z.object({
  userId: z.string().uuid().optional(),
  legalEntityId: z.string().uuid().optional(),
  employeeNumber: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  preferredName: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  workEmail: z.string().email().optional(),
  workPhone: z.string().optional(),
  personalEmail: z.string().email().optional(),
  personalPhone: z.string().optional(),
  workerType: z.enum(["regular", "fixed_term", "intern", "apprentice", "seasonal", "contractor", "consultant", "agency", "temp"]).default("regular"),
  hireDate: z.string().optional(),
  positionId: z.string().uuid().optional(),
  jobTitle: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  baseSalary: z.number().optional(),
  salaryCurrency: z.string().default("RON"),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const result = await db.transaction(async (tx) => {
    const [emp] = await tx.insert(employees).values({
      tenantId, userId: body.userId, legalEntityId: body.legalEntityId,
      employeeNumber: body.employeeNumber, firstName: body.firstName, lastName: body.lastName,
      middleName: body.middleName, preferredName: body.preferredName,
      gender: body.gender, dateOfBirth: body.dateOfBirth as any, nationality: body.nationality,
      workEmail: body.workEmail, workPhone: body.workPhone,
      personalEmail: body.personalEmail, personalPhone: body.personalPhone,
      workerType: body.workerType,
      hireDate: body.hireDate as any, originalHireDate: body.hireDate as any,
      currentPositionId: body.positionId, currentJobTitle: body.jobTitle,
      currentDepartmentId: body.departmentId, currentLocationId: body.locationId,
      currentManagerId: body.managerId,
      currentSalary: body.baseSalary?.toString(), currentSalaryCurrency: body.salaryCurrency,
      status: "active",
    }).returning();

    // Create initial employment history
    await tx.insert(employmentHistory).values({
      tenantId, employeeId: emp!.id,
      effectiveDate: (body.hireDate || new Date().toISOString().slice(0, 10)) as any,
      reason: "hire",
      positionId: body.positionId, jobTitle: body.jobTitle,
      legalEntityId: body.legalEntityId, departmentId: body.departmentId,
      locationId: body.locationId, managerEmployeeId: body.managerId,
      workerType: body.workerType,
      baseSalary: body.baseSalary?.toString(), salaryCurrency: body.salaryCurrency,
      initiatedBy: user.id,
    });

    // Initial compensation plan
    if (body.baseSalary) {
      await tx.insert(compensationPlans).values({
        tenantId, employeeId: emp!.id,
        effectiveDate: (body.hireDate || new Date().toISOString().slice(0, 10)) as any,
        reason: "hire", baseSalary: body.baseSalary.toString(), baseCurrency: body.salaryCurrency,
        status: "active", createdBy: user.id,
      });
    }

    if (body.positionId) {
      await tx.update(positions).set({
        status: "filled", occupiedByEmployeeId: emp!.id,
      }).where(eq(positions.id, body.positionId));
    }

    return emp!;
  });

  return c.json({ success: true, data: result }, 201);
});

hrRoutes.get("/employees/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const [emp] = await db.select().from(employees).where(and(eq(employees.id, id), eq(employees.tenantId, tenantId))).limit(1);
  if (!emp) throw new AppError(404, "NOT_FOUND", "Angajat negăsit");
  const [addrs, contacts, deps, payments, taxInfos] = await Promise.all([
    db.select().from(employeeAddresses).where(eq(employeeAddresses.employeeId, id)),
    db.select().from(emergencyContacts).where(eq(emergencyContacts.employeeId, id)),
    db.select().from(dependents).where(eq(dependents.employeeId, id)),
    db.select().from(employeePaymentMethods).where(eq(employeePaymentMethods.employeeId, id)),
    db.select().from(employeeTaxInfo).where(eq(employeeTaxInfo.employeeId, id)),
  ]);
  return c.json({
    success: true,
    data: { ...emp, addresses: addrs, emergencyContacts: contacts, dependents: deps, paymentMethods: payments, taxInfo: taxInfos },
  });
});

hrRoutes.patch("/employees/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const [updated] = await db.update(employees).set({ ...body, updatedAt: new Date() })
    .where(and(eq(employees.id, id), eq(employees.tenantId, tenantId))).returning();
  if (!updated) throw new AppError(404, "NOT_FOUND", "Angajat negăsit");
  return c.json({ success: true, data: updated });
});

hrRoutes.get("/employees/:id/history", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const list = await db.select().from(employmentHistory)
    .where(and(eq(employmentHistory.employeeId, id), eq(employmentHistory.tenantId, tenantId)))
    .orderBy(desc(employmentHistory.effectiveDate));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/employees/:id/history", zValidator("json", z.object({
  effectiveDate: z.string(),
  reason: z.enum([
    "hire", "rehire", "promotion", "demotion", "lateral", "transfer",
    "reorganization", "data_change", "name_change", "job_change",
    "manager_change", "department_change", "location_change",
    "compensation_change", "fte_change", "leave_start", "leave_end",
    "suspension", "termination", "retirement", "deceased", "title_change", "contract_extension",
  ]),
  positionId: z.string().uuid().optional(),
  jobProfileId: z.string().uuid().optional(),
  jobTitle: z.string().optional(),
  legalEntityId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  managerEmployeeId: z.string().uuid().optional(),
  workerType: z.string().optional(),
  ftePercent: z.number().optional(),
  baseSalary: z.number().optional(),
  salaryCurrency: z.string().optional(),
  notes: z.string().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [h] = await db.insert(employmentHistory).values({
    tenantId, employeeId: id, ...body,
    effectiveDate: body.effectiveDate as any,
    workerType: body.workerType as any,
    ftePercent: body.ftePercent?.toString(),
    baseSalary: body.baseSalary?.toString(),
    initiatedBy: user.id,
  }).returning();

  // Update current snapshot if applicable
  await db.update(employees).set({
    currentJobTitle: body.jobTitle ?? undefined,
    currentDepartmentId: body.departmentId ?? undefined,
    currentLocationId: body.locationId ?? undefined,
    currentManagerId: body.managerEmployeeId ?? undefined,
    currentPositionId: body.positionId ?? undefined,
    currentSalary: body.baseSalary?.toString() ?? undefined,
    currentSalaryCurrency: body.salaryCurrency ?? undefined,
    updatedAt: new Date(),
  }).where(eq(employees.id, id));

  return c.json({ success: true, data: h }, 201);
});

hrRoutes.post("/employees/:id/terminate", zValidator("json", z.object({
  terminationDate: z.string(),
  terminationType: z.enum(["voluntary", "involuntary", "retirement", "mutual"]),
  reason: z.string(),
  isRehirable: z.boolean().default(true),
  notes: z.string().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  await db.transaction(async (tx) => {
    await tx.update(employees).set({
      status: "terminated", terminationDate: body.terminationDate as any,
      terminationType: body.terminationType, terminationReason: body.reason,
      isRehirable: body.isRehirable,
    }).where(and(eq(employees.id, id), eq(employees.tenantId, tenantId)));
    await tx.insert(employmentHistory).values({
      tenantId, employeeId: id,
      effectiveDate: body.terminationDate as any, reason: "termination",
      notes: body.notes || body.reason, initiatedBy: user.id,
    });
    const [emp] = await tx.select({ positionId: employees.currentPositionId }).from(employees).where(eq(employees.id, id)).limit(1);
    if (emp?.positionId) {
      await tx.update(positions).set({
        status: "vacant", occupiedByEmployeeId: null, vacatedAt: new Date(),
      }).where(eq(positions.id, emp.positionId));
    }
  });
  return c.json({ success: true });
});

// Addresses
hrRoutes.post("/employees/:id/addresses", zValidator("json", z.object({
  type: z.string().default("home"),
  isPrimary: z.boolean().default(false),
  street1: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
})), async (c) => {
  const id = c.req.param("id");
  const [a] = await db.insert(employeeAddresses).values({ employeeId: id, ...c.req.valid("json") }).returning();
  return c.json({ success: true, data: a }, 201);
});

// Emergency contacts
hrRoutes.post("/employees/:id/emergency-contacts", zValidator("json", z.object({
  name: z.string(),
  relationship: z.string().optional(),
  isPrimary: z.boolean().default(false),
  phonePrimary: z.string().optional(),
  email: z.string().email().optional(),
})), async (c) => {
  const id = c.req.param("id");
  const [e] = await db.insert(emergencyContacts).values({ employeeId: id, ...c.req.valid("json") }).returning();
  return c.json({ success: true, data: e }, 201);
});

// Dependents
hrRoutes.post("/employees/:id/dependents", zValidator("json", z.object({
  firstName: z.string(), lastName: z.string(),
  relationship: z.string(), dateOfBirth: z.string().optional(),
})), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [d] = await db.insert(dependents).values({
    employeeId: id, ...body, dateOfBirth: body.dateOfBirth as any,
  }).returning();
  return c.json({ success: true, data: d }, 201);
});

// ═══════════════════════════════════════════════════════════
// ORG CHART
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/org-chart", async (c) => {
  const tenantId = c.get("tenantId");
  const rootEmployeeId = c.req.query("rootEmployeeId");
  const list = await db.select({
    id: employees.id, firstName: employees.firstName, lastName: employees.lastName,
    preferredName: employees.preferredName, workEmail: employees.workEmail,
    photoUrl: employees.photoUrl, currentJobTitle: employees.currentJobTitle,
    currentManagerId: employees.currentManagerId, currentDepartmentId: employees.currentDepartmentId,
    status: employees.status,
  }).from(employees).where(and(
    eq(employees.tenantId, tenantId), eq(employees.status, "active"),
  ));

  const byManager = new Map<string | null, any[]>();
  for (const e of list) {
    const k = e.currentManagerId || null;
    if (!byManager.has(k)) byManager.set(k, []);
    byManager.get(k)!.push(e);
  }
  const buildTree = (parentId: string | null): any[] =>
    (byManager.get(parentId) || []).map((e) => ({ ...e, reports: buildTree(e.id) }));

  const tree = rootEmployeeId
    ? list.filter((e) => e.id === rootEmployeeId).map((e) => ({ ...e, reports: buildTree(e.id) }))
    : buildTree(null);

  return c.json({ success: true, data: tree });
});

// ═══════════════════════════════════════════════════════════
// 4. COMPENSATION
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/employees/:id/compensation", async (c) => {
  const id = c.req.param("id");
  const list = await db.select().from(compensationPlans)
    .where(eq(compensationPlans.employeeId, id))
    .orderBy(desc(compensationPlans.effectiveDate));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/employees/:id/compensation", zValidator("json", z.object({
  effectiveDate: z.string(),
  reason: z.string(),
  baseSalary: z.number(),
  baseCurrency: z.string().default("RON"),
  payFrequency: z.string().default("monthly"),
  bonusTargetPercent: z.number().optional(),
  bonusTargetAmount: z.number().optional(),
  equityShares: z.number().int().optional(),
  equityType: z.string().optional(),
  notes: z.string().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const result = await db.transaction(async (tx) => {
    const [plan] = await tx.insert(compensationPlans).values({
      tenantId, employeeId: id, ...body,
      effectiveDate: body.effectiveDate as any,
      baseSalary: body.baseSalary.toString(),
      bonusTargetPercent: body.bonusTargetPercent?.toString(),
      bonusTargetAmount: body.bonusTargetAmount?.toString(),
      status: "approved", approvedBy: user.id, approvedAt: new Date(), createdBy: user.id,
    }).returning();
    await tx.update(employees).set({
      currentSalary: body.baseSalary.toString(),
      currentSalaryCurrency: body.baseCurrency,
      currentSalaryFrequency: body.payFrequency,
    }).where(eq(employees.id, id));
    await tx.insert(employmentHistory).values({
      tenantId, employeeId: id,
      effectiveDate: body.effectiveDate as any, reason: "compensation_change",
      baseSalary: body.baseSalary.toString(), salaryCurrency: body.baseCurrency,
      salaryFrequency: body.payFrequency, notes: body.notes, initiatedBy: user.id,
    });
    return plan!;
  });

  return c.json({ success: true, data: result }, 201);
});

hrRoutes.post("/employees/:id/bonuses", zValidator("json", z.object({
  type: z.string(),
  amount: z.number(),
  currency: z.string().default("RON"),
  reason: z.string().optional(),
  payoutDate: z.string().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [b] = await db.insert(bonuses).values({
    tenantId, employeeId: id, ...body,
    amount: body.amount.toString(),
    payoutDate: body.payoutDate as any, approvedBy: user.id, approvedAt: new Date(),
  }).returning();
  return c.json({ success: true, data: b }, 201);
});

// ═══════════════════════════════════════════════════════════
// 5. BENEFITS
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/benefit-plans", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(benefitPlans).where(eq(benefitPlans.tenantId, tenantId));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/benefit-plans", zValidator("json", z.object({
  legalEntityId: z.string().uuid().optional(),
  code: z.string(), name: z.string(),
  category: z.string(), type: z.string().optional(),
  carrier: z.string().optional(), policyNumber: z.string().optional(),
  description: z.string().optional(),
  employeeMonthlyCost: z.number().optional(),
  employerMonthlyCost: z.number().optional(),
  costPerDependent: z.number().optional(),
  currency: z.string().default("RON"),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");
  const [p] = await db.insert(benefitPlans).values({
    tenantId, ...body,
    employeeMonthlyCost: body.employeeMonthlyCost?.toString(),
    employerMonthlyCost: body.employerMonthlyCost?.toString(),
    costPerDependent: body.costPerDependent?.toString(),
  }).returning();
  return c.json({ success: true, data: p }, 201);
});

hrRoutes.get("/employees/:id/benefits", async (c) => {
  const id = c.req.param("id");
  const list = await db.select().from(benefitEnrollments).where(eq(benefitEnrollments.employeeId, id));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/employees/:id/benefits", zValidator("json", z.object({
  benefitPlanId: z.string().uuid(),
  coverageLevel: z.string().default("employee_only"),
  coveredDependentIds: z.array(z.string().uuid()).optional(),
  contributionAmount: z.number().optional(),
  effectiveFrom: z.string().optional(),
})), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [e] = await db.insert(benefitEnrollments).values({
    employeeId: id, ...body,
    contributionAmount: body.contributionAmount?.toString(),
    effectiveFrom: body.effectiveFrom as any,
  }).returning();
  return c.json({ success: true, data: e }, 201);
});

// ═══════════════════════════════════════════════════════════
// 6. LEAVES
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/leave-policies", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(leavePolicies).where(eq(leavePolicies.tenantId, tenantId));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/leave-policies", zValidator("json", z.object({
  legalEntityId: z.string().uuid().optional(),
  code: z.string(), name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  accrualType: z.string().default("annual_grant"),
  accrualAmount: z.number().optional(),
  accrualUnit: z.string().default("days"),
  isPaid: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  minDaysAdvanceNotice: z.number().int().default(0),
  maxConsecutiveDays: z.number().int().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");
  const [p] = await db.insert(leavePolicies).values({
    tenantId, ...body, type: body.type as any,
    accrualAmount: body.accrualAmount?.toString(),
  }).returning();
  return c.json({ success: true, data: p }, 201);
});

hrRoutes.get("/employees/:id/leave-balances", async (c) => {
  const id = c.req.param("id");
  const year = parseInt(c.req.query("year") || String(new Date().getFullYear()));
  const list = await db.select().from(leaveBalances).where(and(
    eq(leaveBalances.employeeId, id), eq(leaveBalances.year, year),
  ));
  return c.json({ success: true, data: list });
});

hrRoutes.get("/leaves", async (c) => {
  const tenantId = c.get("tenantId");
  const status = c.req.query("status");
  const employeeId = c.req.query("employeeId");
  const conds: any[] = [eq(leaveRequests.tenantId, tenantId)];
  if (status) conds.push(eq(leaveRequests.status, status as any));
  if (employeeId) conds.push(eq(leaveRequests.employeeId, employeeId));
  const list = await db.select({
    id: leaveRequests.id, employeeId: leaveRequests.employeeId,
    leavePolicyId: leaveRequests.leavePolicyId, startDate: leaveRequests.startDate,
    endDate: leaveRequests.endDate, totalDays: leaveRequests.totalDays,
    reason: leaveRequests.reason, status: leaveRequests.status,
    approverEmployeeId: leaveRequests.approverEmployeeId,
    decisionAt: leaveRequests.decisionAt, createdAt: leaveRequests.createdAt,
    employeeFirstName: employees.firstName, employeeLastName: employees.lastName,
    employeePhoto: employees.photoUrl,
  }).from(leaveRequests)
    .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .where(and(...conds)).orderBy(desc(leaveRequests.createdAt));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/leaves", zValidator("json", z.object({
  employeeId: z.string().uuid(),
  leavePolicyId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  isHalfDayStart: z.boolean().default(false),
  isHalfDayEnd: z.boolean().default(false),
  totalDays: z.number(),
  reason: z.string().optional(),
  delegatedToEmployeeId: z.string().uuid().optional(),
  outOfOfficeMessage: z.string().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");
  const [r] = await db.insert(leaveRequests).values({
    tenantId, ...body,
    startDate: body.startDate as any, endDate: body.endDate as any,
    totalDays: body.totalDays.toString(),
  }).returning();
  return c.json({ success: true, data: r }, 201);
});

hrRoutes.post("/leaves/:id/approve", zValidator("json", z.object({
  notes: z.string().optional(),
})), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [r] = await db.update(leaveRequests).set({
    status: "approved", decisionAt: new Date(), decisionNotes: body.notes,
  }).where(eq(leaveRequests.id, id)).returning();
  return c.json({ success: true, data: r });
});

hrRoutes.post("/leaves/:id/reject", zValidator("json", z.object({
  notes: z.string().optional(),
})), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [r] = await db.update(leaveRequests).set({
    status: "rejected", decisionAt: new Date(), decisionNotes: body.notes,
  }).where(eq(leaveRequests.id, id)).returning();
  return c.json({ success: true, data: r });
});

hrRoutes.post("/leaves/:id/cancel", async (c) => {
  const id = c.req.param("id");
  const [r] = await db.update(leaveRequests).set({
    status: "cancelled", cancelledAt: new Date(),
  }).where(eq(leaveRequests.id, id)).returning();
  return c.json({ success: true, data: r });
});

hrRoutes.get("/holidays", async (c) => {
  const tenantId = c.get("tenantId");
  const year = parseInt(c.req.query("year") || String(new Date().getFullYear()));
  const list = await db.select().from(holidays).where(and(
    eq(holidays.tenantId, tenantId),
    gte(holidays.date, `${year}-01-01`),
    lte(holidays.date, `${year}-12-31`),
  )).orderBy(holidays.date);
  return c.json({ success: true, data: list });
});

// ═══════════════════════════════════════════════════════════
// 7. TIME & ATTENDANCE
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/timesheets/:employeeId", async (c) => {
  const empId = c.req.param("employeeId");
  const list = await db.select().from(timesheets).where(eq(timesheets.employeeId, empId))
    .orderBy(desc(timesheets.periodStart));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/timesheets", zValidator("json", z.object({
  employeeId: z.string().uuid(),
  periodStart: z.string(),
  periodEnd: z.string(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");
  const [t] = await db.insert(timesheets).values({
    tenantId, ...body,
    periodStart: body.periodStart as any, periodEnd: body.periodEnd as any,
  }).returning();
  return c.json({ success: true, data: t }, 201);
});

hrRoutes.post("/timesheets/:id/entries", zValidator("json", z.object({
  date: z.string(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  totalMinutes: z.number().int(),
  type: z.string().default("regular"),
  projectId: z.string().uuid().optional(),
  notes: z.string().optional(),
})), async (c) => {
  const tsId = c.req.param("id");
  const body = c.req.valid("json");
  const [ts] = await db.select({ employeeId: timesheets.employeeId }).from(timesheets).where(eq(timesheets.id, tsId)).limit(1);
  if (!ts) throw new AppError(404, "NOT_FOUND", "Timesheet negăsit");
  const [e] = await db.insert(timeEntries).values({
    timesheetId: tsId, employeeId: ts.employeeId,
    date: body.date as any,
    startTime: body.startTime ? new Date(body.startTime) : null,
    endTime: body.endTime ? new Date(body.endTime) : null,
    totalMinutes: body.totalMinutes, type: body.type, projectId: body.projectId, notes: body.notes,
  }).returning();
  return c.json({ success: true, data: e }, 201);
});

hrRoutes.post("/timesheets/:id/submit", async (c) => {
  const id = c.req.param("id");
  const [t] = await db.update(timesheets).set({
    status: "submitted", submittedAt: new Date(),
  }).where(eq(timesheets.id, id)).returning();
  return c.json({ success: true, data: t });
});

// ═══════════════════════════════════════════════════════════
// 8. PERFORMANCE — cycles, goals, reviews, calibration
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/performance/cycles", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(performanceCycles).where(eq(performanceCycles.tenantId, tenantId)).orderBy(desc(performanceCycles.year));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/performance/cycles", zValidator("json", z.object({
  name: z.string(), type: z.string().default("annual"),
  year: z.number().int(),
  goalSettingStart: z.string().optional(),
  goalSettingEnd: z.string().optional(),
  selfReviewStart: z.string().optional(),
  selfReviewEnd: z.string().optional(),
  managerReviewStart: z.string().optional(),
  managerReviewEnd: z.string().optional(),
  ratingMethod: z.string().default("5_point"),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [cy] = await db.insert(performanceCycles).values({
    tenantId, ...body, createdBy: user.id,
    goalSettingStart: body.goalSettingStart as any,
    goalSettingEnd: body.goalSettingEnd as any,
    selfReviewStart: body.selfReviewStart as any,
    selfReviewEnd: body.selfReviewEnd as any,
    managerReviewStart: body.managerReviewStart as any,
    managerReviewEnd: body.managerReviewEnd as any,
  }).returning();
  return c.json({ success: true, data: cy }, 201);
  });

hrRoutes.get("/goals", async (c) => {
  const tenantId = c.get("tenantId");
  const employeeId = c.req.query("employeeId");
  const cycleId = c.req.query("cycleId");
  const conds: any[] = [eq(goals.tenantId, tenantId)];
  if (employeeId) conds.push(eq(goals.employeeId, employeeId));
  if (cycleId) conds.push(eq(goals.performanceCycleId, cycleId));
  const list = await db.select().from(goals).where(and(...conds)).orderBy(desc(goals.createdAt));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/goals", zValidator("json", z.object({
  employeeId: z.string().uuid(),
  performanceCycleId: z.string().uuid().optional(),
  parentGoalId: z.string().uuid().optional(),
  title: z.string(),
  description: z.string().optional(),
  category: z.enum(["performance", "development", "okr_objective", "okr_key_result", "team", "company", "stretch", "behavioral", "competency"]).default("performance"),
  metricType: z.string().optional(),
  targetValue: z.number().optional(),
  startValue: z.number().optional(),
  weight: z.number().default(1),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [g] = await db.insert(goals).values({
    tenantId, ...body, createdBy: user.id,
    targetValue: body.targetValue?.toString(),
    startValue: body.startValue?.toString(),
    weight: body.weight.toString(),
    startDate: body.startDate as any, dueDate: body.dueDate as any,
  }).returning();
  return c.json({ success: true, data: g }, 201);
});

hrRoutes.post("/goals/:id/update", zValidator("json", z.object({
  newValue: z.number().optional(),
  newProgressPercent: z.number().int().optional(),
  newStatus: z.string().optional(),
  comment: z.string().optional(),
})), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [u] = await db.insert(goalUpdates).values({
    goalId: id, ...body,
    newValue: body.newValue?.toString(), createdBy: user.id,
  }).returning();
  await db.update(goals).set({
    currentValue: body.newValue?.toString(),
    progressPercent: body.newProgressPercent,
    status: body.newStatus || undefined,
    updatedAt: new Date(),
  }).where(eq(goals.id, id));
  return c.json({ success: true, data: u });
});

hrRoutes.get("/reviews", async (c) => {
  const tenantId = c.get("tenantId");
  const employeeId = c.req.query("employeeId");
  const cycleId = c.req.query("cycleId");
  const conds: any[] = [eq(reviews.tenantId, tenantId)];
  if (employeeId) conds.push(eq(reviews.employeeId, employeeId));
  if (cycleId) conds.push(eq(reviews.performanceCycleId, cycleId));
  const list = await db.select().from(reviews).where(and(...conds));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/reviews", zValidator("json", z.object({
  performanceCycleId: z.string().uuid().optional(),
  reviewTemplateId: z.string().uuid().optional(),
  employeeId: z.string().uuid(),
  reviewerId: z.string().uuid().optional(),
  reviewType: z.string(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");
  const [r] = await db.insert(reviews).values({ tenantId, ...body }).returning();
  return c.json({ success: true, data: r }, 201);
});

hrRoutes.patch("/reviews/:id", zValidator("json", z.object({
  responses: z.record(z.unknown()).optional(),
  overallRating: z.number().optional(),
  performanceRating: z.number().optional(),
  potentialRating: z.number().optional(),
  ratingLabel: z.string().optional(),
  nineBoxPerformance: z.number().int().optional(),
  nineBoxPotential: z.number().int().optional(),
  strengths: z.string().optional(),
  developmentAreas: z.string().optional(),
  managerComments: z.string().optional(),
  employeeComments: z.string().optional(),
  status: z.string().optional(),
})), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [r] = await db.update(reviews).set({
    ...body,
    overallRating: body.overallRating?.toString() ?? undefined,
    performanceRating: body.performanceRating?.toString() ?? undefined,
    potentialRating: body.potentialRating?.toString() ?? undefined,
    updatedAt: new Date(),
  } as any).where(eq(reviews.id, id)).returning();
  return c.json({ success: true, data: r });
});

// ═══════════════════════════════════════════════════════════
// 9. LEARNING & DEVELOPMENT
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/learning/courses", async (c) => {
  const tenantId = c.get("tenantId");
  const search = c.req.query("q");
  const category = c.req.query("category");
  const conds: any[] = [eq(learningCourses.tenantId, tenantId)];
  if (search) conds.push(sql`${learningCourses.title} ILIKE ${"%" + search + "%"}`);
  if (category) conds.push(eq(learningCourses.category, category));
  const list = await db.select().from(learningCourses).where(and(...conds)).orderBy(desc(learningCourses.createdAt));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/learning/courses", zValidator("json", z.object({
  code: z.string(), title: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  level: z.string().optional(),
  language: z.string().default("ro"),
  format: z.string().default("self_paced"),
  durationMinutes: z.number().int().optional(),
  isMandatory: z.boolean().default(false),
  modules: z.array(z.any()).optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [c2] = await db.insert(learningCourses).values({
    tenantId, ...body, createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: c2 }, 201);
});

hrRoutes.get("/employees/:id/enrollments", async (c) => {
  const id = c.req.param("id");
  const list = await db.select().from(enrollments).where(eq(enrollments.employeeId, id));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/learning/enroll", zValidator("json", z.object({
  employeeId: z.string().uuid(),
  courseId: z.string().uuid().optional(),
  learningPathId: z.string().uuid().optional(),
  enrollmentType: z.string().default("self"),
  dueDate: z.string().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [e] = await db.insert(enrollments).values({
    tenantId, ...body, dueDate: body.dueDate as any, assignedBy: user.id,
  }).returning();
  return c.json({ success: true, data: e }, 201);
});

hrRoutes.post("/learning/enrollments/:id/complete", zValidator("json", z.object({
  score: z.number().optional(),
  passed: z.boolean().optional(),
})), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [e] = await db.update(enrollments).set({
    status: "completed", completedAt: new Date(),
    score: body.score?.toString(), passed: body.passed,
    progressPercent: 100,
  }).where(eq(enrollments.id, id)).returning();
  return c.json({ success: true, data: e });
});

hrRoutes.post("/employees/:id/certifications", zValidator("json", z.object({
  name: z.string(),
  issuer: z.string().optional(),
  certificationNumber: z.string().optional(),
  certificationUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  issuedDate: z.string().optional(),
  expiresDate: z.string().optional(),
  category: z.string().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [cert] = await db.insert(certifications).values({
    tenantId, employeeId: id, ...body,
    issuedDate: body.issuedDate as any, expiresDate: body.expiresDate as any,
  }).returning();
  return c.json({ success: true, data: cert }, 201);
});

// ═══════════════════════════════════════════════════════════
// 10. RECRUITMENT (ATS)
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/recruiting/requisitions", async (c) => {
  const tenantId = c.get("tenantId");
  const status = c.req.query("status");
  const conds: any[] = [eq(jobRequisitions.tenantId, tenantId)];
  if (status) conds.push(eq(jobRequisitions.status, status as any));
  const list = await db.select().from(jobRequisitions).where(and(...conds)).orderBy(desc(jobRequisitions.createdAt));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/recruiting/requisitions", zValidator("json", z.object({
  requisitionNumber: z.string(),
  positionId: z.string().uuid().optional(),
  jobProfileId: z.string().uuid().optional(),
  legalEntityId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  hiringManagerId: z.string().uuid().optional(),
  recruiterId: z.string().uuid().optional(),
  numberOfOpenings: z.number().int().default(1),
  isReplacement: z.boolean().default(false),
  reason: z.string().optional(),
  budgetSalaryMin: z.number().optional(),
  budgetSalaryMax: z.number().optional(),
  budgetCurrency: z.string().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");
  const [r] = await db.insert(jobRequisitions).values({
    tenantId, ...body,
    budgetSalaryMin: body.budgetSalaryMin?.toString(),
    budgetSalaryMax: body.budgetSalaryMax?.toString(),
  }).returning();
  return c.json({ success: true, data: r }, 201);
});

hrRoutes.get("/recruiting/jobs", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(jobPostings).where(eq(jobPostings.tenantId, tenantId)).orderBy(desc(jobPostings.createdAt));
  const withCounts = await Promise.all(list.map(async (j) => {
    const [{ cnt }] = await db.select({ cnt: count() }).from(applications).where(eq(applications.jobPostingId, j.id));
    return { ...j, applicationCount: Number(cnt) };
  }));
  return c.json({ success: true, data: withCounts });
});

hrRoutes.post("/recruiting/jobs", zValidator("json", z.object({
  requisitionId: z.string().uuid().optional(),
  title: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  department: z.string().optional(),
  location: z.string().optional(),
  workArrangement: z.string().default("on_site"),
  type: z.string().default("full_time"),
  description: z.string().optional(),
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
  whatWeOffer: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().optional(),
  showSalary: z.boolean().default(false),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [j] = await db.insert(jobPostings).values({
    tenantId, ...body,
    salaryMin: body.salaryMin?.toString(),
    salaryMax: body.salaryMax?.toString(),
    createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: j }, 201);
});

hrRoutes.post("/recruiting/jobs/:id/publish", async (c) => {
  const id = c.req.param("id");
  await db.update(jobPostings).set({
    status: "open", publishedAt: new Date(),
  }).where(eq(jobPostings.id, id));
  return c.json({ success: true });
});

hrRoutes.get("/recruiting/jobs/:id/applications", async (c) => {
  const id = c.req.param("id");
  const list = await db.select({
    id: applications.id, status: applications.status, appliedAt: applications.appliedAt,
    matchScore: applications.matchScore, starRating: applications.starRating,
    candidate: {
      id: candidates.id, firstName: candidates.firstName, lastName: candidates.lastName,
      email: candidates.email, phone: candidates.phone, currentJobTitle: candidates.currentJobTitle,
      currentCompany: candidates.currentCompany, yearsOfExperience: candidates.yearsOfExperience,
    },
  }).from(applications)
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .where(eq(applications.jobPostingId, id))
    .orderBy(desc(applications.appliedAt));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/recruiting/applications", zValidator("json", z.object({
  jobPostingId: z.string().uuid(),
  candidate: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    linkedinUrl: z.string().optional(),
    currentJobTitle: z.string().optional(),
    currentCompany: z.string().optional(),
    yearsOfExperience: z.number().int().optional(),
    expectedSalary: z.number().optional(),
  }),
  resumeUrl: z.string().optional(),
  coverLetter: z.string().optional(),
  source: z.string().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");

  let cand = (await db.select().from(candidates).where(and(
    eq(candidates.tenantId, tenantId), eq(candidates.email, body.candidate.email),
  )).limit(1))[0];

  if (!cand) {
    const [newCand] = await db.insert(candidates).values({
      tenantId,
      ...body.candidate,
      expectedSalary: body.candidate.expectedSalary?.toString(),
      source: body.source, consentToProcess: true,
    }).returning();
    cand = newCand!;
  }

  const [app] = await db.insert(applications).values({
    tenantId, jobPostingId: body.jobPostingId, candidateId: cand.id,
    resumeUrl: body.resumeUrl, coverLetter: body.coverLetter,
    source: body.source, status: "applied",
  }).returning();

  await db.update(jobPostings).set({
    applicationCount: sql`${jobPostings.applicationCount} + 1`,
  }).where(eq(jobPostings.id, body.jobPostingId));

  return c.json({ success: true, data: app }, 201);
});

hrRoutes.patch("/recruiting/applications/:id", zValidator("json", z.object({
  status: z.string().optional(),
  starRating: z.number().int().optional(),
  notes: z.string().optional(),
})), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [a] = await db.update(applications).set({
    ...body, status: body.status as any, updatedAt: new Date(),
  }).where(eq(applications.id, id)).returning();
  return c.json({ success: true, data: a });
});

hrRoutes.post("/recruiting/applications/:id/reject", zValidator("json", z.object({
  reason: z.string(),
  stage: z.string().optional(),
})), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [a] = await db.update(applications).set({
    status: "rejected", rejectedAt: new Date(),
    rejectionReason: body.reason, rejectionStage: body.stage,
    rejectedBy: user.id,
  }).where(eq(applications.id, id)).returning();
  return c.json({ success: true, data: a });
});

hrRoutes.post("/recruiting/applications/:id/interviews", zValidator("json", z.object({
  round: z.number().int().default(1),
  type: z.string().default("video"),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().default(45),
  meetingUrl: z.string().optional(),
  interviewerIds: z.array(z.string().uuid()),
  primaryInterviewerId: z.string().uuid().optional(),
})), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [iv] = await db.insert(interviews).values({
    applicationId: id, ...body,
    scheduledAt: new Date(body.scheduledAt),
  }).returning();
  return c.json({ success: true, data: iv }, 201);
});

hrRoutes.post("/recruiting/interviews/:id/feedback", zValidator("json", z.object({
  recommendation: z.enum(["strong_hire", "hire", "no_decision", "no_hire", "strong_no_hire"]),
  overallScore: z.number().optional(),
  strengths: z.string().optional(),
  concerns: z.string().optional(),
  notes: z.string().optional(),
  competencyScores: z.record(z.number()).optional(),
})), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  // Find employee record from user
  const [emp] = await db.select({ id: employees.id }).from(employees)
    .where(eq(employees.userId, user.id)).limit(1);

  const [fb] = await db.insert(interviewFeedback).values({
    interviewId: id,
    interviewerId: emp?.id || user.id,
    recommendation: body.recommendation,
    overallScore: body.overallScore?.toString(),
    strengths: body.strengths, concerns: body.concerns, notes: body.notes,
    competencyScores: body.competencyScores || {},
  }).returning();

  return c.json({ success: true, data: fb }, 201);
});

hrRoutes.post("/recruiting/applications/:id/offers", zValidator("json", z.object({
  offerNumber: z.string(),
  jobProfileId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  legalEntityId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  startDate: z.string(),
  workerType: z.string().optional(),
  baseSalary: z.number(),
  salaryCurrency: z.string(),
  signingBonus: z.number().optional(),
  expiresAt: z.string().datetime().optional(),
})), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [o] = await db.insert(offers).values({
    applicationId: id, ...body,
    startDate: body.startDate as any,
    baseSalary: body.baseSalary.toString(),
    signingBonus: body.signingBonus?.toString(),
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: o }, 201);
});

// ═══════════════════════════════════════════════════════════
// 11. ONBOARDING / OFFBOARDING
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/onboarding/plans", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(onboardingPlans).where(eq(onboardingPlans.tenantId, tenantId));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/onboarding/plans", zValidator("json", z.object({
  name: z.string(), description: z.string().optional(),
  durationDays: z.number().int().default(90),
  tasks: z.array(z.any()).default([]),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");
  const [p] = await db.insert(onboardingPlans).values({ tenantId, ...body }).returning();
  return c.json({ success: true, data: p }, 201);
});

hrRoutes.post("/employees/:id/onboarding/start", zValidator("json", z.object({
  onboardingPlanId: z.string().uuid(),
})), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [plan] = await db.select().from(onboardingPlans).where(eq(onboardingPlans.id, body.onboardingPlanId)).limit(1);
  if (!plan) throw new AppError(404, "NOT_FOUND", "Plan negăsit");
  const tasksToCreate = (plan.tasks as any[]).map((t) => ({
    employeeId: id, onboardingPlanId: plan.id,
    title: t.title, description: t.description, category: t.category,
    assignedToRole: t.assignedToRole,
    dueDate: new Date(Date.now() + (t.dueDays || 0) * 86400000).toISOString().slice(0, 10) as any,
  }));
  if (tasksToCreate.length) await db.insert(onboardingTasks).values(tasksToCreate);
  return c.json({ success: true, data: { tasks: tasksToCreate.length } });
});

hrRoutes.get("/employees/:id/onboarding/tasks", async (c) => {
  const id = c.req.param("id");
  const list = await db.select().from(onboardingTasks).where(eq(onboardingTasks.employeeId, id))
    .orderBy(asc(onboardingTasks.dueDate));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/onboarding/tasks/:id/complete", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const [t] = await db.update(onboardingTasks).set({
    status: "completed", completedAt: new Date(), completedBy: user.id,
  }).where(eq(onboardingTasks.id, id)).returning();
  return c.json({ success: true, data: t });
});

// ═══════════════════════════════════════════════════════════
// 12. SURVEYS / ENGAGEMENT
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/surveys", async (c) => {
  const tenantId = c.get("tenantId");
  const list = await db.select().from(surveyCampaigns).where(eq(surveyCampaigns.tenantId, tenantId)).orderBy(desc(surveyCampaigns.createdAt));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/surveys", zValidator("json", z.object({
  name: z.string(),
  type: z.string().default("engagement"),
  description: z.string().optional(),
  questions: z.array(z.any()).default([]),
  isAnonymous: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
})), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");
  const [s] = await db.insert(surveyCampaigns).values({
    tenantId, ...body,
    startsAt: body.startsAt ? new Date(body.startsAt) : null,
    endsAt: body.endsAt ? new Date(body.endsAt) : null,
    createdBy: user.id,
  }).returning();
  return c.json({ success: true, data: s }, 201);
});

hrRoutes.post("/surveys/:id/respond", zValidator("json", z.object({
  responses: z.record(z.unknown()),
  comments: z.string().optional(),
})), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [emp] = await db.select({ id: employees.id, departmentId: employees.currentDepartmentId, locationId: employees.currentLocationId }).from(employees).where(eq(employees.userId, user.id)).limit(1);
  const [r] = await db.insert(surveyResponses).values({
    surveyCampaignId: id,
    employeeId: emp?.id,
    departmentId: emp?.departmentId,
    locationId: emp?.locationId,
    responses: body.responses, comments: body.comments,
    isComplete: true, submittedAt: new Date(),
  }).returning();
  return c.json({ success: true, data: r }, 201);
});

// ═══════════════════════════════════════════════════════════
// 13. EMPLOYEE DOCUMENTS
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/employees/:id/documents", async (c) => {
  const id = c.req.param("id");
  const list = await db.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, id))
    .orderBy(desc(employeeDocuments.createdAt));
  return c.json({ success: true, data: list });
});

hrRoutes.post("/employees/:id/documents", zValidator("json", z.object({
  name: z.string(), category: z.string(), documentType: z.string().optional(),
  description: z.string().optional(), url: z.string(),
  isConfidential: z.boolean().default(true),
  isVisibleToEmployee: z.boolean().default(true),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
  expiresAt: z.string().optional(),
})), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [d] = await db.insert(employeeDocuments).values({
    employeeId: id, ...body,
    effectiveFrom: body.effectiveFrom as any,
    effectiveTo: body.effectiveTo as any,
    expiresAt: body.expiresAt as any,
    uploadedBy: user.id,
  }).returning();
  return c.json({ success: true, data: d }, 201);
});

// ═══════════════════════════════════════════════════════════
// 14. ANALYTICS
// ═══════════════════════════════════════════════════════════

hrRoutes.get("/analytics/headcount", async (c) => {
  const tenantId = c.get("tenantId");
  const [{ total }] = await db.select({ total: count() }).from(employees).where(and(
    eq(employees.tenantId, tenantId), eq(employees.status, "active"),
  ));
  const byDept = await db.select({
    departmentId: employees.currentDepartmentId,
    count: count(),
  }).from(employees).where(and(
    eq(employees.tenantId, tenantId), eq(employees.status, "active"),
  )).groupBy(employees.currentDepartmentId);
  const byType = await db.select({
    workerType: employees.workerType,
    count: count(),
  }).from(employees).where(and(
    eq(employees.tenantId, tenantId), eq(employees.status, "active"),
  )).groupBy(employees.workerType);
  return c.json({
    success: true,
    data: { total: Number(total), byDepartment: byDept, byWorkerType: byType },
  });
});

hrRoutes.get("/analytics/turnover", async (c) => {
  const tenantId = c.get("tenantId");
  const months = parseInt(c.req.query("months") || "12");
  const cutoff = new Date(Date.now() - months * 30 * 86400000);
  const [{ terminated }] = await db.select({ terminated: count() }).from(employees).where(and(
    eq(employees.tenantId, tenantId), eq(employees.status, "terminated"),
    gte(employees.terminationDate, cutoff.toISOString().slice(0, 10)),
  ));
  const [{ active }] = await db.select({ active: count() }).from(employees).where(and(
    eq(employees.tenantId, tenantId), eq(employees.status, "active"),
  ));
  const turnoverRate = active > 0 ? (Number(terminated) / Number(active)) * 100 : 0;
  return c.json({
    success: true,
    data: { terminated: Number(terminated), active: Number(active), turnoverRate, periodMonths: months },
  });
});

hrRoutes.get("/analytics/diversity", async (c) => {
  const tenantId = c.get("tenantId");
  const byGender = await db.select({
    gender: employees.gender, count: count(),
  }).from(employees).where(and(
    eq(employees.tenantId, tenantId), eq(employees.status, "active"),
  )).groupBy(employees.gender);
  return c.json({ success: true, data: { byGender } });
});
