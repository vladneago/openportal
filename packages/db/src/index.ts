import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as tenantSchema from "./schema/tenants";
import * as userSchema from "./schema/users";
import * as siteSchema from "./schema/sites";
import * as auditSchema from "./schema/audit";
import * as documentSchema from "./schema/documents";

const schema = {
  ...tenantSchema,
  ...userSchema,
  ...siteSchema,
  ...auditSchema,
  ...documentSchema,
};

const connectionString = process.env.DATABASE_URL || "postgresql://openportal:openportal_dev@localhost:5432/openportal";

const queryClient = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

export * from "./schema/tenants";
export * from "./schema/users";
export * from "./schema/sites";
export * from "./schema/audit";
export * from "./schema/documents";

export { schema };
export type Database = typeof db;
