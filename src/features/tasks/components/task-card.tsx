import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Task } from "../types/task.types";
import { Avatar, Card, CardBody, Chip } from "@heroui/react";
import { MessageSquare, MoreHorizontal, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
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
        isDragging ? "opacity-50 scale-105" : "hover:scale-[1.01]"
      )}
    >
      <Card
        className={cn(
          "border border-default-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg",
          isDragging && "shadow-2xl ring-2 ring-primary/20 rotate-1"
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
          <h4 className="text-sm font-semibold text-default-900 leading-snug group-hover:text-primary transition-colors">
            {task.title}
          </h4>

          {/* Tags / Labels */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Chip 
              size="sm" 
              variant="flat" 
              className={cn(
                "h-5 text-[9px] font-bold uppercase tracking-tighter px-1",
                task.priority === 'urgent' ? 'bg-danger/10 text-danger' : 
                task.priority === 'high' ? 'bg-warning/10 text-warning' : 
                'bg-default-100 text-default-600'
              )}
            >
              {t(`priority.${task.priority}`)}
            </Chip>
            {task.tags?.slice(0, 2).map(tag => (
              <Chip key={tag} size="sm" variant="flat" className="h-5 text-[9px] font-medium bg-default-100">
                {tag}
              </Chip>
            ))}
          </div>

          {/* Footer: Icons */}
          <div className="flex items-center justify-between pt-2 border-t border-default-50">
            <div className="flex items-center gap-3">
              {task.commentsCount > 0 && (
                <div className="flex items-center gap-1 text-default-400">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">{task.commentsCount}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-default-300">
                <Paperclip className="h-3.5 w-3.5" />
              </div>
            </div>
            <button className="text-default-300 hover:text-default-600 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
