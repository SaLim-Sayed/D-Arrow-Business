import { useTranslation } from "react-i18next";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useAllTasksQuery } from "../hooks/use-tasks";
import { useUpdateTask } from "../hooks/use-task-mutations";
import { TaskCard } from "./task-card";
// ScrollArea removed, using native scrollbars
import { Chip } from "@heroui/react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { TASK_STATUSES } from "@/lib/constants";
import type { Task, TaskStatus } from "../types/task.types";
import { cn } from "@/lib/utils";

export function KanbanBoard() {
  const { t } = useTranslation("tasks");
  const { data, isLoading } = useAllTasksQuery();
  const updateTask = useUpdateTask();

  const tasks = data?.data ?? [];

  const columns: Record<TaskStatus, Task[]> = {
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  };

  for (const task of tasks) {
    columns[task.status].push(task);
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as TaskStatus;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    updateTask.mutate({ id: taskId, data: { status: newStatus } });
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const columnStyles: Record<
    TaskStatus,
    { border: string; bg: string; text: string }
  > = {
    todo: {
      border: "border-default-200",
      bg: "bg-default-50/50",
      text: "text-default-600",
    },
    in_progress: {
      border: "border-primary/20",
      bg: "bg-primary/5",
      text: "text-primary",
    },
    in_review: {
      border: "border-secondary/20",
      bg: "bg-secondary/5",
      text: "text-secondary",
    },
    done: {
      border: "border-success/20",
      bg: "bg-success/5",
      text: "text-success",
    },
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
        {TASK_STATUSES.map((status) => (
          <div
            key={status}
            className={cn(
              "flex-shrink-0 w-80 rounded-3xl border flex flex-col glass-card",
              columnStyles[status].border,
              columnStyles[status].bg,
            )}
          >
            <div className="flex items-center justify-between p-5 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    status === "todo"
                      ? "bg-default-400"
                      : status === "in_progress"
                        ? "bg-primary"
                        : status === "in_review"
                          ? "bg-secondary"
                          : "bg-success",
                  )}
                />
                <h3
                  className={cn(
                    "text-sm font-black uppercase tracking-widest",
                    columnStyles[status].text,
                  )}
                >
                  {t(`status.${status}`)}
                </h3>
              </div>
              <Chip
                size="sm"
                variant="flat"
                className={cn(
                  "font-bold",
                  columnStyles[status].bg,
                  columnStyles[status].text,
                )}
              >
                {columns[status].length}
              </Chip>
            </div>

            <Droppable droppableId={status}>
              {(provided) => (
                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-[500px] max-h-[calc(100vh-320px)]">
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-4 p-4 pt-2 min-h-[100px]"
                  >
                    {columns[status].map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="transition-transform"
                          >
                            <TaskCard
                              task={task}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
