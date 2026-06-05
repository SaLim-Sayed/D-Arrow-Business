import { useState } from "react";
import { Button, Textarea } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/utils";
import type { CrmNote } from "../../types/notes.types";
import { Pencil, Trash2 } from "lucide-react";

interface CrmNotesSectionProps {
  notes: CrmNote[];
  canManage: boolean;
  isLoading?: boolean;
  onAdd: (content: string) => Promise<void>;
  onUpdate?: (id: string, content: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function CrmNotesSection({
  notes,
  canManage,
  isLoading,
  onAdd,
  onUpdate,
  onDelete,
}: CrmNotesSectionProps) {
  const { t } = useTranslation("crm");
  const [text, setText] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await onAdd(text.trim());
      setText("");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!onUpdate || !editText.trim()) return;
    setBusy(true);
    try {
      await onUpdate(id, editText.trim());
      setEditId(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder={t("leadDetail.notes.placeholder")}
            value={text}
            onValueChange={setText}
            minRows={2}
          />
          <Button
            color="primary"
            size="sm"
            className="self-end rounded-full"
            isLoading={busy || isLoading}
            isDisabled={!text.trim()}
            onPress={handleAdd}
          >
            {t("leadDetail.notes.add")}
          </Button>
        </div>
      )}
      {notes.length === 0 ? (
        <p className="text-default-500 text-sm">{t("leadDetail.notes.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="p-4 rounded-xl bg-default-50 border border-default-100">
              {editId === n.id ? (
                <div className="space-y-2">
                  <Textarea value={editText} onValueChange={setEditText} minRows={2} />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="light" onPress={() => setEditId(null)}>
                      {t("leads.form.cancel")}
                    </Button>
                    <Button size="sm" color="primary" isLoading={busy} onPress={() => handleSaveEdit(n.id)}>
                      {t("leads.form.save")}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-default-400">{formatDate(n.createdAt)}</p>
                    {canManage && onUpdate && onDelete && (
                      <div className="flex gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            setEditId(n.id);
                            setEditText(n.content);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => onDelete(n.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
