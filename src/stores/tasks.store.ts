import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Task, TaskFilterData, User } from "@/lib/schemas";
import { STORAGE_KEYS } from "@/lib/constants";

interface TasksState {
  // State
  tasks: Task[];
  selectedTask: Task | null;
  filters: TaskFilterData;
  isLoading: boolean;
  error: string | null;
  
  // UI State
  viewMode: "list" | "kanban" | "grid";
  sidebarOpen: boolean;
  
  // Assignment state
  availableUsers: User[];
  isLoadingUsers: boolean;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
  setFilters: (filters: Partial<TaskFilterData>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  assignTask: (taskId: string, assigneeId: string | null) => void;
  unassignTask: (taskId: string) => void;
  setViewMode: (mode: "list" | "kanban" | "grid") => void;
  toggleSidebar: () => void;
  clearError: () => void;
  reset: () => void;
  
  // User management
  setAvailableUsers: (users: User[]) => void;
  setLoadingUsers: (loading: boolean) => void;
  
  // Filter helpers
  filterTasks: () => Task[];
  getTasksByAssignee: (assigneeId: string) => Task[];
  getTasksByStatus: (status: Task["status"]) => Task[];
  getTasksByPriority: (priority: Task["priority"]) => Task[];
}

const defaultFilters: TaskFilterData = {
  page: 1,
  pageSize: 10,
};

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      selectedTask: null,
      filters: defaultFilters,
      isLoading: false,
      error: null,
      viewMode: "list",
      sidebarOpen: true,
      availableUsers: [],
      isLoadingUsers: false,

      // Actions
      setTasks: (tasks) => set({ tasks }),
      
      setSelectedTask: (task) => set({ selectedTask: task }),
      
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters, page: 1 }
      })),
      
      clearFilters: () => set({ filters: defaultFilters }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      addTask: (task) => set((state) => ({
        tasks: [task, ...state.tasks]
      })),
      
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === id ? { ...task, ...updates } : task
        ),
        selectedTask: state.selectedTask?.id === id 
          ? { ...state.selectedTask, ...updates } 
          : state.selectedTask
      })),
      
      removeTask: (id) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask
      })),
      
      assignTask: (taskId, assigneeId) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? { ...task, assigneeId } : task
        ),
        selectedTask: state.selectedTask?.id === taskId 
          ? { ...state.selectedTask, assigneeId } 
          : state.selectedTask
      })),
      
      unassignTask: (taskId) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? { ...task, assigneeId: null } : task
        ),
        selectedTask: state.selectedTask?.id === taskId 
          ? { ...state.selectedTask, assigneeId: null } 
          : state.selectedTask
      })),
      
      setViewMode: (viewMode) => set({ viewMode }),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarOpen: !state.sidebarOpen 
      })),
      
      clearError: () => set({ error: null }),
      
      reset: () => set({
        tasks: [],
        selectedTask: null,
        filters: defaultFilters,
        isLoading: false,
        error: null,
        availableUsers: [],
        isLoadingUsers: false,
      }),
      
      // User management
      setAvailableUsers: (users) => set({ availableUsers: users }),
      setLoadingUsers: (loading) => set({ isLoadingUsers: loading }),
      
      // Filter helpers
      filterTasks: () => {
        const { tasks, filters } = get();
        return tasks.filter(task => {
          if (filters.status && !filters.status.includes(task.status)) return false;
          if (filters.priority && !filters.priority.includes(task.priority)) return false;
          if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false;
          if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
          return true;
        });
      },
      
      getTasksByAssignee: (assigneeId) => {
        const { tasks } = get();
        return tasks.filter(task => task.assigneeId === assigneeId);
      },
      
      getTasksByStatus: (status) => {
        const { tasks } = get();
        return tasks.filter(task => task.status === status);
      },
      
      getTasksByPriority: (priority) => {
        const { tasks } = get();
        return tasks.filter(task => task.priority === priority);
      },
    }),
    {
      name: STORAGE_KEYS.TASKS_STORE || "d-arrow-tasks-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        filters: state.filters,
        viewMode: state.viewMode,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
