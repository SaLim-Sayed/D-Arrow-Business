import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { TaskService } from "../api/tasks.service";
import type { CreateTaskDTO, UpdateTaskDTO } from "../types/task.types";
import { toast } from "sonner";
import { useCompany } from "@/features/companies/context/company-context";

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (data: CreateTaskDTO) => TaskService.createTask(companyId!, data),
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
      TaskService.updateTask(companyId!, id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.all });

      // Snapshot the previous values for all matching queries
      const previousQueries = queryClient.getQueriesData({ queryKey: QUERY_KEYS.tasks.all });

      // Optimistically update to the new value across all matching queries
      queryClient.setQueriesData({ queryKey: QUERY_KEYS.tasks.all }, (old: any) => {
        if (!old || !old.data) return old;
        
        // Handle list queries (where data is an array of tasks)
        if (Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((task: any) =>
              task.id === id ? { ...task, ...data } : task
            ),
          };
        }
        
        // Handle detail queries (where data is a single task object)
        if (old.data.id === id) {
          return {
            ...old,
            data: { ...old.data, ...data }
          };
        }

        return old;
      });

      // Return a context object with the snapshotted values
      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, roll back all affected queries
      context?.previousQueries?.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });
      toast.error("Failed to update task");
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.tasks.detail(variables.id),
      });
      toast.success("Task updated successfully");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we are in sync with the server
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (id: string) => TaskService.deleteTask(companyId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
      toast.success("Task deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });
}
