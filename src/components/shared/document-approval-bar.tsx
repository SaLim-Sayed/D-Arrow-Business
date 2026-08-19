import { Button, Chip } from "@heroui/react";
import { Check, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  canApproveDocuments,
  isDocumentApproved,
  type DocumentApprovalFields,
} from "@/lib/permissions/document-approval";
import { useAuthStore } from "@/stores/auth.store";

interface DocumentApprovalBarProps {
  document: DocumentApprovalFields | null | undefined;
  /** True once the document has been saved and can be approved. */
  isSaved: boolean;
  isApproving?: boolean;
  onApprove?: () => void;
}

export function DocumentApprovalBar({
  document,
  isSaved,
  isApproving,
  onApprove,
}: DocumentApprovalBarProps) {
  const { t } = useTranslation("common");
  const role = useAuthStore((s) => s.user?.role);
  const canApprove = canApproveDocuments(role);
  const approved = isDocumentApproved(document);

  if (!isSaved) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-default-200 bg-default-50/80 px-3 py-2">
      <Chip
        size="sm"
        variant="flat"
        color={approved ? "success" : "warning"}
        startContent={
          approved ? (
            <Check className="h-3 w-3" />
          ) : (
            <Lock className="h-3 w-3" />
          )
        }
      >
        {approved
          ? t("documentApproval.approved")
          : t("documentApproval.pending")}
      </Chip>
      <p className="min-w-0 flex-1 text-xs text-default-500">
        {approved
          ? t("documentApproval.approvedHint")
          : canApprove
            ? t("documentApproval.approverHint")
            : t("documentApproval.lockedHint")}
      </p>
      {!approved && canApprove && onApprove && (
        <Button
          size="sm"
          color="success"
          className="font-semibold text-white"
          isLoading={isApproving}
          startContent={<Check className="h-4 w-4" />}
          onPress={onApprove}
        >
          {t("documentApproval.approve")}
        </Button>
      )}
    </div>
  );
}
