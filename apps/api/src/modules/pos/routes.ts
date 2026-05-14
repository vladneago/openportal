import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  db,
  products,
  productCategories,
  posTransactions,
  posTransactionLines,
  stockMovements,
} from "@openportal/db";
import { and, eq, sql, desc, asc, count, or, gte, lte, lt } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const posRoutes = new Hono();
posRoutes.use("*", requireAuth);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function generateReceiptNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `R${ts}${rand}`;
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
    discountAmount: totalDiscount.toFixed(2),
    subtotal: subtotal.toFixed(2),
    vatAmount: vatAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
  };
}

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

const categoryCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  color: z.string().max(7).optional(),
  iconUrl: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

posRoutes.get("/categories", async (c) => {
  const tenantId = c.get("tenantId");
  const rows = await db
    .select()
    .from(productCategories)
    .where(eq(productCategories.tenantId, tenantId))
    .orderBy(asc(productCategories.sortOrder), asc(productCategories.name));

  return c.json({ success: true, data: rows });
});

posRoutes.post("/categories", zValidator("json", categoryCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const body = c.req.valid("json");

  const [row] = await db
    .insert(productCategories)
    .values({
      tenantId,
      name: body.name,
      slug: body.slug,
      description: body.description ?? null,
      color: body.color ?? "#6366F1",
      iconUrl: body.iconUrl ?? null,
      parentId: body.parentId ?? null,
      sortOrder: body.sortOrder,
      isActive: body.isActive,
    })
    .returning();

  return c.json({ success: true, data: row }, 201);
});

posRoutes.patch("/categories/:id", zValidator("json", categoryCreateSchema.partial()), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [row] = await db
    .update(productCategories)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(productCategories.tenantId, tenantId), eq(productCategories.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Category not found");
  return c.json({ success: true, data: row });
});

posRoutes.delete("/categories/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(productCategories)
    .where(and(eq(productCategories.tenantId, tenantId), eq(productCategories.id, id)))
    .returning({ id: productCategories.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Category not found");
  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────

const productCreateSchema = z.object({
  sku: z.string().min(1).max(64),
  barcode: z.string().max(64).optional(),
  name: z.string().min(1).max(300),
  slug: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(500).optional(),
  type: z.enum(["physical", "service", "digital", "voucher", "bundle"]).default("physical"),
  status: z.enum(["active", "inactive", "archived", "out_of_stock"]).default("active"),
  categoryId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  costPrice: z.string().regex(/^\d+(\.\d{1,4})?$/).default("0"),
  sellingPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  salePrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  currency: z.string().length(3).default("RON"),
  vatRate: z.string().regex(/^\d+(\.\d{1,2})?$/).default("19.00"),
  unitOfMeasure: z.string().max(16).default("buc"),
  trackInventory: z.boolean().default(true),
  stockQuantity: z.string().regex(/^\d+(\.\d{1,4})?$/).default("0"),
  reorderPoint: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  reorderQuantity: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  imageUrl: z.string().url().optional(),
  galleryUrls: z.array(z.string().url()).default([]),
  isOnlineEnabled: z.boolean().default(false),
  isPosEnabled: z.boolean().default(true),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(2000).optional(),
  hasVariants: z.boolean().default(false),
  options: z.array(z.object({ name: z.string(), values: z.array(z.string()) })).default([]),
  attributes: z.record(z.string(), z.unknown()).default({}),
  supplier: z.string().max(200).optional(),
  supplierSku: z.string().max(64).optional(),
});

posRoutes.get("/products", async (c) => {
  const tenantId = c.get("tenantId");
  const search = c.req.query("search");
  const categoryId = c.req.query("categoryId");
  const status = c.req.query("status");
  const lowStock = c.req.query("lowStock") === "true";
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);
  const offset = parseInt(c.req.query("offset") || "0");

  const conds = [eq(products.tenantId, tenantId)];
  if (status) {
    conds.push(eq(products.status, status as "active" | "inactive" | "archived" | "out_of_stock"));
  }
  if (categoryId) conds.push(eq(products.categoryId, categoryId));
  if (search) {
    const like = `%${search.toLowerCase()}%`;
    conds.push(
      or(
        sql`LOWER(${products.name}) LIKE ${like}`,
        sql`LOWER(${products.sku}) LIKE ${like}`,
        sql`${products.barcode} = ${search}`,
      )!,
    );
  }
  if (lowStock) {
    conds.push(sql`${products.stockQuantity} <= ${products.reorderPoint}`);
    conds.push(eq(products.trackInventory, true));
  }

  const rows = await db
    .select()
    .from(products)
    .where(and(...conds))
    .orderBy(asc(products.name))
    .limit(limit)
    .offset(offset);

  const totalRow = await db.select({ total: count() }).from(products).where(and(...conds));

  return c.json({
    success: true,
    data: rows,
    meta: { total: Number(totalRow[0]?.total || 0), limit, offset },
  });
});

posRoutes.get("/products/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.tenantId, tenantId), eq(products.id, id)))
    .limit(1);

  if (!row) throw new AppError(404, "NOT_FOUND", "Product not found");
  return c.json({ success: true, data: row });
});

posRoutes.post("/products", zValidator("json", productCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const result = await db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({
        tenantId,
        sku: body.sku,
        barcode: body.barcode ?? null,
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        shortDescription: body.shortDescription ?? null,
        type: body.type,
        status: body.status,
        categoryId: body.categoryId ?? null,
        siteId: body.siteId ?? null,
        costPrice: body.costPrice,
        sellingPrice: body.sellingPrice,
        salePrice: body.salePrice ?? null,
        currency: body.currency,
        vatRate: body.vatRate,
        unitOfMeasure: body.unitOfMeasure,
        trackInventory: body.trackInventory,
        stockQuantity: body.stockQuantity,
        reorderPoint: body.reorderPoint ?? "0",
        reorderQuantity: body.reorderQuantity ?? "0",
        imageUrl: body.imageUrl ?? null,
        galleryUrls: body.galleryUrls,
        isOnlineEnabled: body.isOnlineEnabled,
        isPosEnabled: body.isPosEnabled,
        seoTitle: body.seoTitle ?? null,
        seoDescription: body.seoDescription ?? null,
        hasVariants: body.hasVariants,
        options: body.options,
        attributes: body.attributes,
        supplier: body.supplier ?? null,
        supplierSku: body.supplierSku ?? null,
      })
      .returning();

    if (body.trackInventory && Number(body.stockQuantity) > 0) {
      await tx.insert(stockMovements).values({
        tenantId,
        productId: product!.id,
        type: "purchase",
        quantityDelta: body.stockQuantity,
        quantityAfter: body.stockQuantity,
        reason: "Initial stock",
        performedBy: user.id,
      });
    }

    return product;
  });

  return c.json({ success: true, data: result }, 201);
});

posRoutes.patch("/products/:id", zValidator("json", productCreateSchema.partial()), async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [row] = await db
    .update(products)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(products.tenantId, tenantId), eq(products.id, id)))
    .returning();

  if (!row) throw new AppError(404, "NOT_FOUND", "Product not found");
  return c.json({ success: true, data: row });
});

posRoutes.delete("/products/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const result = await db
    .delete(products)
    .where(and(eq(products.tenantId, tenantId), eq(products.id, id)))
    .returning({ id: products.id });

  if (result.length === 0) throw new AppError(404, "NOT_FOUND", "Product not found");
  return c.json({ success: true });
});

// ─────────────────────────────────────────────
// STOCK MOVEMENTS
// ─────────────────────────────────────────────

const stockAdjustSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum([
    "purchase",
    "sale",
    "return",
    "adjustment_in",
    "adjustment_out",
    "transfer_in",
    "transfer_out",
    "loss",
    "inventory_count",
    "consumption",
  ]),
  quantityDelta: z.string().regex(/^-?\d+(\.\d{1,4})?$/),
  unitCost: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  reason: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  referenceType: z.string().max(64).optional(),
  referenceId: z.string().uuid().optional(),
  referenceCode: z.string().max(64).optional(),
});

posRoutes.get("/stock-movements", async (c) => {
  const tenantId = c.get("tenantId");
  const productId = c.req.query("productId");
  const limit = Math.min(parseInt(c.req.query("limit") || "100"), 500);
  const offset = parseInt(c.req.query("offset") || "0");

  const conds = [eq(stockMovements.tenantId, tenantId)];
  if (productId) conds.push(eq(stockMovements.productId, productId));

  const rows = await db
    .select()
    .from(stockMovements)
    .where(and(...conds))
    .orderBy(desc(stockMovements.performedAt))
    .limit(limit)
    .offset(offset);

  return c.json({ success: true, data: rows });
});

posRoutes.post("/stock-movements", zValidator("json", stockAdjustSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const result = await db.transaction(async (tx) => {
    const [product] = await tx
      .select()
      .from(products)
      .where(and(eq(products.tenantId, tenantId), eq(products.id, body.productId)))
      .for("update")
      .limit(1);

    if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");

    const newStock = Number(product.stockQuantity) + Number(body.quantityDelta);
    if (newStock < 0) {
      throw new AppError(400, "NEGATIVE_STOCK", "Movement would result in negative stock");
    }

    await tx
      .update(products)
      .set({
        stockQuantity: newStock.toFixed(4),
        status: newStock <= 0 && product.trackInventory ? "out_of_stock" : product.status,
        updatedAt: new Date(),
      })
      .where(eq(products.id, body.productId));

    const [movement] = await tx
      .insert(stockMovements)
      .values({
        tenantId,
        productId: body.productId,
        siteId: product.siteId,
        type: body.type,
        quantityDelta: body.quantityDelta,
        quantityAfter: newStock.toFixed(4),
        unitCost: body.unitCost ?? null,
        reason: body.reason ?? null,
        notes: body.notes ?? null,
        referenceType: body.referenceType ?? null,
        referenceId: body.referenceId ?? null,
        referenceCode: body.referenceCode ?? null,
        performedBy: user.id,
      })
      .returning();

    return movement;
  });

  return c.json({ success: true, data: result }, 201);
});

// ─────────────────────────────────────────────
// POS TRANSACTIONS
// ─────────────────────────────────────────────

const transactionLineInputSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z.string().min(1).max(300),
  productSku: z.string().max(64).optional(),
  quantity: z.string().regex(/^\d+(\.\d{1,4})?$/).default("1"),
  unitPrice: z.string().regex(/^\d+(\.\d{1,4})?$/),
  costPrice: z.string().regex(/^\d+(\.\d{1,4})?$/).default("0"),
  discountPercent: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  vatRate: z.string().regex(/^\d+(\.\d{1,2})?$/).default("19.00"),
  notes: z.string().max(500).optional(),
});

const transactionCreateSchema = z.object({
  customerId: z.string().uuid().optional(),
  customerNameSnapshot: z.string().max(300).optional(),
  registerCode: z.string().max(32).optional(),
  siteId: z.string().uuid().optional(),
  currency: z.string().length(3).default("RON"),
  lines: z.array(transactionLineInputSchema).min(1),
  paymentMethod: z.enum(["cash", "card", "voucher", "bank_transfer", "house_account", "split"]).optional(),
  amountTendered: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  tipAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  paymentBreakdown: z.array(z.object({
    method: z.string(),
    amount: z.number(),
    reference: z.string().optional(),
  })).default([]),
  notes: z.string().max(2000).optional(),
  completeOnCreate: z.boolean().default(true),
});

posRoutes.get("/transactions", async (c) => {
  const tenantId = c.get("tenantId");
  const status = c.req.query("status");
  const cashierId = c.req.query("cashierId");
  const customerId = c.req.query("customerId");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);
  const offset = parseInt(c.req.query("offset") || "0");

  const conds = [eq(posTransactions.tenantId, tenantId)];
  if (status) {
    conds.push(eq(posTransactions.status, status as "open" | "completed" | "refunded" | "partially_refunded" | "voided"));
  }
  if (cashierId) conds.push(eq(posTransactions.cashierId, cashierId));
  if (customerId) conds.push(eq(posTransactions.customerId, customerId));
  if (from) conds.push(gte(posTransactions.openedAt, new Date(from)));
  if (to) conds.push(lte(posTransactions.openedAt, new Date(to)));

  const rows = await db
    .select()
    .from(posTransactions)
    .where(and(...conds))
    .orderBy(desc(posTransactions.openedAt))
    .limit(limit)
    .offset(offset);

  const totalRow = await db.select({ total: count() }).from(posTransactions).where(and(...conds));

  return c.json({
    success: true,
    data: rows,
    meta: { total: Number(totalRow[0]?.total || 0), limit, offset },
  });
});

posRoutes.get("/transactions/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  const [tx] = await db
    .select()
    .from(posTransactions)
    .where(and(eq(posTransactions.tenantId, tenantId), eq(posTransactions.id, id)))
    .limit(1);

  if (!tx) throw new AppError(404, "NOT_FOUND", "Transaction not found");

  const lines = await db
    .select()
    .from(posTransactionLines)
    .where(eq(posTransactionLines.transactionId, id))
    .orderBy(asc(posTransactionLines.lineNumber));

  return c.json({ success: true, data: { ...tx, lines } });
});

posRoutes.post("/transactions", zValidator("json", transactionCreateSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  // Compute totals
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
      productId: line.productId ?? null,
      productName: line.productName,
      productSku: line.productSku ?? null,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      costPrice: line.costPrice,
      discountPercent: line.discountPercent,
      discountAmount: totals.discountAmount,
      vatRate: line.vatRate,
      vatAmount: totals.vatAmount,
      subtotal: totals.subtotal,
      totalAmount: totals.totalAmount,
      notes: line.notes ?? null,
    };
  });

  const subtotalSum = computedLines.reduce((acc, l) => acc + Number(l.subtotal), 0);
  const vatSum = computedLines.reduce((acc, l) => acc + Number(l.vatAmount), 0);
  const totalDiscount = computedLines.reduce((acc, l) => acc + Number(l.discountAmount), 0);
  const totalAmount = computedLines.reduce((acc, l) => acc + Number(l.totalAmount), 0);

  const receiptNumber = generateReceiptNumber();
  const status = body.completeOnCreate ? "completed" : "open";
  const openedAt = new Date();
  const closedAt = body.completeOnCreate ? openedAt : null;

  const changeGiven =
    body.amountTendered && body.paymentMethod === "cash"
      ? Math.max(0, Number(body.amountTendered) - totalAmount).toFixed(2)
      : "0";

  const result = await db.transaction(async (tx) => {
    const [transaction] = await tx
      .insert(posTransactions)
      .values({
        tenantId,
        receiptNumber,
        status,
        customerId: body.customerId ?? null,
        customerNameSnapshot: body.customerNameSnapshot ?? null,
        cashierId: user.id,
        registerCode: body.registerCode ?? null,
        siteId: body.siteId ?? null,
        subtotal: subtotalSum.toFixed(2),
        totalDiscount: totalDiscount.toFixed(2),
        totalVat: vatSum.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        tipAmount: body.tipAmount,
        paymentMethod: body.paymentMethod ?? null,
        amountTendered: body.amountTendered ?? null,
        changeGiven,
        paymentBreakdown: body.paymentBreakdown,
        currency: body.currency,
        notes: body.notes ?? null,
        openedAt,
        closedAt,
      })
      .returning();

    const insertedLines = await tx
      .insert(posTransactionLines)
      .values(computedLines.map((l) => ({ tenantId, transactionId: transaction!.id, ...l })))
      .returning();

    // Decrement stock for products with inventory tracking when completing
    if (status === "completed") {
      for (const line of computedLines) {
        if (!line.productId) continue;
        const [prod] = await tx
          .select()
          .from(products)
          .where(and(eq(products.tenantId, tenantId), eq(products.id, line.productId)))
          .for("update")
          .limit(1);
        if (!prod || !prod.trackInventory) continue;

        const newStock = Number(prod.stockQuantity) - Number(line.quantity);
        await tx
          .update(products)
          .set({
            stockQuantity: newStock.toFixed(4),
            totalSold: sql`${products.totalSold} + ${Math.round(Number(line.quantity))}`,
            totalRevenue: sql`${products.totalRevenue} + ${Number(line.totalAmount)}`,
            status: newStock <= 0 ? "out_of_stock" : prod.status,
            updatedAt: new Date(),
          })
          .where(eq(products.id, line.productId));

        await tx.insert(stockMovements).values({
          tenantId,
          productId: line.productId,
          siteId: prod.siteId,
          type: "sale",
          quantityDelta: (-Number(line.quantity)).toFixed(4),
          quantityAfter: newStock.toFixed(4),
          unitCost: prod.costPrice,
          reason: `POS sale ${receiptNumber}`,
          referenceType: "pos_transaction",
          referenceId: transaction!.id,
          referenceCode: receiptNumber,
          performedBy: user.id,
        });
      }
    }

    return { ...transaction!, lines: insertedLines };
  });

  return c.json({ success: true, data: result }, 201);
});

posRoutes.post(
  "/transactions/:id/refund",
  zValidator(
    "json",
    z.object({
      amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
      reason: z.string().max(500).optional(),
      restoreStock: z.boolean().default(true),
    }),
  ),
  async (c) => {
    const tenantId = c.get("tenantId");
    const user = c.get("user");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const result = await db.transaction(async (tx) => {
      const [transaction] = await tx
        .select()
        .from(posTransactions)
        .where(and(eq(posTransactions.tenantId, tenantId), eq(posTransactions.id, id)))
        .for("update")
        .limit(1);

      if (!transaction) throw new AppError(404, "NOT_FOUND", "Transaction not found");
      if (transaction.status !== "completed" && transaction.status !== "partially_refunded") {
        throw new AppError(400, "INVALID_STATE", "Only completed transactions can be refunded");
      }

      const refundAmount = body.amount ? Number(body.amount) : Number(transaction.totalAmount);
      const currentlyRefunded = Number(transaction.refundedAmount);
      const newRefunded = currentlyRefunded + refundAmount;
      if (newRefunded > Number(transaction.totalAmount)) {
        throw new AppError(400, "OVERREFUND", "Refund amount exceeds transaction total");
      }

      const newStatus =
        newRefunded >= Number(transaction.totalAmount) ? "refunded" : "partially_refunded";

      await tx
        .update(posTransactions)
        .set({
          status: newStatus,
          refundedAmount: newRefunded.toFixed(2),
          refundedAt: new Date(),
          notes: body.reason
            ? `${transaction.notes ?? ""}\n[REFUND ${new Date().toISOString()}] ${body.reason}`.trim()
            : transaction.notes,
        })
        .where(eq(posTransactions.id, id));

      // Restore stock proportionally if full refund
      if (body.restoreStock && newStatus === "refunded") {
        const lines = await tx.select().from(posTransactionLines).where(eq(posTransactionLines.transactionId, id));
        for (const line of lines) {
          if (!line.productId) continue;
          const [prod] = await tx
            .select()
            .from(products)
            .where(eq(products.id, line.productId))
            .for("update")
            .limit(1);
          if (!prod || !prod.trackInventory) continue;

          const refundQty = Number(line.quantity) - Number(line.refundedQuantity);
          if (refundQty <= 0) continue;

          const newStock = Number(prod.stockQuantity) + refundQty;

          await tx
            .update(products)
            .set({
              stockQuantity: newStock.toFixed(4),
              status: prod.status === "out_of_stock" && newStock > 0 ? "active" : prod.status,
              updatedAt: new Date(),
            })
            .where(eq(products.id, line.productId));

          await tx
            .update(posTransactionLines)
            .set({ refundedQuantity: line.quantity })
            .where(eq(posTransactionLines.id, line.id));

          await tx.insert(stockMovements).values({
            tenantId,
            productId: line.productId,
            siteId: prod.siteId,
            type: "return",
            quantityDelta: refundQty.toFixed(4),
            quantityAfter: newStock.toFixed(4),
            reason: `Refund of ${transaction.receiptNumber}`,
            referenceType: "pos_transaction_refund",
            referenceId: id,
            referenceCode: transaction.receiptNumber,
            performedBy: user.id,
          });
        }
      }

      return { id, status: newStatus, refundedAmount: newRefunded.toFixed(2) };
    });

    return c.json({ success: true, data: result });
  },
);

// ─────────────────────────────────────────────
// DAILY SUMMARY (Z-Report style)
// ─────────────────────────────────────────────

posRoutes.get("/reports/daily", async (c) => {
  const tenantId = c.get("tenantId");
  const dateStr = c.req.query("date") || new Date().toISOString().slice(0, 10);
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const conds = [
    eq(posTransactions.tenantId, tenantId),
    gte(posTransactions.openedAt, dayStart),
    lt(posTransactions.openedAt, dayEnd),
  ];

  const summary = await db
    .select({
      transactions: count(),
      grossRevenue: sql<string>`COALESCE(SUM(${posTransactions.totalAmount}), 0)`,
      totalVat: sql<string>`COALESCE(SUM(${posTransactions.totalVat}), 0)`,
      totalDiscount: sql<string>`COALESCE(SUM(${posTransactions.totalDiscount}), 0)`,
      totalRefunded: sql<string>`COALESCE(SUM(${posTransactions.refundedAmount}), 0)`,
      tips: sql<string>`COALESCE(SUM(${posTransactions.tipAmount}), 0)`,
    })
    .from(posTransactions)
    .where(and(...conds));

  const byMethod = await db
    .select({
      method: posTransactions.paymentMethod,
      transactions: count(),
      amount: sql<string>`COALESCE(SUM(${posTransactions.totalAmount}), 0)`,
    })
    .from(posTransactions)
    .where(and(...conds))
    .groupBy(posTransactions.paymentMethod);

  return c.json({
    success: true,
    data: {
      date: dateStr,
      summary: summary[0],
      byPaymentMethod: byMethod,
    },
  });
});
