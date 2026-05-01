import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import * as tasksApi from "../api/tasks.api";
import type { TaskFilters } from "../types/task.types";
import { useCompany } from "@/features/companies/context/company-context";

export function useTasksQuery(filters?: TaskFilters) {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: QUERY_KEYS.tasks.list({ ...filters, companyId } as Record<string, unknown>),
    queryFn: () => tasksApi.getTasks(companyId!, filters),
    enabled: !!companyId,
  });
}

export function useTaskQuery(id: string) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: QUERY_KEYS.tasks.detail(id),
    queryFn: () => tasksApi.getTask(companyId!, id),
    enabled: !!id && !!companyId,
  });
}

export function useAllTasksQuery() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: QUERY_KEYS.tasks.list({ all: true, companyId }),
    queryFn: () => tasksApi.getTasks(companyId!, { pageSize: 200 }),
    enabled: !!companyId,
  });
}
