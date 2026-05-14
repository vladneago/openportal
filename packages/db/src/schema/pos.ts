import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { sites } from "./sites";
import { bookingCustomers } from "./booking";
import { billingInvoices } from "./billing";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const productTypeEnum = pgEnum("product_type", [
  "physical",
  "service",
  "digital",
  "voucher",
  "bundle",
]);

export const productStatusEnum = pgEnum("product_status", [
  "active",
  "inactive",
  "archived",
  "out_of_stock",
]);

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
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
]);

export const posTransactionStatusEnum = pgEnum("pos_transaction_status", [
  "open",
  "completed",
  "refunded",
  "partially_refunded",
  "voided",
]);

export const posPaymentMethodEnum = pgEnum("pos_payment_method", [
  "cash",
  "card",
  "voucher",
  "bank_transfer",
  "house_account",
  "split",
]);

// ─────────────────────────────────────────────
// PRODUCT CATEGORIES
// ─────────────────────────────────────────────

export const productCategories = pgTable("product_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#6366F1"),
  iconUrl: text("icon_url"),

  parentId: uuid("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("product_categories_tenant_slug_idx").on(table.tenantId, table.slug),
  index("product_categories_parent_idx").on(table.parentId),
]);

export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
  categoryId: uuid("category_id").references(() => productCategories.id, { onDelete: "set null" }),

  sku: varchar("sku", { length: 64 }).notNull(),
  barcode: varchar("barcode", { length: 64 }),
  name: varchar("name", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 500 }),

  type: productTypeEnum("type").notNull().default("physical"),
  status: productStatusEnum("status").notNull().default("active"),

  // Pricing
  costPrice: numeric("cost_price", { precision: 14, scale: 4 }).default("0"),
  sellingPrice: numeric("selling_price", { precision: 14, scale: 2 }).notNull().default("0"),
  salePrice: numeric("sale_price", { precision: 14, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull().default("RON"),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("19.00"),
  unitOfMeasure: varchar("unit_of_measure", { length: 16 }).default("buc"),

  // Stock
  trackInventory: boolean("track_inventory").notNull().default(true),
  stockQuantity: numeric("stock_quantity", { precision: 14, scale: 4 }).notNull().default("0"),
  stockReserved: numeric("stock_reserved", { precision: 14, scale: 4 }).notNull().default("0"),
  reorderPoint: numeric("reorder_point", { precision: 14, scale: 4 }).default("0"),
  reorderQuantity: numeric("reorder_quantity", { precision: 14, scale: 4 }).default("0"),

  // Media
  imageUrl: text("image_url"),
  galleryUrls: jsonb("gallery_urls").$type<string[]>().default([]),

  // Online presence
  isOnlineEnabled: boolean("is_online_enabled").notNull().default(false),
  isPosEnabled: boolean("is_pos_enabled").notNull().default(true),
  seoTitle: varchar("seo_title", { length: 200 }),
  seoDescription: text("seo_description"),

  // Variants & options
  hasVariants: boolean("has_variants").notNull().default(false),
  options: jsonb("options").$type<Array<{ name: string; values: string[] }>>().default([]),
  attributes: jsonb("attributes").$type<Record<string, unknown>>().default({}),

  // Supply chain
  supplier: varchar("supplier", { length: 200 }),
  supplierSku: varchar("supplier_sku", { length: 64 }),

  // Stats
  totalSold: integer("total_sold").notNull().default(0),
  totalRevenue: numeric("total_revenue", { precision: 14, scale: 2 }).notNull().default("0"),

  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("products_tenant_sku_idx").on(table.tenantId, table.sku),
  index("products_tenant_status_idx").on(table.tenantId, table.status),
  index("products_category_idx").on(table.categoryId),
  index("products_barcode_idx").on(table.tenantId, table.barcode),
  index("products_low_stock_idx").on(table.tenantId, table.stockQuantity),
]);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// ─────────────────────────────────────────────
// POS TRANSACTIONS (sales register)
// ─────────────────────────────────────────────

export const posTransactions = pgTable("pos_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),

  // Receipt number (separate from invoice number)
  receiptNumber: varchar("receipt_number", { length: 32 }).notNull(),

  status: posTransactionStatusEnum("status").notNull().default("open"),

  customerId: uuid("customer_id").references(() => bookingCustomers.id, { onDelete: "set null" }),
  customerNameSnapshot: varchar("customer_name_snapshot", { length: 300 }),

  // Cashier
  cashierId: uuid("cashier_id").references(() => users.id),
  registerCode: varchar("register_code", { length: 32 }),

  // Totals
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  totalDiscount: numeric("total_discount", { precision: 14, scale: 2 }).notNull().default("0"),
  totalVat: numeric("total_vat", { precision: 14, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  tipAmount: numeric("tip_amount", { precision: 14, scale: 2 }).notNull().default("0"),

  // Payment
  paymentMethod: posPaymentMethodEnum("payment_method"),
  amountTendered: numeric("amount_tendered", { precision: 14, scale: 2 }),
  changeGiven: numeric("change_given", { precision: 14, scale: 2 }).default("0"),
  paymentBreakdown: jsonb("payment_breakdown").$type<Array<{
    method: string;
    amount: number;
    reference?: string;
  }>>().default([]),

  // Link to invoice if generated
  invoiceId: uuid("invoice_id").references(() => billingInvoices.id, { onDelete: "set null" }),

  currency: varchar("currency", { length: 3 }).notNull().default("RON"),

  // Refund tracking
  refundedAmount: numeric("refunded_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),

  notes: text("notes"),
  receiptUrl: text("receipt_url"),

  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),

  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
}, (table) => [
  uniqueIndex("pos_transactions_receipt_idx").on(table.tenantId, table.receiptNumber),
  index("pos_transactions_tenant_status_idx").on(table.tenantId, table.status, table.openedAt),
  index("pos_transactions_cashier_idx").on(table.cashierId, table.openedAt),
  index("pos_transactions_customer_idx").on(table.customerId),
]);

export type PosTransaction = typeof posTransactions.$inferSelect;
export type NewPosTransaction = typeof posTransactions.$inferInsert;

// ─────────────────────────────────────────────
// POS TRANSACTION LINES
// ─────────────────────────────────────────────

export const posTransactionLines = pgTable("pos_transaction_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  transactionId: uuid("transaction_id").notNull().references(() => posTransactions.id, { onDelete: "cascade" }),

  lineNumber: integer("line_number").notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),

  // Snapshot
  productName: varchar("product_name", { length: 300 }).notNull(),
  productSku: varchar("product_sku", { length: 64 }),

  quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 14, scale: 4 }).notNull().default("0"),
  costPrice: numeric("cost_price", { precision: 14, scale: 4 }).default("0"),

  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 14, scale: 2 }).notNull().default("0"),

  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("19.00"),
  vatAmount: numeric("vat_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),

  // Refund tracking on the line level
  refundedQuantity: numeric("refunded_quantity", { precision: 14, scale: 4 }).notNull().default("0"),

  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("pos_transaction_lines_transaction_idx").on(table.transactionId, table.lineNumber),
  index("pos_transaction_lines_product_idx").on(table.productId),
]);

export type PosTransactionLine = typeof posTransactionLines.$inferSelect;
export type NewPosTransactionLine = typeof posTransactionLines.$inferInsert;

// ─────────────────────────────────────────────
// STOCK MOVEMENTS (audit trail of inventory changes)
// ─────────────────────────────────────────────

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),

  type: stockMovementTypeEnum("type").notNull(),
  quantityDelta: numeric("quantity_delta", { precision: 14, scale: 4 }).notNull(),
  quantityAfter: numeric("quantity_after", { precision: 14, scale: 4 }).notNull(),

  unitCost: numeric("unit_cost", { precision: 14, scale: 4 }).default("0"),

  // Reference to the source document
  referenceType: varchar("reference_type", { length: 64 }),
  referenceId: uuid("reference_id"),
  referenceCode: varchar("reference_code", { length: 64 }),

  reason: varchar("reason", { length: 200 }),
  notes: text("notes"),

  performedBy: uuid("performed_by").references(() => users.id),
  performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("stock_movements_product_time_idx").on(table.productId, table.performedAt),
  index("stock_movements_tenant_time_idx").on(table.tenantId, table.performedAt),
  index("stock_movements_reference_idx").on(table.referenceType, table.referenceId),
]);

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
