import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as tenantSchema from "./schema/tenants";
import * as userSchema from "./schema/users";
import * as siteSchema from "./schema/sites";
import * as auditSchema from "./schema/audit";
import * as documentSchema from "./schema/documents";
import * as tableSchema from "./schema/tables";
import * as pageSchema from "./schema/pages";
import * as commentSchema from "./schema/comments";
import * as notificationSchema from "./schema/notifications";
import * as formSchema from "./schema/forms";
import * as workflowSchema from "./schema/workflows";
import * as chatSchema from "./schema/chat";
import * as calendarSchema from "./schema/calendar";

const schema = {
  ...tenantSchema, ...userSchema, ...siteSchema, ...auditSchema,
  ...documentSchema, ...tableSchema, ...pageSchema,
  ...commentSchema, ...notificationSchema, ...formSchema,
  ...workflowSchema, ...chatSchema, ...calendarSchema,
};

const connectionString = process.env.DATABASE_URL || "postgresql://openportal:openportal_dev@localhost:5432/openportal";
const queryClient = postgres(connectionString, { max: 20, idle_timeout: 20, connect_timeout: 10 });
export const db = drizzle(queryClient, { schema });

export * from "./schema/tenants";
export * from "./schema/users";
export * from "./schema/sites";
export * from "./schema/audit";
export * from "./schema/documents";
export * from "./schema/tables";
export * from "./schema/pages";
export * from "./schema/comments";
export * from "./schema/notifications";
export * from "./schema/forms";
export * from "./schema/workflows";
export * from "./schema/chat";
export * from "./schema/calendar";

export { schema };
export type Database = typeof db;
