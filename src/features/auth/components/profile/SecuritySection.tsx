import { useState } from "react";
import { Card, CardBody, Button, Input } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";

interface SecuritySectionProps {
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  isChangingPassword: boolean;
  onChangePassword: () => void;
  tp: (key: string) => string;
}

export function SecuritySection({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isChangingPassword,
  onChangePassword,
  tp
}: SecuritySectionProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Card className="rounded-3xl shadow-premium border-default-100/50 bg-background/60 backdrop-blur-xl overflow-hidden">
      <div className="bg-primary/5 p-6 border-b border-default-100/50 flex justify-between items-center">
        <h2 className="text-xl font-black tracking-tight">{tp("security")}</h2>
        <Button
          color="primary"
          variant="flat"
          onPress={onChangePassword}
          isLoading={isChangingPassword}
          isDisabled={!currentPassword || !newPassword || newPassword !== confirmPassword || isChangingPassword}
          className="font-bold rounded-2xl"
        >
          Update Password
        </Button>
      </div>
      <CardBody className="p-8 space-y-6">
        <div className="grid grid-cols-1 gap-6 max-w-lg">
          <Input
            label={tp("currentPassword")}
            type={showCurrentPassword ? "text" : "password"}
            variant="bordered"
            value={currentPassword}
            onValueChange={setCurrentPassword}
            className="font-bold"
            endContent={
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <Input
            label={tp("newPassword")}
            type={showNewPassword ? "text" : "password"}
            variant="bordered"
            value={newPassword}
            onValueChange={setNewPassword}
            className="font-bold"
            endContent={
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}>
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <Input
            label={tp("confirmPassword")}
            type={showConfirmPassword ? "text" : "password"}
            variant="bordered"
            value={confirmPassword}
            onValueChange={setConfirmPassword}
            className="font-bold"
            errorMessage={confirmPassword && newPassword !== confirmPassword ? tp("passwordMismatch") : undefined}
            endContent={
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
        </div>
      </CardBody>
    </Card>
  );
}
