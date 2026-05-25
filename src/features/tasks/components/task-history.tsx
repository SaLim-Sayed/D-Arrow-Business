import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { Avatar, Chip } from "@heroui/react";
import { History, Plus, Paperclip, Clock, Edit3 } from "lucide-react";
import type { Task, TaskHistoryEntry } from "../types/task.types";
import { formatDate } from "@/lib/utils";
import { getHistoryMessage } from "../utils/task-history-display";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useAllTasksQuery, useSprintsQuery } from "../hooks/use-tasks";

const ACTION_ICONS: Record<string, typeof History> = {
  created: Plus,
  updated: Edit3,
  attachment_added: Paperclip,
  time_logged: Clock,
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-success/10 text-success",
  updated: "bg-primary/10 text-primary",
  attachment_added: "bg-warning/10 text-warning",
  time_logged: "bg-secondary/10 text-secondary",
};

interface TaskHistoryProps {
  task: Task;
}

export function TaskHistory({ task }: TaskHistoryProps) {
  const { t } = useTranslation("tasks");
  const { data: allUsers } = useAllUsers();
  const { data: allTasks } = useAllTasksQuery();
  const { data: allSprints } = useSprintsQuery();

  const sortedHistory = useMemo(() => {
    const entries = task.history ?? [];
    return [...entries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [task.history]);

  const resolveContext = (entry: TaskHistoryEntry) => {
    const assigneeName = entry.field === "assigneeId" && entry.newValue
      ? allUsers?.find((u) => u.id === entry.newValue)?.name
      : undefined;
    const parentTitle = entry.field === "parentId" && entry.newValue
      ? allTasks?.data?.find((t) => t.id === entry.newValue)?.title
      : undefined;
    const sprintName = entry.field === "sprintId" && entry.newValue
      ? allSprints?.data?.find((s) => s.id === entry.newValue)?.name
      : undefined;
    const userName =
      entry.userName ||
      allUsers?.find((u) => u.id === entry.userId)?.name;

    return { assigneeName, parentTitle, sprintName, userName };
  };

  if (sortedHistory.length === 0) {
    return (
      <div className="text-center py-10 rounded-xl border border-dashed border-default-200 bg-default-50/50">
        <History className="w-8 h-8 text-default-300 mx-auto mb-2" />
        <p className="text-sm text-default-500">{t("detail.historyPlaceholder")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {sortedHistory.map((entry, index) => {
        const Icon = ACTION_ICONS[entry.action] ?? Edit3;
        const colorClass = ACTION_COLORS[entry.action] ?? ACTION_COLORS.updated;
        const ctx = resolveContext(entry);
        const displayName = ctx.userName || t("history.unknownUser");
        const initials = displayName.charAt(0).toUpperCase();

        return (
          <div key={entry.id} className="flex gap-4 relative">
            {index < sortedHistory.length - 1 && (
              <span className="absolute left-[19px] top-10 bottom-0 w-px bg-default-200" />
            )}
            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 pb-6">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Avatar
                  size="sm"
                  name={displayName}
                  fallback={initials}
                  className="w-6 h-6 text-[10px]"
                />
                <span className="text-sm font-semibold text-foreground">{displayName}</span>
                <span className="text-xs text-default-400">
                  {formatDate(entry.timestamp)}
                </span>
                <Chip size="sm" variant="flat" className="capitalize text-[10px] h-5">
                  {t(`history.actions.${entry.action}`, { defaultValue: entry.action })}
                </Chip>
              </div>
              <p className="text-sm text-default-600 leading-relaxed">
                {getHistoryMessage(entry, t, ctx)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
