import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
  Task,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskFilters,
} from "../types/task.types";

export async function getTasks(
  filters?: TaskFilters
): Promise<PaginatedResponse<Task>> {
  const params = new URLSearchParams();

  if (filters?.status?.length) params.set("status", filters.status.join(","));
  if (filters?.priority?.length)
    params.set("priority", filters.priority.join(","));
  if (filters?.assigneeId) params.set("assigneeId", filters.assigneeId);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters?.sortBy) params.set("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);

  const response = await apiClient.get<PaginatedResponse<Task>>(
    `/tasks?${params.toString()}`
  );
  return response.data;
}

export async function getTask(id: string): Promise<ApiResponse<Task>> {
  const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
  return response.data;
}

export async function createTask(
  data: CreateTaskDTO
): Promise<ApiResponse<Task>> {
  const response = await apiClient.post<ApiResponse<Task>>("/tasks", data);
  return response.data;
}

export async function updateTask(
  id: string,
  data: UpdateTaskDTO
): Promise<ApiResponse<Task>> {
  const response = await apiClient.put<ApiResponse<Task>>(
    `/tasks/${id}`,
    data
  );
  return response.data;
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}
