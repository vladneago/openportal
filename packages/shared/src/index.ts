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
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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

export type SiteType = "team" | "communication" | "project" | "wiki";
export type SiteRole = "owner" | "member" | "visitor";

export interface SiteInfo {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: SiteType;
  logo: string | null;
  coverImage: string | null;
  memberCount?: number;
  createdAt: string;
}

export interface CreateSiteRequest {
  title: string;
  slug: string;
  description?: string;
  type: SiteType;
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
} as const;

export type ModuleId = typeof MODULES[keyof typeof MODULES];
