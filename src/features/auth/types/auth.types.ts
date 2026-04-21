export interface User {
  id: string;
  email: string;
  name: string;
  nameAr: string;
  avatar: string;
  role: "admin" | "manager" | "member";
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

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
