import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Task } from "../types/task.types";
import { Avatar, Card, CardBody, Chip } from "@heroui/react";
import { MessageSquare, MoreHorizontal, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  subtasks?: Task[];
  parentTask?: Task;
}

export function TaskCard({
  task,
  isDragging,
  subtasks = [],
  parentTask,
}: TaskCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("tasks");

  const initials = (task.assignee?.name ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      onClick={() => navigate(`/tasks/${task.id}`)}
      className={cn(
        "group cursor-pointer transition-all duration-200",
        isDragging ? "opacity-50 scale-105" : "hover:scale-[1.01]",
      )}
    >
      <Card
        className={cn(
          "border border-default-200 dark:border-default-100 shadow-sm hover:shadow-md dark:hover:shadow-primary/10 transition-all duration-300 rounded-xl bg-white dark:bg-content1/50 backdrop-blur-sm",
          isDragging &&
            "shadow-2xl ring-2 ring-primary/20 rotate-1 scale-[1.02]",
        )}
      >
        <CardBody className="p-4 space-y-3">
          {/* Header: ID and Assignee */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-default-400 uppercase tracking-wider">
                TASK-{task.id.slice(-4).toUpperCase()}
              </span>
            </div>
            {task.assignee && (
              <Avatar
                size="sm"
                src={task.assignee.avatar}
                fallback={initials}
                showFallback
                className="h-6 w-6 ring-2 ring-background"
              />
            )}
          </div>

          {/* Title */}
          <div className="space-y-1">
            {parentTask && (
              <div
                className="text-[10px] font-medium text-primary hover:underline cursor-pointer flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/tasks/${parentTask.id}`);
                }}
              >
                ↑ {parentTask.title}
              </div>
            )}
            <h4 className="text-sm font-bold  text-primary leading-snug group-hover:text-primary transition-colors">
              {task.title}
            </h4>
          </div>

          {/* Tags / Labels */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Chip
              size="sm"
              variant="flat"
              className={cn(
                "h-5 text-[9px] font-bold uppercase tracking-tighter px-1",
                task.priority === "urgent"
                  ? "bg-danger/10 text-danger"
                  : task.priority === "high"
                    ? "bg-warning/10 text-warning"
                    : "bg-default-100 dark:bg-default-100/20 text-default-600 dark:text-default-400",
              )}
            >
              {t(`priority.${task.priority}`)}
            </Chip>
            {task.tags?.slice(0, 2).map((tag) => (
              <Chip
                key={tag}
                size="sm"
                variant="flat"
                className="h-5 text-[9px] font-medium bg-default-100"
              >
                {tag}
              </Chip>
            ))}
          </div>

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <div className="pt-2 space-y-1">
              <div className="text-[10px] font-bold text-default-400 uppercase tracking-wider">
                {t("detail.subtasks")} ({subtasks.filter((st) => st.status === "done").length}
                /{subtasks.length})
              </div>
              <div className="space-y-1">
                {subtasks.slice(0, 3).map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 text-xs p-1 rounded-md hover:bg-default-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tasks/${st.id}`);
                    }}
                  >
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        st.status === "done"
                          ? "bg-success"
                          : st.status === "in_progress"
                            ? "bg-blue-500"
                            : "bg-default-300",
                      )}
                    />
                    <span
                      className={cn(
                        "truncate font-medium",
                        st.status === "done"
                          ? "text-default-400 line-through"
                          : "text-default-600",
                      )}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
                {subtasks.length > 3 && (
                  <div className="text-[10px] text-default-400 pl-3">
                    {t("detail.more", { count: subtasks.length - 3 })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer: Icons */}
          <div className="flex items-center justify-between pt-2 border-t border-default-100/50">
            <div className="flex items-center gap-3">
              {task.commentsCount > 0 && (
                <div className="flex items-center gap-1 text-default-400">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">
                    {task.commentsCount}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 text-default-400">
                <Paperclip className="h-3.5 w-3.5" />
              </div>
            </div>
            <button className="text-default-400 hover:text-primary transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
