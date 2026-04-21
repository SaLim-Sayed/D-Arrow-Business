import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Task } from "../types/task.types";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const assigneeName =
    i18n.language === "ar" ? task.assignee?.nameAr : task.assignee?.name;
  const initials = (task.assignee?.name ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <div
      onClick={() => navigate(`/tasks/${task.id}`)}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm cursor-pointer transition-shadow hover:shadow-md",
        isDragging && "shadow-lg ring-2 ring-primary/20"
      )}
    >
      <h4 className="text-sm font-medium leading-snug mb-2 line-clamp-2">
        {task.title}
      </h4>

      <div className="flex items-center gap-2 mb-2">
        <PriorityBadge priority={task.priority} />
        {isOverdue && (
          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
            Overdue
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          {task.assignee && (
            <>
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                {assigneeName}
              </span>
            </>
          )}
        </div>
        {task.commentsCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {task.commentsCount}
          </div>
        )}
      </div>
    </div>
  );
}
