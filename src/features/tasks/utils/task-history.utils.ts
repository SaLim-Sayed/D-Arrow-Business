import type { TaskHistoryEntry, UpdateTaskDTO } from "../types/task.types";

const TRACKED_FIELDS = [
  "title",
  "description",
  "status",
  "priority",
  "type",
  "parentId",
  "sprintId",
  "assigneeId",
  "dueDate",
  "startDate",
] as const;

function normalizeValue(field: string, value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (field === "dueDate" || field === "startDate") {
    const d = new Date(String(value));
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  }
  if (Array.isArray(value)) return String(value.length);
  return String(value);
}

export function createHistoryEntry(
  partial: Omit<TaskHistoryEntry, "id" | "timestamp"> & { timestamp?: string }
): TaskHistoryEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: partial.timestamp ?? new Date().toISOString(),
    ...partial,
  };
}

export function buildCreatedHistoryEntry(actor: {
  userId: string;
  userName?: string;
}): TaskHistoryEntry {
  return createHistoryEntry({
    action: "created",
    userId: actor.userId,
    userName: actor.userName,
  });
}

export function buildHistoryFromChanges(
  previous: Record<string, unknown>,
  updates: UpdateTaskDTO,
  actor: { userId: string; userName?: string }
): TaskHistoryEntry[] {
  const entries: TaskHistoryEntry[] = [];
  const timestamp = new Date().toISOString();

  for (const field of TRACKED_FIELDS) {
    if (!(field in updates)) continue;
    const oldRaw = previous[field];
    const newRaw = updates[field as keyof UpdateTaskDTO];
    if (normalizeValue(field, oldRaw) === normalizeValue(field, newRaw)) continue;

    entries.push({
      id: crypto.randomUUID(),
      action: "updated",
      field,
      oldValue: normalizeValue(field, oldRaw),
      newValue: normalizeValue(field, newRaw),
      userId: actor.userId,
      userName: actor.userName,
      timestamp,
    });
  }

  if ("attachments" in updates) {
    const oldLen = (previous.attachments as string[] | undefined)?.length ?? 0;
    const newLen = (updates.attachments as string[] | undefined)?.length ?? 0;
    if (oldLen !== newLen) {
      entries.push({
        id: crypto.randomUUID(),
        action: newLen > oldLen ? "attachment_added" : "updated",
        field: "attachments",
        oldValue: oldLen > 0 ? String(oldLen) : null,
        newValue: String(newLen),
        userId: actor.userId,
        userName: actor.userName,
        timestamp,
      });
    }
  }

  if ("timeLogs" in updates) {
    const oldLen = (previous.timeLogs as unknown[] | undefined)?.length ?? 0;
    const newLen = (updates.timeLogs as unknown[] | undefined)?.length ?? 0;
    if (newLen > oldLen) {
      entries.push({
        id: crypto.randomUUID(),
        action: "time_logged",
        field: "timeLogs",
        oldValue: oldLen > 0 ? String(oldLen) : null,
        newValue: String(newLen),
        userId: actor.userId,
        userName: actor.userName,
        timestamp,
      });
    }
  }

  return entries;
}

export function parseHistoryTimestamp(entry: TaskHistoryEntry): string {
  const ts = entry.timestamp as unknown;
  if (ts && typeof ts === "object" && "toDate" in (ts as object)) {
    return (ts as { toDate: () => Date }).toDate().toISOString();
  }
  return String(entry.timestamp);
}
