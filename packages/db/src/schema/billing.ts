import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  date,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { bookingCustomers, bookingAppointments } from "./booking";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const billingInvoiceTypeEnum = pgEnum("billing_invoice_type", [
  "invoice",
  "proforma",
  "credit_note",
  "receipt",
  "advance",
]);

export const billingInvoiceStatusEnum = pgEnum("billing_invoice_status", [
  "draft",
  "issued",
  "sent",
  "viewed",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
  "void",
]);

export const billingPaymentMethodEnum = pgEnum("billing_payment_method", [
  "cash",
  "card",
  "bank_transfer",
  "stripe",
  "paypal",
  "revolut",
  "check",
  "other",
]);

export const efacturaStatusEnum = pgEnum("efactura_status", [
  "not_submitted",
  "queued",
  "submitted",
  "in_processing",
  "accepted",
  "rejected",
  "error",
]);

// ─────────────────────────────────────────────
// INVOICE SERIES (numerotare conform CR / NIR)
// ─────────────────────────────────────────────

export const billingInvoiceSeries = pgTable("billing_invoice_series", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  // Code shown on invoices: "FCT", "BON", "AVZ", etc.
  code: varchar("code", { length: 16 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: billingInvoiceTypeEnum("type").notNull().default("invoice"),

  // Numbering pattern
  prefix: varchar("prefix", { length: 32 }).default(""),
  suffix: varchar("suffix", { length: 32 }).default(""),
  // Number padding: "0001" vs "1"
  padLength: integer("pad_length").notNull().default(4),
  // Reset behavior: yearly, monthly, never
  resetPolicy: varchar("reset_policy", { length: 16 }).notNull().default("yearly"),

  nextNumber: integer("next_number").notNull().default(1),
  lastIssuedAt: timestamp("last_issued_at", { withTimezone: true }),

  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("billing_series_tenant_code_idx").on(table.tenantId, table.code),
  index("billing_series_tenant_idx").on(table.tenantId),
]);

export type BillingInvoiceSeries = typeof billingInvoiceSeries.$inferSelect;
export type NewBillingInvoiceSeries = typeof billingInvoiceSeries.$inferInsert;

// ─────────────────────────────────────────────
// INVOICES (header)
// ─────────────────────────────────────────────

export const billingInvoices = pgTable("billing_invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  // Series + sequence number
  seriesId: uuid("series_id").notNull().references(() => billingInvoiceSeries.id),
  number: integer("number").notNull(),
  // Public display: "FCT-2026-0001"
  documentNumber: varchar("document_number", { length: 64 }).notNull(),

  type: billingInvoiceTypeEnum("type").notNull().default("invoice"),
  status: billingInvoiceStatusEnum("status").notNull().default("draft"),

  // Issuer snapshot (the business)
  issuerName: varchar("issuer_name", { length: 300 }).notNull(),
  issuerTaxId: varchar("issuer_tax_id", { length: 32 }), // CUI/CIF
  issuerRegistrationNumber: varchar("issuer_registration_number", { length: 64 }), // J/Nr ORC
  issuerAddress: text("issuer_address"),
  issuerCity: varchar("issuer_city", { length: 120 }),
  issuerCounty: varchar("issuer_county", { length: 120 }),
  issuerCountry: varchar("issuer_country", { length: 2 }).default("RO"),
  issuerIban: varchar("issuer_iban", { length: 64 }),
  issuerBank: varchar("issuer_bank", { length: 200 }),
  issuerEmail: varchar("issuer_email", { length: 320 }),
  issuerPhone: varchar("issuer_phone", { length: 32 }),

  // Customer snapshot
  customerId: uuid("customer_id").references(() => bookingCustomers.id, { onDelete: "set null" }),
  customerName: varchar("customer_name", { length: 300 }).notNull(),
  customerIsCompany: boolean("customer_is_company").notNull().default(false),
  customerTaxId: varchar("customer_tax_id", { length: 32 }),
  customerRegistrationNumber: varchar("customer_registration_number", { length: 64 }),
  customerAddress: text("customer_address"),
  customerCity: varchar("customer_city", { length: 120 }),
  customerCounty: varchar("customer_county", { length: 120 }),
  customerCountry: varchar("customer_country", { length: 2 }).default("RO"),
  customerEmail: varchar("customer_email", { length: 320 }),
  customerPhone: varchar("customer_phone", { length: 32 }),

  // Dates
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date"),
  serviceDate: date("service_date"),

  // Currency + amounts (computed from lines but stored for fast queries)
  currency: varchar("currency", { length: 3 }).notNull().default("RON"),
  exchangeRate: numeric("exchange_rate", { precision: 12, scale: 6 }).default("1.000000"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  totalDiscount: numeric("total_discount", { precision: 14, scale: 2 }).notNull().default("0"),
  totalVat: numeric("total_vat", { precision: 14, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  totalPaid: numeric("total_paid", { precision: 14, scale: 2 }).notNull().default("0"),
  amountDue: numeric("amount_due", { precision: 14, scale: 2 }).notNull().default("0"),

  // Optional link to an appointment
  appointmentId: uuid("appointment_id").references(() => bookingAppointments.id, { onDelete: "set null" }),

  // Reference to original invoice if this is a credit_note
  relatedInvoiceId: uuid("related_invoice_id"),

  // e-Factura tracking
  efacturaStatus: efacturaStatusEnum("efactura_status").notNull().default("not_submitted"),
  efacturaUploadId: varchar("efactura_upload_id", { length: 64 }),
  efacturaIndexId: varchar("efactura_index_id", { length: 64 }),
  efacturaSubmittedAt: timestamp("efactura_submitted_at", { withTimezone: true }),
  efacturaAcceptedAt: timestamp("efactura_accepted_at", { withTimezone: true }),
  efacturaErrorMessage: text("efactura_error_message"),

  // Display/notes
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  internalNotes: text("internal_notes"),

  // Stored URLs after PDF generation
  pdfUrl: text("pdf_url"),
  xmlUrl: text("xml_url"),

  // Tracking
  sentAt: timestamp("sent_at", { withTimezone: true }),
  viewedAt: timestamp("viewed_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("billing_invoices_document_number_idx").on(table.tenantId, table.documentNumber),
  index("billing_invoices_tenant_status_idx").on(table.tenantId, table.status),
  index("billing_invoices_customer_idx").on(table.customerId),
  index("billing_invoices_due_date_idx").on(table.tenantId, table.dueDate),
  index("billing_invoices_appointment_idx").on(table.appointmentId),
]);

export type BillingInvoice = typeof billingInvoices.$inferSelect;
export type NewBillingInvoice = typeof billingInvoices.$inferInsert;

// ─────────────────────────────────────────────
// INVOICE LINES
// ─────────────────────────────────────────────

export const billingInvoiceLines = pgTable("billing_invoice_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id").notNull().references(() => billingInvoices.id, { onDelete: "cascade" }),

  lineNumber: integer("line_number").notNull(),
  description: text("description").notNull(),
  // Item reference (optional — e.g., service id or product id)
  itemType: varchar("item_type", { length: 32 }),
  itemId: uuid("item_id"),
  itemCode: varchar("item_code", { length: 64 }),

  quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull().default("1"),
  unitOfMeasure: varchar("unit_of_measure", { length: 16 }).default("buc"),
  unitPrice: numeric("unit_price", { precision: 14, scale: 4 }).notNull().default("0"),

  // Discount on line
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 14, scale: 2 }).notNull().default("0"),

  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("19.00"),
  vatCategory: varchar("vat_category", { length: 8 }).notNull().default("S"),
  // S=Standard, AE=Reverse charge, E=Exempt, Z=Zero rated, O=Out of scope

  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  vatAmount: numeric("vat_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("billing_invoice_lines_invoice_idx").on(table.invoiceId, table.lineNumber),
]);

export type BillingInvoiceLine = typeof billingInvoiceLines.$inferSelect;
export type NewBillingInvoiceLine = typeof billingInvoiceLines.$inferInsert;

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

export const billingPayments = pgTable("billing_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id").notNull().references(() => billingInvoices.id, { onDelete: "cascade" }),

  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("RON"),

  method: billingPaymentMethodEnum("method").notNull(),
  reference: varchar("reference", { length: 200 }),

  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),

  // Stripe / payment processor fields
  externalId: varchar("external_id", { length: 200 }),
  externalStatus: varchar("external_status", { length: 64 }),
  processorFee: numeric("processor_fee", { precision: 14, scale: 2 }).default("0"),

  notes: text("notes"),
  receiptUrl: text("receipt_url"),

  recordedBy: uuid("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("billing_payments_invoice_idx").on(table.invoiceId),
  index("billing_payments_tenant_paid_idx").on(table.tenantId, table.paidAt),
  index("billing_payments_external_idx").on(table.externalId),
]);

export type BillingPayment = typeof billingPayments.$inferSelect;
export type NewBillingPayment = typeof billingPayments.$inferInsert;

// ─────────────────────────────────────────────
// E-FACTURA SUBMISSIONS (ANAF)
// ─────────────────────────────────────────────

export const efacturaSubmissions = pgTable("efactura_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id").notNull().references(() => billingInvoices.id, { onDelete: "cascade" }),

  status: efacturaStatusEnum("status").notNull().default("queued"),

  // ANAF identifiers
  uploadId: varchar("upload_id", { length: 64 }),
  indexId: varchar("index_id", { length: 64 }),

  // Submission payloads
  xmlPayload: text("xml_payload"),
  xmlResponse: text("xml_response"),

  // Result
  errorCode: varchar("error_code", { length: 32 }),
  errorMessage: text("error_message"),

  attemptNumber: integer("attempt_number").notNull().default(1),

  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),

  signedXmlUrl: text("signed_xml_url"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("efactura_submissions_invoice_idx").on(table.invoiceId),
  index("efactura_submissions_status_idx").on(table.tenantId, table.status),
  index("efactura_submissions_upload_idx").on(table.uploadId),
]);

export type EfacturaSubmission = typeof efacturaSubmissions.$inferSelect;
export type NewEfacturaSubmission = typeof efacturaSubmissions.$inferInsert;
