import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Task } from "../types/task.types";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { Avatar, AvatarImage, AvatarFallback, Card, CardContent } from "@heroui/react";
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
    <Card
      onClick={() => navigate(`/tasks/${task.id}`)}
      className={cn(
        "bg-content1 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "shadow-lg ring-2 ring-primary/20"
      )}
    >
      <CardContent className="p-3">
        <h4 className="text-sm font-medium leading-snug mb-2 line-clamp-2">
          {task.title}
        </h4>

        <div className="flex items-center gap-2 mb-2">
          <PriorityBadge priority={task.priority} />
          {isOverdue && (
            <span className="text-xs text-danger font-medium">
              Overdue
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            {task.assignee && (
              <>
                <Avatar size="sm">
                  <AvatarImage src={task.assignee.avatar} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-default-500 truncate max-w-[80px]">
                  {assigneeName}
                </span>
              </>
            )}
          </div>
          {task.commentsCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-default-400">
              <MessageSquare className="h-3 w-3" />
              {task.commentsCount}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
