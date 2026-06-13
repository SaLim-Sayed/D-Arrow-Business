import type { PortalId } from "@/lib/portal-permissions";
import type { PortalSubRoles } from "@/lib/permissions/sub-roles";

export type UserRole = "super_admin" | "admin" | "manager" | "employee" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  nameAr: string;
  avatar: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  /** Custom portal subset assigned by super admin; falls back to role defaults when empty. */
  portalAccess?: PortalId[];
  /** Per-portal sub-roles (Tasks / CRM / People). */
  portalSubRoles?: PortalSubRoles;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  companyName: string;
  commercialRegister?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
