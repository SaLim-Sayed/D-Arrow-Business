import { useAllUsers } from "@/features/users/hooks/use-users";
import { useAuthStore } from "@/stores/auth.store";
import { useTasksStore } from "@/stores/tasks.store";
import {
  Avatar,
  Button,
  Chip,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { User, UserPlus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as tasksApi from "../api/tasks.api";

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
        assigneeId ? t("assignment.assigned") : t("assignment.unassigned"),
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
    return allUsers?.find((user) => user.id === currentAssigneeId) || null;
  };

  const currentAssignee = getCurrentAssignee();

  // Compact view - just show current assignee
  if (size === "sm") {
    return (
      <div className="flex items-center gap-2">
        {currentAssignee ? (
          <div className="flex items-center gap-2">
            <Avatar
              src={currentAssignee.avatar}
              fallback={(currentAssignee.name ?? "")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
              showFallback
              size="sm"
            />
            <span className="text-sm font-medium">{currentAssignee.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-default-400">
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
        <div className="flex items-center gap-2 text-foreground/80">
          <Users className="h-4 w-4" />
          <span className="font-semibold tracking-tight">
            {t("assignment.assignTo")}
          </span>
        </div>
        {currentAssignee && (
          <Button
            variant="light"
            size="sm"
            onPress={handleUnassign}
            isDisabled={assignMutation.isPending}
            className="flex items-center gap-2"
          >
            {assignMutation.isPending && <Spinner size="sm" color="current" />}
            {t("assignment.unassign")}
          </Button>
        )}
      </div>

      <Select
        aria-label={t("assignment.selectAssignee")}
        placeholder={t("assignment.selectAssignee")}
        className="h-11"
        selectedKeys={
          new Set([currentAssigneeId || showUnassigned ? "unassigned" : ""])
        }
        onSelectionChange={(keys) =>
          handleAssignmentChange(Array.from(keys)[0] as string)
        }
        isDisabled={assignMutation.isPending || isLoadingUsers}
        renderValue={() => {
          const selectedKey = currentAssigneeId;
          if (selectedKey && selectedKey !== "unassigned") {
            const user =
              allUsers?.find((u) => u.id === selectedKey) || currentUser;
            return (
              <div className="flex items-center gap-2">
                <Avatar
                  size="sm"
                  src={user?.avatar}
                  fallback={(user?.name ?? "").charAt(0).toUpperCase()}
                  showFallback
                />
                <span>{user?.name}</span>
              </div>
            );
          }
          return <span>{t("assignment.selectAssignee")}</span>;
        }}
      >
        {[
          {
            id: "unassigned",
            type: "unassigned",
            text: t("assignment.unassigned"),
          },
          ...(currentUser
            ? [{ id: currentUser.id, type: "me", user: currentUser }]
            : []),
          ...(allUsers || [])
            .filter((user) => user.id !== currentUser?.id)
            .map((user) => ({ id: user.id, type: "other", user })),
        ].map((option) => {
          if (option.type === "unassigned") {
            return (
              <SelectItem key={option.id} textValue={(option as any).text}>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{(option as any).text}</span>
                </div>
              </SelectItem>
            );
          }
          const user = option.user!;
          return (
            <SelectItem key={option.id} textValue={user.name}>
              <div className="flex items-center gap-2">
                <Avatar
                  size="sm"
                  src={user.avatar}
                  fallback={user.name.charAt(0).toUpperCase()}
                  showFallback
                />
                <div className="flex flex-col">
                  <span className="text-small font-medium">{user.name}</span>
                  <span className="text-tiny text-default-400">
                    {option.type === "me" ? t("assignment.me") : user.email}
                  </span>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </Select>

      {/* Current assignment display */}
      {currentAssignee && (
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50 shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar
              size="sm"
              className="ring-2 ring-background"
              src={currentAssignee.avatar}
              fallback={currentAssignee.name.charAt(0).toUpperCase()}
              showFallback
            />
            <div>
              <p className="font-medium">{currentAssignee.name}</p>
              <p className="text-sm text-default-400">
                {currentAssignee.email}
              </p>
            </div>
          </div>
          <Chip variant="flat" color="success">
            {t("assignment.assigned")}
          </Chip>
        </div>
      )}

      {/* Assignment stats */}
      <div className="text-xs font-medium text-muted-foreground pt-1">
        {t("assignment.availableUsers", { count: allUsers?.length || 0 })}
      </div>
    </div>
  );
}

// Quick assignment component for inline use
export function QuickTaskAssignment({
  taskId,
  currentAssigneeId,
}: {
  taskId: string;
  currentAssigneeId?: string | null;
}) {
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

  const currentAssignee = allUsers?.find(
    (user) => user.id === currentAssigneeId,
  );

  return (
    <div className="flex items-center gap-2">
      {currentAssignee ? (
        <div className="flex items-center gap-2">
          <Avatar
            size="sm"
            src={currentAssignee.avatar}
            fallback={currentAssignee.name.charAt(0).toUpperCase()}
            showFallback
          />
          <span className="text-sm">{currentAssignee.name}</span>
        </div>
      ) : (
        <span className="text-sm text-default-400">
          {t("assignment.unassigned")}
        </span>
      )}

      <Button
        variant="light"
        size="sm"
        isIconOnly
        onPress={() => assignMutation.mutate(currentUser?.id || null)}
        isDisabled={assignMutation.isPending}
        className="flex items-center justify-center"
      >
        {assignMutation.isPending ? (
          <Spinner size="sm" color="current" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
