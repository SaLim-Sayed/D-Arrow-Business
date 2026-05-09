import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { KanbanBoard } from "../components/kanban-board";
import { Plus, Search, Filter, MoreHorizontal, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasksUIStore } from "../store/tasks-ui.store";
import {
  Input,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Avatar,
} from "@heroui/react";
import { useAuth } from "@/features/auth/context/auth-context";
import { useAllUsers } from "@/features/users/hooks/use-users";

export function TasksBoardPage() {
  const { t, i18n } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const { filters, setFilter, resetFilters } = useTasksUIStore();
  const { user } = useAuth();
  const { data: allUsers } = useAllUsers();

  const tabs = [{ label: "Board", path: "/tasks/board", active: true }];

  const priorities = ["low", "medium", "high", "urgent"];

  // Split company name for breadcrumb style
  const companyName = user?.companyName || "D-Arrow Business";
  const [firstPart, ...rest] = companyName.split(" ");
  const secondPart = rest.join(" ");

  const selectedAssignee = allUsers?.find((u) => u.id === filters.assigneeId) ?? null;
  const hasActiveFilters = !!filters.search || filters.priority.length > 0 || !!filters.assigneeId;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 animate-in fade-in duration-700 bg-white">
      {/* Integrated Header - Jira Style */}
      <div className="px-8 pt-8 pb-4 flex flex-col gap-6 border-b border-default-100">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <nav className="flex items-center gap-1 text-[10px] font-bold text-default-400 uppercase tracking-widest mb-2">
              <span>{firstPart.toUpperCase()}-</span>
              <span className="text-primary/70">
                {secondPart.toUpperCase()}
              </span>
              <span className="mx-1">/</span>
              <span className="text-default-900">{t("board.title")}</span>
            </nav>
            <h1 className="text-2xl font-black tracking-tight text-default-900">
              {t("board.title")}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/tasks/new"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all gap-2"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3px]" />
              {t("list.newTask")}
            </Link>
          </div>
        </div>

        {/* Board Tabs & Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {tabs.map((tab) => (
              <Link
                key={tab.label}
                to={tab.path}
                className={cn(
                  "text-xs font-bold pb-2 border-b-2 transition-all",
                  tab.active
                    ? "border-primary text-primary"
                    : "border-transparent text-default-500 hover:text-default-900",
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Input
              isClearable
              size="sm"
              variant="bordered"
              placeholder={t("list.searchPlaceholder")}
              value={filters.search}
              onValueChange={(val) => setFilter("search", val)}
              startContent={<Search className="h-3.5 w-3.5 text-default-400" />}
              className="w-64"
              classNames={{
                input: "text-xs",
                inputWrapper: "rounded-lg border-default-200",
              }}
            />

            {/* Priority Filter */}
            <Dropdown>
              <DropdownTrigger>
                <Button
                  size="sm"
                  variant="bordered"
                  className="rounded-lg border-default-200 font-bold text-xs gap-2"
                  startContent={<Filter className="h-3.5 w-3.5" />}
                >
                  {t("form.priority.label")}
                  {filters.priority.length > 0 && (
                    <Chip
                      size="sm"
                      color="primary"
                      variant="flat"
                      className="h-4 text-[9px]"
                    >
                      {filters.priority.length}
                    </Chip>
                  )}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Filter priority"
                selectionMode="multiple"
                selectedKeys={new Set(filters.priority)}
                onSelectionChange={(keys) =>
                  setFilter("priority", Array.from(keys) as any)
                }
              >
                {priorities.map((p) => (
                  <DropdownItem key={p} className="capitalize">
                    {t(`priority.${p}`)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            {/* Assignee Filter */}
            <Dropdown>
              <DropdownTrigger>
                <Button
                  size="sm"
                  variant="bordered"
                  className={cn(
                    "rounded-lg border-default-200 font-bold text-xs gap-2",
                    filters.assigneeId && "border-primary/40 bg-primary/5 text-primary",
                  )}
                  startContent={
                    selectedAssignee ? (
                      <Avatar
                        src={selectedAssignee.avatar}
                        name={selectedAssignee.name}
                        size="sm"
                        className="h-4 w-4 text-[8px]"
                        showFallback
                      />
                    ) : (
                      <UserCircle2 className="h-3.5 w-3.5" />
                    )
                  }
                >
                  {selectedAssignee
                    ? (i18n.language === "ar" ? selectedAssignee.nameAr : selectedAssignee.name)
                    : t("form.assignee.label")}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Filter by assignee"
                selectionMode="single"
                selectedKeys={filters.assigneeId ? new Set([filters.assigneeId]) : new Set()}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string | undefined;
                  setFilter("assigneeId", selected ?? null);
                }}
              >
                {(allUsers ?? []).map((u) => (
                  <DropdownItem
                    key={u.id}
                    startContent={
                      <Avatar
                        src={u.avatar}
                        name={u.name}
                        size="sm"
                        className="h-6 w-6 text-[10px]"
                        showFallback
                      />
                    }
                  >
                    {i18n.language === "ar" ? u.nameAr : u.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            {hasActiveFilters && (
              <Button
                size="sm"
                variant="light"
                color="danger"
                onPress={resetFilters}
                className="font-bold text-xs"
              >
                {tc("actions.reset")}
              </Button>
            )}

            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="text-default-400"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Full height board */}
      <div className="flex-1 overflow-hidden p-8 bg-default-50/30">
        <KanbanBoard />
      </div>
    </div>
  );
}
