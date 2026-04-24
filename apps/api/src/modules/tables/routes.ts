import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, tables, columns, rows } from "@openportal/db";
import { eq, and, asc, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AppError } from "../../middleware/error-handler";

export const tableRoutes = new Hono();
tableRoutes.use("*", requireAuth);

// ─── TABLES ───

// GET /tables — List all tables for tenant
tableRoutes.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const siteId = c.req.query("siteId");
  const conditions: any[] = [eq(tables.tenantId, tenantId)];
  if (siteId) conditions.push(eq(tables.siteId, siteId));
  const results = await db.select().from(tables).where(and(...conditions)).orderBy(tables.title);
  return c.json({ success: true, data: results });
});

// POST /tables — Create a table with default columns
const createTableSchema = z.object({
  siteId: z.string().uuid(),
  title: z.string().min(1).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  icon: z.string().max(10).optional(),
});

tableRoutes.post("/", zValidator("json", createTableSchema), async (c) => {
  const tenantId = c.get("tenantId");
  const user = c.get("user");
  const body = c.req.valid("json");

  const result = await db.transaction(async (tx) => {
    const [table] = await tx.insert(tables).values({
      tenantId, siteId: body.siteId, title: body.title, slug: body.slug,
      description: body.description || null, icon: body.icon || "📋",
      createdBy: user.id,
    }).returning();

    // Create default columns: Title, Status, Priority, Assignee, Due Date
    const defaultCols = [
      { name: "Titlu", type: "text" as const, order: 0, width: 300, config: { required: true } },
      { name: "Status", type: "choice" as const, order: 1, width: 140, config: { choices: ["De făcut", "În progres", "În review", "Finalizat"], defaultValue: "De făcut" }, isKanbanField: true },
      { name: "Prioritate", type: "choice" as const, order: 2, width: 120, config: { choices: ["Urgentă", "Mare", "Medie", "Mică"] } },
      { name: "Responsabil", type: "person" as const, order: 3, width: 160 },
      { name: "Termen", type: "date" as const, order: 4, width: 130 },
    ];

    const insertedCols = [];
    for (const col of defaultCols) {
      const [inserted] = await tx.insert(columns).values({
        tableId: table!.id, name: col.name, type: col.type, order: col.order,
        width: col.width, config: col.config || {}, isKanbanField: col.isKanbanField || false,
      }).returning();
      insertedCols.push(inserted);
    }

    return { table: table!, columns: insertedCols };
  });

  return c.json({ success: true, data: result }, 201);
});

// GET /tables/:id — Get table with columns and row count
tableRoutes.get("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const tableId = c.req.param("id");
  const [table] = await db.select().from(tables).where(and(eq(tables.id, tableId), eq(tables.tenantId, tenantId))).limit(1);
  if (!table) throw new AppError(404, "NOT_FOUND", "Table not found");

  const cols = await db.select().from(columns).where(eq(columns.tableId, tableId)).orderBy(asc(columns.order));
  const [rowCount] = await db.select({ count: count() }).from(rows).where(eq(rows.tableId, tableId));

  return c.json({ success: true, data: { ...table, columns: cols, rowCount: rowCount?.count || 0 } });
});

// DELETE /tables/:id
tableRoutes.delete("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const tableId = c.req.param("id");
  await db.delete(tables).where(and(eq(tables.id, tableId), eq(tables.tenantId, tenantId)));
  return c.json({ success: true, data: { message: "Table deleted" } });
});

// ─── COLUMNS ───

// POST /tables/:id/columns — Add a column
const addColumnSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["text", "number", "date", "datetime", "boolean", "choice", "multi_choice", "person", "url", "email", "currency", "rating", "image", "rich_text"]),
  config: z.record(z.unknown()).optional(),
});

tableRoutes.post("/:id/columns", zValidator("json", addColumnSchema), async (c) => {
  const tableId = c.req.param("id");
  const body = c.req.valid("json");

  // Get max order
  const existing = await db.select().from(columns).where(eq(columns.tableId, tableId)).orderBy(asc(columns.order));
  const maxOrder = existing.length > 0 ? Math.max(...existing.map((c) => c.order)) + 1 : 0;

  const [col] = await db.insert(columns).values({
    tableId, name: body.name, type: body.type, order: maxOrder, config: body.config || {},
  }).returning();

  return c.json({ success: true, data: col }, 201);
});

// DELETE /tables/:tableId/columns/:colId
tableRoutes.delete("/:tableId/columns/:colId", async (c) => {
  const colId = c.req.param("colId");
  await db.delete(columns).where(eq(columns.id, colId));
  return c.json({ success: true, data: { message: "Column deleted" } });
});

// ─── ROWS ───

// GET /tables/:id/rows — Get all rows
tableRoutes.get("/:id/rows", async (c) => {
  const tableId = c.req.param("id");
  const results = await db.select().from(rows).where(eq(rows.tableId, tableId)).orderBy(asc(rows.order));
  return c.json({ success: true, data: results });
});

// POST /tables/:id/rows — Create a row
const createRowSchema = z.object({
  data: z.record(z.unknown()),
});

tableRoutes.post("/:id/rows", zValidator("json", createRowSchema), async (c) => {
  const tableId = c.req.param("id");
  const user = c.get("user");
  const body = c.req.valid("json");

  const existing = await db.select().from(rows).where(eq(rows.tableId, tableId));
  const maxOrder = existing.length > 0 ? Math.max(...existing.map((r) => r.order)) + 1 : 0;

  const [row] = await db.insert(rows).values({
    tableId, data: body.data, order: maxOrder, createdBy: user.id,
  }).returning();

  return c.json({ success: true, data: row }, 201);
});

// PATCH /tables/:tableId/rows/:rowId — Update row data
const updateRowSchema = z.object({
  data: z.record(z.unknown()),
});

tableRoutes.patch("/:tableId/rows/:rowId", zValidator("json", updateRowSchema), async (c) => {
  const rowId = c.req.param("rowId");
  const body = c.req.valid("json");

  const [existing] = await db.select().from(rows).where(eq(rows.id, rowId)).limit(1);
  if (!existing) throw new AppError(404, "NOT_FOUND", "Row not found");

  const mergedData = { ...existing.data as Record<string, unknown>, ...body.data };
  const [updated] = await db.update(rows).set({ data: mergedData, updatedAt: new Date() }).where(eq(rows.id, rowId)).returning();

  return c.json({ success: true, data: updated });
});

// DELETE /tables/:tableId/rows/:rowId
tableRoutes.delete("/:tableId/rows/:rowId", async (c) => {
  const rowId = c.req.param("rowId");
  await db.delete(rows).where(eq(rows.id, rowId));
  return c.json({ success: true, data: { message: "Row deleted" } });
});
