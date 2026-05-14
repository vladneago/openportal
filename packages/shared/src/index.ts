// ─────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  limit?: number;
  offset?: number;
  totalItems?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─────────────────────────────────────────────
// Auth Types
// ─────────────────────────────────────────────

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
}

export type UserRole = "owner" | "admin" | "member" | "guest";
export type UserStatus = "active" | "inactive" | "suspended" | "pending";

export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
  tenantSlug: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ─────────────────────────────────────────────
// Tenant Types
// ─────────────────────────────────────────────

export type Plan = "free" | "starter" | "business" | "enterprise";

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: Plan;
  isActive: boolean;
}

// ─────────────────────────────────────────────
// Site Types
// ─────────────────────────────────────────────

export type SiteType = "team" | "communication" | "project" | "wiki" | "hub" | "private_channel";
export type SiteRole = "owner" | "member" | "visitor" | "designer" | "contributor" | "reader" | "limited" | "approver";

export interface SiteInfo {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: SiteType;
  template?: string;
  status?: string;
  visibility?: string;
  logo: string | null;
  coverImage: string | null;
  isHub?: boolean;
  hubSiteId?: string | null;
  memberCount?: number;
  followerCount?: number;
  lastActivityAt?: string | null;
  createdAt: string;
}

export interface CreateSiteRequest {
  title: string;
  slug: string;
  description?: string;
  type: SiteType;
  template?: string;
  visibility?: string;
}

// ─────────────────────────────────────────────
// Web Part Types
// ─────────────────────────────────────────────

export type WebPartType =
  | "text" | "rich_text" | "image" | "image_gallery" | "video" | "audio"
  | "embed" | "file_viewer" | "code_snippet" | "markdown" | "divider"
  | "spacer" | "heading" | "quote" | "callout" | "button" | "icon"
  | "hero" | "banner" | "carousel" | "tabs" | "accordion" | "card_set"
  | "people" | "people_picker" | "org_chart" | "list_view" | "list_form"
  | "document_library" | "documents" | "recent_documents" | "calendar"
  | "events" | "news" | "highlighted_content" | "quick_links" | "link_picker"
  | "site_activity" | "user_profile" | "site_membership" | "site_logo"
  | "search_box" | "search_results" | "yammer_feed" | "twitter_feed"
  | "rss_feed" | "weather" | "world_clock" | "countdown" | "stock_ticker"
  | "form" | "survey" | "poll" | "map" | "iframe" | "html" | "script"
  | "kpi" | "chart" | "metric" | "gauge" | "progress" | "table"
  | "spreadsheet" | "kanban" | "gantt" | "timeline" | "tasks" | "issues"
  | "approvals" | "workflow_status" | "feedback" | "comments" | "tags"
  | "navigation" | "breadcrumb" | "table_of_contents" | "footer"
  | "social_share" | "follow_button" | "translate_button" | "ai_summary"
  | "ai_chat" | "custom";

export interface WebPart {
  id: string;
  type: WebPartType;
  title?: string | null;
  config: Record<string, unknown>;
  appearance: Record<string, unknown>;
  sectionId?: string;
  columnId?: string;
  sortOrder: number;
  isHidden: boolean;
}

export interface PageSection {
  id: string;
  layout: "one_column" | "two_column" | "three_column" | "left_sidebar" | "right_sidebar" | "vertical_section" | "one_column_full" | "thirty_seventy" | "seventy_thirty";
  background?: { type: string; color?: string; image?: string };
  spacing?: "compact" | "normal" | "spacious";
  isCollapsed?: boolean;
  isCollapsible?: boolean;
  columns: Array<{ id: string; width: number; verticalAlign?: string; webParts: string[] }>;
}

// ─────────────────────────────────────────────
// Page Types
// ─────────────────────────────────────────────

export type PageStatus = "draft" | "in_review" | "scheduled" | "published" | "archived" | "expired";

export interface PageInfo {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  layout: string;
  status: PageStatus;
  publishedAt?: string | null;
  promotedAsNews?: boolean;
  newsCategory?: string | null;
  language: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// List / Library Types
// ─────────────────────────────────────────────

export type ListTemplate =
  | "generic_list" | "document_library" | "picture_library" | "asset_library"
  | "form_library" | "wiki_library" | "site_pages_library" | "calendar"
  | "tasks" | "contacts" | "links" | "announcements" | "discussions"
  | "issues" | "events" | "kpi" | "report_library" | "data_connection_library"
  | "process_diagram_library" | "translation_library" | "external_list" | "survey";

export type ColumnType =
  | "single_line_text" | "multi_line_text" | "rich_text" | "markdown"
  | "number" | "currency" | "percent" | "date" | "datetime" | "time"
  | "boolean" | "choice" | "multi_choice" | "lookup" | "multi_lookup"
  | "person" | "multi_person" | "person_or_group" | "url" | "email"
  | "phone" | "calculated" | "image" | "file_attachment" | "geolocation"
  | "rating" | "thumbs" | "managed_metadata" | "json" | "color" | "duration"
  | "barcode" | "external_data" | "auto_number" | "uuid" | "ip_address"
  | "country" | "language" | "currency_code" | "rich_media" | "code"
  | "formula" | "html" | "tag" | "progress" | "status" | "label"
  | "signature" | "audit";

export type ViewType =
  | "standard" | "datasheet" | "calendar" | "gantt" | "board"
  | "timeline" | "gallery" | "tiles" | "map" | "chart" | "pivot" | "tree";

export interface ListInfo {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  description?: string | null;
  template: ListTemplate;
  icon?: string | null;
  color?: string | null;
  itemCount: number;
}

// ─────────────────────────────────────────────
// HR Types
// ─────────────────────────────────────────────

export type WorkerStatus =
  | "active" | "leave_of_absence" | "suspended" | "terminated"
  | "retired" | "deceased" | "pre_hire" | "candidate";

export type EmploymentType =
  | "regular" | "fixed_term" | "intern" | "apprentice" | "seasonal"
  | "contractor" | "consultant" | "agency" | "temp";

export interface EmployeeInfo {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  workEmail?: string | null;
  workPhone?: string | null;
  photoUrl?: string | null;
  currentJobTitle?: string | null;
  currentDepartmentId?: string | null;
  currentLocationId?: string | null;
  currentManagerId?: string | null;
  status: WorkerStatus;
  workerType: EmploymentType;
  hireDate?: string | null;
  isPublicProfile?: boolean;
}

export interface DepartmentInfo {
  id: string;
  code: string;
  name: string;
  parentDepartmentId?: string | null;
  managerEmployeeId?: string | null;
  function?: string | null;
  currentHeadcount?: number;
}

// ─────────────────────────────────────────────
// Module System Types
// ─────────────────────────────────────────────

export const MODULES = {
  VIDEO: "video",
  CHAT: "chat",
  CALENDAR: "calendar",
  PORTAL: "portal",
  EDUCATION: "education",
  HEALTHCARE: "healthcare",
  LEGAL: "legal",
  HR: "hr",
  GOVERNMENT: "government",
  PROJECTS: "projects",
  FINANCE: "finance",
  CRM: "crm",
  REAL_ESTATE: "real_estate",
  EVENTS: "events",
  SUPPORT: "support",
  IT_DEVOPS: "it_devops",
  SITES: "sites",
  PAGES: "pages",
  LISTS: "lists",
  TAXONOMY: "taxonomy",
  PERMISSIONS: "permissions",
} as const;

export type ModuleId = typeof MODULES[keyof typeof MODULES];
