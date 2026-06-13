import { useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, CardBody, Chip, Input } from "@heroui/react";
import {
  Briefcase,
  Calendar,
  DollarSign,
  Pencil,
  ListTodo,
  StickyNote,
  Paperclip,
  User,
} from "lucide-react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { FieldBox } from "@/components/shared/field-box";
import { useDealQuery, useUpdateDealMutation } from "../hooks/use-deals";
import { useContactQuery } from "../hooks/use-contacts";
import { useCrmPermissions } from "../hooks/use-crm-permissions";
import {
  useCrmEntityActivities,
  useCrmEntityAttachments,
  useCrmEntityNotes,
  useCrmEntityTasks,
  useCreateCrmNoteMutation,
  useCreateCrmActivityMutation,
  useCreateCrmTaskMutation,
  useUploadCrmAttachmentMutation,
  useDeleteCrmAttachmentMutation,
} from "../hooks/use-crm-entity-data";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { DealFormModal } from "../components/DealFormModal";
import { CrmChatter } from "../components/shared/CrmChatter";
import { DEAL_STAGES, DEAL_STAGE_COLORS, normalizeDealProbability } from "../constants/deal-workflow";
import { contactDisplayName } from "../utils/contacts-list.utils";
import { CrmRecordLayout, CrmRecordHeader } from "../components/CrmRecordLayout";
import { CrmStageBar } from "../components/CrmStageBar";
import { CrmSmartButtons } from "../components/CrmSmartButtons";
import { formatDate, formatCurrency } from "@/lib/utils";
import { normalizeCrmTaskStatus } from "../constants/crm-task.constants";
import type { DealStage } from "../types/deals.types";
import type { ActivityType } from "../types/activities.types";

function formatAmount(amount: number, currency: string) {
  return formatCurrency(amount, currency);
}

export function DealDetailPage() {
  const { dealId = "" } = useParams();
  const { t } = useTranslation("crm");
  const { canManageDeals } = useCrmPermissions();
  const { data: dealRes, isLoading } = useDealQuery(dealId);
  const contactId = dealRes?.data.contactId ?? "";
  const { data: contactRes } = useContactQuery(contactId);
  const { data: users } = useAllUsers();
  const updateDeal = useUpdateDealMutation();
  const [editOpen, setEditOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  const { data: notes = [] } = useCrmEntityNotes("deal", dealId);
  const { data: activities = [] } = useCrmEntityActivities("deal", dealId);
  const { data: tasks = [] } = useCrmEntityTasks("deal", dealId);
  const { data: attachments = [] } = useCrmEntityAttachments("deal", dealId);

  const createNote = useCreateCrmNoteMutation("deal", dealId);
  const createActivity = useCreateCrmActivityMutation("deal", dealId);
  const createTask = useCreateCrmTaskMutation("deal", dealId);
  const uploadAttachment = useUploadCrmAttachmentMutation("deal", dealId);
  const deleteAttachment = useDeleteCrmAttachmentMutation("deal", dealId);

  if (isLoading || !dealRes) return <LoadingSpinner />;
  const deal = dealRes.data;
  const contact = deal.contactId && contactRes ? contactRes.data : null;
  const assignee = users?.find((u) => u.id === deal.assignedTo);

  return (
    <>
      <CrmRecordLayout
        header={
          <CrmRecordHeader
            breadcrumbs={[
              { label: "CRM", href: "/crm" },
              { label: t("nav.deals"), href: "/crm/deals" },
              { label: deal.title },
            ]}
            title={deal.title}
            subtitle={formatAmount(deal.amount, deal.currency)}
            badge={
              <Chip color={DEAL_STAGE_COLORS[deal.stage]} variant="flat" size="md">
                {t(`deals.stage.${deal.stage}`)}
              </Chip>
            }
            actions={
              canManageDeals ? (
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Pencil className="h-4 w-4" />}
                  className="rounded-full font-bold"
                  onPress={() => setEditOpen(true)}
                >
                  {t("dealDetail.edit")}
                </Button>
              ) : undefined
            }
            stageBar={
              canManageDeals ? (
                <CrmStageBar
                  stages={DEAL_STAGES}
                  current={deal.stage}
                  terminalStages={["won", "lost"]}
                  labelKey={(s) => t(`deals.stage.${s}`)}
                  onStageClick={(s: DealStage) => updateDeal.mutate({ id: deal.id, data: { stage: s } })}
                />
              ) : undefined
            }
            smartButtons={
              <CrmSmartButtons
                items={[
                  { key: "tasks", label: t("dealDetail.tabs.tasks"), count: tasks.length, icon: ListTodo },
                  { key: "notes", label: t("dealDetail.tabs.notes"), count: notes.length, icon: StickyNote },
                  { key: "files", label: t("dealDetail.tabs.attachments"), count: attachments.length, icon: Paperclip },
                ]}
              />
            }
          />
        }
        main={
          <>
            <Card className="border border-default-200">
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                <FieldBox label={t("deals.form.title")} icon={<Briefcase className="h-3.5 w-3.5" />}>
                  {deal.title}
                </FieldBox>
                <FieldBox label={t("deals.form.amount")} icon={<DollarSign className="h-3.5 w-3.5" />}>
                  {formatAmount(deal.amount, deal.currency)}
                </FieldBox>
                <FieldBox label={t("deals.form.contact")} icon={<User className="h-3.5 w-3.5" />}>
                  {contact ? (
                    <Link to={`/crm/contacts/${contact.id}`} className="text-primary hover:underline">
                      {contactDisplayName(contact)}
                    </Link>
                  ) : "—"}
                </FieldBox>
                <FieldBox label={t("deals.form.assignedTo")}>
                  {assignee?.name ?? t("contacts.filters.unassigned")}
                </FieldBox>
                <FieldBox label={t("dealDetail.probability")}>
                  {normalizeDealProbability(deal.probability)}/10
                </FieldBox>
                <FieldBox label={t("deals.form.expectedCloseDate")} icon={<Calendar className="h-3.5 w-3.5" />}>
                  {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "—"}
                </FieldBox>
              </CardBody>
            </Card>
            <Card className="border border-default-200">
              <CardBody className="p-5 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-primary" />
                  {t("dealDetail.tabs.tasks")}
                </h3>
                {canManageDeals && (
                  <div className="flex gap-2">
                    <Input size="sm" className="flex-1" placeholder={t("dealDetail.tasks.placeholder")} value={taskTitle} onValueChange={setTaskTitle} />
                    <Button size="sm" color="primary" className="rounded-full" isDisabled={!taskTitle.trim()} onPress={async () => {
                      await createTask.mutateAsync({ title: taskTitle.trim() });
                      setTaskTitle("");
                    }}>
                      {t("dealDetail.tasks.add")}
                    </Button>
                  </div>
                )}
                {tasks.length === 0 ? (
                  <p className="text-xs text-default-400">{t("dealDetail.tasks.empty")}</p>
                ) : (
                  <ul className="space-y-2">
                    {tasks.map((task) => (
                      <li key={task.id} className="flex justify-between p-2 rounded-lg bg-default-50 text-sm">
                        <span>{task.title}</span>
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
            canManage={canManageDeals}
            onLogNote={async (c) => { await createNote.mutateAsync(c); }}
            onLogActivity={async (type: ActivityType, subject, description) => {
              await createActivity.mutateAsync({ type, subject, description });
            }}
            onUpload={async (file) => { await uploadAttachment.mutateAsync(file); }}
            onDeleteAttachment={async (id) => { await deleteAttachment.mutateAsync(id); }}
          />
        }
      />
      <DealFormModal isOpen={editOpen} onOpenChange={setEditOpen} deal={deal} />
    </>
  );
}
