import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import * as tasksApi from "../api/tasks.api";
import type { TaskFilters } from "../types/task.types";

export function useTasksQuery(filters?: TaskFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.tasks.list(filters as Record<string, unknown>),
    queryFn: () => tasksApi.getTasks(filters),
  });
}

export function useTaskQuery(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.tasks.detail(id),
    queryFn: () => tasksApi.getTask(id),
    enabled: !!id,
  });
}

export function useAllTasksQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.tasks.list({ all: true }),
    queryFn: () => tasksApi.getTasks({ pageSize: 200 }),
  });
}
