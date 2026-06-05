import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Textarea,
  Input,
  Chip,
} from "@heroui/react";
import { MessageSquare, Phone, Mail, Calendar, Paperclip, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Activity, ActivityType } from "../../types/activities.types";
import type { CrmNote } from "../../types/notes.types";
import type { CrmAttachment } from "../../types/attachments.types";
import { CrmAttachmentsSection } from "./CrmAttachmentsSection";

type ChatterItem =
  | { kind: "note"; id: string; at: string; content: string }
  | { kind: "activity"; id: string; at: string; data: Activity };

function mergeChatterFeed(notes: CrmNote[], activities: Activity[]): ChatterItem[] {
  const items: ChatterItem[] = [
    ...notes.map((n) => ({ kind: "note" as const, id: n.id, at: n.createdAt, content: n.content })),
    ...activities.map((a) => ({ kind: "activity" as const, id: a.id, at: a.occurredAt, data: a })),
  ];
  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

const QUICK_ACTIVITIES: { type: ActivityType; icon: typeof Phone; labelKey: string }[] = [
  { type: "call", icon: Phone, labelKey: "call" },
  { type: "email", icon: Mail, labelKey: "email" },
  { type: "meeting", icon: Calendar, labelKey: "meeting" },
];

interface CrmChatterProps {
  notes: CrmNote[];
  activities: Activity[];
  attachments: CrmAttachment[];
  canManage: boolean;
  onLogNote: (content: string) => Promise<void>;
  onLogActivity: (type: ActivityType, subject: string, description?: string) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  onDeleteAttachment?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function CrmChatter({
  notes,
  activities,
  attachments,
  canManage,
  onLogNote,
  onLogActivity,
  onUpload,
  onDeleteAttachment,
  isLoading,
}: CrmChatterProps) {
  const { t } = useTranslation("crm");
  const [noteText, setNoteText] = useState("");
  const [activitySubject, setActivitySubject] = useState("");
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("call");
  const [busy, setBusy] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  const feed = mergeChatterFeed(notes, activities);

  const submitNote = async () => {
    if (!noteText.trim()) return;
    setBusy(true);
    try {
      await onLogNote(noteText.trim());
      setNoteText("");
    } finally {
      setBusy(false);
    }
  };

  const submitActivity = async () => {
    if (!activitySubject.trim()) return;
    setBusy(true);
    try {
      await onLogActivity(activityType, activitySubject.trim());
      setActivitySubject("");
      setShowActivityForm(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border border-default-200 shadow-sm">
      <CardHeader className="pb-2 flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm">{t("ui.chatter.title")}</h3>
        </div>
        <p className="text-[10px] text-default-400">{t("ui.chatter.subtitle")}</p>
      </CardHeader>
      <CardBody className="gap-4 pt-0">
        {canManage && (
          <div className="space-y-2 pb-3 border-b border-default-100">
            <Textarea
              placeholder={t("ui.chatter.logNote")}
              value={noteText}
              onValueChange={setNoteText}
              minRows={2}
              size="sm"
            />
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                color="primary"
                className="rounded-lg font-semibold"
                startContent={<Send className="h-3.5 w-3.5" />}
                isDisabled={!noteText.trim()}
                isLoading={busy}
                onPress={submitNote}
              >
                {t("ui.chatter.post")}
              </Button>
              {QUICK_ACTIVITIES.map(({ type, icon: Icon, labelKey }) => (
                <Button
                  key={type}
                  size="sm"
                  variant="flat"
                  className="rounded-lg"
                  startContent={<Icon className="h-3.5 w-3.5" />}
                  onPress={() => {
                    setActivityType(type);
                    setActivitySubject(t(`leadDetail.activities.types.${labelKey}`));
                    setShowActivityForm(true);
                  }}
                >
                  {t(`leadDetail.activities.types.${labelKey}`)}
                </Button>
              ))}
              <Button
                size="sm"
                variant="flat"
                className="rounded-lg"
                startContent={<Paperclip className="h-3.5 w-3.5" />}
                onPress={() => setShowAttachments((v) => !v)}
              >
                {t("ui.chatter.attach")} ({attachments.length})
              </Button>
            </div>
            {showActivityForm && (
              <div className="p-2 rounded-lg bg-default-50 space-y-2">
                <Input
                  size="sm"
                  placeholder={t("leadDetail.activities.subject")}
                  value={activitySubject}
                  onValueChange={setActivitySubject}
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="light" onPress={() => setShowActivityForm(false)}>
                    {t("leads.form.cancel")}
                  </Button>
                  <Button size="sm" color="primary" isLoading={busy} onPress={submitActivity}>
                    {t("leadDetail.activities.log")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {showAttachments && (
          <CrmAttachmentsSection
            attachments={attachments}
            canManage={canManage}
            isLoading={isLoading}
            onUpload={onUpload}
            onDelete={onDeleteAttachment}
          />
        )}

        <div className="space-y-3 max-h-[32rem] overflow-y-auto scrollbar-hide">
          {feed.length === 0 ? (
            <p className="text-xs text-default-400 text-center py-4">{t("ui.chatter.empty")}</p>
          ) : (
            feed.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="p-3 rounded-xl bg-default-50/80 border border-default-100 text-sm"
              >
                {item.kind === "note" ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Chip size="sm" variant="flat" color="secondary" className="h-5 text-[9px]">
                        {t("ui.chatter.note")}
                      </Chip>
                      <span className="text-[10px] text-default-400">{formatDate(item.at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-default-700">{item.content}</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Chip size="sm" variant="flat" color="primary" className="h-5 text-[9px]">
                        {t(`leadDetail.activities.types.${item.data.type}`, item.data.type)}
                      </Chip>
                      <span className="text-[10px] text-default-400">{formatDate(item.at)}</span>
                    </div>
                    <p className="font-semibold">{item.data.subject}</p>
                    {item.data.description && (
                      <p className="text-default-600 mt-1 text-xs whitespace-pre-wrap">
                        {item.data.description}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}
