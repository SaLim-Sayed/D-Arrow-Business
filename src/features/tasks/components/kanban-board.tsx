import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Columns3,
  Expand,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Plus,
  Rows3,
} from "lucide-react";
import { Button, Select, SelectItem } from "@heroui/react";
import { useTasksQuery } from "../hooks/use-tasks";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useUpdateTask } from "../hooks/use-task-mutations";
import { TaskCard } from "./task-card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { TASK_STATUSES } from "@/lib/constants";
import type { Task, TaskStatus } from "../types/task.types";
import { cn } from "@/lib/utils";
import { useTasksUIStore } from "../store/tasks-ui.store";
import { useTasksPermissions } from "../hooks/use-tasks-permissions";
import {
  autoScrollKanbanPointer,
  bindKanbanWheelScroll,
  getHorizontalScrollEdges,
  getHorizontalScrollProgress,
  getVerticalScrollEdges,
  scrollElementIntoInlineCenter,
  scrollHorizontalBy,
  scrollHorizontalToProgress,
  scrollVerticalBy,
} from "../utils/kanban-scroll.utils";
import {
  readKanbanBoardPrefs,
  writeKanbanBoardPrefs,
  type KanbanColumnSort,
} from "../utils/kanban-board.prefs";
import { sortKanbanColumnTasks } from "../utils/kanban-column-sort.utils";
import { toast } from "sonner";

type ColumnConfig = {
  color: string;
  bg: string;
  dot: string;
  ring: string;
};

const COLUMN_CONFIG: Record<TaskStatus, ColumnConfig> = {
  todo: {
    color: "text-default-600 dark:text-default-400",
    bg: "bg-default-50/80 dark:bg-default-50/30 border border-default-200/60 dark:border-default-100/30",
    dot: "border-default-400",
    ring: "ring-default-300/40",
  },
  in_progress: {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50/40 dark:bg-default-50/30 border border-blue-200/50 dark:border-default-100/30",
    dot: "border-blue-500",
    ring: "ring-blue-400/35",
  },
  in_review: {
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50/40 dark:bg-default-50/30 border border-orange-200/50 dark:border-default-100/30",
    dot: "border-orange-500",
    ring: "ring-orange-400/35",
  },
  done: {
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50/40 dark:bg-default-50/30 border border-green-200/50 dark:border-default-100/30",
    dot: "border-green-500",
    ring: "ring-green-400/35",
  },
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

function KanbanScrollButton({
  direction,
  visible,
  label,
  onPress,
}: {
  direction: "start" | "end";
  visible: boolean;
  label: string;
  onPress: () => void;
}) {
  const Icon = direction === "start" ? ChevronLeft : ChevronRight;

  return (
    <Button
      isIconOnly
      size="sm"
      variant="flat"
      aria-label={label}
      onPress={onPress}
      className={cn(
        "absolute top-1/2 z-20 -translate-y-1/2 border border-default-200 bg-content1/95 shadow-md backdrop-blur-sm",
        direction === "start" ? "start-0.5 sm:start-1" : "end-0.5 sm:end-1",
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      )}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

function KanbanBoardToolbar({
  total,
  overdue,
  inProgress,
  scrollProgress,
  onScrollProgressChange,
  compact,
  onCompactChange,
  columnSort,
  onColumnSortChange,
  onExpandAll,
  onCollapseAll,
  focusedColumn,
  onClearFocus,
}: {
  total: number;
  overdue: number;
  inProgress: number;
  scrollProgress: number;
  onScrollProgressChange: (value: number) => void;
  compact: boolean;
  onCompactChange: () => void;
  columnSort: KanbanColumnSort;
  onColumnSortChange: (sort: KanbanColumnSort) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  focusedColumn: TaskStatus | null;
  onClearFocus: () => void;
}) {
  const { t } = useTranslation("tasks");

  return (
    <div className="shrink-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-default-200 bg-content1 px-2.5 py-1 font-semibold text-default-700">
          {t("board.stats.total", { count: total })}
        </span>
        <span className="rounded-full border border-blue-200/60 bg-blue-50/60 px-2.5 py-1 font-semibold text-blue-700 dark:text-blue-300">
          {t("board.stats.inProgress", { count: inProgress })}
        </span>
        {overdue > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-danger/20 bg-danger/10 px-2.5 py-1 font-semibold text-danger">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("board.stats.overdue", { count: overdue })}
          </span>
        )}

        {focusedColumn && (
          <button
            type="button"
            onClick={onClearFocus}
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            <Maximize2 className="h-3 w-3" />
            {t("board.focusMode.exit", { status: t(`status.${focusedColumn}`) })}
          </button>
        )}

        <div className="ms-auto flex flex-wrap items-center gap-1.5">
          <Select
            size="sm"
            variant="flat"
            aria-label={t("board.sort.label")}
            selectedKeys={[columnSort]}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0];
              if (value) onColumnSortChange(value as KanbanColumnSort);
            }}
            classNames={{
              base: "min-w-[9.5rem] w-auto",
              trigger: "h-8 min-h-8 bg-content1 border border-default-200",
              value: "text-xs font-semibold",
            }}
          >
            <SelectItem key="updated">{t("board.sort.updated")}</SelectItem>
            <SelectItem key="priority">{t("board.sort.priority")}</SelectItem>
            <SelectItem key="dueDate">{t("board.sort.dueDate")}</SelectItem>
          </Select>

          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="border border-default-200 bg-content1"
            aria-label={t("board.expandAll")}
            onPress={onExpandAll}
          >
            <Expand className="h-3.5 w-3.5" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="border border-default-200 bg-content1"
            aria-label={t("board.collapseAll")}
            onPress={onCollapseAll}
          >
            <Columns3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant={compact ? "solid" : "flat"}
            color={compact ? "primary" : "default"}
            className={cn(!compact && "border border-default-200 bg-content1")}
            aria-label={
              compact ? t("board.density.comfortable") : t("board.density.compact")
            }
            onPress={onCompactChange}
          >
            {compact ? (
              <LayoutGrid className="h-3.5 w-3.5" />
            ) : (
              <Rows3 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-default-100">
          <div
            className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-150"
            style={{ width: `${Math.round(scrollProgress * 100)}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(scrollProgress * 100)}
            onChange={(e) => onScrollProgressChange(Number(e.target.value) / 100)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={t("board.scrollProgress")}
          />
        </div>
        <span className="hidden shrink-0 text-[10px] text-default-400 lg:inline">
          {t("board.keyboardHint")}
        </span>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
  allTasks,
  columnRef,
  bodyRef,
  onBodyScroll,
  verticalEdges,
  activeColumn,
  collapsed,
  dimmed,
  compact,
  searchQuery,
  onToggleCollapse,
  onJump,
  onFocusColumn,
}: {
  status: TaskStatus;
  tasks: Task[];
  allTasks: Task[];
  columnRef: (el: HTMLElement | null) => void;
  bodyRef: (el: HTMLDivElement | null) => void;
  onBodyScroll: () => void;
  verticalEdges: { top: boolean; bottom: boolean };
  activeColumn: TaskStatus | null;
  collapsed: boolean;
  dimmed: boolean;
  compact: boolean;
  searchQuery?: string;
  onToggleCollapse: () => void;
  onJump: () => void;
  onFocusColumn: () => void;
}) {
  const { t } = useTranslation("tasks");
  const config = COLUMN_CONFIG[status];
  const columnBodyElRef = useRef<HTMLDivElement | null>(null);

  if (collapsed) {
    return (
      <button
        type="button"
        ref={columnRef}
        data-kanban-column={status}
        onClick={onJump}
        className={cn(
          "flex h-full min-h-0 w-12 shrink-0 snap-center flex-col items-center justify-between rounded-2xl border py-3 transition-all hover:shadow-md",
          config.bg,
          dimmed && "opacity-45 saturate-50"
        )}
        aria-label={t("board.expandColumn", { status: t(`status.${status}`) })}
      >
        <span
          className={cn("h-3 w-3 shrink-0 rounded-full border-[3px]", config.dot)}
        />
        <span
          className={cn(
            "kanban-column-collapsed-label text-[10px] font-bold uppercase tracking-wide",
            config.color
          )}
        >
          {t(`status.${status}`)}
        </span>
        <span className="rounded-full bg-content1/90 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-default-500">
          {tasks.length}
        </span>
      </button>
    );
  }

  return (
    <div
      ref={columnRef}
      data-kanban-column={status}
      className={cn(
        "flex h-full min-h-0 w-[min(300px,calc(100vw-2.5rem))] shrink-0 snap-center flex-col rounded-2xl transition-all duration-300 md:w-[300px]",
        compact && "md:w-[260px] w-[min(260px,calc(100vw-2.5rem))]",
        config.bg,
        activeColumn === status && "ring-2 ring-primary/25 shadow-md",
        dimmed && "opacity-45 saturate-75 scale-[0.98]"
      )}
    >
      <div className="sticky top-0 z-[2] flex shrink-0 items-center gap-1 px-2 py-2">
        <button
          type="button"
          onClick={onJump}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-start transition-colors hover:bg-content1/40"
          aria-label={t("board.jumpToColumn", { status: t(`status.${status}`) })}
        >
          <div
            className={cn(
              "h-4 w-4 shrink-0 rounded-full border-[3px]",
              config.dot
            )}
          />
          <h3
            className={cn(
              "truncate text-xs font-bold uppercase tracking-wider",
              config.color
            )}
          >
            {t(`status.${status}`)}
          </h3>
          <span className="ms-auto rounded-full bg-content1/80 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-default-500">
            {tasks.length}
          </span>
        </button>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="h-7 w-7 min-w-7"
          aria-label={t("board.focusMode.enter", { status: t(`status.${status}`) })}
          onPress={onFocusColumn}
        >
          <Minimize2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="h-7 w-7 min-w-7"
          aria-label={t("board.collapseColumn", { status: t(`status.${status}`) })}
          onPress={onToggleCollapse}
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div className="relative flex min-h-0 flex-1 flex-col">
            {verticalEdges.top && (
              <>
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-6 bg-gradient-to-b from-content1/90 to-transparent"
                  aria-hidden
                />
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  aria-label={t("board.scrollColumnUp")}
                  onPress={() => {
                    if (columnBodyElRef.current) {
                      scrollVerticalBy(columnBodyElRef.current, "up");
                    }
                  }}
                  className="absolute start-1/2 top-1 z-[3] h-6 w-6 min-w-6 -translate-x-1/2 border border-default-200 bg-content1/95 shadow-sm"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            {verticalEdges.bottom && (
              <>
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-10 z-[1] h-8 bg-gradient-to-t from-content1/90 to-transparent"
                  aria-hidden
                />
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  aria-label={t("board.scrollColumnDown")}
                  onPress={() => {
                    if (columnBodyElRef.current) {
                      scrollVerticalBy(columnBodyElRef.current, "down");
                    }
                  }}
                  className="absolute start-1/2 bottom-12 z-[3] h-6 w-6 min-w-6 -translate-x-1/2 border border-default-200 bg-content1/95 shadow-sm"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </>
            )}

            <div
              ref={(el) => {
                provided.innerRef(el);
                bodyRef(el);
                columnBodyElRef.current = el;
              }}
              {...provided.droppableProps}
              onScroll={onBodyScroll}
              className={cn(
                "kanban-scroll kanban-column-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-xl p-1.5 transition-all duration-200",
                compact && "p-1",
                snapshot.isDraggingOver
                  ? cn("bg-primary/[0.06] ring-2 ring-inset", config.ring)
                  : "bg-transparent"
              )}
            >
              <div className={cn("space-y-3 pb-2", compact && "space-y-2")}>
                {tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="outline-none"
                      >
                        <TaskCard
                          task={task}
                          compact={compact}
                          searchQuery={searchQuery}
                          isDragging={snapshot.isDragging}
                          subtasks={allTasks.filter(
                            (t: Task) => t.parentId === task.id
                          )}
                          parentTask={
                            task.parentId
                              ? allTasks.find((t: Task) => t.id === task.parentId)
                              : undefined
                          }
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {tasks.length === 0 && !snapshot.isDraggingOver && (
                  <div className="flex min-h-[180px] flex-col items-center justify-center px-4 py-8 text-center animate-in fade-in duration-500">
                    <h4 className="mb-1 text-sm font-bold text-default-400 dark:text-default-500">
                      {t("board.emptyTitle")}
                    </h4>
                    <p className="max-w-[200px] text-xs leading-relaxed text-default-300 dark:text-default-600">
                      {t("board.emptySubtitle")}
                    </p>
                  </div>
                )}

                {snapshot.isDraggingOver && tasks.length === 0 && (
                  <div className="flex min-h-[100px] items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/[0.04] px-4 text-xs font-medium text-primary/70">
                    {t("board.dropHere")}
                  </div>
                )}
              </div>
            </div>

            <Link
              to={`/tasks/new?status=${status}`}
              className="mx-1.5 mb-1.5 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-default-200 bg-content1/60 px-3 py-2 text-xs font-semibold text-default-500 transition-colors hover:border-primary/30 hover:bg-primary/[0.04] hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("board.addTask")}
            </Link>
          </div>
        )}
      </Droppable>
    </div>
  );
}

export function KanbanBoard() {
  const { t } = useTranslation("tasks");
  const { data: allUsers } = useAllUsers();
  const { filters } = useTasksUIStore();
  const { canApproveTasks: canApprove } = useTasksPermissions();

  const boardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Partial<Record<TaskStatus, HTMLElement>>>({});
  const columnBodyRefs = useRef<Partial<Record<TaskStatus, HTMLDivElement>>>({});
  const pointerRef = useRef({ x: 0, y: 0 });
  const dragRafRef = useRef<number | null>(null);

  const [edges, setEdges] = useState({ start: false, end: false });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [columnVerticalEdges, setColumnVerticalEdges] = useState<
    Record<TaskStatus, { top: boolean; bottom: boolean }>
  >({
    todo: { top: false, bottom: false },
    in_progress: { top: false, bottom: false },
    in_review: { top: false, bottom: false },
    done: { top: false, bottom: false },
  });
  const [activeColumn, setActiveColumn] = useState<TaskStatus | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(() => {
    const prefs = readKanbanBoardPrefs();
    return new Set(prefs.collapsedColumns);
  });
  const [compact, setCompact] = useState(() => readKanbanBoardPrefs().compact);
  const [columnSort, setColumnSort] = useState<KanbanColumnSort>(
    () => readKanbanBoardPrefs().columnSort
  );
  const [focusedColumn, setFocusedColumn] = useState<TaskStatus | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<
    Partial<Record<string, TaskStatus>>
  >({});
  const [isDragging, setIsDragging] = useState(false);

  const persistPrefs = useCallback(
    (patch: Partial<{ collapsedColumns: Set<TaskStatus>; compact: boolean; columnSort: KanbanColumnSort }>) => {
      const nextCollapsed = patch.collapsedColumns ?? collapsedColumns;
      const nextCompact = patch.compact ?? compact;
      const nextSort = patch.columnSort ?? columnSort;
      writeKanbanBoardPrefs({
        collapsedColumns: [...nextCollapsed],
        compact: nextCompact,
        columnSort: nextSort,
      });
    },
    [collapsedColumns, compact, columnSort]
  );

  const effectiveCollapsedColumns = useMemo(() => {
    if (!focusedColumn) return collapsedColumns;
    return new Set(
      TASK_STATUSES.filter((status) => status !== focusedColumn)
    );
  }, [collapsedColumns, focusedColumn]);

  const { data, isLoading: isTasksLoading } = useTasksQuery({
    status: filters.status.length ? filters.status : undefined,
    search: filters.search || undefined,
    priority: filters.priority.length ? filters.priority : undefined,
    assigneeId: filters.assigneeId ?? undefined,
    sprintId: filters.sprintId ?? undefined,
    overdueOnly: filters.overdueOnly || undefined,
    completedThisWeek: filters.completedThisWeek || undefined,
    pageSize: 100,
  });

  const updateTask = useUpdateTask();
  const isLoading = isTasksLoading || !allUsers;

  const baseTasks = useMemo(
    () =>
      (data?.data ?? [])
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .map((task: Task) => ({
          ...task,
          assignee: allUsers?.find((u) => u.id === task.assigneeId) || null,
        })),
    [data?.data, allUsers]
  );

  const tasks = useMemo(
    () =>
      baseTasks.map((task) =>
        statusOverrides[task.id]
          ? { ...task, status: statusOverrides[task.id]! }
          : task
      ),
    [baseTasks, statusOverrides]
  );

  useEffect(() => {
    setStatusOverrides((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [id, status] of Object.entries(prev)) {
        const serverTask = baseTasks.find((task) => task.id === id);
        if (!serverTask || serverTask.status === status) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [baseTasks]);

  const columns = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    };
    for (const task of tasks) {
      if (task.status in grouped) {
        grouped[task.status as TaskStatus].push(task);
      }
    }
    for (const status of TASK_STATUSES) {
      grouped[status] = sortKanbanColumnTasks(grouped[status], columnSort);
    }
    return grouped;
  }, [tasks, columnSort]);

  const boardStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = tasks.filter(
      (task) =>
        task.dueDate &&
        task.status !== "done" &&
        new Date(task.dueDate) < today
    ).length;
    const inProgress = tasks.filter((task) => task.status === "in_progress").length;
    return { total: tasks.length, overdue, inProgress };
  }, [tasks]);

  const updateHorizontalEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const next = getHorizontalScrollEdges(el);
    setEdges({ start: next.start, end: next.end });
    setScrollProgress(getHorizontalScrollProgress(el));
  }, []);

  const updateColumnVerticalEdges = useCallback(() => {
    const next = {} as Record<TaskStatus, { top: boolean; bottom: boolean }>;
    for (const status of TASK_STATUSES) {
      const el = columnBodyRefs.current[status];
      next[status] = el ? getVerticalScrollEdges(el) : { top: false, bottom: false };
    }
    setColumnVerticalEdges(next);
  }, []);

  const updateActiveColumn = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    let closest: TaskStatus | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const status of TASK_STATUSES) {
      if (effectiveCollapsedColumns.has(status)) continue;
      const el = columnRefs.current[status];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(center - containerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = status;
      }
    }

    setActiveColumn(closest);
  }, [effectiveCollapsedColumns]);

  const refreshScrollUi = useCallback(() => {
    updateHorizontalEdges();
    updateColumnVerticalEdges();
    updateActiveColumn();
  }, [updateActiveColumn, updateColumnVerticalEdges, updateHorizontalEdges]);

  const jumpToColumn = useCallback(
    (status: TaskStatus) => {
      if (effectiveCollapsedColumns.has(status)) {
        setCollapsedColumns((prev) => {
          const next = new Set(prev);
          next.delete(status);
          persistPrefs({ collapsedColumns: next });
          return next;
        });
        requestAnimationFrame(() => {
          const el = columnRefs.current[status];
          if (el) scrollElementIntoInlineCenter(el);
        });
      } else {
        const el = columnRefs.current[status];
        if (el) scrollElementIntoInlineCenter(el);
      }
      setActiveColumn(status);
    },
    [effectiveCollapsedColumns, persistPrefs]
  );

  const enterFocusMode = useCallback((status: TaskStatus) => {
    setFocusedColumn(status);
    setActiveColumn(status);
    requestAnimationFrame(() => {
      const el = columnRefs.current[status];
      if (el) scrollElementIntoInlineCenter(el);
    });
  }, []);

  const toggleCollapse = useCallback((status: TaskStatus) => {
    setCollapsedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      persistPrefs({ collapsedColumns: next });
      return next;
    });
    requestAnimationFrame(refreshScrollUi);
  }, [persistPrefs, refreshScrollUi]);

  useEffect(() => {
    if (isLoading) return;
    refreshScrollUi();

    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => refreshScrollUi());
    observer.observe(el);
    const unbindWheel = bindKanbanWheelScroll(el);

    return () => {
      observer.disconnect();
      unbindWheel();
    };
  }, [isLoading, refreshScrollUi, tasks.length, effectiveCollapsedColumns, focusedColumn]);

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (event: MouseEvent | TouchEvent) => {
      if ("touches" in event) {
        pointerRef.current = {
          x: event.touches[0]?.clientX ?? 0,
          y: event.touches[0]?.clientY ?? 0,
        };
      } else {
        pointerRef.current = { x: event.clientX, y: event.clientY };
      }
    };

    const tick = () => {
      autoScrollKanbanPointer(
        pointerRef.current,
        scrollRef.current,
        columnBodyRefs.current
      );
      dragRafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    dragRafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      if (dragRafRef.current != null) {
        cancelAnimationFrame(dragRafRef.current);
      }
    };
  }, [isDragging]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (!boardRef.current) return;

      if (event.key === "Escape" && focusedColumn) {
        setFocusedColumn(null);
        return;
      }

      const idx = Number(event.key) - 1;
      if (idx >= 0 && idx < TASK_STATUSES.length) {
        jumpToColumn(TASK_STATUSES[idx]!);
        return;
      }

      const el = scrollRef.current;
      if (!el) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollHorizontalBy(el, "start");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollHorizontalBy(el, "end");
      } else if (event.key === "Home") {
        event.preventDefault();
        jumpToColumn(TASK_STATUSES[0]!);
      } else if (event.key === "End") {
        event.preventDefault();
        jumpToColumn(TASK_STATUSES[TASK_STATUSES.length - 1]!);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [jumpToColumn, focusedColumn]);

  function handleDragEnd(result: DropResult) {
    setIsDragging(false);

    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as TaskStatus;
    const task = tasks.find((t: Task) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    if (task.status === "in_review" && newStatus === "done" && !canApprove) {
      toast.error(t("errors.approvePermission"));
      return;
    }

    const previousStatus = task.status;

    setStatusOverrides((prev) => ({ ...prev, [taskId]: newStatus }));
    updateTask.mutate(
      { id: taskId, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast.success(
            t("board.moveSuccess", {
              title: task.title,
              status: t(`status.${newStatus}`),
            }),
            {
              action: {
                label: t("board.undo"),
                onClick: () => {
                  setStatusOverrides((prev) => ({
                    ...prev,
                    [taskId]: previousStatus,
                  }));
                  updateTask.mutate({ id: taskId, data: { status: previousStatus } });
                },
              },
              duration: 5000,
            }
          );
        },
        onError: () => {
          setStatusOverrides((prev) => {
            const next = { ...prev };
            delete next[taskId];
            return next;
          });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <DragDropContext
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={boardRef}
        tabIndex={0}
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg",
          isDragging && "ring-1 ring-primary/20"
        )}
      >
        <KanbanBoardToolbar
          total={boardStats.total}
          overdue={boardStats.overdue}
          inProgress={boardStats.inProgress}
          scrollProgress={scrollProgress}
          compact={compact}
          columnSort={columnSort}
          focusedColumn={focusedColumn}
          onClearFocus={() => setFocusedColumn(null)}
          onCompactChange={() => {
            setCompact((prev) => {
              const next = !prev;
              persistPrefs({ compact: next });
              return next;
            });
          }}
          onColumnSortChange={(sort) => {
            setColumnSort(sort);
            persistPrefs({ columnSort: sort });
          }}
          onExpandAll={() => {
            const next = new Set<TaskStatus>();
            setCollapsedColumns(next);
            setFocusedColumn(null);
            persistPrefs({ collapsedColumns: next });
            requestAnimationFrame(refreshScrollUi);
          }}
          onCollapseAll={() => {
            const next = new Set<TaskStatus>(TASK_STATUSES);
            setCollapsedColumns(next);
            setFocusedColumn(null);
            persistPrefs({ collapsedColumns: next });
            requestAnimationFrame(refreshScrollUi);
          }}
          onScrollProgressChange={(value) => {
            if (scrollRef.current) {
              scrollHorizontalToProgress(scrollRef.current, value);
              updateHorizontalEdges();
              updateActiveColumn();
            }
          }}
        />

        <div className="kanban-scroll flex shrink-0 gap-1.5 overflow-x-auto pb-1">
          {TASK_STATUSES.map((status) => {
            const config = COLUMN_CONFIG[status];
            const isActive = activeColumn === status;
            const isCollapsed = effectiveCollapsedColumns.has(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => jumpToColumn(status)}
                onDoubleClick={() => enterFocusMode(status)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                    : "border-default-200 bg-content1 text-default-600 hover:border-primary/20 hover:bg-primary/[0.04]",
                  isCollapsed && "opacity-70"
                )}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full border-2",
                    config.dot
                  )}
                />
                {t(`status.${status}`)}
                <span className="tabular-nums text-default-400">
                  {columns[status].length}
                </span>
                {isCollapsed && <ChevronDown className="h-3 w-3 opacity-60" />}
              </button>
            );
          })}
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col">
          {edges.start && (
            <div
              className="pointer-events-none absolute inset-y-8 start-0 z-10 w-10 bg-gradient-to-r from-content1 via-content1/80 to-transparent"
              aria-hidden
            />
          )}
          {edges.end && (
            <div
              className="pointer-events-none absolute inset-y-8 end-0 z-10 w-10 bg-gradient-to-l from-content1 via-content1/80 to-transparent"
              aria-hidden
            />
          )}

          <KanbanScrollButton
            direction="start"
            visible={edges.start}
            label={t("board.scrollStart")}
            onPress={() => {
              if (scrollRef.current) scrollHorizontalBy(scrollRef.current, "start");
            }}
          />
          <KanbanScrollButton
            direction="end"
            visible={edges.end}
            label={t("board.scrollEnd")}
            onPress={() => {
              if (scrollRef.current) scrollHorizontalBy(scrollRef.current, "end");
            }}
          />

          <div
            ref={scrollRef}
            onScroll={() => {
              updateHorizontalEdges();
              updateActiveColumn();
            }}
            className={cn(
              "kanban-scroll kanban-scroll-x flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden px-0.5 pb-2 pt-1 sm:gap-4",
              "snap-x snap-mandatory md:snap-none",
              isDragging && "cursor-grabbing"
            )}
          >
            {TASK_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={columns[status]}
                allTasks={tasks}
                compact={compact}
                searchQuery={filters.search || undefined}
                collapsed={effectiveCollapsedColumns.has(status)}
                dimmed={!!focusedColumn && focusedColumn !== status}
                columnRef={(el) => {
                  if (el) columnRefs.current[status] = el;
                  else delete columnRefs.current[status];
                }}
                bodyRef={(el) => {
                  if (el) columnBodyRefs.current[status] = el;
                  else delete columnBodyRefs.current[status];
                }}
                onBodyScroll={updateColumnVerticalEdges}
                verticalEdges={columnVerticalEdges[status]}
                activeColumn={activeColumn}
                onToggleCollapse={() => toggleCollapse(status)}
                onJump={() => jumpToColumn(status)}
                onFocusColumn={() => enterFocusMode(status)}
              />
            ))}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}
