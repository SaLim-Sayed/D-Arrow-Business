import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import { Hash, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { usePublicChannels, useChannelActions } from "../hooks/use-channels";

interface BrowseChannelsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectConversation?: (conversationId: string) => void;
}

export function BrowseChannelsDialog({
  isOpen,
  onOpenChange,
  onSelectConversation,
}: BrowseChannelsDialogProps) {
  const { t } = useTranslation("chat");
  const navigate = useNavigate();
  const { discoverable, isLoading } = usePublicChannels();
  const { joinChannel } = useChannelActions();
  const [query, setQuery] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return discoverable;
    return discoverable.filter(
      (channel) =>
        (channel.name ?? "").toLowerCase().includes(q) ||
        (channel.topic ?? "").toLowerCase().includes(q)
    );
  }, [discoverable, query]);

  const join = async (channelId: string) => {
    setJoiningId(channelId);
    try {
      await joinChannel(channelId);
      onOpenChange(false);
      setQuery("");
      if (onSelectConversation) onSelectConversation(channelId);
      else navigate(`/chat/${channelId}`);
    } catch (error) {
      console.error(error);
      toast.error(t("errors.joinFailed"));
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      size="md"
      classNames={{
        header: "border-b border-default-100/80 pb-3",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <p className="text-base font-bold">{t("channels.browse")}</p>
          <p className="text-xs font-normal text-default-400">
            {t("channels.publicHint")}
          </p>
        </ModalHeader>
        <ModalBody className="gap-3 pb-6 pt-4">
          <Input
            value={query}
            onValueChange={setQuery}
            placeholder={t("channels.searchMembers")}
            startContent={<Search className="h-4 w-4 text-default-400" />}
            variant="bordered"
            radius="lg"
            size="sm"
            classNames={{
              inputWrapper: "border-default-200 bg-default-50/50",
            }}
          />

          <div className="max-h-80 overflow-y-auto rounded-2xl border border-default-100/80">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size="sm" />
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-default-100 text-default-400">
                  <Hash className="h-4 w-4" />
                </div>
                <p className="text-sm text-default-400">{t("channels.noneToJoin")}</p>
              </div>
            ) : (
              <ul>
                {results.map((channel) => (
                  <li
                    key={channel.id}
                    className="flex items-center gap-3 border-b border-default-100/70 px-3 py-3 last:border-b-0 hover:bg-default-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-default-100 text-default-500">
                      <Hash className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {channel.name}
                      </p>
                      <p className="flex items-center gap-1 truncate text-[11px] text-default-400">
                        <Users className="h-3 w-3 shrink-0" />
                        {channel.topic ||
                          t("channels.members", {
                            count: channel.memberIds.length,
                          })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      radius="lg"
                      isLoading={joiningId === channel.id}
                      onPress={() => void join(channel.id)}
                    >
                      {t("channels.join")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
