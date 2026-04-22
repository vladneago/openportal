import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as tenantSchema from "./schema/tenants";
import * as userSchema from "./schema/users";
import * as siteSchema from "./schema/sites";
import * as auditSchema from "./schema/audit";

// Combine all schemas
const schema = {
  ...tenantSchema,
  ...userSchema,
  ...siteSchema,
  ...auditSchema,
};

// Create the database connection
const connectionString = process.env.DATABASE_URL || "postgresql://openportal:openportal_dev@localhost:5432/openportal";

// For query purposes (connection pool)
const queryClient = postgres(connectionString, {
  max: 20,               // Max connections in pool
  idle_timeout: 20,      // Close idle connections after 20s
  connect_timeout: 10,   // Connection timeout 10s
});

// The Drizzle ORM instance — use this everywhere
export const db = drizzle(queryClient, { schema });

// Export all schemas
export * from "./schema/tenants";
export * from "./schema/users";
export * from "./schema/sites";
export * from "./schema/audit";

// Export the schema object for migrations
export { schema };

// Export types
export type Database = typeof db;
