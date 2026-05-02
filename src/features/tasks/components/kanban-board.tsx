import { useTranslation } from "react-i18next";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useTasksQuery } from "../hooks/use-tasks";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useUpdateTask } from "../hooks/use-task-mutations";
import { TaskCard } from "./task-card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { TASK_STATUSES } from "@/lib/constants";
import type { Task, TaskStatus } from "../types/task.types";
import { cn } from "@/lib/utils";
import { useTasksUIStore } from "../store/tasks-ui.store";

export function KanbanBoard() {
  const { t } = useTranslation("tasks");
  const { data: allUsers } = useAllUsers();
  const { filters } = useTasksUIStore();
  
  const { data, isLoading: isTasksLoading } = useTasksQuery({
    search: filters.search || undefined,
    priority: filters.priority.length ? filters.priority : undefined,
    pageSize: 100, // Show more tasks on board
  });
  
  const updateTask = useUpdateTask();

  const isLoading = isTasksLoading || !allUsers;
  const tasks = (data?.data ?? [])
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((task: Task) => ({
      ...task,
      assignee: allUsers?.find(u => u.id === task.assigneeId) || null
    }));

  const columns: Record<TaskStatus, Task[]> = {
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  };

  for (const task of tasks) {
    if (task.status in columns) {
      columns[task.status as TaskStatus].push(task);
    }
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as TaskStatus;

    const task = tasks.find((t: Task) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    updateTask.mutate({ id: taskId, data: { status: newStatus } });
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const columnConfig: Record<
    TaskStatus,
    { color: string; bg: string; dot: string }
  > = {
    todo: {
      color: "text-default-600",
      bg: "bg-default-50/30",
      dot: "border-default-400",
    },
    in_progress: {
      color: "text-blue-600",
      bg: "bg-blue-50/10",
      dot: "border-blue-500",
    },
    in_review: {
      color: "text-orange-600",
      bg: "bg-orange-50/10",
      dot: "border-orange-500",
    },
    done: {
      color: "text-green-600",
      bg: "bg-green-50/10",
      dot: "border-green-500",
    },
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-8 overflow-x-auto pb-6 h-full scrollbar-hide">
        {TASK_STATUSES.map((status) => (
          <div
            key={status}
            className={cn(
              "flex-shrink-0 w-[300px] flex flex-col group/column",
              columnConfig[status].bg
            )}
          >
            {/* Column Header - Jira Style */}
            <div className="flex items-center gap-3 px-2 py-4 mb-2">
              <div className={cn(
                "h-4 w-4 rounded-full border-[3px] shrink-0",
                columnConfig[status].dot
              )} />
              <h3 className={cn(
                "text-xs font-bold uppercase tracking-wider",
                columnConfig[status].color
              )}>
                {t(`status.${status}`)}
              </h3>
              <span className="text-[11px] font-medium text-default-400">
                ( {columns[status].length} )
              </span>
            </div>

            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 overflow-y-auto overflow-x-hidden min-h-[400px] rounded-xl transition-colors duration-200 p-1",
                    snapshot.isDraggingOver ? "bg-default-100/50" : "bg-transparent"
                  )}
                >
                  <div className="space-y-3">
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
                            className="outline-none"
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

                    {/* Empty State */}
                    {columns[status].length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-col items-center justify-center py-20 text-center px-4 animate-in fade-in duration-500">
                        <div className="h-24 w-32 mb-6 opacity-10">
                          <svg viewBox="0 0 120 80" className="w-full h-full fill-current text-default-900">
                            <rect x="10" y="10" width="40" height="25" rx="2" />
                            <rect x="60" y="15" width="40" height="25" rx="2" />
                            <rect x="20" y="45" width="40" height="25" rx="2" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-bold text-default-900 mb-2">No items available</h4>
                        <p className="text-xs text-default-400 leading-relaxed max-w-[200px]">
                          Add an item to this status and track them across status
                        </p>
                      </div>
                    )}
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
