import { useState } from "react";
import { Badge, Button } from "@heroui/react";
import { MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCanAccessPortal } from "@/features/portals/hooks/use-portals";
import { useUnreadChatCount } from "@/features/chat/hooks/use-unread-chat-count";
import { ChatPopup } from "@/features/chat/components/ChatPopup";
import { cn } from "@/lib/utils";

export function ChatNavButton() {
  const { t } = useTranslation();
  const canAccess = useCanAccessPortal("chat");
  const unread = useUnreadChatCount(canAccess);
  const [open, setOpen] = useState(false);

  if (!canAccess) return null;

  const label = t("portals.chat.short");
  const badge = unread > 9 ? "9+" : unread;

  return (
    <>
      <Button
        isIconOnly
        variant="light"
        className="relative overflow-visible"
        aria-label={unread > 0 ? `${label} (${unread})` : label}
        aria-expanded={open}
        onPress={() => setOpen(true)}
      >
        <Badge
          color="danger"
          content={badge}
          isInvisible={unread === 0}
          shape="circle"
        >
          <MessageSquare
            className={cn(
              "h-5 w-5",
              open ? "text-primary" : "text-default-600"
            )}
          />
        </Badge>
      </Button>
      <ChatPopup isOpen={open} onOpenChange={setOpen} />
    </>
  );
}
