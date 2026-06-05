import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Tab,
  Tabs,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Mail,
  Phone,
  Pencil,
  StickyNote,
  ListTodo,
  Paperclip,
  User,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { FieldBox } from "@/components/shared/field-box";
import { useContactQuery } from "../hooks/use-contacts";
import { useDealsQuery } from "../hooks/use-deals";
import { useCrmPermissions } from "../hooks/use-crm-permissions";
import {
  useCrmEntityActivities,
  useCrmEntityAttachments,
  useCrmEntityNotes,
  useCrmEntityTasks,
  useCreateCrmNoteMutation,
  useUpdateCrmNoteMutation,
  useDeleteCrmNoteMutation,
  useUploadCrmAttachmentMutation,
  useDeleteCrmAttachmentMutation,
} from "../hooks/use-crm-entity-data";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { ContactFormModal } from "../components/ContactFormModal";
import { CrmNotesSection } from "../components/shared/CrmNotesSection";
import { CrmAttachmentsSection } from "../components/shared/CrmAttachmentsSection";
import { CrmTimeline } from "../components/shared/CrmTimeline";
import { contactDisplayName } from "../utils/contacts-list.utils";
import { formatDate, formatCurrency } from "@/lib/utils";
import { normalizeCrmTaskStatus } from "../constants/crm-task.constants";

export function ContactDetailPage() {
  const { contactId = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("crm");
  const { canManageContacts } = useCrmPermissions();
  const { data: contactRes, isLoading } = useContactQuery(contactId);
  const { data: dealsRes } = useDealsQuery();
  const { data: users } = useAllUsers();
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState("overview");

  const { data: notes = [], isLoading: notesLoading } = useCrmEntityNotes("contact", contactId);
  const { data: activities = [], isLoading: activitiesLoading } = useCrmEntityActivities(
    "contact",
    contactId
  );
  const { data: tasks = [], isLoading: tasksLoading } = useCrmEntityTasks("contact", contactId);
  const { data: attachments = [], isLoading: attachmentsLoading } = useCrmEntityAttachments(
    "contact",
    contactId
  );

  const createNote = useCreateCrmNoteMutation("contact", contactId);
  const updateNote = useUpdateCrmNoteMutation();
  const deleteNote = useDeleteCrmNoteMutation();
  const uploadAttachment = useUploadCrmAttachmentMutation("contact", contactId);
  const deleteAttachment = useDeleteCrmAttachmentMutation("contact", contactId);

  const contactDeals = useMemo(
    () => (dealsRes?.data ?? []).filter((d) => d.contactId === contactId),
    [dealsRes?.data, contactId]
  );

  if (isLoading || !contactRes) return <LoadingSpinner />;
  const contact = contactRes.data;
  const name = contactDisplayName(contact);
  const assignee = users?.find((u) => u.id === contact.assignedTo);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <Button
          isIconOnly
          variant="light"
          onPress={() => navigate("/crm/contacts")}
          aria-label={t("contactDetail.back")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title={name}
          description={contact.accountName || contact.jobTitle || contact.email || t("contactDetail.noAccount")}
          actions={
            canManageContacts ? (
              <Button
                color="primary"
                variant="flat"
                startContent={<Pencil className="h-4 w-4" />}
                className="rounded-full font-bold"
                onPress={() => setEditOpen(true)}
              >
                {t("contactDetail.edit")}
              </Button>
            ) : undefined
          }
        />
      </div>

      <Card className="border border-default-100">
        <CardBody className="p-4 flex flex-wrap items-center gap-3">
          {contact.jobTitle && (
            <Chip variant="flat" size="sm">
              {contact.jobTitle}
            </Chip>
          )}
          {contact.department && (
            <Chip variant="bordered" size="sm">
              {contact.department}
            </Chip>
          )}
          {contact.accountName && (
            <Chip variant="bordered" size="sm" startContent={<Building2 className="h-3 w-3" />}>
              {contact.accountName}
            </Chip>
          )}
        </CardBody>
      </Card>

      <Tabs
        selectedKey={tab}
        onSelectionChange={(k) => setTab(k as string)}
        variant="underlined"
        classNames={{ tabList: "gap-4" }}
      >
        <Tab
          key="overview"
          title={
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {t("contactDetail.tabs.overview")}
            </span>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <FieldBox label={t("contacts.form.firstName")}>{contact.firstName}</FieldBox>
            <FieldBox label={t("contacts.form.lastName")}>{contact.lastName || "—"}</FieldBox>
            <FieldBox label={t("contacts.form.email")} icon={<Mail className="h-3.5 w-3.5" />}>
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                  {contact.email}
                </a>
              ) : (
                "—"
              )}
            </FieldBox>
            <FieldBox label={t("contacts.form.phone")} icon={<Phone className="h-3.5 w-3.5" />}>
              {contact.phone || "—"}
            </FieldBox>
            <FieldBox label={t("contacts.form.jobTitle")}>{contact.jobTitle || "—"}</FieldBox>
            <FieldBox label={t("contacts.form.department")}>{contact.department || "—"}</FieldBox>
            <FieldBox label={t("contacts.form.accountName")} icon={<Building2 className="h-3.5 w-3.5" />}>
              {contact.accountName || "—"}
            </FieldBox>
            <FieldBox label={t("contacts.form.assignedTo")}>
              {assignee?.name ?? t("contacts.filters.unassigned")}
            </FieldBox>
            <FieldBox label={t("contacts.columns.created")}>{formatDate(contact.createdAt)}</FieldBox>
          </div>
        </Tab>

        <Tab
          key="deals"
          title={
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              {t("contactDetail.tabs.deals")}
            </span>
          }
        >
          <div className="pt-4">
            {contactDeals.length === 0 ? (
              <p className="text-default-500 text-sm">{t("contactDetail.deals.empty")}</p>
            ) : (
              <Table aria-label={t("contactDetail.tabs.deals")} removeWrapper>
                <TableHeader>
                  <TableColumn>{t("deals.form.title")}</TableColumn>
                  <TableColumn>{t("deals.form.stage")}</TableColumn>
                  <TableColumn>{t("deals.form.amount")}</TableColumn>
                  <TableColumn>{t("contacts.columns.actions")}</TableColumn>
                </TableHeader>
                <TableBody>
                  {contactDeals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell>{deal.title}</TableCell>
                      <TableCell>{t(`deals.stage.${deal.stage}`)}</TableCell>
                      <TableCell>
                        {formatCurrency(deal.amount, deal.currency)}
                      </TableCell>
                      <TableCell>
                        <Button
                          as={Link}
                          to={`/crm/deals/${deal.id}`}
                          size="sm"
                          variant="light"
                          color="primary"
                        >
                          {t("contacts.details")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Tab>

        <Tab
          key="tasks"
          title={
            <span className="flex items-center gap-1.5">
              <ListTodo className="h-4 w-4" />
              {t("contactDetail.tabs.tasks")}
            </span>
          }
        >
          <div className="pt-4">
            {tasksLoading ? (
              <LoadingSpinner />
            ) : tasks.length === 0 ? (
              <p className="text-default-500 text-sm">{t("contactDetail.tasks.empty")}</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-default-50 border border-default-100"
                  >
                    <span className="font-medium text-sm">{task.title}</span>
                    <Chip size="sm" variant="flat">
                      {t(`crmTasks.status.${normalizeCrmTaskStatus(task.status)}`)}
                    </Chip>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Tab>

        <Tab
          key="notes"
          title={
            <span className="flex items-center gap-1.5">
              <StickyNote className="h-4 w-4" />
              {t("contactDetail.tabs.notes")}
            </span>
          }
        >
          <div className="pt-4">
            <CrmNotesSection
              notes={notes}
              canManage={canManageContacts}
              isLoading={notesLoading || createNote.isPending}
              onAdd={async (content) => {
                await createNote.mutateAsync(content);
              }}
              onUpdate={
                canManageContacts
                  ? async (id, content) => {
                      await updateNote.mutateAsync({ id, content });
                    }
                  : undefined
              }
              onDelete={
                canManageContacts
                  ? async (id) => {
                      await deleteNote.mutateAsync(id);
                    }
                  : undefined
              }
            />
          </div>
        </Tab>

        <Tab
          key="attachments"
          title={
            <span className="flex items-center gap-1.5">
              <Paperclip className="h-4 w-4" />
              {t("contactDetail.tabs.attachments")}
            </span>
          }
        >
          <div className="pt-4">
            <CrmAttachmentsSection
              attachments={attachments}
              canManage={canManageContacts}
              isLoading={attachmentsLoading || uploadAttachment.isPending}
              onUpload={async (file) => {
                await uploadAttachment.mutateAsync(file);
              }}
              onDelete={
                canManageContacts
                  ? async (id) => {
                      await deleteAttachment.mutateAsync(id);
                    }
                  : undefined
              }
            />
          </div>
        </Tab>

        <Tab
          key="timeline"
          title={
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {t("contactDetail.tabs.timeline")}
            </span>
          }
        >
          <div className="pt-4">
            {activitiesLoading ? (
              <LoadingSpinner />
            ) : (
              <CrmTimeline activities={activities} />
            )}
          </div>
        </Tab>
      </Tabs>

      <ContactFormModal isOpen={editOpen} onOpenChange={setEditOpen} contact={contact} />
    </div>
  );
}
