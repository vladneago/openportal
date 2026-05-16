import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

// ─────────────────────────────────────────────
// ANAF credentials per tenant
//
// Stores OAuth2 tokens for ANAF SPV (Spațiul Privat Virtual) and the
// issuer's static fiscal identity used in UBL invoice generation.
//
// One row per tenant. Tokens are encrypted at rest in production via
// the secrets-manager hook (TODO); for now stored verbatim — the DB
// itself is private and access is auth-gated.
// ─────────────────────────────────────────────

export const anafEnvEnum = pgEnum("anaf_environment", ["test", "prod"]);

export const tenantAnafCredentials = pgTable(
  "tenant_anaf_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

    // OAuth2 with ANAF (logincert.anaf.ro)
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    tokenType: varchar("token_type", { length: 32 }).default("Bearer"),
    scope: varchar("scope", { length: 200 }),

    // Which ANAF environment this tenant is wired to
    environment: anafEnvEnum("environment").notNull().default("test"),

    // Issuer fiscal identity (snapshot — also stored per-invoice)
    cui: varchar("cui", { length: 32 }), // CUI sau CIF (with or without RO prefix)
    registrationNumber: varchar("registration_number", { length: 64 }), // Nr ORC, ex: J40/12345/2020
    legalName: varchar("legal_name", { length: 300 }),
    address: text("address"),
    city: varchar("city", { length: 120 }),
    county: varchar("county", { length: 120 }), // Județul (ex: "B" pentru București)
    countryCode: varchar("country_code", { length: 2 }).default("RO"),
    postalCode: varchar("postal_code", { length: 16 }),
    iban: varchar("iban", { length: 64 }),
    bank: varchar("bank", { length: 200 }),

    // Sync state
    isActive: boolean("is_active").notNull().default(false),
    lastConnectedAt: timestamp("last_connected_at", { withTimezone: true }),
    lastErrorAt: timestamp("last_error_at", { withTimezone: true }),
    lastErrorMessage: text("last_error_message"),

    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("tenant_anaf_credentials_tenant_idx").on(table.tenantId),
    index("tenant_anaf_credentials_cui_idx").on(table.cui),
  ],
);

export type TenantAnafCredentials = typeof tenantAnafCredentials.$inferSelect;
export type NewTenantAnafCredentials = typeof tenantAnafCredentials.$inferInsert;
