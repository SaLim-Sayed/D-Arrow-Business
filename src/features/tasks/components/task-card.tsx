import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Task } from "../types/task.types";
import { Avatar, Card, CardBody, Chip } from "@heroui/react";
import { MessageSquare, MoreHorizontal, Paperclip, CalendarClock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query?.trim()) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark
            key={`${part}-${index}`}
            className="rounded-sm bg-warning/25 px-0.5 text-inherit"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </>
  );
}

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  subtasks?: Task[];
  parentTask?: Task;
  compact?: boolean;
  searchQuery?: string;
}

export function TaskCard({
  task,
  isDragging,
  subtasks = [],
  parentTask,
  compact = false,
  searchQuery,
}: TaskCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("tasks");

  const initials = (task.assignee?.name ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isOverdue =
    !!task.dueDate &&
    task.status !== "done" &&
    new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

  const completedSubtasksCount = subtasks.filter((st) => st.status === "done").length;
  const subtasksProgress = subtasks.length > 0 ? (completedSubtasksCount / subtasks.length) * 100 : 0;

  const priorityBorderColor =
    task.priority === "urgent"
      ? "border-s-danger"
      : task.priority === "high"
        ? "border-s-warning"
        : task.priority === "medium"
          ? "border-s-primary"
          : "border-s-default-300";

  return (
    <div
      onClick={() => navigate(`/tasks/${task.id}`)}
      className={cn(
        "group cursor-pointer transition-all duration-200",
        isDragging ? "opacity-50 scale-105" : "hover:-translate-y-0.5"
      )}
    >
      <Card
        className={cn(
          "relative overflow-hidden border border-default-200/80 dark:border-default-100 shadow-sm hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300 rounded-2xl bg-white dark:bg-content1/70 backdrop-blur-sm border-s-4",
          priorityBorderColor,
          compact && "rounded-xl border-s-3",
          isDragging &&
            "shadow-2xl ring-2 ring-primary/30 rotate-1 scale-[1.02]"
        )}
      >
        <CardBody className={cn("space-y-3", compact ? "p-2.5 space-y-2" : "p-4")}>
          {/* Header: ID and Assignee */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              {!compact && (
                <span className="text-[10px] font-extrabold text-default-400 uppercase tracking-wider bg-default-100 dark:bg-default-100/30 px-1.5 py-0.5 rounded-md">
                  TSK-{task.id.slice(-4).toUpperCase()}
                </span>
              )}
              {compact && (
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    task.priority === "urgent"
                      ? "bg-danger shadow-sm shadow-danger/50"
                      : task.priority === "high"
                        ? "bg-warning shadow-sm shadow-warning/50"
                        : task.priority === "medium"
                          ? "bg-primary"
                          : "bg-default-300"
                  )}
                  title={t(`priority.${task.priority}`)}
                />
              )}
            </div>
            {task.assignee && (
              <Avatar
                size="sm"
                src={task.assignee.avatar}
                fallback={initials}
                showFallback
                className={cn(
                  "ring-2 ring-background shadow-xs",
                  compact ? "h-5 w-5 text-[8px]" : "h-6 w-6 text-[10px]"
                )}
              />
            )}
          </div>

          {/* Title */}
          <div className="space-y-1">
            {!compact && parentTask && (
              <div
                className="text-[10px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/tasks/${parentTask.id}`);
                }}
              >
                ↑ {parentTask.title}
              </div>
            )}
            <h4
              className={cn(
                "font-bold text-foreground leading-snug group-hover:text-primary transition-colors",
                compact ? "text-xs line-clamp-2" : "text-sm"
              )}
            >
              <HighlightText text={task.title} query={searchQuery} />
            </h4>
          </div>

          {/* Priority & Tags */}
          {!compact && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <Chip
                size="sm"
                variant="flat"
                className={cn(
                  "h-5 text-[9px] font-extrabold uppercase tracking-tight px-1.5 rounded-md",
                  task.priority === "urgent"
                    ? "bg-danger/15 text-danger border border-danger/20"
                    : task.priority === "high"
                      ? "bg-warning/15 text-warning-700 dark:text-warning border border-warning/20"
                      : task.priority === "medium"
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "bg-default-100 text-default-600 border border-default-200"
                )}
              >
                {t(`priority.${task.priority}`)}
              </Chip>
              {task.tags?.slice(0, 2).map((tag) => (
                <Chip
                  key={tag}
                  size="sm"
                  variant="flat"
                  className="h-5 text-[9px] font-bold bg-default-100 text-default-600 rounded-md"
                >
                  {tag}
                </Chip>
              ))}
            </div>
          )}

          {/* Subtasks Visual Progress Bar */}
          {!compact && subtasks.length > 0 && (
            <div className="pt-1.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-default-500">
                <span>{t("detail.subtasks")}</span>
                <span>
                  {completedSubtasksCount}/{subtasks.length}
                </span>
              </div>
              <div className="h-1.5 w-full bg-default-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${subtasksProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer Metadata */}
          <div
            className={cn(
              "flex items-center justify-between border-t border-default-100/60 pt-2",
              compact && "pt-1.5"
            )}
          >
            <div className="flex items-center gap-2.5">
              {task.dueDate && (
                <div
                  className={cn(
                    "flex items-center gap-1 font-bold rounded-md px-1.5 py-0.5",
                    compact ? "text-[9px]" : "text-[10px]",
                    isOverdue
                      ? "bg-danger/10 text-danger border border-danger/20 animate-pulse"
                      : "bg-default-100/70 text-default-500"
                  )}
                >
                  <CalendarClock className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
                  <span dir="ltr">{formatDate(task.dueDate)}</span>
                </div>
              )}
              {!compact && task.commentsCount > 0 && (
                <div className="flex items-center gap-1 text-default-400">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">
                    {task.commentsCount}
                  </span>
                </div>
              )}
              {!compact && task.attachments && task.attachments.length > 0 && (
                <div className="flex items-center gap-1 text-default-400">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">
                    {task.attachments.length}
                  </span>
                </div>
              )}
            </div>
            {!compact && (
              <button
                type="button"
                className="text-default-400 hover:text-primary transition-colors p-1 rounded-md hover:bg-default-100"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/tasks/${task.id}`);
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

