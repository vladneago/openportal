import { Hono } from "hono";
import { db, patients, appointments, medicalRecords, prescriptions, users } from "@openportal/db";
import { eq, and, desc, asc, gte, lte, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const healthcareRoutes = new Hono();
healthcareRoutes.use("*", requireAuth);

// Patients
healthcareRoutes.get("/patients", async (c) => {
  const tenantId = c.get("tenantId");
  const results = await db.select().from(patients).where(eq(patients.tenantId, tenantId)).orderBy(patients.lastName);
  return c.json({ success: true, data: results });
});

healthcareRoutes.post("/patients", async (c) => {
  const tenantId = c.get("tenantId"); const body = await c.req.json();
  const [patient] = await db.insert(patients).values({
    tenantId, firstName: body.firstName, lastName: body.lastName,
    dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null, gender: body.gender || null,
    cnp: body.cnp || null, phone: body.phone || null, email: body.email || null,
    address: body.address || null, allergies: body.allergies || [], chronicConditions: body.chronicConditions || [],
    bloodType: body.bloodType || null,
  }).returning();
  return c.json({ success: true, data: patient }, 201);
});

healthcareRoutes.get("/patients/:id", async (c) => {
  const tenantId = c.get("tenantId"); const id = c.req.param("id");
  const [patient] = await db.select().from(patients).where(and(eq(patients.id, id), eq(patients.tenantId, tenantId))).limit(1);
  if (!patient) throw new AppError(404, "NOT_FOUND", "Patient not found");
  const records = await db.select().from(medicalRecords).where(eq(medicalRecords.patientId, id)).orderBy(desc(medicalRecords.createdAt));
  const appts = await db.select().from(appointments).where(eq(appointments.patientId, id)).orderBy(desc(appointments.startAt)).limit(10);
  const presc = await db.select().from(prescriptions).where(eq(prescriptions.patientId, id)).orderBy(desc(prescriptions.issuedAt)).limit(10);
  return c.json({ success: true, data: { ...patient, records, appointments: appts, prescriptions: presc } });
});

healthcareRoutes.delete("/patients/:id", async (c) => {
  const tenantId = c.get("tenantId");
  await db.delete(patients).where(and(eq(patients.id, c.req.param("id")), eq(patients.tenantId, tenantId)));
  return c.json({ success: true });
});

// Appointments
healthcareRoutes.get("/appointments", async (c) => {
  const tenantId = c.get("tenantId");
  const start = c.req.query("start"); const end = c.req.query("end");
  const conditions: any[] = [eq(appointments.tenantId, tenantId)];
  if (start) conditions.push(gte(appointments.startAt, new Date(start)));
  if (end) conditions.push(lte(appointments.startAt, new Date(end)));
  const results = await db.select({
    id: appointments.id, title: appointments.title, department: appointments.department,
    startAt: appointments.startAt, endAt: appointments.endAt, status: appointments.status,
    reason: appointments.reason, meetingUrl: appointments.meetingUrl,
    patientId: appointments.patientId, doctorId: appointments.doctorId,
    patientFirstName: patients.firstName, patientLastName: patients.lastName,
    doctorName: users.displayName,
  }).from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(users, eq(appointments.doctorId, users.id))
    .where(and(...conditions))
    .orderBy(asc(appointments.startAt));
  return c.json({ success: true, data: results });
});

healthcareRoutes.post("/appointments", async (c) => {
  const tenantId = c.get("tenantId"); const user = c.get("user"); const body = await c.req.json();
  const [appt] = await db.insert(appointments).values({
    tenantId, patientId: body.patientId, doctorId: body.doctorId || user.id,
    title: body.title || "Consultație", department: body.department || null,
    startAt: new Date(body.startAt), endAt: new Date(body.endAt),
    status: body.status || "scheduled", reason: body.reason || null,
  }).returning();
  return c.json({ success: true, data: appt }, 201);
});

healthcareRoutes.patch("/appointments/:id", async (c) => {
  const id = c.req.param("id"); const body = await c.req.json();
  const update: any = { updatedAt: new Date() };
  if (body.status) update.status = body.status;
  if (body.notes) update.notes = body.notes;
  await db.update(appointments).set(update).where(eq(appointments.id, id));
  return c.json({ success: true });
});

// Medical Records
healthcareRoutes.post("/records", async (c) => {
  const user = c.get("user"); const body = await c.req.json();
  const [record] = await db.insert(medicalRecords).values({
    patientId: body.patientId, appointmentId: body.appointmentId || null, doctorId: user.id,
    type: body.type || "consultation", title: body.title, diagnosis: body.diagnosis || null,
    treatment: body.treatment || null, findings: body.findings || null,
  }).returning();
  return c.json({ success: true, data: record }, 201);
});

// Prescriptions
healthcareRoutes.post("/prescriptions", async (c) => {
  const user = c.get("user"); const body = await c.req.json();
  const [presc] = await db.insert(prescriptions).values({
    patientId: body.patientId, doctorId: user.id, appointmentId: body.appointmentId || null,
    medications: body.medications || [], diagnosis: body.diagnosis || null, notes: body.notes || null,
  }).returning();
  return c.json({ success: true, data: presc }, 201);
});

// Stats
healthcareRoutes.get("/stats", async (c) => {
  const tenantId = c.get("tenantId");
  const [pc] = await db.select({ count: count() }).from(patients).where(eq(patients.tenantId, tenantId));
  const [ac] = await db.select({ count: count() }).from(appointments).where(eq(appointments.tenantId, tenantId));
  return c.json({ success: true, data: { patients: pc?.count || 0, appointments: ac?.count || 0 } });
});
