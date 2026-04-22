export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const ENABLE_MOCKS = import.meta.env.VITE_ENABLE_MOCKS === "true";

export const STORAGE_KEYS = {
  THEME: "d-arrow-theme",
  LAYOUT: "d-arrow-layout",
  LANGUAGE: "d-arrow-lang",
  REFRESH_TOKEN: "d-arrow-refresh-token",
  AUTH_STORE: "d-arrow-auth-store",
  TASKS_STORE: "d-arrow-tasks-store",
} as const;

export const QUERY_KEYS = {
  tasks: {
    all: ["tasks"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["tasks", "list", filters] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
    comments: (taskId: string) => ["tasks", taskId, "comments"] as const,
  },
  users: {
    all: ["users"] as const,
  },
} as const;

export const TASK_STATUSES = ["todo", "in_progress", "in_review", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
