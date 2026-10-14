import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Tab,
  Tabs,
} from "@heroui/react";
import { Copy, KeyRound, MailPlus, UserPlus, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { selectFieldProps } from "@/components/shared/select-field";
import {
  getAssignableRoles,
} from "@/lib/permissions/role-assignment";
import { useAppPermissions } from "../hooks/use-app-permissions";
import {
  useCreateInviteMutation,
  useCreateMemberWithPasswordMutation,
} from "../hooks/use-invites";
import {
  generateMemberPassword,
  MIN_MEMBER_PASSWORD_LENGTH,
} from "../api/create-member.service";
import type { UserRole } from "@/features/auth/types/auth.types";

interface InviteUserModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = "link" | "password";

export function InviteUserModal({ isOpen, onOpenChange }: InviteUserModalProps) {
  const { t } = useTranslation("settings");
  const { role: actorRole } = useAppPermissions();
  const createInvite = useCreateInviteMutation();
  const createMember = useCreateMemberWithPasswordMutation();
  const roles = useMemo(() => getAssignableRoles(actorRole), [actorRole]);
  const defaultRole: UserRole = roles.includes("employee") ? "employee" : roles[0] || "employee";

  const [mode, setMode] = useState<Mode>("link");
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>(defaultRole);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  const reset = () => {
    setMode("link");
    setEmail("");
    setInviteRole(defaultRole);
    setLastLink(null);
    setName("");
    setPassword("");
    setMustChangePassword(true);
    setCreatedCredentials(null);
  };

  const submitLink = async () => {
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

  const submitPassword = async () => {
    try {
      await createMember.mutateAsync({
        name,
        email,
        password,
        role: inviteRole,
        mustChangePassword,
      });
      setCreatedCredentials({ email: email.trim().toLowerCase(), password });
      setName("");
      setEmail("");
      setPassword("");
    } catch {
      // toast handled by mutation
    }
  };

  const copyCredentials = async () => {
    if (!createdCredentials) return;
    try {
      await navigator.clipboard.writeText(
        `${t("team.invite.email")}: ${createdCredentials.email}\n${t("team.invite.password")}: ${createdCredentials.password}\n${window.location.origin}/login`
      );
      toast.success(t("team.invite.credentialsCopied"));
    } catch {
      // ignore clipboard failures
    }
  };

  const passwordTooShort = password.length > 0 && password.length < MIN_MEMBER_PASSWORD_LENGTH;
  const canSubmitPassword =
    !!name.trim() && !!email.trim() && password.length >= MIN_MEMBER_PASSWORD_LENGTH;

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
                {mode === "link" ? t("team.invite.subtitle") : t("team.invite.passwordSubtitle")}
              </span>
            </ModalHeader>
            <ModalBody className="gap-4">
              <Tabs
                aria-label={t("team.invite.title")}
                selectedKey={mode}
                onSelectionChange={(key) => setMode(key as Mode)}
                fullWidth
                size="sm"
              >
                <Tab
                  key="link"
                  title={
                    <span className="flex items-center gap-1.5">
                      <MailPlus className="h-3.5 w-3.5" />
                      {t("team.invite.modeLink")}
                    </span>
                  }
                />
                <Tab
                  key="password"
                  title={
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5" />
                      {t("team.invite.modePassword")}
                    </span>
                  }
                />
              </Tabs>

              {mode === "password" && (
                <Input
                  label={t("team.invite.name")}
                  labelPlacement="outside"
                  placeholder={t("team.invite.namePlaceholder")}
                  value={name}
                  onValueChange={setName}
                  variant="bordered"
                  isRequired
                />
              )}

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

              {mode === "password" && (
                <Input
                  label={t("team.invite.password")}
                  labelPlacement="outside"
                  value={password}
                  onValueChange={setPassword}
                  variant="bordered"
                  isRequired
                  autoComplete="new-password"
                  description={t("team.invite.passwordHint")}
                  isInvalid={passwordTooShort}
                  errorMessage={passwordTooShort ? t("team.invite.passwordHint") : undefined}
                  endContent={
                    <Button
                      size="sm"
                      variant="light"
                      className="h-7 min-w-0 px-2"
                      startContent={<Wand2 className="h-3.5 w-3.5" />}
                      onPress={() => setPassword(generateMemberPassword())}
                    >
                      {t("team.invite.generatePassword")}
                    </Button>
                  }
                />
              )}

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

              {mode === "password" && (
                <Checkbox isSelected={mustChangePassword} onValueChange={setMustChangePassword} size="sm">
                  {t("team.invite.mustChangePassword")}
                </Checkbox>
              )}

              {mode === "link" && lastLink && (
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

              {mode === "password" && createdCredentials && (
                <div className="rounded-xl border border-success-200 bg-success-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-success-700">
                    {t("team.invite.credentialsTitle")}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 whitespace-pre-wrap break-all text-[11px] text-default-600">
                      {createdCredentials.email}
                      {"\n"}
                      {createdCredentials.password}
                    </code>
                    <Button
                      size="sm"
                      variant="flat"
                      isIconOnly
                      aria-label={t("team.invite.copyCredentials")}
                      onPress={() => void copyCredentials()}
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
              {mode === "link" ? (
                <Button
                  color="primary"
                  startContent={<MailPlus className="h-4 w-4" />}
                  isLoading={createInvite.isPending}
                  isDisabled={!email.trim()}
                  onPress={() => void submitLink()}
                >
                  {t("team.invite.submit")}
                </Button>
              ) : (
                <Button
                  color="primary"
                  startContent={<UserPlus className="h-4 w-4" />}
                  isLoading={createMember.isPending}
                  isDisabled={!canSubmitPassword}
                  onPress={() => void submitPassword()}
                >
                  {t("team.invite.createSubmit")}
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
