import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api.types";
import type {
  LoginRequest,
  LoginResponse,
  User,
} from "../types/auth.types";

export async function login(
  data: LoginRequest
): Promise<ApiResponse<LoginResponse>> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    "/auth/login",
    data
  );
  return response.data;
}

export async function refreshToken(
  token: string
): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
  const response = await apiClient.post<
    ApiResponse<{ accessToken: string; refreshToken: string }>
  >("/auth/refresh", { refreshToken: token });
  return response.data;
}

export async function getCurrentUser(): Promise<ApiResponse<User>> {
  const response = await apiClient.get<ApiResponse<User>>("/auth/me");
  return response.data;
}
