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
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { TASK_STATUSES } from "@/lib/constants";
import type { Task, TaskStatus } from "../types/task.types";

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

  const columnColors: Record<TaskStatus, string> = {
    todo: "border-t-zinc-400",
    in_progress: "border-t-blue-500",
    in_review: "border-t-amber-500",
    done: "border-t-green-500",
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TASK_STATUSES.map((status) => (
          <div
            key={status}
            className={`rounded-lg border border-t-4 bg-muted/30 ${columnColors[status]}`}
          >
            <div className="flex items-center justify-between p-3 pb-2">
              <h3 className="text-sm font-semibold">
                {t(`status.${status}`)}
              </h3>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {columns[status].length}
              </span>
            </div>

            <Droppable droppableId={status}>
              {(provided) => (
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2 p-2 pt-0 min-h-[100px]"
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
                </ScrollArea>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
