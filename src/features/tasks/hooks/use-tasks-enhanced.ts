import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import * as tasksApi from "../api/tasks.api";
import { useTasksStore } from "@/stores/tasks.store";
import { toast } from "sonner";
import type { TaskFormData } from "@/lib/schemas";
import type { TaskFilters } from "../types/task.types";

// Enhanced query hooks with optimistic updates
export function useTasksQuery(filters?: TaskFilters) {
  const { setTasks, setLoading, setError } = useTasksStore();
  
  const query = useQuery({
    queryKey: QUERY_KEYS.tasks.list(filters as Record<string, unknown>),
    queryFn: () => tasksApi.getTasks(filters),
  });

  // Handle side effects
  React.useEffect(() => {
    if (query.data) {
      setTasks(query.data.tasks || query.data);
      setLoading(false);
      setError(null);
    }
  }, [query.data, setTasks, setLoading, setError]);

  React.useEffect(() => {
    if (query.error) {
      setError(query.error instanceof Error ? query.error.message : "Failed to fetch tasks");
      setLoading(false);
    }
  }, [query.error, setError, setLoading]);

  React.useEffect(() => {
    setLoading(query.isLoading);
  }, [query.isLoading, setLoading]);

  return query;
}

export function useTaskQuery(id: string) {
  const { setSelectedTask, setError } = useTasksStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.tasks.detail(id),
    queryFn: () => tasksApi.getTask(id),
    enabled: !!id,
    onSuccess: (data) => {
      setSelectedTask(data);
      setError(null);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : "Failed to fetch task");
    },
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  const { addTask, setError } = useTasksStore();
  
  return useMutation({
    mutationFn: (data: TaskFormData) => tasksApi.createTask(data),
    onMutate: async (newTask) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.all });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(QUERY_KEYS.tasks.all);
      
      // Optimistically update to the new value
      const optimisticTask = {
        ...newTask,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      addTask(optimisticTask);
      
      return { previousTasks };
    },
    onError: (error, variables, context) => {
      setError(error instanceof Error ? error.message : "Failed to create task");
      toast.error("Failed to create task");
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(QUERY_KEYS.tasks.all, context.previousTasks);
      }
    },
    onSuccess: (data) => {
      toast.success("Task created successfully");
      setError(null);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();
  const { updateTask, setError } = useTasksStore();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskFormData> }) => 
      tasksApi.updateTask(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.all });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.detail(id) });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(QUERY_KEYS.tasks.all);
      const previousTask = queryClient.getQueryData(QUERY_KEYS.tasks.detail(id));
      
      // Optimistically update
      updateTask(id, data);
      
      return { previousTasks, previousTask };
    },
    onError: (error, variables, context) => {
      setError(error instanceof Error ? error.message : "Failed to update task");
      toast.error("Failed to update task");
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(QUERY_KEYS.tasks.all, context.previousTasks);
      }
      if (context?.previousTask && variables.id) {
        queryClient.setQueryData(QUERY_KEYS.tasks.detail(variables.id), context.previousTask);
      }
    },
    onSuccess: (data, variables) => {
      toast.success("Task updated successfully");
      setError(null);
      // Update the store with the actual response
      updateTask(variables.id, data);
    },
    onSettled: (_, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.detail(variables.id) });
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();
  const { removeTask, setError } = useTasksStore();
  
  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.all });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.detail(id) });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(QUERY_KEYS.tasks.all);
      
      // Optimistically remove the task
      removeTask(id);
      
      return { previousTasks };
    },
    onError: (error, variables, context) => {
      setError(error instanceof Error ? error.message : "Failed to delete task");
      toast.error("Failed to delete task");
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(QUERY_KEYS.tasks.all, context.previousTasks);
      }
    },
    onSuccess: () => {
      toast.success("Task deleted successfully");
      setError(null);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
    },
  });
}

export function useAllTasksQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.tasks.list({ all: true }),
    queryFn: () => tasksApi.getTasks({ pageSize: 200 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
