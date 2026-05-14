import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

// ═════════════════════════════════════════════════════════════════
// PERMISSIONS — SharePoint-grade ACL
// Role definitions, assignments, inheritance, audit, policies.
// ═════════════════════════════════════════════════════════════════

export const permissionEnum = pgEnum("permission", [
  // List & item permissions
  "manage_lists",
  "override_list_behaviors",
  "add_list_items",
  "edit_list_items",
  "delete_list_items",
  "view_list_items",
  "approve_items",
  "open_items",
  "view_versions",
  "delete_versions",
  "create_alerts",
  "view_application_pages",
  // Site permissions
  "manage_permissions",
  "view_usage_data",
  "create_subsites",
  "manage_web_site",
  "add_and_customize_pages",
  "apply_themes_and_borders",
  "apply_style_sheets",
  "create_groups",
  "browse_directories",
  "use_self_service_site_creation",
  "view_pages",
  "enumerate_permissions",
  "browse_user_information",
  "manage_alerts",
  "use_remote_apis",
  "use_client_integration_features",
  "open_site",
  "edit_personal_user_information",
  // Personal permissions
  "manage_personal_views",
  "add_delete_private_web_parts",
  "update_personal_web_parts",
  // Custom
  "share_externally",
  "share_internally",
  "delete_site",
  "manage_quotas",
  "manage_audit",
]);

// ─────────────────────────────────────────────
// ROLE DEFINITIONS — bundles of permissions
// ─────────────────────────────────────────────

export const roleDefinitions = pgTable(
  "role_definitions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),

    permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
    order: integer("order").notNull().default(0),

    isHidden: boolean("is_hidden").notNull().default(false),
    isSystem: boolean("is_system").notNull().default(false),
    isAssignable: boolean("is_assignable").notNull().default(true),

    color: varchar("color", { length: 20 }),

    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("role_def_tenant_name_idx").on(table.tenantId, table.name),
  ],
);

export type RoleDefinition = typeof roleDefinitions.$inferSelect;

// ─────────────────────────────────────────────
// ROLE ASSIGNMENTS — principal × role × scope
// ─────────────────────────────────────────────

export const principalTypeEnum = pgEnum("principal_type", [
  "user",
  "group",
  "external_user",
  "anonymous",
  "everyone",
  "everyone_except_external",
  "system",
]);

export const scopeTypeEnum = pgEnum("scope_type", [
  "tenant",
  "site_collection",
  "site",
  "list",
  "list_item",
  "folder",
  "document",
  "page",
  "web_part",
  "library",
]);

export const roleAssignments = pgTable(
  "role_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    principalType: principalTypeEnum("principal_type").notNull(),
    principalId: uuid("principal_id"),
    principalLabel: varchar("principal_label", { length: 200 }),

    roleDefinitionId: uuid("role_definition_id")
      .notNull()
      .references(() => roleDefinitions.id, { onDelete: "cascade" }),

    scopeType: scopeTypeEnum("scope_type").notNull(),
    scopeId: uuid("scope_id"),

    isInherited: boolean("is_inherited").notNull().default(false),
    inheritedFromScopeType: scopeTypeEnum("inherited_from_scope_type"),
    inheritedFromScopeId: uuid("inherited_from_scope_id"),

    expiresAt: timestamp("expires_at", { withTimezone: true }),

    grantedBy: uuid("granted_by").references(() => users.id),
    grantedReason: text("granted_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("role_assign_principal_idx").on(table.principalType, table.principalId),
    index("role_assign_scope_idx").on(table.scopeType, table.scopeId),
    index("role_assign_tenant_idx").on(table.tenantId),
  ],
);

export type RoleAssignment = typeof roleAssignments.$inferSelect;

// ─────────────────────────────────────────────
// PERMISSION INHERITANCE OVERRIDES
// (when a child object breaks inheritance from its parent)
// ─────────────────────────────────────────────

export const permissionInheritance = pgTable(
  "permission_inheritance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    scopeType: scopeTypeEnum("scope_type").notNull(),
    scopeId: uuid("scope_id").notNull(),

    inheritsPermissions: boolean("inherits_permissions").notNull().default(true),
    parentScopeType: scopeTypeEnum("parent_scope_type"),
    parentScopeId: uuid("parent_scope_id"),

    brokenBy: uuid("broken_by").references(() => users.id),
    brokenAt: timestamp("broken_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("perm_inherit_scope_idx").on(table.scopeType, table.scopeId),
  ],
);

// ─────────────────────────────────────────────
// ACCESS REQUESTS — when a user requests access
// ─────────────────────────────────────────────

export const accessRequestStatusEnum = pgEnum("access_request_status", [
  "pending",
  "approved",
  "denied",
  "expired",
  "withdrawn",
]);

export const accessRequests = pgTable(
  "access_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    requesterId: uuid("requester_id").references(() => users.id),
    requesterEmail: varchar("requester_email", { length: 255 }),
    requesterName: varchar("requester_name", { length: 200 }),

    scopeType: scopeTypeEnum("scope_type").notNull(),
    scopeId: uuid("scope_id").notNull(),
    scopeLabel: varchar("scope_label", { length: 500 }),

    requestedRole: varchar("requested_role", { length: 60 }).default("member"),
    message: text("message"),

    status: accessRequestStatusEnum("status").notNull().default("pending"),
    decidedBy: uuid("decided_by").references(() => users.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decisionNotes: text("decision_notes"),

    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("access_req_tenant_status_idx").on(table.tenantId, table.status),
    index("access_req_scope_idx").on(table.scopeType, table.scopeId),
  ],
);

export type AccessRequest = typeof accessRequests.$inferSelect;

// ─────────────────────────────────────────────
// CONDITIONAL ACCESS POLICIES
// ─────────────────────────────────────────────

export const conditionalAccessPolicies = pgTable("conditional_access_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(false),
  priority: integer("priority").notNull().default(100),

  // Conditions
  conditions: jsonb("conditions")
    .$type<{
      userInclude?: { type: "all" | "groups" | "users"; ids?: string[] };
      userExclude?: { type: "groups" | "users"; ids?: string[] };
      appIncludeIds?: string[];
      appExcludeIds?: string[];
      ipRanges?: { include?: string[]; exclude?: string[] };
      countries?: { include?: string[]; exclude?: string[] };
      deviceTypes?: string[];
      clientTypes?: string[]; // browser, mobile, desktop
      sensitivityLabels?: string[];
      timeWindow?: { startHour: number; endHour: number; days: number[] };
      riskLevels?: ("low" | "medium" | "high")[];
    }>()
    .notNull()
    .default({}),

  // Grant controls
  grantControls: jsonb("grant_controls")
    .$type<{
      block?: boolean;
      requireMfa?: boolean;
      requireCompliantDevice?: boolean;
      requireApprovedApp?: boolean;
      requireTermsAccept?: boolean;
      requireApproval?: { approverGroupIds: string[] };
    }>()
    .notNull()
    .default({}),

  // Session controls
  sessionControls: jsonb("session_controls")
    .$type<{
      sessionLifetimeMinutes?: number;
      forcePasswordChange?: boolean;
      blockDownload?: boolean;
      watermark?: boolean;
      printRestrictions?: boolean;
    }>()
    .default({}),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// AUDIT LOG — every access/change recorded
// ─────────────────────────────────────────────

export const auditEventTypeEnum = pgEnum("audit_event_type", [
  // Auth
  "login_success",
  "login_failure",
  "logout",
  "mfa_challenge",
  "mfa_success",
  "mfa_failure",
  "password_change",
  "password_reset",
  // Permissions
  "permission_granted",
  "permission_revoked",
  "permission_modified",
  "inheritance_broken",
  "inheritance_restored",
  "access_request_submitted",
  "access_request_approved",
  "access_request_denied",
  // Sharing
  "shared_externally",
  "shared_internally",
  "share_link_created",
  "share_link_revoked",
  "share_link_used",
  // Content
  "item_created",
  "item_modified",
  "item_deleted",
  "item_restored",
  "item_viewed",
  "item_downloaded",
  "item_uploaded",
  "item_published",
  "item_unpublished",
  "item_approved",
  "item_rejected",
  "item_checked_out",
  "item_checked_in",
  "item_versioned",
  "item_moved",
  "item_copied",
  "item_renamed",
  // Site
  "site_created",
  "site_modified",
  "site_archived",
  "site_deleted",
  "site_restored",
  "site_locked",
  "site_unlocked",
  "site_quota_changed",
  "theme_changed",
  // Configuration
  "policy_created",
  "policy_modified",
  "policy_deleted",
  "user_invited",
  "user_removed",
  "user_role_changed",
  // Compliance
  "ediscovery_search",
  "ediscovery_export",
  "retention_applied",
  "label_applied",
  "label_changed",
  // Custom
  "api_call",
  "webhook_called",
  "workflow_started",
  "workflow_completed",
  "workflow_failed",
  "alert_triggered",
  "rule_executed",
  "report_generated",
]);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    eventType: auditEventTypeEnum("event_type").notNull(),
    severity: varchar("severity", { length: 20 }).notNull().default("info"),

    actorType: principalTypeEnum("actor_type").notNull().default("user"),
    actorId: uuid("actor_id"),
    actorLabel: varchar("actor_label", { length: 200 }),
    actorIp: varchar("actor_ip", { length: 45 }),
    actorUserAgent: text("actor_user_agent"),
    actorCountry: varchar("actor_country", { length: 4 }),
    actorDevice: varchar("actor_device", { length: 100 }),

    targetType: varchar("target_type", { length: 60 }),
    targetId: uuid("target_id"),
    targetLabel: varchar("target_label", { length: 500 }),
    targetUrl: text("target_url"),

    action: varchar("action", { length: 100 }).notNull(),
    description: text("description"),
    details: jsonb("details").$type<Record<string, unknown>>().default({}),

    sessionId: varchar("session_id", { length: 100 }),
    requestId: varchar("request_id", { length: 100 }),
    correlationId: varchar("correlation_id", { length: 100 }),

    success: boolean("success").notNull().default(true),
    errorCode: varchar("error_code", { length: 100 }),
    errorMessage: text("error_message"),

    riskScore: integer("risk_score"),
    isAnomalous: boolean("is_anomalous").notNull().default(false),
    flaggedForReview: boolean("flagged_for_review").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_tenant_time_idx").on(table.tenantId, table.createdAt),
    index("audit_log_actor_idx").on(table.actorId, table.createdAt),
    index("audit_log_target_idx").on(table.targetType, table.targetId),
    index("audit_log_event_idx").on(table.eventType),
    index("audit_log_severity_idx").on(table.tenantId, table.severity),
  ],
);

export type AuditLogEntry = typeof auditLog.$inferSelect;

// ─────────────────────────────────────────────
// RETENTION POLICIES — info-management
// ─────────────────────────────────────────────

export const retentionActionEnum = pgEnum("retention_action", [
  "retain",
  "delete",
  "retain_then_delete",
  "label_only",
  "review",
  "archive",
]);

export const retentionPolicies = pgTable("retention_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(false),

  scope: jsonb("scope")
    .$type<{
      siteIds?: string[];
      libraryIds?: string[];
      contentTypeIds?: string[];
      sensitivityLabels?: string[];
      keywordQuery?: string;
    }>()
    .default({}),

  action: retentionActionEnum("action").notNull(),
  retentionDays: integer("retention_days"),
  triggerType: varchar("trigger_type", { length: 30 }).default("created"), // created, modified, labeled, custom
  preventDeletion: boolean("prevent_deletion").notNull().default(false),
  preventModification: boolean("prevent_modification").notNull().default(false),

  approvalRequiredForDelete: boolean("approval_required_for_delete").notNull().default(false),
  reviewerGroupIds: jsonb("reviewer_group_ids").$type<string[]>().default([]),

  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// DATA LOSS PREVENTION RULES
// ─────────────────────────────────────────────

export const dlpRules = pgTable("dlp_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(false),
  priority: integer("priority").default(100),

  // Detection
  conditions: jsonb("conditions")
    .$type<{
      sensitiveInfoTypes?: string[]; // CNP, IBAN, credit_card, ssn, passport, etc.
      keywords?: string[];
      regex?: string[];
      sensitivityLabels?: string[];
      attachmentTypes?: string[];
      contentSize?: { min?: number; max?: number };
    }>()
    .default({}),

  // Actions
  actions: jsonb("actions")
    .$type<{
      block?: boolean;
      blockExternalSharing?: boolean;
      blockDownload?: boolean;
      notifyUser?: boolean;
      notifyAdmin?: boolean;
      forceLabel?: string;
      requireJustification?: boolean;
      generateIncident?: boolean;
      auditOnly?: boolean;
    }>()
    .default({}),

  notificationTemplate: text("notification_template"),

  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
