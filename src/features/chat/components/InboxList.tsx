import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import {
  Hash,
  Lock,
  Megaphone,
  MessageSquarePlus,
  Plus,
  Radio,
  Search,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { useCompany } from "@/features/companies/context/company-context";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { ConversationsService } from "../api/conversations.service";
import { usePresenceMap } from "../hooks/use-presence";
import { PresenceDot } from "./PresenceDot";
import { CreateChannelDialog } from "./CreateChannelDialog";
import { BrowseChannelsDialog } from "./BrowseChannelsDialog";
import { isChannel, type Conversation } from "../types/chat.types";
import { isUnreadConversation } from "../utils/unread";
import type { User } from "@/features/auth/types/auth.types";
import { cn } from "@/lib/utils";

interface InboxListProps {
  conversations: Conversation[];
  reads: Record<string, string>;
  isLoading: boolean;
  activeId?: string;
  usersById: Record<string, User>;
  onSelectConversation?: (conversationId: string) => void;
  onClose?: () => void;
}

export function InboxList({
  conversations,
  reads,
  isLoading,
  activeId,
  usersById,
  onSelectConversation,
  onClose,
}: InboxListProps) {
  const { t, i18n } = useTranslation("chat");
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const { companyId } = useCompany();
  const presence = usePresenceMap();
  const { data: users = [] } = useAllUsers();
  const [open, setOpen] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [query, setQuery] = useState("");
  const [inboxFilter, setInboxFilter] = useState("");
  const [starting, setStarting] = useState(false);

  const otherMember = (conversation: Conversation) => {
    const otherId = conversation.memberIds.find((id) => id !== userId);
    return otherId ? usersById[otherId] : undefined;
  };

  const filtered = useMemo(() => {
    const q = inboxFilter.trim().toLowerCase();
    const list = !q
      ? conversations
      : conversations.filter((conversation) => {
          const channel = isChannel(conversation);
          const title = channel
            ? conversation.name ?? ""
            : otherMember(conversation)?.name ?? "";
          const haystack = [
            title,
            conversation.topic ?? "",
            conversation.lastMessagePreview ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        });

    return {
      channels: list.filter(isChannel),
      dms: list.filter((c) => !isChannel(c)),
    };
  }, [conversations, inboxFilter, usersById, userId]);

  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => u.id !== userId)
      .filter(
        (u) =>
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.nameAr ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aOnline = presence[a.id]?.status === "online" ? 0 : 1;
        const bOnline = presence[b.id]?.status === "online" ? 0 : 1;
        if (aOnline !== bOnline) return aOnline - bOnline;
        return a.name.localeCompare(b.name);
      });
  }, [users, userId, query, presence]);

  const openConversation = (conversationId: string) => {
    if (onSelectConversation) onSelectConversation(conversationId);
    else navigate(`/chat/${conversationId}`);
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
      openConversation(conversation.id);
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

  const renderRow = (conversation: Conversation) => {
    const channel = isChannel(conversation);
    const other = channel ? undefined : otherMember(conversation);
    const unread = isUnreadConversation(conversation, userId, reads[conversation.id]);
    const status = other ? presence[other.id]?.status ?? "offline" : "offline";
    const active = activeId === conversation.id;
    const title = channel ? conversation.name : other?.name ?? t("inbox.you");

    return (
      <li key={conversation.id} className="px-2">
        <button
          type="button"
          onClick={() => openConversation(conversation.id)}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start transition-all",
            active
              ? "bg-primary/10 shadow-sm ring-1 ring-primary/20"
              : "hover:bg-default-100/80"
          )}
        >
          <div className="relative shrink-0">
            {channel ? (
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl",
                  conversation.readOnly
                    ? "bg-warning/15 text-warning"
                    : conversation.visibility === "private"
                      ? "bg-secondary/15 text-secondary"
                      : "bg-primary/10 text-primary"
                )}
              >
                {conversation.readOnly ? (
                  <Megaphone className="h-4 w-4" />
                ) : conversation.visibility === "private" ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Hash className="h-4 w-4" />
                )}
              </div>
            ) : (
              <>
                <Avatar
                  src={other?.avatar}
                  name={other?.name ?? "?"}
                  className="h-11 w-11"
                />
                <PresenceDot
                  status={status}
                  className="absolute bottom-0 end-0"
                />
              </>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "truncate text-sm",
                  unread ? "font-bold text-foreground" : "font-semibold text-foreground/90"
                )}
              >
                {title}
              </span>
              <span
                className={cn(
                  "shrink-0 text-[10px] tabular-nums",
                  unread ? "font-semibold text-primary" : "text-default-400"
                )}
              >
                {formatTime(
                  conversation.lastMessageAt ?? conversation.createdAt
                )}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <p
                className={cn(
                  "min-w-0 flex-1 truncate text-xs",
                  unread ? "font-medium text-default-600" : "text-default-400"
                )}
              >
                {conversation.lastMessagePreview || "—"}
              </p>
              {unread && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_0_3px_hsl(var(--heroui-primary)/0.2)]" />
              )}
            </div>
          </div>
        </button>
      </li>
    );
  };

  const sectionHeader = (label: string, count: number) => (
    <div className="flex items-center justify-between px-4 pb-1.5 pt-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-default-400">
        {label}
      </p>
      <span className="rounded-md bg-default-100 px-1.5 py-0.5 text-[10px] font-semibold text-default-500">
        {count}
      </span>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-content1">
      <div className="shrink-0 space-y-3 border-b border-default-100/80 px-3 py-3 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{t("inbox.title")}</h2>
            <p className="text-[11px] text-default-400">
              {conversations.length
                ? t("inbox.conversationCount", { count: conversations.length })
                : t("inbox.emptyHint")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {onClose && (
              <Button
                size="sm"
                variant="light"
                radius="full"
                isIconOnly
                aria-label={t("popup.close")}
                onPress={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                size="sm"
                color="primary"
                radius="full"
                isIconOnly
                aria-label={t("inbox.newMessage")}
                className="shadow-sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label={t("inbox.newMessage")}>
              <DropdownItem
                key="dm"
                startContent={<MessageSquarePlus className="h-4 w-4" />}
                onPress={() => setOpen(true)}
              >
                {t("inbox.newMessage")}
              </DropdownItem>
              <DropdownItem
                key="channel"
                startContent={<Hash className="h-4 w-4" />}
                onPress={() => setCreatingChannel(true)}
              >
                {t("channels.create")}
              </DropdownItem>
              <DropdownItem
                key="browse"
                startContent={<Radio className="h-4 w-4" />}
                onPress={() => setBrowsing(true)}
              >
                {t("channels.browse")}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          </div>
        </div>

        <Input
          size="sm"
          radius="lg"
          variant="bordered"
          value={inboxFilter}
          onValueChange={setInboxFilter}
          placeholder={t("inbox.searchInbox")}
          startContent={<Search className="h-3.5 w-3.5 text-default-400" />}
          classNames={{
            inputWrapper: "border-default-200 bg-default-50/60 h-9",
          }}
        />
      </div>

      <div className="chat-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="sm" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <MessageSquarePlus className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-default-700">
              {t("inbox.empty")}
            </p>
            <p className="mt-1 max-w-[16rem] text-xs text-default-400">
              {t("inbox.emptyHint")}
            </p>
            <div className="mt-5 flex w-full max-w-[14rem] flex-col gap-2">
              <Button
                size="sm"
                color="primary"
                radius="lg"
                onPress={() => setOpen(true)}
              >
                {t("inbox.newMessage")}
              </Button>
              <Button
                size="sm"
                variant="flat"
                radius="lg"
                onPress={() => setCreatingChannel(true)}
              >
                {t("channels.create")}
              </Button>
            </div>
          </div>
        ) : filtered.channels.length === 0 && filtered.dms.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-default-400">
            {t("inbox.noPeople")}
          </p>
        ) : (
          <>
            {filtered.channels.length > 0 && (
              <>
                {sectionHeader(t("channels.title"), filtered.channels.length)}
                <ul className="space-y-0.5">{filtered.channels.map(renderRow)}</ul>
              </>
            )}
            {filtered.dms.length > 0 && (
              <>
                {sectionHeader(
                  t("channels.directMessages"),
                  filtered.dms.length
                )}
                <ul className="space-y-0.5">{filtered.dms.map(renderRow)}</ul>
              </>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={open}
        onOpenChange={setOpen}
        placement="center"
        size="md"
        classNames={{ header: "border-b border-default-100/80 pb-3" }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <p className="text-base font-bold">{t("inbox.startConversation")}</p>
            <p className="text-xs font-normal text-default-400">
              {t("inbox.searchPeople")}
            </p>
          </ModalHeader>
          <ModalBody className="gap-3 pb-6 pt-4">
            <Input
              value={query}
              onValueChange={setQuery}
              placeholder={t("inbox.searchPeople")}
              startContent={<Search className="h-4 w-4 text-default-400" />}
              variant="bordered"
              radius="lg"
              size="sm"
              classNames={{
                inputWrapper: "border-default-200 bg-default-50/50",
              }}
            />
            <div className="max-h-80 overflow-y-auto rounded-2xl border border-default-100/80">
              {people.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Users className="h-5 w-5 text-default-300" />
                  <p className="text-sm text-default-400">{t("inbox.noPeople")}</p>
                </div>
              ) : (
                <ul>
                  {people.map((person) => {
                    const status = presence[person.id]?.status ?? "offline";
                    return (
                      <li
                        key={person.id}
                        className="border-b border-default-100/70 last:border-b-0"
                      >
                        <button
                          type="button"
                          disabled={starting}
                          onClick={() => void startDm(person)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors hover:bg-default-50 disabled:opacity-50"
                        >
                          <div className="relative shrink-0">
                            <Avatar
                              src={person.avatar}
                              name={person.name}
                              size="sm"
                            />
                            <PresenceDot
                              status={status}
                              className="absolute bottom-0 end-0"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {person.name}
                            </p>
                            <p className="truncate text-[11px] text-default-400">
                              {person.email}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      <CreateChannelDialog
        isOpen={creatingChannel}
        onOpenChange={setCreatingChannel}
        onSelectConversation={onSelectConversation}
      />
      <BrowseChannelsDialog
        isOpen={browsing}
        onOpenChange={setBrowsing}
        onSelectConversation={onSelectConversation}
      />
    </div>
  );
}
