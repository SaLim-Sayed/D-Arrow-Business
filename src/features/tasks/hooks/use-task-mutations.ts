import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import * as tasksApi from "../api/tasks.api";
import type { CreateTaskDTO, UpdateTaskDTO } from "../types/task.types";
import { toast } from "sonner";
import { useCompany } from "@/features/companies/context/company-context";

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (data: CreateTaskDTO) => tasksApi.createTask(companyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
      toast.success("Task created successfully");
    },
    onError: () => {
      toast.error("Failed to create task");
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDTO }) =>
      tasksApi.updateTask(companyId!, id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.tasks.detail(variables.id),
      });
      toast.success("Task updated successfully");
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(companyId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
      toast.success("Task deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });
}
