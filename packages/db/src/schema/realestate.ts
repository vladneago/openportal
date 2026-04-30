import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const propertyTypeEnum = pgEnum("property_type", ["apartment", "house", "commercial", "land", "office", "warehouse"]);
export const propertyStatusEnum = pgEnum("property_status", ["available", "reserved", "sold", "rented", "unavailable"]);
export const listingTypeEnum = pgEnum("listing_type", ["sale", "rent", "both"]);
export const viewingStatusEnum = pgEnum("viewing_status", ["scheduled", "completed", "cancelled", "no_show"]);

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  propertyType: propertyTypeEnum("property_type").notNull().default("apartment"),
  listingType: listingTypeEnum("listing_type").notNull().default("sale"),
  status: propertyStatusEnum("property_status").notNull().default("available"),
  price: integer("price").default(0), // cents
  currency: varchar("currency", { length: 3 }).default("EUR"),
  rentPrice: integer("rent_price").default(0), // monthly, cents
  address: text("address"),
  city: varchar("city", { length: 200 }),
  zone: varchar("zone", { length: 200 }),
  area: integer("area"), // sqm
  rooms: integer("rooms"),
  bathrooms: integer("bathrooms"),
  floor: integer("floor"),
  totalFloors: integer("total_floors"),
  yearBuilt: integer("year_built"),
  description: text("description"),
  features: jsonb("features").$type<string[]>().default([]), // parking, balcony, elevator, etc
  images: jsonb("images").$type<Array<{ url: string; caption?: string }>>().default([]),
  coordinates: jsonb("coordinates").$type<{ lat: number; lng: number }>(),
  agentId: uuid("agent_id").references(() => users.id),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("properties_tenant_status_idx").on(table.tenantId, table.status),
]);

export type Property = typeof properties.$inferSelect;

export const propertyViewings = pgTable("property_viewings", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  clientName: varchar("client_name", { length: 300 }).notNull(),
  clientPhone: varchar("client_phone", { length: 50 }),
  clientEmail: varchar("client_email", { length: 255 }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: viewingStatusEnum("viewing_status").notNull().default("scheduled"),
  notes: text("notes"),
  feedback: text("feedback"),
  rating: integer("rating"), // 1-5
  agentId: uuid("agent_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
