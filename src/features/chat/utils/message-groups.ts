import type { ChatMessage } from "../types/chat.types";

const CLUSTER_GAP_MS = 5 * 60 * 1000;

export type MessageListItem =
  | { type: "day"; key: string; date: Date }
  | {
      type: "message";
      key: string;
      message: ChatMessage;
      /** First message in a consecutive same-sender cluster. */
      isClusterStart: boolean;
      /** Last message in a consecutive same-sender cluster. */
      isClusterEnd: boolean;
    };

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function sameCluster(a: ChatMessage, b: ChatMessage): boolean {
  if (a.senderId !== b.senderId) return false;
  if (a.deletedAt || b.deletedAt) return false;
  const gap =
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  return gap >= 0 && gap <= CLUSTER_GAP_MS;
}

/** Inserts day separators and marks sender clusters (oldest → newest). */
export function groupMessagesByDay(messages: ChatMessage[]): MessageListItem[] {
  const items: MessageListItem[] = [];
  let lastDay = "";

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const key = dayKey(message.createdAt);
    if (key !== lastDay) {
      items.push({
        type: "day",
        key: `day-${key}`,
        date: new Date(message.createdAt),
      });
      lastDay = key;
    }

    const prev = i > 0 ? messages[i - 1] : null;
    const next = i < messages.length - 1 ? messages[i + 1] : null;
    const continuesPrev =
      Boolean(prev) &&
      dayKey(prev!.createdAt) === key &&
      sameCluster(prev!, message);
    const continuesNext =
      Boolean(next) &&
      dayKey(next!.createdAt) === key &&
      sameCluster(message, next!);

    items.push({
      type: "message",
      key: message.id,
      message,
      isClusterStart: !continuesPrev,
      isClusterEnd: !continuesNext,
    });
  }

  return items;
}

export function formatDayLabel(date: Date, locale: string): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMsg = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfMsg.getTime()) / 86_400_000
  );

  if (diffDays === 0) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      0,
      "day"
    );
  }
  if (diffDays === 1) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      -1,
      "day"
    );
  }

  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(date);
}
