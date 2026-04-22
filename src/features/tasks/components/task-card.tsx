import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Task } from "../types/task.types";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { Avatar, Card, CardBody } from "@heroui/react";
import { MessageSquare, Plus } from "lucide-react";
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
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";

  return (
    <Link to={`/tasks/${task.id}`}>
      <Card
        onClick={() => navigate(`/tasks/${task.id}`)}
        className={cn(
          "glass-card border-none hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer group",
          isDragging && "shadow-2xl ring-2 ring-primary/40 rotate-2 z-50",
        )}
      >
        <CardBody className="p-4">
          <div className="flex items-center justify-between mb-3">
            <PriorityBadge priority={task.priority} />
            {task.commentsCount > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-default-400 group-hover:text-primary transition-colors">
                <MessageSquare className="h-3.5 w-3.5" />
                {task.commentsCount}
              </div>
            )}
          </div>

          <h4 className="text-sm font-bold leading-relaxed mb-4 group-hover:text-primary transition-colors">
            {task.title}
          </h4>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar
                    size="sm"
                    src={task.assignee.avatar}
                    fallback={initials}
                    showFallback
                    className="ring-2 ring-background group-hover:ring-primary/20 transition-all"
                  />
                  <span className="text-[10px] font-bold text-default-500 uppercase tracking-wider truncate max-w-[100px]">
                    {assigneeName}
                  </span>
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-default-100 flex items-center justify-center border border-dashed border-default-300">
                  <Plus className="h-3 w-3 text-default-400" />
                </div>
              )}
            </div>
            {isOverdue && (
              <div className="px-2 py-0.5 rounded-full bg-danger/10 text-[9px] font-black uppercase tracking-tighter text-danger animate-pulse">
                Overdue
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
