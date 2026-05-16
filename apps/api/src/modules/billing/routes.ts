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
import { renderInvoiceHtml } from "../../lib/invoice-html";

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
// GET /invoices/:id/print — server-rendered HTML for print / Save-as-PDF
// Returns text/html with embedded print styles; user opens in tab,
// Ctrl+P or hits the "Tipărește" button on the page itself.
// ─────────────────────────────────────────────

billingRoutes.get("/invoices/:id/print", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [invoice] = await db
    .select()
    .from(billingInvoices)
    .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.id, id)))
    .limit(1);
  if (!invoice) throw new AppError(404, "NOT_FOUND", "Invoice not found");

  const [lines, payments] = await Promise.all([
    db
      .select()
      .from(billingInvoiceLines)
      .where(eq(billingInvoiceLines.invoiceId, id))
      .orderBy(asc(billingInvoiceLines.lineNumber)),
    db
      .select()
      .from(billingPayments)
      .where(eq(billingPayments.invoiceId, id))
      .orderBy(asc(billingPayments.paidAt)),
  ]);

  const html = renderInvoiceHtml({ invoice, lines, payments });
  c.header("Content-Type", "text/html; charset=utf-8");
  return c.body(html);
});

// ─────────────────────────────────────────────
// POST /invoices/:id/storno — create credit_note that reverses this invoice
// Copies lines with negative quantities, links back via relatedInvoiceId.
// Marks original as "void" (status='void') so it can't be paid again.
// ─────────────────────────────────────────────

billingRoutes.post(
  "/invoices/:id/storno",
  zValidator("json", z.object({ reason: z.string().max(500).optional() }).optional()),
  async (c) => {
    const tenantId = c.get("tenantId");
    const user = c.get("user");
    const id = c.req.param("id");
    const body = c.req.valid("json") || {};

    const result = await db.transaction(async (tx) => {
      const [original] = await tx
        .select()
        .from(billingInvoices)
        .where(and(eq(billingInvoices.tenantId, tenantId), eq(billingInvoices.id, id)))
        .limit(1);
      if (!original) throw new AppError(404, "NOT_FOUND", "Invoice not found");
      if (original.type === "credit_note") {
        throw new AppError(400, "CANNOT_STORNO_CREDIT_NOTE", "O notă de credit nu poate fi stornată");
      }
      if (original.status === "draft") {
        throw new AppError(400, "DRAFT_CANNOT_BE_STORNED", "Ciornele se șterg, nu se stornează");
      }
      if (original.status === "cancelled" || original.status === "void") {
        throw new AppError(400, "ALREADY_INACTIVE", "Factura este deja anulată/stornată");
      }

      const originalLines = await tx
        .select()
        .from(billingInvoiceLines)
        .where(eq(billingInvoiceLines.invoiceId, id))
        .orderBy(asc(billingInvoiceLines.lineNumber));
      if (originalLines.length === 0) {
        throw new AppError(400, "EMPTY_INVOICE", "Factura nu are linii");
      }

      // Find a credit_note series — default first, then any active one
      let [creditSeries] = await tx
        .select()
        .from(billingInvoiceSeries)
        .where(
          and(
            eq(billingInvoiceSeries.tenantId, tenantId),
            eq(billingInvoiceSeries.type, "credit_note"),
            eq(billingInvoiceSeries.isActive, true),
            eq(billingInvoiceSeries.isDefault, true),
          ),
        )
        .limit(1);
      if (!creditSeries) {
        [creditSeries] = await tx
          .select()
          .from(billingInvoiceSeries)
          .where(
            and(
              eq(billingInvoiceSeries.tenantId, tenantId),
              eq(billingInvoiceSeries.type, "credit_note"),
              eq(billingInvoiceSeries.isActive, true),
            ),
          )
          .limit(1);
      }
      if (!creditSeries) {
        // Auto-provision a default credit_note series on first storno
        const [created] = await tx
          .insert(billingInvoiceSeries)
          .values({
            tenantId,
            code: "STO",
            name: "Storno (auto)",
            type: "credit_note",
            prefix: "STO",
            suffix: "",
            padLength: 4,
            resetPolicy: "yearly",
            nextNumber: 1,
            isDefault: true,
            isActive: true,
          })
          .returning();
        creditSeries = created;
      }

      // Allocate next number for the credit_note series
      const [seriesLocked] = await tx
        .select()
        .from(billingInvoiceSeries)
        .where(eq(billingInvoiceSeries.id, creditSeries.id))
        .for("update")
        .limit(1);
      if (!seriesLocked) throw new AppError(500, "SERIES_LOCK_FAILED", "Could not lock series");

      const number = seriesLocked.nextNumber;
      const padded = padNumber(number, seriesLocked.padLength);
      const issueDate = new Date().toISOString().slice(0, 10);
      const year = parseInt(issueDate.slice(0, 4), 10);
      const documentNumber = formatDocumentNumber(
        seriesLocked.prefix || seriesLocked.code,
        padded,
        seriesLocked.suffix,
        year,
      );

      await tx
        .update(billingInvoiceSeries)
        .set({ nextNumber: number + 1, lastIssuedAt: new Date(), updatedAt: new Date() })
        .where(eq(billingInvoiceSeries.id, seriesLocked.id));

      // Insert credit_note header — negate all amounts
      const neg = (v: string) => "-" + Math.abs(Number(v)).toFixed(2);

      const [creditNote] = await tx
        .insert(billingInvoices)
        .values({
          tenantId,
          seriesId: seriesLocked.id,
          number,
          documentNumber,
          type: "credit_note",
          status: "issued",
          relatedInvoiceId: original.id,
          // Issuer + customer snapshot copied from original
          issuerName: original.issuerName,
          issuerTaxId: original.issuerTaxId,
          issuerRegistrationNumber: original.issuerRegistrationNumber,
          issuerAddress: original.issuerAddress,
          issuerCity: original.issuerCity,
          issuerCounty: original.issuerCounty,
          issuerCountry: original.issuerCountry,
          issuerIban: original.issuerIban,
          issuerBank: original.issuerBank,
          issuerEmail: original.issuerEmail,
          issuerPhone: original.issuerPhone,
          customerId: original.customerId,
          customerName: original.customerName,
          customerIsCompany: original.customerIsCompany,
          customerTaxId: original.customerTaxId,
          customerRegistrationNumber: original.customerRegistrationNumber,
          customerAddress: original.customerAddress,
          customerCity: original.customerCity,
          customerCounty: original.customerCounty,
          customerCountry: original.customerCountry,
          customerEmail: original.customerEmail,
          customerPhone: original.customerPhone,
          issueDate,
          dueDate: null,
          currency: original.currency,
          exchangeRate: original.exchangeRate,
          subtotal: neg(original.subtotal),
          totalDiscount: neg(original.totalDiscount),
          totalVat: neg(original.totalVat),
          totalAmount: neg(original.totalAmount),
          amountDue: "0", // credit notes don't owe money
          notes: body.reason ? `Storno la factura ${original.documentNumber} — ${body.reason}` : `Storno la factura ${original.documentNumber}`,
          createdBy: user.id,
        })
        .returning();

      // Insert negated lines
      const negLines = originalLines.map((line) => ({
        tenantId,
        invoiceId: creditNote.id,
        lineNumber: line.lineNumber,
        description: line.description,
        itemType: line.itemType,
        itemId: line.itemId,
        itemCode: line.itemCode,
        quantity: "-" + Math.abs(Number(line.quantity)).toFixed(4),
        unitOfMeasure: line.unitOfMeasure,
        unitPrice: line.unitPrice,
        discountPercent: line.discountPercent,
        discountAmount: neg(line.discountAmount),
        vatRate: line.vatRate,
        vatCategory: line.vatCategory,
        subtotal: neg(line.subtotal),
        vatAmount: neg(line.vatAmount),
        totalAmount: neg(line.totalAmount),
      }));
      await tx.insert(billingInvoiceLines).values(negLines);

      // Mark original as void so it can't accept further payments
      await tx
        .update(billingInvoices)
        .set({
          status: "void",
          cancelledAt: new Date(),
          internalNotes: original.internalNotes
            ? `${original.internalNotes}\nStornată prin ${documentNumber} la ${issueDate}`
            : `Stornată prin ${documentNumber} la ${issueDate}`,
          updatedAt: new Date(),
        })
        .where(eq(billingInvoices.id, original.id));

      return creditNote;
    });

    return c.json({ success: true, data: result }, 201);
  },
);

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

// ─────────────────────────────────────────────
// AGING REPORT (overdue buckets)
// GET /api/v1/billing/aging — buckets unpaid invoices by overdue days
// ─────────────────────────────────────────────

billingRoutes.get("/aging", async (c) => {
  const tenantId = c.get("tenantId");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDate = today.toISOString().slice(0, 10);

  const rows = await db
    .select({
      id: billingInvoices.id,
      documentNumber: billingInvoices.documentNumber,
      customerName: billingInvoices.customerName,
      customerEmail: billingInvoices.customerEmail,
      issueDate: billingInvoices.issueDate,
      dueDate: billingInvoices.dueDate,
      status: billingInvoices.status,
      totalAmount: billingInvoices.totalAmount,
      amountDue: billingInvoices.amountDue,
      currency: billingInvoices.currency,
    })
    .from(billingInvoices)
    .where(
      and(
        eq(billingInvoices.tenantId, tenantId),
        sql`${billingInvoices.status} IN ('issued','sent','viewed','partially_paid','overdue')`,
        sql`${billingInvoices.amountDue}::numeric > 0`,
      ),
    )
    .orderBy(asc(billingInvoices.dueDate));

  const buckets: Record<string, { label: string; total: number; count: number; invoices: typeof rows }> = {
    notDue:    { label: "Curent (neexpirat)", total: 0, count: 0, invoices: [] },
    "1_30":    { label: "1–30 zile întârziere", total: 0, count: 0, invoices: [] },
    "31_60":   { label: "31–60 zile",          total: 0, count: 0, invoices: [] },
    "61_90":   { label: "61–90 zile",          total: 0, count: 0, invoices: [] },
    "90_plus": { label: "Peste 90 zile",       total: 0, count: 0, invoices: [] },
  };

  for (const row of rows) {
    const dueIso = row.dueDate || row.issueDate;
    if (!dueIso) continue;
    const due = new Date(dueIso + "T00:00:00Z");
    const days = Math.floor((today.getTime() - due.getTime()) / 86400000);
    let key: keyof typeof buckets;
    if (days <= 0) key = "notDue";
    else if (days <= 30) key = "1_30";
    else if (days <= 60) key = "31_60";
    else if (days <= 90) key = "61_90";
    else key = "90_plus";
    buckets[key].count++;
    buckets[key].total += Number(row.amountDue);
    buckets[key].invoices.push(row);
  }

  const grandTotal = Object.values(buckets).reduce((s, b) => s + b.total, 0);
  const grandCount = Object.values(buckets).reduce((s, b) => s + b.count, 0);

  return c.json({
    success: true,
    data: {
      asOf: todayDate,
      grandTotal,
      grandCount,
      buckets,
    },
  });
});

// ─────────────────────────────────────────────
// CSV EXPORT — for accountant
// GET /api/v1/billing/export.csv?from=YYYY-MM-DD&to=YYYY-MM-DD
// ─────────────────────────────────────────────

billingRoutes.get("/export.csv", async (c) => {
  const tenantId = c.get("tenantId");
  const from = c.req.query("from");
  const to = c.req.query("to");

  const conds = [eq(billingInvoices.tenantId, tenantId)];
  if (from) conds.push(gte(billingInvoices.issueDate, from));
  if (to) conds.push(lte(billingInvoices.issueDate, to));

  const rows = await db
    .select()
    .from(billingInvoices)
    .where(and(...conds))
    .orderBy(asc(billingInvoices.issueDate));

  // CSV header — covers what accountants typically need for the journal
  const headers = [
    "Document",
    "Tip",
    "Status",
    "Data emiterii",
    "Data scadentei",
    "Client",
    "CUI client",
    "Subtotal",
    "TVA",
    "Total",
    "Achitat",
    "Rest de plata",
    "Moneda",
    "Status e-Factura",
    "Upload ID ANAF",
    "Note",
  ];

  const escCsv = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n;]/.test(s) ? `"${s}"` : s;
  };

  const lines = [headers.join(";")];
  for (const r of rows) {
    lines.push(
      [
        r.documentNumber,
        r.type,
        r.status,
        r.issueDate,
        r.dueDate ?? "",
        r.customerName,
        r.customerTaxId ?? "",
        r.subtotal,
        r.totalVat,
        r.totalAmount,
        r.totalPaid,
        r.amountDue,
        r.currency,
        r.efacturaStatus,
        r.efacturaUploadId ?? "",
        (r.notes ?? "").replace(/\r?\n/g, " ").slice(0, 200),
      ].map(escCsv).join(";"),
    );
  }

  // BOM so Excel recognises UTF-8
  const csv = "﻿" + lines.join("\n");
  const filename = `facturi_${from ?? "all"}_${to ?? "all"}.csv`;

  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", `attachment; filename="${filename}"`);
  return c.body(csv);
});
