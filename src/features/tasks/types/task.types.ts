import type { User } from "@/features/auth/types/auth.types";

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskType = "task" | "epic" | "subtask";

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "active" | "planned" | "completed";
  goal?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  parentId: string | null;
  sprintId: string | null;
  assigneeId: string | null;
  assignee?: User | null;
  reporterId: string;
  reporter?: User | null;
  tags: string[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  commentsCount: number;
  attachments?: string[];
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority: TaskPriority;
  type?: TaskType;
  parentId?: string | null;
  sprintId?: string | null;
  assigneeId?: string | null;
  tags?: string[];
  dueDate?: string | null;
  attachments?: string[];
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  parentId?: string | null;
  sprintId?: string | null;
  assigneeId?: string | null;
  tags?: string[];
  dueDate?: string | null;
  attachments?: string[];
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  type?: TaskType[];
  parentId?: string | null;
  sprintId?: string | null;
  assigneeId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  dueDate?: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  author?: User;
  content: string;
  createdAt: string;
}
