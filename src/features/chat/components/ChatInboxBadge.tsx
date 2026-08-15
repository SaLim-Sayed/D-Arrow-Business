import { cn } from "@/lib/utils";
import { useUnreadChatCount } from "../hooks/use-unread-chat-count";

interface ChatInboxBadgeProps {
  collapsed?: boolean;
  className?: string;
}

/** Unread conversation count for chat nav items. Mount only on chat inbox links. */
export function ChatInboxBadge({ collapsed, className }: ChatInboxBadgeProps) {
  const count = useUnreadChatCount(true);
  if (count === 0) return null;

  if (collapsed) {
    return (
      <span
        className={cn(
          "absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-sidebar",
          className
        )}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={cn(
        "ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white",
        className
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
