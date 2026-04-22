import { useTranslation } from "react-i18next";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopover,
  ListBox,
  ListBoxItem,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Chip,
  ChipLabel,
  Spinner,
} from "@heroui/react";
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
            <Avatar size="sm">
              <AvatarImage src={currentAssignee.avatar} />
              <AvatarFallback>
                {(currentAssignee.name ?? "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
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
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="font-medium">{t("assignment.assignTo")}</span>
        </div>
        {currentAssignee && (
          <Button
            variant="tertiary"
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
        selectedKey={
          currentAssigneeId
            ? currentAssigneeId
            : showUnassigned
              ? "unassigned"
              : ""
        }
        onSelectionChange={(key) => handleAssignmentChange(key as string)}
        isDisabled={assignMutation.isPending || isLoadingUsers}
      >
        <SelectTrigger>
          <SelectValue>
            {(value) => {
              const selectedKey = value.state.selectedKey as string;
              if (selectedKey && selectedKey !== "unassigned") {
                const user =
                  allUsers?.find((u) => u.id === selectedKey) || currentUser;
                return (
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback>
                        {(user?.name ?? "")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user?.name}</span>
                  </div>
                );
              }
              return <span>{t("assignment.selectAssignee")}</span>;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectPopover>
          <ListBox>
            <ListBoxItem id="unassigned" textValue={t("assignment.unassigned")}>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{t("assignment.unassigned")}</span>
              </div>
            </ListBoxItem>

            {/* Current user option */}
            {currentUser && (
              <ListBoxItem
                id={currentUser.id}
                key={currentUser.id}
                textValue={currentUser.name}
              >
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback>
                      {currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-small font-medium">
                      {currentUser.name}
                    </span>
                    <span className="text-tiny text-default-400">
                      {t("assignment.me")}
                    </span>
                  </div>
                </div>
              </ListBoxItem>
            )}

            {/* Other users */}
            {(allUsers || [])
              .filter((user) => user.id !== currentUser?.id)
              .map((user) => (
                <ListBoxItem id={user.id} key={user.id} textValue={user.name}>
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-small font-medium">
                        {user.name}
                      </span>
                      <span className="text-tiny text-default-400">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </ListBoxItem>
              ))}
          </ListBox>
        </SelectPopover>
      </Select>

      {/* Current assignment display */}
      {currentAssignee && (
        <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarImage src={currentAssignee.avatar} />
              <AvatarFallback>
                {currentAssignee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{currentAssignee.name}</p>
              <p className="text-sm text-default-400">
                {currentAssignee.email}
              </p>
            </div>
          </div>
          <Chip variant="soft" color="success">
            <ChipLabel>{t("assignment.assigned")}</ChipLabel>
          </Chip>
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
          <Avatar size="sm">
            <AvatarImage src={currentAssignee.avatar} />
            <AvatarFallback>
              {currentAssignee.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{currentAssignee.name}</span>
        </div>
      ) : (
        <span className="text-sm text-default-400">
          {t("assignment.unassigned")}
        </span>
      )}

      <Button
        variant="tertiary"
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
