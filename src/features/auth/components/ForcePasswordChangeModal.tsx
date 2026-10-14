import { useState } from "react";
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth.store";

const MIN_LENGTH = 8;

/**
 * Shown to members whose account an admin created with a password. They can't
 * dismiss it until they pick their own password, so the admin no longer knows it.
 * Mounted once in AppLayout.
 */
export function ForcePasswordChangeModal() {
  const { t } = useTranslation("auth");
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSave = password.length >= MIN_LENGTH && confirm === password;

  const save = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !user) return;
    setSaving(true);
    try {
      await updatePassword(firebaseUser, password);
      await updateDoc(doc(db, "users", firebaseUser.uid), {
        mustChangePassword: false,
        updatedAt: new Date().toISOString(),
      });
      updateUser({ mustChangePassword: false });
      setPassword("");
      setConfirm("");
      toast.success(t("mustChangePassword.saved"));
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/requires-recent-login") {
        setNeedsReauth(true);
      } else {
        toast.error(t("mustChangePassword.error"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={!!user?.mustChangePassword}
      isDismissable={false}
      isKeyboardDismissDisabled
      hideCloseButton
      size="sm"
      placement="center"
    >
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">
            <span className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              {t("mustChangePassword.title")}
            </span>
            <span className="text-xs font-normal text-default-500">
              {needsReauth ? t("mustChangePassword.reauth") : t("mustChangePassword.subtitle")}
            </span>
          </ModalHeader>
          <ModalBody className="gap-4">
            <Input
              type="password"
              label={t("mustChangePassword.newPassword")}
              labelPlacement="outside"
              value={password}
              onValueChange={setPassword}
              variant="bordered"
              autoComplete="new-password"
              isInvalid={tooShort}
              errorMessage={tooShort ? t("mustChangePassword.tooShort") : undefined}
            />
            <Input
              type="password"
              label={t("mustChangePassword.confirmPassword")}
              labelPlacement="outside"
              value={confirm}
              onValueChange={setConfirm}
              variant="bordered"
              autoComplete="new-password"
              isInvalid={mismatch}
              errorMessage={mismatch ? t("mustChangePassword.mismatch") : undefined}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => void logout()}>
              {t("mustChangePassword.signOut")}
            </Button>
            <Button
              color="primary"
              isLoading={saving}
              isDisabled={!canSave || needsReauth}
              onPress={() => void save()}
            >
              {t("mustChangePassword.submit")}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
