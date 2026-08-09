import { cn } from "@/lib/utils";
import type { PresenceStatus } from "../types/chat.types";

const STATUS_COLOR: Record<PresenceStatus, string> = {
  online: "bg-success",
  away: "bg-warning",
  busy: "bg-danger",
  offline: "bg-default-300",
};

export function PresenceDot({
  status = "offline",
  className,
}: {
  status?: PresenceStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full ring-2 ring-content1",
        STATUS_COLOR[status],
        status === "online" && "shadow-[0_0_0_2px_hsl(var(--heroui-success)/0.25)]",
        className
      )}
      aria-hidden
    />
  );
}
