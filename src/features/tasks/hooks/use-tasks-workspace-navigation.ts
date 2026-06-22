import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTasksUIStore } from "../store/tasks-ui.store";
import type { TaskPriority, TaskStatus } from "../types/task.types";

type WorkspaceView = "list" | "board";

export function useTasksWorkspaceNavigation() {
  const navigate = useNavigate();
  const resetFilters = useTasksUIStore((s) => s.resetFilters);
  const setFilter = useTasksUIStore((s) => s.setFilter);

  const goToWorkspace = useCallback(
    (view: WorkspaceView = "board") => {
      navigate(view === "list" ? "/tasks/work/list" : "/tasks/work");
    },
    [navigate]
  );

  const openAllTasks = useCallback(
    (view: WorkspaceView = "board") => {
      resetFilters();
      goToWorkspace(view);
    },
    [resetFilters, goToWorkspace]
  );

  const openByStatus = useCallback(
    (status: TaskStatus, view: WorkspaceView = "board") => {
      resetFilters();
      setFilter("status", [status]);
      goToWorkspace(view);
    },
    [resetFilters, setFilter, goToWorkspace]
  );

  const openByPriority = useCallback(
    (priority: TaskPriority, view: WorkspaceView = "board") => {
      resetFilters();
      setFilter("priority", [priority]);
      goToWorkspace(view);
    },
    [resetFilters, setFilter, goToWorkspace]
  );

  const openInProgress = useCallback(
    (view: WorkspaceView = "board") => openByStatus("in_progress", view),
    [openByStatus]
  );

  const openOverdue = useCallback(
    (view: WorkspaceView = "board") => {
      resetFilters();
      setFilter("overdueOnly", true);
      goToWorkspace(view);
    },
    [resetFilters, setFilter, goToWorkspace]
  );

  const openCompletedThisWeek = useCallback(
    (view: WorkspaceView = "board") => {
      resetFilters();
      setFilter("completedThisWeek", true);
      goToWorkspace(view);
    },
    [resetFilters, setFilter, goToWorkspace]
  );

  return {
    openAllTasks,
    openByStatus,
    openByPriority,
    openInProgress,
    openOverdue,
    openCompletedThisWeek,
    goToWorkspace,
  };
}
