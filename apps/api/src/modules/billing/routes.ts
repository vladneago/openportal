import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  db,
  billingInvoiceSeries,
  billingInvoices,
  billingInvoiceLines,
  billingPayments,
  efacturaSubmissions,
  bookingCustomers,
  tenants,
} from "@openportal/db";
import { and, eq, gte, lte, sql, desc, asc, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";
import { assertEfacturaQuota } from "../../lib/plan-limits";

export const billingRoutes = new Hono();
billingRoutes.use("*", requireAuth);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function padNumber(num: number, length: number): string {
  return String(num).padStart(length, "0");
}

function formatDocumentNumber(prefix: string | null, padded: string, suffix: string | null, year: number): string {
  // Pattern: PREFIX-YYYY-NUMBER-SUFFIX
  const parts = [prefix, String(year), padded, suffix].filter((p) => p);
  return parts.join("-");
}

function calcLineTotals(qty: string, unitPrice: string, discountPercent: string, discountAmount: string, vatRate: string) {
  const q = Number(qty);
  const up = Number(unitPrice);
  const dp = Number(discountPercent);
  const da = Number(discountAmount);
  const vr = Number(vatRate);

  const gross = q * up;
  const totalDiscount = da > 0 ? da : (gross * dp) / 100;
  const subtotal = Math.max(0, gross - totalDiscount);
  const vatAmount = (subtotal * vr) / 100;
  const totalAmount = subtotal + vatAmount;

  return {
    subtotal: subtotal.toFixed(2),
    vatAmount: vatAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    discountAmount: totalDiscount.toFixed(2),
  };
}

// ─────────────────────────────────────────────
// INVOICE SERIES
// ─────────────────────────────────────────────

const seriesCreateSchema = z.object({
  code: z.string().min(1).max(16),
  name: z.string().min(1).max(100),
  type: z.enum(["invoice", "proforma", "credit_note", "receipt", "advance"]).default("invoice"),
  prefix: z.string().max(32).default(""),
  suffix: z.string().max(32).default(""),
  padLength: z.number().int().min(0).max(10).default(4),
  resetPolicy: z.enum(["yearly", "monthly", "never"]).default("yearly"),
  nextNumber: z.number().int().min(1).default(1),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

billingRoutes.get("/series", async (c) => {
  const tenantId = c.get("tenantId");

  const rows = await db
    .select()
    .from(billingInvoiceSeries)
    .where(eq(billingInvoiceSeries.tenantId, tenantId))
    .orderBy(desc(billingInvoiceSeries.isDefault), asc(billingInvoiceSeries.code));

  return c.json({ success: true, data: rows });
});

billingRoutes.post("/series", zValidator("json", seriesCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");

  const [row] = await db.transaction(async (tx) => {
    if (body.isDefault) {
      await tx
        .update(billingInvoiceSeries)
        .set({ isDefault: false })
        .where(eq(billingInvoiceSeries.tenantId, tenantId));
    }
    const [inserted] = await tx
      .insert(billingInvoiceSeries)
      .values({ tenantId, ...body })
      .returning();
    return [inserted!];
  });

  return c.json({ success: true, data: row }, 201);
});

billingRoutes.patch("/series/:id", zValidator("json", seriesCreateSchema.partial()), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [row] = await db.transaction(async (tx) => {
    if (body.isDefault) {
      await tx
        .update(billingInvoiceSeries)
        .set({ isDefault: false })
        .where(eq(billingInvoiceSeries.tenantId, tenantId));
    }
    const [updated] = await tx
      .update(billingInvoiceSeries)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(billingInvoiceSeries.tenantId, tenantId), eq(billingInvoiceSeries.id, id)))
      .returning();
    return [updated];
  });

  if (!row) throw new AppError(404, "NOT_FOUND", "Series not found");
  return c.json({ success: true, data: row });
});

billingRoutes.delete("/series/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(billingInvoiceSeries)
    .where(and(eq(billingInvoiceSeries.tenantId, tenantId), eq(billingInvoiceSeries.id, id)))
    .returning({ id: billingInvoiceSeries.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Series not found");
  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// INVOICES
// ─────────────────────────────────────────────

const invoiceLineInputSchema = z.object({
  description: z.string().min(1).max(2000),
  itemType: z.string().max(32).optional(),
  itemId: z.string().uuid().optional(),
  itemCode: z.string().max(64).optional(),
  quantity: z.string().regex(/^\d+(\.\d{1,4})?$/).default("1"),
  unitOfMeasure: z.string().max(16).default("buc"),
  unitPrice: z.string().regex(/^\d+(\.\d{1,4})?$/).default("0"),
  discountPercent: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  vatRate: z.string().regex(/^\d+(\.\d{1,2})?$/).default("19.00"),
  vatCategory: z.string().max(8).default("S"),
});

const invoiceCreateSchema = z.object({
  seriesId: z.string().uuid().optional(),
  type: z.enum(["invoice", "proforma", "credit_note", "receipt", "advance"]).default("invoice"),
  customerId: z.string().uuid().optional(),

  // Customer override (used when customerId not provided OR for snapshot override)
  customerName: z.string().min(1).max(300).optional(),
  customerIsCompany: z.boolean().default(false),
  customerTaxId: z.string().max(32).optional(),
  customerRegistrationNumber: z.string().max(64).optional(),
  customerAddress: z.string().max(500).optional(),
  customerCity: z.string().max(120).optional(),
  customerCounty: z.string().max(120).optional(),
  customerCountry: z.string().length(2).default("RO"),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().max(32).optional(),

  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

  currency: z.string().length(3).default("RON"),
  exchangeRate: z.string().regex(/^\d+(\.\d{1,6})?$/).default("1.000000"),

  appointmentId: z.string().uuid().optional(),
  relatedInvoiceId: z.string().uuid().optional(),

  notes: z.string().max(2000).optional(),
  termsAndConditions: z.string().max(5000).optional(),
  internalNotes: z.string().max(2000).optional(),

  lines: z.array(invoiceLineInputSchema).min(1),
});

billingRoutes.get("/invoices", async (c) => {
  const tenantId = c.get("tenantId");
  const status = c.req.query("status");
  const customerId = c.req.query("customerId");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);
  const offset = parseInt(c.req.query("offset") || "0");

  const conds = [eq(billingInvoices.tenantId, tenantId)];
  if (status) {
    conds.push(eq(billingInvoices.status, status as "draft" | "issued" | "sent" | "viewed" | "partially_paid" | "paid" | "overdue" | "cancelled" | "void"));
  }
  if (customerId) conds.push(eq(billingInvoices.customerId, customerId));
  if (from) conds.push(gte(billingInvoices.issueDate, from));
  if (to) conds.push(lte(billingInvoices.issueDate, to));

  const rows = await db
    .select()
    .from(billingInvoices)
    .where(and(...conds))
    .orderBy(desc(billingInvoices.issueDate), desc(billingInvoices.documentNumber))
    .limit(limit)
    .offset(offset);

  const totalRow = await db.select({ total: count() }).from(billingInvoices).where(and(...conds));

  return c.json({
    success: true,
    data: rows,
    meta: { total: Number(totalRow[0]?.total || 0), limit, offset },
  });
});

billingRoutes.get("/invoices/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [invoice] = await db
    .select()
    .from(billingInvoices)
    .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.id, id)))
    .limit(1);

  if (!invoice) throw new AppError(404, "NOT_FOUND", "Invoice not found");

  const lines = await db
    .select()
    .from(billingInvoiceLines)
    .where(eq(billingInvoiceLines.invoiceId, id))
    .orderBy(asc(billingInvoiceLines.lineNumber));

  const payments = await db
    .select()
    .from(billingPayments)
    .where(eq(billingPayments.invoiceId, id))
    .orderBy(asc(billingPayments.paidAt));

  return c.json({ success: true, data: { ...invoice, lines, payments } });
});

billingRoutes.post("/invoices", zValidator("json", invoiceCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  // 1. Resolve issuer info from tenant
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant) throw new AppError(404, "TENANT_NOT_FOUND", "Tenant missing");

  // 2. Resolve series — explicit or default
  let series;
  if (body.seriesId) {
    const [s] = await db
      .select()
      .from(billingInvoiceSeries)
      .where(and(eq(billingInvoiceSeries.tenantId, tenantId), eq(billingInvoiceSeries.id, body.seriesId)))
      .limit(1);
    if (!s) throw new AppError(404, "SERIES_NOT_FOUND", "Invoice series not found");
    series = s;
  } else {
    const [s] = await db
      .select()
      .from(billingInvoiceSeries)
      .where(
        and(
          eq(billingInvoiceSeries.tenantId, tenantId),
          eq(billingInvoiceSeries.isDefault, true),
          eq(billingInvoiceSeries.isActive, true),
          eq(billingInvoiceSeries.type, body.type),
        ),
      )
      .limit(1);
    if (!s) throw new AppError(400, "NO_DEFAULT_SERIES", "No default series set for this invoice type");
    series = s;
  }

  // 3. Resolve customer snapshot
  let customerSnapshot = {
    customerName: body.customerName ?? "",
    customerIsCompany: body.customerIsCompany,
    customerTaxId: body.customerTaxId ?? null,
    customerRegistrationNumber: body.customerRegistrationNumber ?? null,
    customerAddress: body.customerAddress ?? null,
    customerCity: body.customerCity ?? null,
    customerCounty: body.customerCounty ?? null,
    customerCountry: body.customerCountry,
    customerEmail: body.customerEmail ?? null,
    customerPhone: body.customerPhone ?? null,
  };

  if (body.customerId) {
    const [cust] = await db
      .select()
      .from(bookingCustomers)
      .where(and(eq(bookingCustomers.tenantId, tenantId), eq(bookingCustomers.id, body.customerId)))
      .limit(1);
    if (!cust) throw new AppError(404, "CUSTOMER_NOT_FOUND", "Customer not found");

    customerSnapshot = {
      customerName: body.customerName ?? `${cust.firstName}${cust.lastName ? " " + cust.lastName : ""}`,
      customerIsCompany: body.customerIsCompany,
      customerTaxId: body.customerTaxId ?? null,
      customerRegistrationNumber: body.customerRegistrationNumber ?? null,
      customerAddress: body.customerAddress ?? null,
      customerCity: body.customerCity ?? null,
      customerCounty: body.customerCounty ?? null,
      customerCountry: body.customerCountry,
      customerEmail: body.customerEmail ?? cust.email,
      customerPhone: body.customerPhone ?? cust.phone,
    };
  }

  if (!customerSnapshot.customerName) {
    throw new AppError(400, "CUSTOMER_NAME_REQUIRED", "Customer name is required");
  }

  // 4. Compute line totals
  const computedLines = body.lines.map((line, idx) => {
    const totals = calcLineTotals(
      line.quantity,
      line.unitPrice,
      line.discountPercent,
      line.discountAmount,
      line.vatRate,
    );
    return {
      lineNumber: idx + 1,
      description: line.description,
      itemType: line.itemType ?? null,
      itemId: line.itemId ?? null,
      itemCode: line.itemCode ?? null,
      quantity: line.quantity,
      unitOfMeasure: line.unitOfMeasure,
      unitPrice: line.unitPrice,
      discountPercent: line.discountPercent,
      discountAmount: totals.discountAmount,
      vatRate: line.vatRate,
      vatCategory: line.vatCategory,
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      totalAmount: totals.totalAmount,
    };
  });

  const subtotalSum = computedLines.reduce((acc, l) => acc + Number(l.subtotal), 0);
  const vatSum = computedLines.reduce((acc, l) => acc + Number(l.vatAmount), 0);
  const totalAmount = computedLines.reduce((acc, l) => acc + Number(l.totalAmount), 0);
  const discountSum = computedLines.reduce((acc, l) => acc + Number(l.discountAmount), 0);

  // 5. Issue date defaults to today; build document number based on series
  const issueDateStr = body.issueDate ?? new Date().toISOString().slice(0, 10);
  const year = parseInt(issueDateStr.slice(0, 4), 10);

  // 6. Insert in transaction with sequence allocation
  const result = await db.transaction(async (tx) => {
    // Allocate next number
    const [seriesLocked] = await tx
      .select()
      .from(billingInvoiceSeries)
      .where(eq(billingInvoiceSeries.id, series.id))
      .for("update")
      .limit(1);
    if (!seriesLocked) throw new AppError(500, "SERIES_LOCK_FAILED", "Could not lock series");

    const number = seriesLocked.nextNumber;
    const padded = padNumber(number, seriesLocked.padLength);
    const documentNumber = formatDocumentNumber(
      seriesLocked.prefix || seriesLocked.code,
      padded,
      seriesLocked.suffix,
      year,
    );

    await tx
      .update(billingInvoiceSeries)
      .set({
        nextNumber: number + 1,
        lastIssuedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(billingInvoiceSeries.id, series.id));

    const [invoice] = await tx
      .insert(billingInvoices)
      .values({
        tenantId,
        seriesId: series.id,
        number,
        documentNumber,
        type: body.type,
        status: "draft",
        issuerName: tenant.name,
        issuerTaxId: (tenant.settings as { taxId?: string } | null)?.taxId ?? null,
        issuerEmail: (tenant.settings as { contactEmail?: string } | null)?.contactEmail ?? null,
        ...customerSnapshot,
        customerId: body.customerId ?? null,
        issueDate: issueDateStr,
        dueDate: body.dueDate ?? null,
        serviceDate: body.serviceDate ?? null,
        currency: body.currency,
        exchangeRate: body.exchangeRate,
        subtotal: subtotalSum.toFixed(2),
        totalDiscount: discountSum.toFixed(2),
        totalVat: vatSum.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        amountDue: totalAmount.toFixed(2),
        appointmentId: body.appointmentId ?? null,
        relatedInvoiceId: body.relatedInvoiceId ?? null,
        notes: body.notes ?? null,
        termsAndConditions: body.termsAndConditions ?? null,
        internalNotes: body.internalNotes ?? null,
        createdBy: user.id,
      })
      .returning();

    const insertedLines = await tx
      .insert(billingInvoiceLines)
      .values(
        computedLines.map((l) => ({
          tenantId,
          invoiceId: invoice!.id,
          ...l,
        })),
      )
      .returning();

    return { invoice: invoice!, lines: insertedLines };
  });

  return c.json({ success: true, data: result }, 201);
});

const invoiceUpdateSchema = z.object({
  status: z.enum(["draft", "issued", "sent", "viewed", "partially_paid", "paid", "overdue", "cancelled", "void"]).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
});

billingRoutes.patch("/invoices/:id", zValidator("json", invoiceUpdateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };

  if (body.status === "cancelled") {
    updates.cancelledAt = new Date();
  }
  if (body.status === "sent" && !updates.sentAt) {
    updates.sentAt = new Date();
  }
  if (body.status === "paid") {
    updates.paidAt = new Date();
  }

  const [row] = await db
    .update(billingInvoices)
    .set(updates)
    .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Invoice not found");
  return c.json({ success: true, data: row });
});

billingRoutes.delete("/invoices/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  // Only allow deletion of drafts; finalized invoices must be cancelled
  const [invoice] = await db
    .select({ status: billingInvoices.status })
    .from(billingInvoices)
    .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.id, id)))
    .limit(1);

  if (!invoice) throw new AppError(404, "NOT_FOUND", "Invoice not found");
  if (invoice.status !== "draft") {
    throw new AppError(400, "CANNOT_DELETE", "Only draft invoices can be deleted; cancel finalized invoices instead");
  }

  await db
    .delete(billingInvoices)
    .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.id, id)));

  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

const paymentCreateSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().length(3).default("RON"),
  method: z.enum(["cash", "card", "bank_transfer", "stripe", "paypal", "revolut", "check", "other"]),
  reference: z.string().max(200).optional(),
  paidAt: z.string().optional(),
  externalId: z.string().max(200).optional(),
  externalStatus: z.string().max(64).optional(),
  processorFee: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  notes: z.string().max(1000).optional(),
});

billingRoutes.get("/payments", async (c) => {
  const tenantId = c.get("tenantId");
  const invoiceId = c.req.query("invoiceId");

  const conds = [eq(billingPayments.tenantId, tenantId)];
  if (invoiceId) conds.push(eq(billingPayments.invoiceId, invoiceId));

  const rows = await db
    .select()
    .from(billingPayments)
    .where(and(...conds))
    .orderBy(desc(billingPayments.paidAt));

  return c.json({ success: true, data: rows });
});

billingRoutes.post("/payments", zValidator("json", paymentCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const result = await db.transaction(async (tx) => {
    const [invoice] = await tx
      .select()
      .from(billingInvoices)
      .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.id, body.invoiceId)))
      .for("update")
      .limit(1);

    if (!invoice) throw new AppError(404, "INVOICE_NOT_FOUND", "Invoice not found");

    const [payment] = await tx
      .insert(billingPayments)
      .values({
        tenantId,
        invoiceId: body.invoiceId,
        amount: body.amount,
        currency: body.currency,
        method: body.method,
        reference: body.reference ?? null,
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        externalId: body.externalId ?? null,
        externalStatus: body.externalStatus ?? null,
        processorFee: body.processorFee,
        notes: body.notes ?? null,
        recordedBy: user.id,
      })
      .returning();

    const newTotalPaid = Number(invoice.totalPaid) + Number(body.amount);
    const newAmountDue = Math.max(0, Number(invoice.totalAmount) - newTotalPaid);
    const newStatus =
      newAmountDue <= 0
        ? "paid"
        : newTotalPaid > 0
          ? "partially_paid"
          : invoice.status;

    await tx
      .update(billingInvoices)
      .set({
        totalPaid: newTotalPaid.toFixed(2),
        amountDue: newAmountDue.toFixed(2),
        status: newStatus,
        paidAt: newAmountDue <= 0 ? new Date() : invoice.paidAt,
        updatedAt: new Date(),
      })
      .where(eq(billingInvoices.id, body.invoiceId));

    return payment;
  });

  return c.json({ success: true, data: result }, 201);
});

billingRoutes.delete("/payments/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(billingPayments)
      .where(and(eq(billingPayments.tenantId, tenantId), eq(billingPayments.id, id)))
      .limit(1);

    if (!payment) throw new AppError(404, "NOT_FOUND", "Payment not found");

    await tx.delete(billingPayments).where(eq(billingPayments.id, id));

    const [invoice] = await tx
      .select()
      .from(billingInvoices)
      .where(eq(billingInvoices.id, payment.invoiceId))
      .limit(1);

    if (invoice) {
      const newTotalPaid = Math.max(0, Number(invoice.totalPaid) - Number(payment.amount));
      const newAmountDue = Math.max(0, Number(invoice.totalAmount) - newTotalPaid);
      const newStatus = newTotalPaid <= 0 ? "issued" : newAmountDue <= 0 ? "paid" : "partially_paid";

      await tx
        .update(billingInvoices)
        .set({
          totalPaid: newTotalPaid.toFixed(2),
          amountDue: newAmountDue.toFixed(2),
          status: newStatus,
          paidAt: newAmountDue <= 0 ? invoice.paidAt : null,
          updatedAt: new Date(),
        })
        .where(eq(billingInvoices.id, payment.invoiceId));
    }

    return { id };
  });

  return c.json({ success: true, data: result });
});

// ─────────────────────────────────────────────
// E-FACTURA (queue + status check)
// ─────────────────────────────────────────────

billingRoutes.get("/efactura/submissions", async (c) => {
  const tenantId = c.get("tenantId");
  const invoiceId = c.req.query("invoiceId");

  const conds = [eq(efacturaSubmissions.tenantId, tenantId)];
  if (invoiceId) conds.push(eq(efacturaSubmissions.invoiceId, invoiceId));

  const rows = await db
    .select()
    .from(efacturaSubmissions)
    .where(and(...conds))
    .orderBy(desc(efacturaSubmissions.createdAt));

  return c.json({ success: true, data: rows });
});

billingRoutes.post(
  "/efactura/queue",
  zValidator("json", z.object({ invoiceId: z.string().uuid() })),
  async (c) => {
    const tenantId = c.get("tenantId");
    const { invoiceId } = c.req.valid("json");

    const [invoice] = await db
      .select()
      .from(billingInvoices)
      .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.id, invoiceId)))
      .limit(1);

    if (!invoice) throw new AppError(404, "INVOICE_NOT_FOUND", "Invoice not found");
    if (invoice.status === "draft") {
      throw new AppError(400, "INVOICE_DRAFT", "Cannot submit a draft invoice to e-Factura");
    }

    await assertEfacturaQuota(tenantId);

    const [submission] = await db
      .insert(efacturaSubmissions)
      .values({
        tenantId,
        invoiceId,
        status: "queued",
        attemptNumber: 1,
      })
      .returning();

    await db
      .update(billingInvoices)
      .set({
        efacturaStatus: "queued",
        updatedAt: new Date(),
      })
      .where(eq(billingInvoices.id, invoiceId));

    return c.json({ success: true, data: submission }, 201);
  },
);
