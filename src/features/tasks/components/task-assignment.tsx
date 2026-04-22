import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, UserPlus, Users } from "lucide-react";
import { useTasksStore } from "@/stores/tasks.store";
import { useAuthStore } from "@/stores/auth.store";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useMutation } from "@tanstack/react-query";
import * as tasksApi from "../api/tasks.api";
import { toast } from "sonner";

interface TaskAssignmentProps {
  taskId: string;
  currentAssigneeId?: string | null;
  onAssignmentChange?: (assigneeId: string | null) => void;
  showUnassigned?: boolean;
  size?: "sm" | "md" | "lg";
}

export function TaskAssignment({
  taskId,
  currentAssigneeId,
  onAssignmentChange,
  showUnassigned = true,
  size = "md",
}: TaskAssignmentProps) {
  const { t } = useTranslation("tasks");
  
  const { assignTask, unassignTask } = useTasksStore();
  const { user: currentUser } = useAuthStore();
  const { data: allUsers, isLoading: isLoadingUsers } = useAllUsers();

  // Mutation for assigning task
  const assignMutation = useMutation({
    mutationFn: async (assigneeId: string | null) => {
      if (assigneeId) {
        return tasksApi.updateTask(taskId, { assigneeId });
      } else {
        return tasksApi.updateTask(taskId, { assigneeId: null });
      }
    },
    onMutate: (assigneeId) => {
      // Optimistic update
      if (assigneeId) {
        assignTask(taskId, assigneeId);
      } else {
        unassignTask(taskId);
      }
    },
    onSuccess: (_, assigneeId) => {
      toast.success(
        assigneeId 
          ? t("assignment.assigned") 
          : t("assignment.unassigned")
      );
      onAssignmentChange?.(assigneeId);
    },
    onError: (error) => {
      toast.error(t("assignment.error"));
      console.error("Assignment failed:", error);
    },
  });

  const handleAssignmentChange = (assigneeId: string) => {
    assignMutation.mutate(assigneeId === "unassigned" ? null : assigneeId);
  };

  const handleUnassign = () => {
    assignMutation.mutate(null);
  };

  const getCurrentAssignee = () => {
    if (!currentAssigneeId) return null;
    return allUsers?.find(user => user.id === currentAssigneeId) || null;
  };

  const currentAssignee = getCurrentAssignee();

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  // Compact view - just show current assignee
  if (size === "sm") {
    return (
      <div className="flex items-center gap-2">
        {currentAssignee ? (
          <div className="flex items-center gap-2">
            <Avatar className={sizeClasses[size]}>
              <AvatarImage src={currentAssignee.avatar} />
              <AvatarFallback>
                {currentAssignee.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{currentAssignee.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="text-sm">{t("assignment.unassigned")}</span>
          </div>
        )}
      </div>
    );
  }

  // Medium/Large view - show assignment selector
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="font-medium">{t("assignment.assignTo")}</span>
        </div>
        {currentAssignee && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUnassign}
            disabled={assignMutation.isPending}
          >
            {t("assignment.unassign")}
          </Button>
        )}
      </div>

      <Select
        value={currentAssigneeId || ""}
        onValueChange={handleAssignmentChange}
        disabled={assignMutation.isPending || isLoadingUsers}
      >
        <SelectTrigger>
          <SelectValue placeholder={t("assignment.selectAssignee")} />
        </SelectTrigger>
        <SelectContent>
          {showUnassigned && (
            <SelectItem value="unassigned">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{t("assignment.unassigned")}</span>
              </div>
            </SelectItem>
          )}
          
          {/* Current user option */}
          {currentUser && (
            <SelectItem value={currentUser.id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{currentUser.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("assignment.me")}
                  </span>
                </div>
              </div>
            </SelectItem>
          )}
          
          {/* Other users */}
          {(allUsers || [])
            .filter(user => user.id !== currentUser?.id)
            .map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                    <span className="text-xs text-primary">
                      {user.role}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {/* Current assignment display */}
      {currentAssignee && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar className={sizeClasses[size]}>
              <AvatarImage src={currentAssignee.avatar} />
              <AvatarFallback>
                {currentAssignee.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{currentAssignee.name}</p>
              <p className="text-sm text-muted-foreground">{currentAssignee.email}</p>
            </div>
          </div>
          <Badge variant="secondary">
            {t("assignment.assigned")}
          </Badge>
        </div>
      )}

      {/* Assignment stats */}
      <div className="text-xs text-muted-foreground">
        {t("assignment.availableUsers", { count: allUsers?.length || 0 })}
      </div>
    </div>
  );
}

// Quick assignment component for inline use
export function QuickTaskAssignment({ taskId, currentAssigneeId }: { taskId: string; currentAssigneeId?: string | null }) {
  const { t } = useTranslation("tasks");
  const { data: allUsers } = useAllUsers();
  const { user: currentUser } = useAuthStore();

  const assignMutation = useMutation({
    mutationFn: async (assigneeId: string | null) => {
      return tasksApi.updateTask(taskId, { assigneeId });
    },
    onSuccess: () => {
      toast.success(t("assignment.updated"));
    },
    onError: () => {
      toast.error(t("assignment.error"));
    },
  });

  const currentAssignee = allUsers?.find(user => user.id === currentAssigneeId);

  return (
    <div className="flex items-center gap-2">
      {currentAssignee ? (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={currentAssignee.avatar} />
            <AvatarFallback>
              {currentAssignee.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{currentAssignee.name}</span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">{t("assignment.unassigned")}</span>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => assignMutation.mutate(currentUser?.id || null)}
        disabled={assignMutation.isPending}
      >
        <UserPlus className="h-4 w-4" />
      </Button>
    </div>
  );
}
