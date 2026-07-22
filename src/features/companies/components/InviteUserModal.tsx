import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import { Copy, MailPlus } from "lucide-react";
import { toast } from "sonner";
import { selectFieldProps } from "@/components/shared/select-field";
import {
  getAssignableRoles,
} from "@/lib/permissions/role-assignment";
import { useAppPermissions } from "../hooks/use-app-permissions";
import { useCreateInviteMutation } from "../hooks/use-invites";
import type { UserRole } from "@/features/auth/types/auth.types";

interface InviteUserModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserModal({ isOpen, onOpenChange }: InviteUserModalProps) {
  const { t } = useTranslation("settings");
  const { role: actorRole } = useAppPermissions();
  const createInvite = useCreateInviteMutation();
  const roles = useMemo(() => getAssignableRoles(actorRole), [actorRole]);

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>(
    roles.includes("employee") ? "employee" : roles[0] || "employee"
  );
  const [lastLink, setLastLink] = useState<string | null>(null);

  const reset = () => {
    setEmail("");
    setInviteRole(roles.includes("employee") ? "employee" : roles[0] || "employee");
    setLastLink(null);
  };

  const submit = async () => {
    try {
      const result = await createInvite.mutateAsync({
        email,
        role: inviteRole,
      });
      setLastLink(result.inviteUrl);
      try {
        await navigator.clipboard.writeText(result.inviteUrl);
        toast.message(t("team.invite.linkCopied"));
      } catch {
        // ignore clipboard failures
      }
    } catch {
      // toast handled by mutation
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}
      placement="center"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span>{t("team.invite.title")}</span>
              <span className="text-xs font-normal text-default-500">
                {t("team.invite.subtitle")}
              </span>
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                type="email"
                label={t("team.invite.email")}
                labelPlacement="outside"
                placeholder={t("team.invite.emailPlaceholder")}
                value={email}
                onValueChange={setEmail}
                variant="bordered"
                isRequired
              />
              <Select
                {...selectFieldProps()}
                label={t("team.invite.role")}
                labelPlacement="outside"
                selectedKeys={new Set([inviteRole])}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as UserRole;
                  if (selected) setInviteRole(selected);
                }}
                variant="bordered"
              >
                {roles.map((r) => (
                  <SelectItem key={r} textValue={t(`team.globalRoles.${r}`)}>
                    {t(`team.globalRoles.${r}`)}
                  </SelectItem>
                ))}
              </Select>

              {lastLink && (
                <div className="rounded-xl border border-default-200 bg-default-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-default-600">
                    {t("team.invite.shareLink")}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate text-[11px] text-default-500">
                      {lastLink}
                    </code>
                    <Button
                      size="sm"
                      variant="flat"
                      isIconOnly
                      aria-label={t("team.invite.copyLink")}
                      onPress={async () => {
                        await navigator.clipboard.writeText(lastLink);
                        toast.success(t("team.invite.linkCopied"));
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("team.invite.close")}
              </Button>
              <Button
                color="primary"
                startContent={<MailPlus className="h-4 w-4" />}
                isLoading={createInvite.isPending}
                isDisabled={!email.trim()}
                onPress={() => void submit()}
              >
                {t("team.invite.submit")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
