import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAllTasksQuery } from "../hooks/use-tasks";
import { TaskStatsCards } from "../components/task-stats-cards";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@heroui/react";
import {
  CalendarRange,
  ClipboardCheck,
  GraduationCap,
  Kanban,
  ListTodo,
  Plus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTasksWorkspaceNavigation } from "../hooks/use-tasks-workspace-navigation";
import type { TaskStatus } from "../types/task.types";
import {
  TasksAppTile,
  TasksPanel,
  TasksQuickAction,
} from "../components/tasks-ui";
import { TasksOnboardingModal } from "../components/TasksOnboardingModal";

export function TasksDashboardPage() {
  const { t, i18n } = useTranslation("tasks");
  const isAr = i18n.language === "ar";
  const { data, isLoading } = useAllTasksQuery();
  const { openAllTasks, openByStatus } = useTasksWorkspaceNavigation();
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const tasks = data?.data ?? [];
  const recentTasks = [...tasks]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  const openTasks = tasks.filter((task) => task.status !== "done").length;
  const activeSprints = new Set(
    tasks.map((task) => task.sprintId).filter(Boolean)
  ).size;

  return (
    <div className="animate-in fade-in pb-16 duration-300 space-y-6 w-full max-w-full overflow-hidden p-2 sm:p-4 md:p-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-default-200/80 bg-gradient-to-br from-primary/10 via-purple-500/5 to-content1/80 p-5 md:p-6 shadow-sm backdrop-blur-md">
        <div className="absolute -end-10 -top-10 h-44 w-44 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <ListTodo className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground md:text-2xl">
                {t("landing.title")}
              </h1>
              <p className="mt-1 text-xs text-default-500 font-medium">
                {t("landing.subtitle")}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="flat"
              color="secondary"
              onPress={() => setIsTutorialOpen(true)}
              startContent={<GraduationCap size={16} />}
              className="font-bold text-xs rounded-2xl h-11 px-4 border border-secondary/20 shadow-sm"
            >
              {isAr ? "الدليل التعليمي للمهام 🎓" : "Tasks Training Guide 🎓"}
            </Button>
            <TasksQuickAction
              to="/tasks/new"
              icon={Plus}
              label={t("landing.quick.newTask")}
              color="primary"
            />
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <TaskStatsCards tasks={tasks} />

      {/* All Core Modules Grid */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
            <Kanban className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-foreground">أدوات وموديلات العمل</h2>
            <p className="text-xs text-default-400 font-medium">الوصول السريع إلى اللوحات والمهام ودورات التطوير</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          <TasksAppTile
            to="/tasks/work"
            icon={Kanban}
            title={t("landing.apps.board.title", "مساحة العمل والمهام")}
            description="متابعة كافة المهام عبر لوحة كانبان التفاعلية أو القائمة مع الفلترة حسب الحالة والأولوية"
            badge={openTasks || undefined}
            iconClassName="bg-primary/10 text-primary border border-primary/20"
          />
          <TasksAppTile
            to="/tasks/daily-reports"
            icon={ClipboardCheck}
            title="تقارير الإنجاز اليومية"
            description="متابعة تقارير العمل اليومية للموظفين، ساعات العمل، الإنجازات وتقييمات المشرفين"
            iconClassName="bg-sky-500/10 text-sky-600 border border-sky-500/20"
          />
          <TasksAppTile
            to="/tasks/sprints"
            icon={CalendarRange}
            title={t("landing.apps.sprints.title", "دورات التطوير (Sprints)")}
            description={t("landing.apps.sprints.desc", "تخطيط وإدارة السبرنتات والأهداف وجدولة المهام المركزة")}
            badge={activeSprints || undefined}
            iconClassName="bg-violet-500/10 text-violet-600 border border-violet-500/20"
          />
          <TasksAppTile
            to="/tasks/new"
            icon={Plus}
            title={t("landing.apps.newTask.title", "إنشاء مهمة جديدة")}
            description={t("landing.apps.newTask.desc", "إسناد مهمة جديدة للموظف أو الفريق وتحديد الاستحقاق والأولويات")}
            iconClassName="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
          />
        </div>
      </section>

      {/* Recent Activity List */}
      <div>
        <TasksPanel
          title={t("dashboard.recentTasks")}
          action={
            <Button
              size="sm"
              variant="flat"
              color="primary"
              className="h-7 min-w-0 px-3 text-xs font-bold rounded-xl"
              onPress={() => openAllTasks()}
            >
              {t("dashboard.viewAll")}
            </Button>
          }
        >
          {recentTasks.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-6 text-xs text-default-400">
              {t("dashboard.noRecent")}
            </p>
          ) : (
            <div className="divide-y divide-default-100">
              {recentTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="group flex items-center justify-between gap-4 px-3 py-2.5 transition-colors hover:bg-default-100/50 rounded-xl"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs md:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-default-400 mt-0.5">
                      {formatDate(task.updatedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openByStatus(task.status as TaskStatus);
                    }}
                    className="shrink-0"
                  >
                    <StatusBadge status={task.status} />
                  </button>
                </Link>
              ))}
            </div>
          )}
        </TasksPanel>
      </div>

      <p className="pt-2 text-center text-[11px] font-medium text-default-400">{t("landing.footer")}</p>

      {/* Interactive Onboarding Tutorial Modal */}
      <TasksOnboardingModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
}

