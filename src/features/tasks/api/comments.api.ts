import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api.types";
import type { Comment } from "../types/task.types";

export async function getComments(
  taskId: string
): Promise<ApiResponse<Comment[]>> {
  const response = await apiClient.get<ApiResponse<Comment[]>>(
    `/tasks/${taskId}/comments`
  );
  return response.data;
}

export async function addComment(
  taskId: string,
  content: string
): Promise<ApiResponse<Comment>> {
  const response = await apiClient.post<ApiResponse<Comment>>(
    `/tasks/${taskId}/comments`,
    { content }
  );
  return response.data;
}
