import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, CardBody, Chip } from "@heroui/react";
import {
  Building2,
  Mail,
  Phone,
  Pencil,
  ListTodo,
  StickyNote,
  Paperclip,
  User,
  UserCheck,
  MessageCircle,
} from "lucide-react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { FieldBox } from "@/components/shared/field-box";
import { useLeadQuery, useUpdateLeadMutation } from "../hooks/use-leads";
import { useCrmPermissions } from "../hooks/use-crm-permissions";
import {
  useLeadActivities,
  useLeadAttachments,
  useLeadCrmTasks,
  useLeadNotes,
  useCreateCrmNoteMutation,
  useCreateLeadActivityMutation,
  useCreateLeadCrmTaskMutation,
  useUploadCrmAttachmentMutation,
  useDeleteCrmAttachmentMutation,
} from "../hooks/use-crm-entity-data";
import { useConvertLeadMutation } from "../hooks/use-lead-conversion";
import { CrmChatter } from "../components/shared/CrmChatter";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { LeadFormModal } from "../components/LeadFormModal";
import { LeadStatusChip } from "../components/LeadStatusChip";
import { LEAD_STATUSES, normalizeLeadStatus } from "../constants/lead-workflow";
import { CrmRecordLayout, CrmRecordHeader } from "../components/CrmRecordLayout";
import { CrmStageBar } from "../components/CrmStageBar";
import { CrmSmartButtons } from "../components/CrmSmartButtons";
import { CrmWhatsAppPanel } from "../components/CrmWhatsAppPanel";
import { buildWhatsAppUrl, isValidWhatsAppPhone } from "../utils/phone.utils";
import { formatDate } from "@/lib/utils";
import type { LeadStatus } from "../types/leads.types";
import type { ActivityType } from "../types/activities.types";
import { Input } from "@heroui/react";
import { normalizeCrmTaskStatus } from "../constants/crm-task.constants";

export function LeadDetailPage() {
  const { leadId = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("crm");
  const { canManageLeads } = useCrmPermissions();
  const { data: leadRes, isLoading } = useLeadQuery(leadId);
  const { data: users } = useAllUsers();
  const updateLead = useUpdateLeadMutation();
  const convertLead = useConvertLeadMutation();
  const [editOpen, setEditOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  const { data: notes = [] } = useLeadNotes(leadId);
  const { data: activities = [] } = useLeadActivities(leadId);
  const { data: tasks = [] } = useLeadCrmTasks(leadId);
  const { data: attachments = [] } = useLeadAttachments(leadId);

  const createNote = useCreateCrmNoteMutation("lead", leadId);
  const createActivity = useCreateLeadActivityMutation(leadId);
  const createTask = useCreateLeadCrmTaskMutation(leadId);
  const uploadAttachment = useUploadCrmAttachmentMutation("lead", leadId);
  const deleteAttachment = useDeleteCrmAttachmentMutation("lead", leadId);

  if (isLoading || !leadRes) return <LoadingSpinner />;
  const lead = {
    ...leadRes.data,
    status: normalizeLeadStatus(leadRes.data.status) as LeadStatus,
  };
  const assignee = users?.find((u) => u.id === lead.assignedTo);

  return (
    <>
      <CrmRecordLayout
        header={
          <CrmRecordHeader
            breadcrumbs={[
              { label: "CRM", href: "/crm" },
              { label: t("nav.leads"), href: "/crm/leads" },
              { label: lead.name },
            ]}
            title={lead.name}
            subtitle={lead.company || lead.email || t("leadDetail.noCompany")}
            badge={<LeadStatusChip status={lead.status} size="md" />}
            actions={
              canManageLeads ? (
                <div className="flex gap-2 flex-wrap">
                  {!lead.contactId ? (
                    <Button
                      color="success"
                      variant="flat"
                      startContent={<UserCheck className="h-4 w-4" />}
                      className="rounded-full font-bold"
                      isLoading={convertLead.isPending}
                      onPress={async () => {
                        const res = await convertLead.mutateAsync(lead.id);
                        navigate(`/crm/contacts/${res.data.contact.id}`);
                      }}
                    >
                      {t("leads.convert.action")}
                    </Button>
                  ) : (
                    <Button as={Link} to={`/crm/contacts/${lead.contactId}`} variant="flat" className="rounded-full font-bold">
                      {t("leads.convert.viewContact")}
                    </Button>
                  )}
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<Pencil className="h-4 w-4" />}
                    className="rounded-full font-bold"
                    onPress={() => setEditOpen(true)}
                  >
                    {t("leadDetail.edit")}
                  </Button>
                </div>
              ) : undefined
            }
            stageBar={
              canManageLeads ? (
                <CrmStageBar
                  stages={LEAD_STATUSES}
                  current={lead.status}
                  terminalStages={["won", "lost"]}
                  labelKey={(s) => t(`leads.status.${s}`)}
                  onStageClick={(s) => updateLead.mutate({ id: lead.id, data: { status: s } })}
                />
              ) : undefined
            }
            smartButtons={
              <CrmSmartButtons
                items={[
                  { key: "tasks", label: t("leadDetail.tabs.tasks"), count: tasks.length, icon: ListTodo },
                  { key: "notes", label: t("leadDetail.tabs.notes"), count: notes.length, icon: StickyNote },
                  { key: "files", label: t("leadDetail.tabs.attachments"), count: attachments.length, icon: Paperclip },
                  ...(isValidWhatsAppPhone(lead.phone)
                    ? [{
                        key: "whatsapp",
                        label: t("whatsapp.short"),
                        count: activities.filter((a) => a.type === "whatsapp").length,
                        icon: MessageCircle,
                        href: buildWhatsAppUrl(lead.phone) ?? undefined,
                      }]
                    : []),
                ]}
              />
            }
          />
        }
        main={
          <>
            <Card className="border border-default-200">
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                <FieldBox label={t("leads.form.name")} icon={<User className="h-3.5 w-3.5" />}>
                  {lead.name}
                </FieldBox>
                <FieldBox label={t("leads.form.company")} icon={<Building2 className="h-3.5 w-3.5" />}>
                  {lead.company || "—"}
                </FieldBox>
                <FieldBox label={t("leads.form.email")} icon={<Mail className="h-3.5 w-3.5" />}>
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
                  ) : "—"}
                </FieldBox>
                <FieldBox label={t("leads.form.phone")} icon={<Phone className="h-3.5 w-3.5" />}>
                  {isValidWhatsAppPhone(lead.phone) ? (
                    <a
                      href={buildWhatsAppUrl(lead.phone)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-success hover:underline font-mono text-sm"
                    >
                      {lead.phone}
                    </a>
                  ) : (
                    lead.phone || "—"
                  )}
                </FieldBox>
                <FieldBox label={t("leads.form.assignedTo")}>{assignee?.name ?? t("leads.filters.unassigned")}</FieldBox>
                <FieldBox label={t("leads.columns.created")}>{formatDate(lead.createdAt)}</FieldBox>
                {lead.priority && (
                  <FieldBox label={t("leads.form.priority")}>
                    {t(`leads.priority.${lead.priority}`)}
                  </FieldBox>
                )}
                {lead.source && (
                  <FieldBox label={t("leads.form.source")}>{t(`leads.source.${lead.source}`)}</FieldBox>
                )}
                <FieldBox label={t("leads.form.notes")} className="md:col-span-2">
                  <p className="text-default-600 whitespace-pre-wrap">{lead.notes || "—"}</p>
                </FieldBox>
              </CardBody>
            </Card>

            <CrmWhatsAppPanel
              phone={lead.phone}
              entityType="lead"
              entityId={lead.id}
              entityLabel={lead.name}
              canManage={canManageLeads}
            />

            <Card className="border border-default-200">
              <CardBody className="p-5 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-primary" />
                  {t("leadDetail.tabs.tasks")}
                </h3>
                {canManageLeads && (
                  <div className="flex gap-2">
                    <Input
                      size="sm"
                      className="flex-1"
                      placeholder={t("leadDetail.tasks.placeholder")}
                      value={taskTitle}
                      onValueChange={setTaskTitle}
                    />
                    <Button
                      size="sm"
                      color="primary"
                      className="rounded-full"
                      isDisabled={!taskTitle.trim()}
                      onPress={async () => {
                        await createTask.mutateAsync({ title: taskTitle.trim() });
                        setTaskTitle("");
                      }}
                    >
                      {t("leadDetail.tasks.add")}
                    </Button>
                  </div>
                )}
                {tasks.length === 0 ? (
                  <p className="text-xs text-default-400">{t("leadDetail.tasks.empty")}</p>
                ) : (
                  <ul className="space-y-2">
                    {tasks.map((task) => (
                      <li key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-default-50 text-sm">
                        <span className="font-medium">{task.title}</span>
                        <Chip size="sm" variant="flat">{normalizeCrmTaskStatus(task.status)}</Chip>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </>
        }
        chatter={
          <CrmChatter
            notes={notes}
            activities={activities}
            attachments={attachments}
            canManage={canManageLeads}
            onLogNote={async (c) => { await createNote.mutateAsync(c); }}
            onLogActivity={async (type: ActivityType, subject, description) => {
              await createActivity.mutateAsync({ type, subject, description });
            }}
            onUpload={async (file) => { await uploadAttachment.mutateAsync(file); }}
            onDeleteAttachment={async (id) => { await deleteAttachment.mutateAsync(id); }}
          />
        }
      />
      <LeadFormModal isOpen={editOpen} onOpenChange={setEditOpen} lead={lead} />
    </>
  );
}
