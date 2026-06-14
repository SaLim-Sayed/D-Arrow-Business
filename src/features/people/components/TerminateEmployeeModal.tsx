import { useState } from "react";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Select, 
  SelectItem,
  Textarea,
  Avatar,
  Chip
} from "@heroui/react";
import { AlertTriangle, UserMinus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Employee } from "../types/people.types";

export type TerminateAction = "resigned" | "terminated";

interface TerminateEmployeeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onConfirm: (data: { type: TerminateAction; reason: string }) => Promise<void>;
}

export function TerminateEmployeeModal({ isOpen, onOpenChange, employee, onConfirm }: TerminateEmployeeModalProps) {
  const { t } = useTranslation("people");
  const [actionType, setActionType] = useState<TerminateAction>("terminated");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm({ type: actionType, reason });
      onOpenChange(false);
      setReason("");
      setActionType("terminated");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!employee) return null;

  const initials = `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase() || "E";

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 p-0 overflow-hidden rounded-t-medium">
              <div className="bg-gradient-to-r from-danger/20 to-danger/5 p-6 flex items-start gap-4 border-b border-danger/10">
                <div className="p-3 bg-danger/10 text-danger rounded-xl">
                  <UserMinus size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight">{t("terminate_modal.title")}</h2>
                  <p className="text-xs font-medium text-default-500 mt-1">{t("terminate_modal.subtitle")}</p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="py-6">
              <div className="flex items-center gap-4 p-4 bg-default-50 rounded-xl border border-default-100">
                <Avatar
                  src={employee.avatarUrl}
                  fallback={initials}
                  className="w-12 h-12"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-sm">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-xs text-default-500">{employee.jobTitle}</p>
                </div>
                <Chip size="sm" variant="flat" color="danger" className="font-bold">
                  {t(`statuses.${employee.status}`, employee.status)}
                </Chip>
              </div>

              <div className="space-y-4 mt-2">
                <Select
                  label={t("terminate_modal.action_type")}
                  placeholder={t("terminate_modal.action_type")}
                  selectedKeys={[actionType]}
                  onSelectionChange={(keys) => setActionType(Array.from(keys)[0] as TerminateAction)}
                  isRequired
                >
                  <SelectItem key="resigned" description={t("extra.resignation_desc")}>
                    {t("terminate_modal.resign")}
                  </SelectItem>
                  <SelectItem key="terminated" description={t("extra.termination_desc")} className="text-danger">
                    {t("terminate_modal.terminate")}
                  </SelectItem>
                </Select>

                <Textarea
                  label={t("terminate_modal.reason")}
                  placeholder={t("terminate_modal.reason")}
                  value={reason}
                  onValueChange={setReason}
                  isRequired
                  minRows={3}
                  errorMessage={!reason.trim() ? t("errors.somethingWentWrong", "Required") : undefined}
                />

                <div className="flex gap-3 p-4 bg-danger/5 rounded-xl border border-danger/10 text-danger-600">
                  <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                  <div className="text-xs font-medium">
                    <strong className="font-bold block mb-1">{t("extra.warning")}</strong>
                    {t("extra.revoke_warning")}
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-default-100">
              <Button variant="light" onPress={onClose} isDisabled={isSubmitting}>
                {t("terminate_modal.cancel")}
              </Button>
              <Button 
                color="danger" 
                variant="shadow" 
                onPress={handleSubmit} 
                isLoading={isSubmitting}
                isDisabled={!reason.trim()}
                className="font-bold shadow-lg shadow-danger/25"
              >
                {actionType === "resigned" ? t("extra.confirm_resignation") : t("extra.confirm_termination")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
