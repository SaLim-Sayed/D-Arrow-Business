import type { TaskStatus } from "../types/task.types";

const STORAGE_KEY = "d-arrow-kanban-board-prefs";

export type KanbanColumnSort = "updated" | "priority" | "dueDate";

export type KanbanBoardPrefs = {
  collapsedColumns: TaskStatus[];
  compact: boolean;
  columnSort: KanbanColumnSort;
};

const DEFAULT_PREFS: KanbanBoardPrefs = {
  collapsedColumns: [],
  compact: false,
  columnSort: "updated",
};

export function readKanbanBoardPrefs(): KanbanBoardPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<KanbanBoardPrefs>;
    return {
      collapsedColumns: Array.isArray(parsed.collapsedColumns)
        ? parsed.collapsedColumns
        : DEFAULT_PREFS.collapsedColumns,
      compact: parsed.compact ?? DEFAULT_PREFS.compact,
      columnSort: parsed.columnSort ?? DEFAULT_PREFS.columnSort,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writeKanbanBoardPrefs(prefs: KanbanBoardPrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota / private mode
  }
}
