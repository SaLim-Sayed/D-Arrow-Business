import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
  Textarea,
} from "@heroui/react";
import { Hash, Lock, Megaphone, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { cn } from "@/lib/utils";
import { useChannelActions } from "../hooks/use-channels";
import { slugifyChannelName, type ChannelVisibility } from "../types/chat.types";
import { ChannelMemberPicker } from "./ChannelMemberPicker";

interface CreateChannelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChannelDialog({
  isOpen,
  onOpenChange,
}: CreateChannelDialogProps) {
  const { t } = useTranslation("chat");
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: users = [] } = useAllUsers();
  const { createChannel } = useChannelActions();

  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [visibility, setVisibility] = useState<ChannelVisibility>("public");
  const [readOnly, setReadOnly] = useState(false);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const slug = slugifyChannelName(name);
  const inviteCount = memberIds.length;

  const previewIcon = useMemo(() => {
    if (readOnly) return Megaphone;
    if (visibility === "private") return Lock;
    return Hash;
  }, [readOnly, visibility]);
  const PreviewIcon = previewIcon;

  const reset = () => {
    setName("");
    setTopic("");
    setVisibility("public");
    setReadOnly(false);
    setMemberIds([]);
  };

  const submit = async () => {
    if (!slug) {
      toast.error(t("errors.channelNameRequired"));
      return;
    }

    setSaving(true);
    try {
      const channelId = await createChannel({
        name,
        topic,
        visibility,
        readOnly,
        memberIds,
      });
      reset();
      onOpenChange(false);
      navigate(`/chat/${channelId}`);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error && /already exists/i.test(error.message)
          ? t("errors.duplicateChannel")
          : t("errors.createChannelFailed");
      toast.error(message);
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
        header: "border-b border-default-100/80 pb-3",
        footer: "border-t border-default-100/80",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors">
              <PreviewIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-base font-bold">{t("channels.createTitle")}</p>
              <p className="text-xs font-normal text-default-400">
                {name.trim() || t("channels.namePlaceholder")}
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="gap-5 py-5">
          <Input
            autoFocus
            value={name}
            onValueChange={setName}
            label={t("channels.name")}
            placeholder={t("channels.namePlaceholder")}
            variant="bordered"
            radius="lg"
            size="sm"
            startContent={<span className="text-default-400">#</span>}
            description={slug ? `#${slug}` : undefined}
            classNames={{
              inputWrapper: "border-default-200",
            }}
          />

          <Textarea
            value={topic}
            onValueChange={setTopic}
            label={t("channels.topicOptional")}
            placeholder={t("channels.topicPlaceholder")}
            variant="bordered"
            radius="lg"
            size="sm"
            minRows={2}
            classNames={{
              inputWrapper: "border-default-200",
            }}
          />

          <div>
            <p className="mb-2 text-sm font-medium">{t("channels.visibility")}</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    key: "public" as const,
                    icon: Hash,
                    title: t("channels.public"),
                    hint: t("channels.publicHint"),
                  },
                  {
                    key: "private" as const,
                    icon: Lock,
                    title: t("channels.private"),
                    hint: t("channels.privateHint"),
                  },
                ] as const
              ).map((option) => {
                const active = visibility === option.key;
                const Icon = option.icon;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setVisibility(option.key)}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-start transition-all",
                      active
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-default-200 hover:border-default-300 hover:bg-default-50"
                    )}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5",
                          active ? "text-primary" : "text-default-400"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          active ? "text-primary" : "text-foreground"
                        )}
                      >
                        {option.title}
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug text-default-400">
                      {option.hint}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={cn(
              "flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 transition-colors",
              readOnly
                ? "border-warning/30 bg-warning/5"
                : "border-default-200 bg-default-50/40"
            )}
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                  readOnly
                    ? "bg-warning/15 text-warning"
                    : "bg-default-100 text-default-500"
                )}
              >
                <Megaphone className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t("channels.readOnly")}</p>
                <p className="text-[11px] text-default-400">
                  {t("channels.readOnlyHint")}
                </p>
              </div>
            </div>
            <Switch size="sm" isSelected={readOnly} onValueChange={setReadOnly} />
          </div>

          <div className="rounded-2xl border border-default-100/80 bg-default-50/30 p-3">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-default-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t("channels.addMembers")}</p>
                <p className="text-[11px] text-default-400">
                  {visibility === "private"
                    ? t("channels.addMembersPrivateHint")
                    : t("channels.addMembersHint")}
                </p>
              </div>
              {inviteCount > 0 && (
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  +{inviteCount}
                </span>
              )}
            </div>
            <ChannelMemberPicker
              users={users}
              selectedIds={memberIds}
              onChange={setMemberIds}
              excludeUserId={userId}
            />
          </div>
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
            onPress={() => void submit()}
            isLoading={saving}
            isDisabled={!slug}
          >
            {t("channels.create")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
