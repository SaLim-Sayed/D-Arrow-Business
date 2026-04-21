import { create } from "zustand";
import type { TaskStatus, TaskPriority } from "../types/task.types";

interface TasksUIState {
  viewMode: "list" | "board";
  filters: {
    status: TaskStatus[];
    priority: TaskPriority[];
    assigneeId: string | null;
    search: string;
  };
  sort: {
    field: string;
    order: "asc" | "desc";
  };
  page: number;
  pageSize: number;
  setViewMode: (mode: "list" | "board") => void;
  setFilter: <K extends keyof TasksUIState["filters"]>(
    key: K,
    value: TasksUIState["filters"][K]
  ) => void;
  resetFilters: () => void;
  setSort: (field: string, order: "asc" | "desc") => void;
  setPage: (page: number) => void;
}

const defaultFilters = {
  status: [] as TaskStatus[],
  priority: [] as TaskPriority[],
  assigneeId: null as string | null,
  search: "",
};

export const useTasksUIStore = create<TasksUIState>()((set) => ({
  viewMode: "list",
  filters: { ...defaultFilters },
  sort: { field: "createdAt", order: "desc" },
  page: 1,
  pageSize: 10,
  setViewMode: (mode) => set({ viewMode: mode }),
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      page: 1,
    })),
  resetFilters: () => set({ filters: { ...defaultFilters }, page: 1 }),
  setSort: (field, order) => set({ sort: { field, order }, page: 1 }),
  setPage: (page) => set({ page }),
}));
