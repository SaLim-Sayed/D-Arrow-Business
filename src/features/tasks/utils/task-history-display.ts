import type { TFunction } from "i18next";
import type { TaskHistoryEntry } from "../types/task.types";

const ENUM_FIELDS = new Set(["status", "priority", "type"]);

function formatFieldValue(
  t: TFunction,
  field: string | undefined,
  value: string | null | undefined
): string {
  if (value === null || value === undefined || value === "") {
    return t("history.emptyValue");
  }
  if (field && ENUM_FIELDS.has(field)) {
    const key = field === "status" ? `status.${value}` : field === "priority" ? `priority.${value}` : `type.${value}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  if (field === "assigneeId" && value === "unassigned") {
    return t("form.assignee.unassigned");
  }
  if (field === "parentId" && !value) {
    return t("history.noParent");
  }
  if (field === "attachments") {
    return t("history.fileCount", { count: Number(value) || 0 });
  }
  return value;
}

export function getHistoryMessage(
  entry: TaskHistoryEntry,
  t: TFunction,
  context?: { userName?: string; taskTitle?: string; sprintName?: string; parentTitle?: string; assigneeName?: string }
): string {
  const name = entry.userName || context?.userName || t("history.unknownUser");

  if (entry.action === "created") {
    return t("history.created", { user: name });
  }

  if (entry.action === "time_logged") {
    return t("history.timeLogged", { user: name });
  }

  if (entry.action === "attachment_added") {
    return t("history.attachmentAdded", {
      user: name,
      count: entry.newValue ?? "1",
    });
  }

  if (entry.field) {
    const fieldLabel = t(`history.fields.${entry.field}`, { defaultValue: entry.field });
    const oldDisplay = resolveDisplayValue(entry.field, entry.oldValue, t, context);
    const newDisplay = resolveDisplayValue(entry.field, entry.newValue, t, context);

    if (oldDisplay === null || oldDisplay === "") {
      return t("history.setField", { user: name, field: fieldLabel, value: newDisplay });
    }
    return t("history.changedField", {
      user: name,
      field: fieldLabel,
      from: oldDisplay,
      to: newDisplay,
    });
  }

  return t("history.updated", { user: name });
}

function resolveDisplayValue(
  field: string,
  value: string | null | undefined,
  t: TFunction,
  context?: { sprintName?: string; parentTitle?: string; assigneeName?: string }
): string {
  if (value === null || value === undefined || value === "") {
    return t("history.emptyValue");
  }
  if (field === "sprintId" && context?.sprintName) return context.sprintName;
  if (field === "parentId" && context?.parentTitle) return context.parentTitle;
  if (field === "assigneeId" && context?.assigneeName) return context.assigneeName;
  return formatFieldValue(t, field, value);
}
