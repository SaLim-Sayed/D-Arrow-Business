import type { ChatMessage } from "../types/chat.types";

export type MessageListItem =
  | { type: "day"; key: string; date: Date }
  | { type: "message"; key: string; message: ChatMessage };

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Inserts day separators between messages ordered oldest → newest. */
export function groupMessagesByDay(messages: ChatMessage[]): MessageListItem[] {
  const items: MessageListItem[] = [];
  let lastDay = "";

  for (const message of messages) {
    const key = dayKey(message.createdAt);
    if (key !== lastDay) {
      items.push({
        type: "day",
        key: `day-${key}`,
        date: new Date(message.createdAt),
      });
      lastDay = key;
    }
    items.push({ type: "message", key: message.id, message });
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
    year:
      date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(date);
}
