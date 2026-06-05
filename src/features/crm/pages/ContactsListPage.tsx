import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useContactsQuery } from "../hooks/use-contacts";
import { useCrmPermissions } from "../hooks/use-crm-permissions";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Pagination } from "@/components/shared/pagination";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User as UserAvatar,
  Button,
  Card,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { Plus, ChevronUp, ChevronDown, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAllUsers } from "@/features/users/hooks/use-users";
import {
  applyContactsListPipeline,
  contactDisplayName,
  type ContactsListParams,
  type ContactSortField,
} from "../utils/contacts-list.utils";
import { ContactFormModal } from "../components/ContactFormModal";
import { formatDate } from "@/lib/utils";

const DEFAULT_PARAMS: ContactsListParams = {
  page: 1,
  pageSize: 10,
  sortField: "createdAt",
  sortOrder: "desc",
};

export function ContactsListPage() {
  const { t } = useTranslation("crm");
  const { canManageContacts } = useCrmPermissions();
  const { data, isLoading } = useContactsQuery();
  const { data: users } = useAllUsers();
  const [params, setParams] = useState<ContactsListParams>(DEFAULT_PARAMS);
  const [formOpen, setFormOpen] = useState(false);

  const pipeline = useMemo(() => {
    const all = data?.data ?? [];
    return applyContactsListPipeline(all, params);
  }, [data?.data, params]);

  const assigneeName = (id: string | null | undefined) => {
    if (!id) return "—";
    return users?.find((u) => u.id === id)?.name ?? "—";
  };

  const toggleSort = (field: ContactSortField) => {
    setParams((p) => ({
      ...p,
      sortField: field,
      sortOrder: p.sortField === field && p.sortOrder === "asc" ? "desc" : "asc",
      page: 1,
    }));
  };

  const SortIcon = ({ field }: { field: ContactSortField }) => {
    if (params.sortField !== field) return null;
    return params.sortOrder === "asc" ? (
      <ChevronUp className="h-3 w-3 inline ms-1" />
    ) : (
      <ChevronDown className="h-3 w-3 inline ms-1" />
    );
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("contacts.title")}
        description={t("contacts.description")}
        actions={
          canManageContacts ? (
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              className="rounded-full font-bold"
              onPress={() => setFormOpen(true)}
            >
              {t("contacts.addContact")}
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2 bg-default-50 p-4 rounded-3xl border border-default-100">
        <Input
          isClearable
          size="sm"
          variant="bordered"
          placeholder={t("contacts.searchPlaceholder")}
          value={params.search ?? ""}
          onValueChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))}
          startContent={<Search className="h-4 w-4 text-default-400" />}
          className="w-full sm:w-64"
        />
        <Select
          size="sm"
          variant="bordered"
          label={t("contacts.filters.assignedTo")}
          className="w-full sm:w-48"
          selectedKeys={params.assignedTo ? [params.assignedTo] : []}
          onSelectionChange={(keys) => {
            const v = Array.from(keys)[0] as string | undefined;
            setParams((p) => ({ ...p, assignedTo: v, page: 1 }));
          }}
          items={[
            { id: "__unassigned__", name: t("contacts.filters.unassigned") },
            ...(users ?? []).map((u) => ({ id: u.id, name: u.name })),
          ]}
        >
          {(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
        </Select>
        {(params.search || params.assignedTo) && (
          <Button
            size="sm"
            variant="light"
            onPress={() => setParams(DEFAULT_PARAMS)}
          >
            {t("contacts.filters.clear")}
          </Button>
        )}
      </div>

      <Card className="glass-card border-none p-2">
        <Table aria-label={t("contacts.title")} removeWrapper className="bg-transparent">
          <TableHeader>
            <TableColumn>
              <button type="button" className="font-bold" onClick={() => toggleSort("name")}>
                {t("contacts.columns.name")}
                <SortIcon field="name" />
              </button>
            </TableColumn>
            <TableColumn>
              <button type="button" className="font-bold" onClick={() => toggleSort("email")}>
                {t("contacts.columns.email")}
                <SortIcon field="email" />
              </button>
            </TableColumn>
            <TableColumn>{t("contacts.columns.phone")}</TableColumn>
            <TableColumn>
              <button type="button" className="font-bold" onClick={() => toggleSort("accountName")}>
                {t("contacts.columns.account")}
                <SortIcon field="accountName" />
              </button>
            </TableColumn>
            <TableColumn>{t("contacts.columns.assigned")}</TableColumn>
            <TableColumn>
              <button type="button" className="font-bold" onClick={() => toggleSort("createdAt")}>
                {t("contacts.columns.created")}
                <SortIcon field="createdAt" />
              </button>
            </TableColumn>
            <TableColumn>{t("contacts.columns.actions")}</TableColumn>
          </TableHeader>
          <TableBody emptyContent={t("contacts.empty")}>
            {pipeline.items.map((contact) => (
              <TableRow
                key={contact.id}
                className="hover:bg-default-100/50 transition-colors cursor-pointer group"
              >
                <TableCell>
                  <UserAvatar
                    name={contactDisplayName(contact)}
                    description={contact.jobTitle || contact.accountName}
                    avatarProps={{
                      src: contact.email ? `https://avatar.vercel.sh/${contact.email}` : undefined,
                      size: "sm",
                    }}
                    className="font-bold"
                  />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-default-600">{contact.email || "—"}</span>
                </TableCell>
                <TableCell>
                  <span className="text-default-500 font-mono text-xs">{contact.phone || "—"}</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-default-600">{contact.accountName || "—"}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-default-600">{assigneeName(contact.assignedTo)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-default-500 text-xs">{formatDate(contact.createdAt)}</span>
                </TableCell>
                <TableCell>
                  <Button
                    as={Link}
                    to={`/crm/contacts/${contact.id}`}
                    size="sm"
                    variant="light"
                    color="primary"
                    className="font-bold rounded-xl"
                  >
                    {t("contacts.details")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-center">
        <Pagination
          total={pipeline.totalPages}
          page={pipeline.page}
          onChange={(page) => setParams((p) => ({ ...p, page }))}
        />
      </div>

      <ContactFormModal isOpen={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
