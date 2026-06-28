import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Checkbox,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Spinner,
  ButtonGroup,
} from "@heroui/react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  Layers,
  List,
  Lock,
  Plus,
  Search,
  BookOpen,
  GitBranch,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useAccounts } from "../hooks/use-accounts";
import { AccountFormModal } from "../components/AccountFormModal";
import type { Account, AccountType } from "../schemas/account";
import { cn } from "@/lib/utils";
import {
  compareAccountCode,
  downloadAccountsCsv,
  flattenAccountsForTreeView,
} from "../utils/account-tree";

const TYPE_ORDER: AccountType[] = [
  "asset",
  "liability",
  "equity",
  "income",
  "expense",
];

type TypeFilter = "all" | AccountType;
type ViewMode = "list" | "tree";

function AccountRow({
  account,
  selected,
  onToggle,
  onEdit,
  onLedger,
  t,
  treeDepth = 0,
  hideTypeColumn = false,
  branchToggle,
}: {
  account: Account;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onLedger: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
  treeDepth?: number;
  hideTypeColumn?: boolean;
  branchToggle?: {
    collapsed: boolean;
    onToggle: () => void;
    hasChildren: boolean;
  };
}) {
  const balance = account.currentBalance ?? 0;
  const isZero = Math.abs(balance) < 0.01;

  return (
    <tr
      className={cn(
        "border-b border-default-100 text-sm transition-colors hover:bg-primary/[0.03]",
        !account.isActive && "opacity-50",
        selected && "bg-primary/[0.06]"
      )}
    >
      <td className="w-10 px-3 py-2">
        <Checkbox
          size="sm"
          isSelected={selected}
          onValueChange={onToggle}
          aria-label={account.name}
        />
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-mono text-default-600">
        {account.code}
      </td>
      <td className="px-3 py-2">
        <div
          className="flex items-center gap-1"
          style={{ paddingInlineStart: `${treeDepth * 1.25}rem` }}
        >
          {branchToggle?.hasChildren ? (
            <button
              type="button"
              onClick={branchToggle.onToggle}
              className="rounded p-0.5 text-default-500 hover:bg-default-100"
              aria-label={branchToggle.collapsed ? "Expand" : "Collapse"}
            >
              {branchToggle.collapsed ? (
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          ) : treeDepth > 0 ? (
            <span className="w-5 shrink-0 border-s-2 border-default-200 ps-1" />
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 text-start font-medium text-default-900 hover:text-primary"
          >
            {account.isSystemAccount && (
              <Lock className="h-3.5 w-3.5 shrink-0 text-default-400" />
            )}
            {t(`accounts.names.${account.name}`, { defaultValue: account.name })}
          </button>
        </div>
      </td>
      {!hideTypeColumn && (
        <td className="hidden px-3 py-2 text-default-600 md:table-cell">
          {t(`accounts.types.${account.type}`)}
        </td>
      )}
      <td className="hidden px-3 py-2 text-default-500 lg:table-cell">
        {t(`accounts.sub_types.${account.subType}`)}
      </td>
      <td className="hidden px-3 py-2 sm:table-cell">
        <span
          className={cn(
            "inline-block rounded px-1.5 py-0.5 text-xs",
            account.isActive
              ? "bg-success/10 text-success"
              : "bg-default-100 text-default-400"
          )}
        >
          {account.isActive
            ? t("accounts.status.active")
            : t("accounts.status.inactive")}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-end">
        <span
          className={cn(
            "tabular-nums font-medium",
            isZero ? "text-default-400" : "text-default-900"
          )}
          dir="ltr"
        >
          {formatCurrency(balance, account.currency ?? "USD")}
        </span>
      </td>
      <td className="w-10 px-2 py-2">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          aria-label={t("accounts.viewLedger")}
          onPress={onLedger}
        >
          <BookOpen className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

export default function ChartOfAccountsPage() {
  const { t } = useTranslation("billing");
  const navigate = useNavigate();
  const { data: accounts = [], isLoading } = useAccounts();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [groupByType, setGroupByType] = useState(true);
  const [collapsedTypes, setCollapsedTypes] = useState<Set<AccountType>>(
    new Set()
  );
  const [collapsedBranches, setCollapsedBranches] = useState<Set<string>>(
    new Set()
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts
      .filter((a) => {
        if (typeFilter !== "all" && a.type !== typeFilter) return false;
        if (!q) return true;
        return (
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          t(`accounts.sub_types.${a.subType}`).toLowerCase().includes(q)
        );
      })
      .sort(compareAccountCode);
  }, [accounts, search, typeFilter, t]);

  const grouped = useMemo(() => {
    if (viewMode === "tree") return null;
    if (!groupByType) return null;
    return TYPE_ORDER.map((type) => ({
      type,
      accounts: filtered.filter((a) => a.type === type),
      total: filtered
        .filter((a) => a.type === type)
        .reduce((s, a) => s + (a.currentBalance ?? 0), 0),
    })).filter((g) => g.accounts.length > 0);
  }, [filtered, groupByType, viewMode]);

  const treeRows = useMemo(() => {
    if (viewMode !== "tree") return null;
    return flattenAccountsForTreeView(
      filtered,
      TYPE_ORDER,
      collapsedTypes,
      collapsedBranches
    );
  }, [filtered, viewMode, collapsedTypes, collapsedBranches]);

  const allSelected =
    filtered.length > 0 && filtered.every((a) => a.id && selectedIds.has(a.id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((a) => a.id!).filter(Boolean)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTypeSection = (type: AccountType) => {
    setCollapsedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleBranch = (branchKey: string) => {
    setCollapsedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(branchKey)) next.delete(branchKey);
      else next.add(branchKey);
      return next;
    });
  };

  const openCreate = () => {
    setEditingAccount(null);
    setModalOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setModalOpen(true);
  };

  const handleExport = () => {
    const toExport =
      selectedIds.size > 0
        ? filtered.filter((a) => a.id && selectedIds.has(a.id))
        : filtered;

    if (toExport.length === 0) {
      toast.error(t("accounts.export_empty"));
      return;
    }

    downloadAccountsCsv(
      toExport,
      [
        t("accounts.columns.code"),
        t("accounts.columns.name"),
        t("accounts.columns.type"),
        t("accounts.columns.internal_type"),
        t("accounts.columns.status"),
        t("accounts.columns.balance"),
        t("accounts.form.parent"),
      ],
      (a) => [
        a.code,
        t(`accounts.names.${a.name}`, { defaultValue: a.name }),
        t(`accounts.types.${a.type}`),
        t(`accounts.sub_types.${a.subType}`),
        a.isActive ? t("accounts.status.active") : t("accounts.status.inactive"),
        a.currentBalance ?? 0,
        a.parentId ?? "",
      ]
    );
    toast.success(t("accounts.export_success"));
  };

  const filterChips: { key: TypeFilter; label: string }[] = [
    { key: "all", label: t("accounts.filters.all") },
    ...TYPE_ORDER.map((type) => ({
      key: type as TypeFilter,
      label: t(`accounts.types.${type}`),
    })),
  ];

  const hideTypeColumn = viewMode === "tree";

  return (
    <div className="pb-20 animate-in fade-in duration-300">
      <nav className="mb-3 flex items-center gap-1 text-sm text-default-500">
        <Link to="/billing" className="hover:text-primary">
          {t("module_name")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="font-medium text-default-800">{t("accounts.title")}</span>
      </nav>

      <div className="overflow-hidden rounded-lg border border-default-200 bg-content1 shadow-sm">
        <div className="border-b border-default-200 bg-default-50/90">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <Button
              size="sm"
              color="primary"
              className="font-semibold"
              startContent={<Plus className="h-4 w-4" />}
              onPress={openCreate}
            >
              {t("accounts.add")}
            </Button>

            <Button
              size="sm"
              variant="flat"
              startContent={<Download className="h-4 w-4" />}
              onPress={handleExport}
            >
              {t("accounts.export")}
            </Button>

            <div className="mx-1 hidden h-5 w-px bg-default-200 sm:block" />

            <Input
              size="sm"
              variant="flat"
              className="min-w-[200px] flex-1 max-w-xl"
              placeholder={t("accounts.search")}
              value={search}
              onValueChange={setSearch}
              startContent={<Search className="h-4 w-4 text-default-400" />}
              classNames={{
                inputWrapper:
                  "bg-white dark:bg-content1 shadow-none border border-default-200",
              }}
            />

            <ButtonGroup size="sm" variant="flat">
              <Button
                color={viewMode === "list" ? "primary" : "default"}
                startContent={<List className="h-4 w-4" />}
                onPress={() => setViewMode("list")}
              >
                {t("accounts.view.list")}
              </Button>
              <Button
                color={viewMode === "tree" ? "primary" : "default"}
                startContent={<GitBranch className="h-4 w-4" />}
                onPress={() => setViewMode("tree")}
              >
                {t("accounts.view.tree")}
              </Button>
            </ButtonGroup>

            <Dropdown>
              <DropdownTrigger>
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<Filter className="h-4 w-4" />}
                >
                  {t("accounts.filters.label")}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label={t("accounts.filters.label")}
                selectedKeys={new Set([typeFilter])}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as TypeFilter;
                  if (key) setTypeFilter(key);
                }}
              >
                {filterChips.map(({ key, label }) => (
                  <DropdownItem key={key}>{label}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            {viewMode === "list" && (
              <Button
                size="sm"
                variant={groupByType ? "solid" : "flat"}
                color={groupByType ? "primary" : "default"}
                startContent={<Layers className="h-4 w-4" />}
                onPress={() => setGroupByType((v) => !v)}
              >
                {t("accounts.groupBy.type")}
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-default-100 px-3 py-1.5">
            {filterChips.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTypeFilter(key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  typeFilter === key
                    ? "bg-primary text-white"
                    : "bg-white text-default-600 hover:bg-default-100 dark:bg-content1"
                )}
              >
                {label}
              </button>
            ))}
            <span className="ms-auto text-xs text-default-400">
              {t("accounts.accountCount", { count: filtered.length })}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner color="primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-default-500">
              {t("accounts.empty")}
            </div>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-start">
              <thead>
                <tr className="border-b border-default-200 bg-default-50/50 text-xs uppercase tracking-wide text-default-500">
                  <th className="w-10 px-3 py-2.5">
                    <Checkbox
                      size="sm"
                      isSelected={allSelected}
                      onValueChange={toggleAll}
                    />
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("accounts.columns.code")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("accounts.columns.name")}
                  </th>
                  {!hideTypeColumn && (
                    <th className="hidden px-3 py-2.5 font-semibold md:table-cell">
                      {t("accounts.columns.type")}
                    </th>
                  )}
                  <th className="hidden px-3 py-2.5 font-semibold lg:table-cell">
                    {t("accounts.columns.internal_type")}
                  </th>
                  <th className="hidden px-3 py-2.5 font-semibold sm:table-cell">
                    {t("accounts.columns.status")}
                  </th>
                  <th className="px-3 py-2.5 text-end font-semibold">
                    {t("accounts.columns.balance")}
                  </th>
                  <th className="w-10 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {viewMode === "tree" && treeRows
                  ? treeRows.map((entry, idx) => {
                      if (entry.kind === "type-header") {
                        const collapsed = collapsedTypes.has(entry.type);
                        return (
                          <tr
                            key={`type-${entry.type}`}
                            className="border-b border-default-200 bg-default-100/90"
                          >
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => toggleTypeSection(entry.type)}
                                className="rounded p-0.5 text-default-600 hover:bg-default-200/80"
                              >
                                {collapsed ? (
                                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                            <td colSpan={hideTypeColumn ? 5 : 6} className="px-3 py-2">
                              <span className="text-sm font-bold text-default-800">
                                {t(`accounts.types.${entry.type}`)}
                              </span>
                              <span className="ms-2 text-xs text-default-500">
                                ({entry.count})
                              </span>
                            </td>
                            <td
                              className="px-3 py-2 text-end text-sm font-bold tabular-nums"
                              dir="ltr"
                            >
                              {formatCurrency(
                                entry.total,
                                filtered.find((a) => a.type === entry.type)
                                  ?.currency ?? "USD"
                              )}
                            </td>
                            <td />
                          </tr>
                        );
                      }

                      const { row } = entry;
                      const account = row.account;
                      return (
                        <AccountRow
                          key={account.id ?? `${account.code}-${idx}`}
                          account={account}
                          selected={
                            !!account.id && selectedIds.has(account.id)
                          }
                          onToggle={() =>
                            account.id && toggleOne(account.id)
                          }
                          onEdit={() => openEdit(account)}
                          onLedger={() => navigate("/billing/journals")}
                          t={t}
                          treeDepth={row.depth}
                          hideTypeColumn={hideTypeColumn}
                          branchToggle={
                            row.hasChildren
                              ? {
                                  hasChildren: true,
                                  collapsed: collapsedBranches.has(
                                    row.branchKey
                                  ),
                                  onToggle: () =>
                                    toggleBranch(row.branchKey),
                                }
                              : undefined
                          }
                        />
                      );
                    })
                  : groupByType && grouped
                    ? grouped.flatMap((group) => [
                        <tr
                          key={`group-${group.type}`}
                          className="border-b border-default-200 bg-default-100/80"
                        >
                          <td className="px-3 py-2" />
                          <td colSpan={5} className="px-3 py-2">
                            <span className="text-sm font-bold text-default-800">
                              {t(`accounts.types.${group.type}`)}
                            </span>
                            <span className="ms-2 text-xs text-default-500">
                              ({group.accounts.length})
                            </span>
                          </td>
                          <td
                            className="px-3 py-2 text-end text-sm font-bold tabular-nums"
                            dir="ltr"
                          >
                            {formatCurrency(
                              group.total,
                              group.accounts[0]?.currency ?? "USD"
                            )}
                          </td>
                          <td />
                        </tr>,
                        ...group.accounts.map((account) => (
                          <AccountRow
                            key={account.id}
                            account={account}
                            selected={
                              !!account.id && selectedIds.has(account.id)
                            }
                            onToggle={() =>
                              account.id && toggleOne(account.id)
                            }
                            onEdit={() => openEdit(account)}
                            onLedger={() => navigate("/billing/journals")}
                            t={t}
                          />
                        )),
                      ])
                    : filtered.map((account) => (
                        <AccountRow
                          key={account.id}
                          account={account}
                          selected={
                            !!account.id && selectedIds.has(account.id)
                          }
                          onToggle={() =>
                            account.id && toggleOne(account.id)
                          }
                          onEdit={() => openEdit(account)}
                          onLedger={() => navigate("/billing/journals")}
                          t={t}
                        />
                      ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-default-200 bg-default-50/50 px-4 py-2 text-xs text-default-500">
          <span>
            {selectedIds.size > 0
              ? t("accounts.selectedCount", { count: selectedIds.size })
              : t("accounts.accountCount", { count: filtered.length })}
          </span>
          <span>1 / 1</span>
        </div>
      </div>

      <AccountFormModal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        account={editingAccount}
        allAccounts={accounts}
      />
    </div>
  );
}
