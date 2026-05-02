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
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
