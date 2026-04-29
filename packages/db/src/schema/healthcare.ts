import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const appointmentStatusEnum = pgEnum("appointment_status", ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]);

// Patients
export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 200 }).notNull(),
  lastName: varchar("last_name", { length: 200 }).notNull(),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  gender: varchar("gender", { length: 20 }),
  cnp: varchar("cnp", { length: 20 }), // Romanian personal ID
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  allergies: jsonb("allergies").$type<string[]>().default([]),
  chronicConditions: jsonb("chronic_conditions").$type<string[]>().default([]),
  currentMedications: jsonb("current_medications").$type<string[]>().default([]),
  bloodType: varchar("blood_type", { length: 5 }),
  emergencyContact: jsonb("emergency_contact").$type<{ name?: string; phone?: string; relation?: string }>(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("patients_tenant_idx").on(table.tenantId),
]);

// Appointments
export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id").notNull().references(() => users.id),
  title: varchar("title", { length: 500 }),
  department: varchar("department", { length: 200 }),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  status: appointmentStatusEnum("appointment_status").notNull().default("scheduled"),
  reason: text("reason"),
  notes: text("notes"),
  meetingUrl: text("meeting_url"), // for telemedicine
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("appointments_doctor_date_idx").on(table.doctorId, table.startAt),
  index("appointments_patient_idx").on(table.patientId),
]);

// Medical Records
export const medicalRecords = pgTable("medical_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  doctorId: uuid("doctor_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // consultation, lab_result, imaging, procedure, prescription
  title: varchar("title", { length: 500 }).notNull(),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  findings: text("findings"),
  attachments: jsonb("attachments").$type<Array<{ name: string; url: string; type: string }>>().default([]),
  isConfidential: boolean("is_confidential").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Prescriptions
export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id").notNull().references(() => users.id),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  medications: jsonb("medications").$type<Array<{
    name: string; dosage: string; frequency: string; duration: string; instructions?: string;
  }>>().notNull().default([]),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
});
