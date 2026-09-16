import { useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Modal, ModalContent, useDisclosure } from "@heroui/react";
import { Kanban, List, Plus, Trash2, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasksUIStore } from "../store/tasks-ui.store";
import { TasksWorkspaceFilters } from "../components/tasks-workspace-filters";
import { TasksListView } from "../components/tasks-list-view";
import { KanbanBoard } from "../components/kanban-board";
import { useDeleteAllTasks, useSeedWorkedTasks } from "../hooks/use-task-mutations";
import {
  TasksPageHeader,
  TasksShell,
  TasksTabBar,
} from "../components/tasks-ui";

import { useSprintsQuery } from "../hooks/use-tasks";

const WORK_BASE = "/tasks/work";

export function TasksWorkspacePage() {
  const { t, i18n } = useTranslation("tasks");
  const isAr = i18n.language === "ar";
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { filters, setFilter } = useTasksUIStore();
  const { data: allSprints } = useSprintsQuery();

  const { isOpen: isOpenDeleteAll, onOpen: onOpenDeleteAll, onOpenChange: onOpenChangeDeleteAll } = useDisclosure();
  const deleteAllTasksMutation = useDeleteAllTasks();
  const seedTasksMutation = useSeedWorkedTasks();

  const isList = location.pathname.endsWith("/list");
  const isBoard = !isList;

  useEffect(() => {
    const sprintIdFromUrl = searchParams.get("sprintId");
    if (sprintIdFromUrl) {
      setFilter("sprintId", sprintIdFromUrl);
    } else if (!filters.sprintId && allSprints?.data && allSprints.data.length > 0) {
      const activeSprint = allSprints.data.find((s) => s.status === "active") || allSprints.data[0];
      if (activeSprint) {
        setFilter("sprintId", activeSprint.id);
      }
    }
  }, [searchParams, allSprints, setFilter, filters.sprintId]);

  const viewTabs = [
    {
      key: "board",
      label: t("workspace.views.board"),
      path: WORK_BASE,
      icon: Kanban,
      active: isBoard,
    },
    {
      key: "list",
      label: t("workspace.views.list"),
      path: `${WORK_BASE}/list`,
      icon: List,
      active: isList,
    },
  ] as const;

  return (
    <div
      className={cn(
        "animate-in fade-in duration-300",
        isBoard &&
          "flex h-[calc(100dvh-var(--header-height)-env(safe-area-inset-bottom,0px))] min-h-0 flex-col -mb-4 md:-mb-6"
      )}
    >
      <div className={cn(isBoard && "shrink-0")}>
        <TasksPageHeader
          compact={isBoard}
          title={isList ? t("list.title") : t("board.title")}
          description={isList ? t("list.description") : t("board.description")}
          breadcrumbLabel={t("nav.dashboard")}
          breadcrumbTo="/tasks"
          action={
            <div className="flex items-center gap-2">
              <TasksTabBar
                tabs={viewTabs.map((tab) => ({
                  key: tab.key,
                  label: tab.label,
                  icon: tab.icon,
                  active: tab.active,
                  to: tab.path,
                }))}
              />
              <Button
                size="sm"
                variant="flat"
                color="secondary"
                isLoading={seedTasksMutation.isPending}
                onPress={() => seedTasksMutation.mutate()}
                className="font-bold rounded-xl h-9"
                startContent={!seedTasksMutation.isPending && <Sparkles className="h-4 w-4 text-purple-500" />}
              >
                {isAr ? "إضافة مهام الأيام السابقة 🚀" : "Add Worked Tasks 🚀"}
              </Button>
              <Button
                as={Link}
                to="/tasks/new"
                size="sm"
                color="primary"
                className="font-bold rounded-xl shadow-sm shadow-primary/25 h-9"
                startContent={<Plus className="h-4 w-4" />}
              >
                {t("list.newTask")}
              </Button>

              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="flat" className="rounded-xl border border-default-200/80 bg-content1 h-9 w-9 min-w-9">
                    <Trash2 className="h-4 w-4 text-default-500 hover:text-danger" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Workspace Options">
                  <DropdownItem
                    key="delete-all"
                    color="danger"
                    className="text-danger font-bold"
                    onPress={onOpenDeleteAll}
                    startContent={<Trash2 className="h-4 w-4" />}
                  >
                    {isAr ? "حذف جميع المهام" : "Delete All Tasks"}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          }
        />
      </div>

      <TasksShell
        bleed={isBoard}
        className={cn(isBoard && "flex min-h-0 flex-1 flex-col")}
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TasksWorkspaceFilters compact={isBoard} />
          </div>
        }
      >
        <div
          className={cn(
            isBoard
              ? "flex min-h-0 flex-1 flex-col px-2 pb-1 pt-0"
              : "-mx-1 px-1"
          )}
        >
          {isBoard ? <KanbanBoard /> : <TasksListView />}
        </div>
      </TasksShell>

      {/* Delete All Tasks Confirmation Dialog */}
      <Modal isOpen={isOpenDeleteAll} onOpenChange={onOpenChangeDeleteAll} size="md" classNames={{ backdrop: "backdrop-blur-sm" }}>
        <ModalContent className="rounded-3xl p-2 border border-default-100 shadow-2xl">
          {(onClose) => (
            <div dir={isAr ? "rtl" : "ltr"} className="p-6 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-danger-500/10 text-danger border border-danger-500/20 flex items-center justify-center">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">
                  {isAr ? "حذف جميع المهام نهائياً" : "Delete All Tasks"}
                </h3>
                <p className="text-xs text-default-500 mt-1 leading-relaxed max-w-sm mx-auto">
                  {isAr
                    ? "هل أنت تأكد من رغبتك في مسح وحذف جميع المهام المسجلة في النظام نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
                    : "Are you sure you want to permanently delete all tasks in the system? This action cannot be undone."}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="flat" onPress={onClose} className="font-bold rounded-2xl">
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  color="danger"
                  onPress={async () => {
                    await deleteAllTasksMutation.mutateAsync();
                    onClose();
                  }}
                  isLoading={deleteAllTasksMutation.isPending}
                  startContent={<Trash2 size={16} />}
                  className="font-bold rounded-2xl shadow-lg shadow-danger/25"
                >
                  {isAr ? "نعم، مسح وحذف الكل" : "Yes, Delete All Tasks"}
                </Button>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
