import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { Hash, Lock, Megaphone, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useChannelActions } from "../hooks/use-channels";
import { usePresenceMap } from "../hooks/use-presence";
import type { Conversation } from "../types/chat.types";
import { PresenceDot } from "./PresenceDot";
import { ChannelMemberPicker } from "./ChannelMemberPicker";

interface ChannelMembersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Conversation;
}

export function ChannelMembersDialog({
  isOpen,
  onOpenChange,
  channel,
}: ChannelMembersDialogProps) {
  const { t } = useTranslation("chat");
  const userId = useAuthStore((s) => s.user?.id);
  const { data: users = [] } = useAllUsers();
  const presence = usePresenceMap();
  const { addMembers } = useChannelActions();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) setSelectedIds([]);
  }, [isOpen, channel.id]);

  const members = useMemo(
    () =>
      channel.memberIds
        .map((id) => users.find((user) => user.id === id))
        .filter((user): user is NonNullable<typeof user> => Boolean(user))
        .sort((a, b) => {
          if (a.id === channel.createdBy) return -1;
          if (b.id === channel.createdBy) return 1;
          if (a.id === userId) return -1;
          if (b.id === userId) return 1;
          return a.name.localeCompare(b.name);
        }),
    [channel.memberIds, channel.createdBy, users, userId]
  );

  const ChannelIcon =
    channel.readOnly ? Megaphone : channel.visibility === "private" ? Lock : Hash;

  const submit = async () => {
    if (!selectedIds.length) {
      onOpenChange(false);
      return;
    }
    setSaving(true);
    try {
      await addMembers(channel.id, selectedIds);
      toast.success(
        t("channels.membersAdded", { count: selectedIds.length })
      );
      setSelectedIds([]);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(t("errors.addMembersFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      scrollBehavior="inside"
      size="lg"
      classNames={{
        base: "bg-content1",
        header: "border-b border-default-100/80 pb-3",
        footer: "border-t border-default-100/80",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-default-100 text-default-500">
              <ChannelIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold">{channel.name}</p>
              <p className="text-xs font-normal text-default-400">
                {t("channels.manageMembers")}
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="gap-5 py-5">
          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-default-400" />
                <p className="text-xs font-semibold uppercase tracking-wide text-default-400">
                  {t("channels.currentMembers", {
                    count: channel.memberIds.length,
                  })}
                </p>
              </div>
            </div>

            <ul className="max-h-44 space-y-0.5 overflow-y-auto rounded-2xl border border-default-100/80 bg-default-50/40 p-1.5">
              {members.map((user) => {
                const status = presence[user.id]?.status ?? "offline";
                const isYou = user.id === userId;
                const isCreator = user.id === channel.createdBy;
                return (
                  <li
                    key={user.id}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-content1"
                  >
                    <div className="relative shrink-0">
                      <Avatar src={user.avatar} name={user.name} size="sm" />
                      <PresenceDot
                        status={status}
                        className="absolute bottom-0 end-0"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {user.name}
                        {isYou ? (
                          <span className="ms-1.5 text-xs font-normal text-default-400">
                            ({t("inbox.you")})
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-[11px] text-default-400">
                        {user.email}
                      </p>
                    </div>
                    {isCreator && (
                      <span className="rounded-md bg-default-100 px-1.5 py-0.5 text-[10px] font-semibold text-default-500">
                        {t("channels.creator")}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <UserPlus className="h-3.5 w-3.5 text-default-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-default-400">
                {t("channels.addMembers")}
              </p>
            </div>
            <ChannelMemberPicker
              users={users}
              existingMemberIds={channel.memberIds}
              selectedIds={selectedIds}
              onChange={setSelectedIds}
              excludeUserId={userId}
            />
          </section>
        </ModalBody>
        <ModalFooter>
          <Button
            size="sm"
            variant="light"
            onPress={() => onOpenChange(false)}
            isDisabled={saving}
          >
            {t("conversation.cancel")}
          </Button>
          <Button
            size="sm"
            color="primary"
            radius="lg"
            startContent={!saving && selectedIds.length > 0 ? <UserPlus className="h-3.5 w-3.5" /> : undefined}
            onPress={() => void submit()}
            isLoading={saving}
            isDisabled={selectedIds.length === 0}
          >
            {selectedIds.length === 0
              ? t("channels.addMembers")
              : t("channels.addSelected", { count: selectedIds.length })}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
