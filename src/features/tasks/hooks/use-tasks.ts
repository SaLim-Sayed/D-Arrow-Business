import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { TaskService } from "../api/tasks.service";
import type { TaskFilters } from "../types/task.types";
import { useCompany } from "@/features/companies/context/company-context";

export function useTasksQuery(filters?: TaskFilters) {
  const { companyId } = useCompany();
  
  return useQuery({
    queryKey: QUERY_KEYS.tasks.list({ ...filters, companyId } as Record<string, unknown>),
    queryFn: () => TaskService.getTasks(companyId!, filters),
    enabled: !!companyId,
  });
}

export function useTaskQuery(id: string) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: QUERY_KEYS.tasks.detail(id),
    queryFn: () => TaskService.getTask(companyId!, id),
    enabled: !!id && !!companyId,
  });
}

export function useAllTasksQuery() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: QUERY_KEYS.tasks.list({ all: true, companyId }),
    queryFn: () => TaskService.getTasks(companyId!, { pageSize: 200 }),
    enabled: !!companyId,
  });
}
