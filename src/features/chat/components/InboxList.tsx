import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import { MessageSquarePlus, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { useCompany } from "@/features/companies/context/company-context";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { ConversationsService } from "../api/conversations.service";
import { usePresenceMap } from "../hooks/use-presence";
import { PresenceDot } from "./PresenceDot";
import type { Conversation } from "../types/chat.types";
import type { User } from "@/features/auth/types/auth.types";
import { cn } from "@/lib/utils";

function isUnread(
  conversation: Conversation,
  userId: string | undefined,
  lastReadAt: string | undefined
): boolean {
  if (!userId || !conversation.lastMessageAt) return false;
  if (!lastReadAt) return true;
  return (
    new Date(conversation.lastMessageAt).getTime() >
    new Date(lastReadAt).getTime()
  );
}

interface InboxListProps {
  conversations: Conversation[];
  reads: Record<string, string>;
  isLoading: boolean;
  activeId?: string;
  usersById: Record<string, User>;
}

export function InboxList({
  conversations,
  reads,
  isLoading,
  activeId,
  usersById,
}: InboxListProps) {
  const { t, i18n } = useTranslation("chat");
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const { companyId } = useCompany();
  const presence = usePresenceMap();
  const { data: users = [] } = useAllUsers();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [starting, setStarting] = useState(false);

  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => u.id !== userId)
      .filter(
        (u) =>
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
  }, [users, userId, query]);

  const otherMember = (conversation: Conversation) => {
    const otherId = conversation.memberIds.find((id) => id !== userId);
    return otherId ? usersById[otherId] : undefined;
  };

  const startDm = async (other: User) => {
    if (!companyId || !userId) return;
    setStarting(true);
    try {
      const conversation = await ConversationsService.findOrCreateDm(
        companyId,
        userId,
        other.id
      );
      setOpen(false);
      setQuery("");
      navigate(`/chat/${conversation.id}`);
    } catch (error) {
      console.error(error);
      toast.error(t("errors.startFailed"));
    } finally {
      setStarting(false);
    }
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return "";
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-e border-default-100 bg-content1/40">
      <div className="flex items-center justify-between gap-2 border-b border-default-100 px-4 py-3">
        <h2 className="text-base font-bold tracking-tight">{t("inbox.title")}</h2>
        <Button
          size="sm"
          color="primary"
          variant="flat"
          isIconOnly
          aria-label={t("inbox.newMessage")}
          onPress={() => setOpen(true)}
        >
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="sm" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-semibold text-default-700">
              {t("inbox.empty")}
            </p>
            <p className="mt-1 text-xs text-default-400">{t("inbox.emptyHint")}</p>
            <Button
              className="mt-4"
              size="sm"
              color="primary"
              onPress={() => setOpen(true)}
            >
              {t("inbox.newMessage")}
            </Button>
          </div>
        ) : (
          <ul className="py-1">
            {conversations.map((conversation) => {
              const other = otherMember(conversation);
              const unread = isUnread(
                conversation,
                userId,
                reads[conversation.id]
              );
              const status = other
                ? presence[other.id]?.status ?? "offline"
                : "offline";

              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/chat/${conversation.id}`)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-start transition-colors",
                      activeId === conversation.id
                        ? "bg-primary/10"
                        : "hover:bg-default-100"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        src={other?.avatar}
                        name={other?.name ?? "?"}
                        size="sm"
                        className="h-10 w-10"
                      />
                      <PresenceDot
                        status={status}
                        className="absolute bottom-0 end-0"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm",
                            unread ? "font-bold" : "font-semibold"
                          )}
                        >
                          {other?.name ?? t("inbox.you")}
                        </span>
                        <span className="shrink-0 text-[10px] text-default-400">
                          {formatTime(
                            conversation.lastMessageAt ?? conversation.createdAt
                          )}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "truncate text-xs",
                          unread
                            ? "font-medium text-default-700"
                            : "text-default-400"
                        )}
                      >
                        {conversation.lastMessagePreview || "—"}
                      </p>
                    </div>
                    {unread && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal isOpen={open} onOpenChange={setOpen} placement="center">
        <ModalContent>
          <ModalHeader>{t("inbox.startConversation")}</ModalHeader>
          <ModalBody className="pb-6">
            <Input
              value={query}
              onValueChange={setQuery}
              placeholder={t("inbox.searchPeople")}
              startContent={<Search className="h-4 w-4 text-default-400" />}
              variant="bordered"
              size="sm"
            />
            <div className="mt-2 max-h-72 overflow-y-auto">
              {people.length === 0 ? (
                <p className="py-6 text-center text-sm text-default-400">
                  {t("inbox.noPeople")}
                </p>
              ) : (
                <ul className="space-y-1">
                  {people.map((person) => (
                    <li key={person.id}>
                      <button
                        type="button"
                        disabled={starting}
                        onClick={() => void startDm(person)}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start hover:bg-default-100 disabled:opacity-50"
                      >
                        <Avatar
                          src={person.avatar}
                          name={person.name}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {person.name}
                          </p>
                          <p className="truncate text-xs text-default-400">
                            {person.email}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
