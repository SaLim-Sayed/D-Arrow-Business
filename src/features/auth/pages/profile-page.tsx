import { useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/auth-context";
import { ProfileService } from "@/features/auth/api/profile.service";
import { PageHeader } from "@/components/shared/page-header";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Divider,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { Camera, Check, Loader2, Mail, Shield, User } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@/features/auth/types/auth.types";
import { doc, updateDoc } from "firebase/firestore/lite";
import { auth, db } from "@/lib/firebase";

const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin",       label: "Admin" },
  { value: "manager",     label: "Manager" },
  { value: "employee",    label: "Employee" },
  { value: "viewer",      label: "Viewer" },
];

export function ProfilePage() {
  const { t } = useTranslation();
  const { t: tp } = useTranslation("profile");
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [nameAr, setNameAr] = useState(user?.nameAr ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "employee");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error(tp("avatarTooLarge"));
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    },
    [tp],
  );

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(tp("nameRequired"));
      return;
    }
    setIsSaving(true);
    try {
      // 1. Update name + avatar via ProfileService
      const updated = await ProfileService.updateProfile({
        name: name.trim(),
        nameAr: nameAr.trim(),
        avatarFile,
      });

      // 2. Persist role change directly to Firestore
      const firebaseUser = auth.currentUser;
      if (firebaseUser && role !== user?.role) {
        await updateDoc(doc(db, "users", firebaseUser.uid), {
          role,
          updatedAt: new Date().toISOString(),
        });
      }

      // 3. Merge into the auth context / store
      updateUser({
        name: updated.name,
        nameAr: updated.nameAr,
        role,
        ...(avatarFile ? { avatar: updated.avatar } : {}),
      });

      setAvatarFile(null);
      toast.success(tp("saveSuccess"));
    } catch (err) {
      console.error(err);
      toast.error(tp("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const displayAvatar = avatarPreview ?? user?.avatar;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={tp("title")} description={tp("description")} />

      <Card className="rounded-2xl shadow-md border border-default-100">
        <CardBody className="p-8 flex flex-col gap-8">
          {/* Avatar section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar
                src={displayAvatar}
                fallback={initials}
                showFallback
                className="h-28 w-28 text-2xl ring-4 ring-primary/20"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <Button
              size="sm"
              variant="flat"
              color="primary"
              onPress={() => fileInputRef.current?.click()}
              startContent={<Camera className="h-3.5 w-3.5" />}
              className="font-medium"
            >
              {tp("changePhoto")}
            </Button>

            {avatarFile && (
              <p className="text-xs text-default-400">
                {avatarFile.name} ({(avatarFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          <Divider />

          {/* Form fields */}
          <div className="flex flex-col gap-5">
            {/* Email (read-only) */}
            <Input
              isReadOnly
              label={tp("email")}
              value={user?.email ?? ""}
              startContent={<Mail className="h-4 w-4 text-default-400 shrink-0" />}
              classNames={{ input: "text-default-500", inputWrapper: "bg-default-50" }}
            />

            {/* Name */}
            <Input
              label={tp("name")}
              placeholder={tp("namePlaceholder")}
              value={name}
              onValueChange={setName}
              startContent={<User className="h-4 w-4 text-default-400 shrink-0" />}
              isRequired
              errorMessage={!name.trim() ? tp("nameRequired") : undefined}
            />

            {/* Arabic name */}
            <Input
              label={tp("nameAr")}
              placeholder={tp("nameArPlaceholder")}
              value={nameAr}
              onValueChange={setNameAr}
              dir="rtl"
              classNames={{ input: "text-right font-arabic" }}
            />

            {/* Role — editable select */}
            <Select
              label={tp("role")}
              selectedKeys={new Set([role])}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as UserRole;
                if (selected) setRole(selected);
              }}
              startContent={<Shield className="h-4 w-4 text-default-400 shrink-0" />}
            >
              {USER_ROLES.map((r) => (
                <SelectItem key={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <Divider />

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={isSaving}
              isDisabled={isSaving}
              startContent={
                isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )
              }
              className="px-8 font-bold shadow-lg shadow-primary/20"
            >
              {isSaving ? t("actions.loading") : t("actions.save")}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
