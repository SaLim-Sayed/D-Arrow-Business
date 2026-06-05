import { useRef, useState } from "react";
import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { Paperclip, Trash2, Download, FileText } from "lucide-react";
import type { CrmAttachment } from "../../types/attachments.types";
import { isAllowedCrmFile } from "../../api/crm-storage.service";

interface CrmAttachmentsSectionProps {
  attachments: CrmAttachment[];
  canManage: boolean;
  isLoading?: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

function isImage(mime: string) {
  return mime.startsWith("image/");
}

export function CrmAttachmentsSection({
  attachments,
  canManage,
  isLoading,
  onUpload,
  onDelete,
}: CrmAttachmentsSectionProps) {
  const { t } = useTranslation("crm");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (!isAllowedCrmFile(file)) {
      alert(t("attachments.unsupported"));
      return;
    }
    setBusy(true);
    try {
      await onUpload(file);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.xls,.xlsx,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
          <Button
            color="primary"
            variant="flat"
            className="rounded-full"
            startContent={<Paperclip className="h-4 w-4" />}
            isLoading={busy || isLoading}
            onPress={() => inputRef.current?.click()}
          >
            {t("attachments.upload")}
          </Button>
        </>
      )}
      {attachments.length === 0 ? (
        <p className="text-default-500 text-sm">{t("leadDetail.attachments.empty")}</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-default-100 bg-default-50/50"
            >
              {isImage(att.mimeType) ? (
                <img
                  src={att.fileUrl}
                  alt={att.fileName}
                  className="h-12 w-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-default-100 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-default-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{att.fileName}</p>
                <a
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                >
                  <Download className="h-3 w-3" />
                  {t("attachments.download")}
                </a>
              </div>
              {canManage && onDelete && (
                <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => onDelete(att.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
