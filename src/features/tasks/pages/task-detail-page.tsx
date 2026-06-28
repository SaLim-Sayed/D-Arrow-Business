import { useTranslation } from "react-i18next";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { useCompany } from "@/features/companies/context/company-context";
import { useTaskQuery, useSprintsQuery, useTasksQuery, useAllTasksQuery } from "../hooks/use-tasks";
import { toast } from "sonner";
import type { Task } from "../types/task.types";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useUpdateTask, useDeleteTask } from "../hooks/use-task-mutations";
import { TaskComments } from "../components/task-comments";
import { TaskHistory } from "../components/task-history";
import { AttachmentThumbnail, isLikelyImageUrl } from "../components/attachment-thumbnail";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { FieldBox } from "@/components/shared/field-box";
import { SearchableSelect } from "@/components/shared/searchable-select";
import {
  Button,
  Avatar,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  SelectItem,
  Textarea,
  Input,
  Progress,
} from "@heroui/react";
import { AppDatePicker } from "@/components/shared/app-date-picker";
import { parseDate } from "@internationalized/date";
import {
  FileText,
  Copy,
  Plus,
  Trash2,
  ArrowRight,
  Clock,
  Save,
  Paperclip,
  X,
  ChevronLeft,
  ListTodo,
  MessageSquare,
  Timer,
  Layers,
  AlignLeft,
  History,
  UserRound,
  CalendarRange,
} from "lucide-react";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import {
  normalizeTaskPriorityValue,
  normalizeTaskStatusValue,
} from "../utils/task-field-normalizers";
import { TasksTabBar } from "../components/tasks-ui";

const NAV_TABS = [
  { key: "details", label: "Details", icon: ListTodo },
  { key: "description", label: "Description", icon: AlignLeft },
  { key: "comments", label: "Comments", icon: MessageSquare },
  { key: "history", label: "History", icon: History },
  { key: "attachments", label: "Attachments", icon: Paperclip },
  { key: "log-hours", label: "Log Hours", icon: Timer },
  { key: "subitems", label: "Subitems", icon: Layers },
] as const;

const PRIORITY_CHIP_COLOR: Record<string, "default" | "primary" | "warning" | "danger"> = {
  low: "default",
  medium: "primary",
  high: "warning",
  urgent: "danger",
};

const TYPE_ICON_COLOR: Record<string, string> = {
  task: "bg-primary/10 text-primary",
  story: "bg-success/10 text-success",
  bug: "bg-danger/10 text-danger",
  subtask: "bg-sky-500/10 text-sky-600",
};

function SectionCard({
  id,
  title,
  subtitle,
  icon,
  action,
  children,
  className = "",
  bare = false,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bare?: boolean;
}) {
  return (
    <section id={id} className={`scroll-mt-24 px-4 md:px-6 py-3 ${className}`}>
      <div className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-default-200 bg-content1 shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-default-200 bg-default-50/90 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="shrink-0 text-primary">{icon}</div>
            <div className="min-w-0 text-start">
              <h2 className="text-sm font-bold text-default-800">{title}</h2>
              {subtitle && (
                <p className="mt-0.5 text-xs text-default-500">{subtitle}</p>
              )}
            </div>
          </div>
          {action}
        </div>
        <div className={bare ? "p-0" : "p-4 md:p-5"}>{children}</div>
      </div>
    </section>
  );
}

function SubtasksList({ parentId }: { parentId: string }) {
  const { t } = useTranslation("tasks");
  const navigate = useNavigate();
  const { data, isLoading } = useTasksQuery({ parentId, pageSize: 50 });

  if (isLoading) return <Spinner size="sm" />;

  const subtasks = data?.data || [];

  if (subtasks.length === 0) {
    return (
      <div className="text-center py-6 rounded-lg border border-dashed border-default-200 bg-default-50/50 space-y-3">
        <p className="text-sm text-default-500">{t("detail.noSubtasks")}</p>
        <Button
          size="sm"
          color="primary"
          variant="flat"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => navigate(`/tasks/new?parentId=${parentId}`)}
          className="font-semibold"
        >
          {t("detail.addSubtask")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {subtasks.map((st) => (
        <Link key={st.id} to={`/tasks/${st.id}`} className="block group">
          <div className="flex items-center justify-between p-3 rounded-lg border border-default-200 bg-content1 hover:border-primary/30 hover:bg-primary-50/20 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <StatusBadge status={st.status} />
              <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{st.title}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-default-400 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      ))}
    </div>
  );
}

export function TaskDetailPage() {
  const { t, i18n } = useTranslation("tasks");
  const { t: tc } = useTranslation("common");
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { data: allUsers } = useAllUsers();
  const { data, isLoading: isTaskLoading } = useTaskQuery(taskId!);
  const { data: allSprints } = useSprintsQuery();
  const { data: allTasksResponse } = useAllTasksQuery();
  const { companyId } = useCompany();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>({});
  const [isDirty, setIsDirty] = useState(false);
  const [logHours, setLogHours] = useState("");
  const [logMinutes, setLogMinutes] = useState("");
  const [logDesc, setLogDesc] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isLoading = isTaskLoading || !allUsers;

  // ScrollSpy via IntersectionObserver — highlights active tab when section enters view
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    for (const { key } of NAV_TABS) {
      const el = document.getElementById(`section-${key}`);
      if (!el) continue;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveTab(key); },
        { root: scrollContainerRef.current, threshold: 0.25 }
      );
      obs.observe(el);
      observers.push(obs);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Click a tab → scroll that section into view using its id
  const scrollToSection = (key: string) => {
    const el = document.getElementById(`section-${key}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) return <LoadingSpinner />;

  const baseTask = data?.data;
  const task = baseTask
    ? {
        ...baseTask,
        ...pendingChanges,
        status: normalizeTaskStatusValue(
          pendingChanges.status ?? baseTask.status
        ),
        priority: normalizeTaskPriorityValue(
          pendingChanges.priority ?? baseTask.priority
        ),
        history: pendingChanges.history ?? baseTask.history,
        assignee:
          allUsers?.find(
            (u) =>
              u.id ===
              (pendingChanges.assigneeId !== undefined
                ? pendingChanges.assigneeId
                : baseTask.assigneeId)
          ) || null,
      }
    : null;

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-default-400">{t("detail.notFound")}</p>
        <Button variant="light" className="mt-4" onPress={() => navigate(-1)}>
          {tc("actions.back")}
        </Button>
      </div>
    );
  }

  // Buffer changes locally — only saved when Save button is pressed
  const handleFieldChange = (field: string, value: any) => {
    setPendingChanges((prev: any) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Immediate save (for dropdowns like sprint/assignee/status) — also marks dirty
  const handleInlineChange = (field: string, value: any) => {
    setPendingChanges((prev: any) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleTypeChange = (newType: string) => {
    setPendingChanges((prev: any) => {
      const next = { ...prev, type: newType };
      if (newType !== "subtask") {
        next.parentId = null;
      }
      return next;
    });
    setIsDirty(true);
  };

  const handleParentChange = (parentId: string | null) => {
    setPendingChanges((prev: any) => {
      const next = { ...prev, parentId };
      if (parentId) {
        const parent = allTasksResponse?.data?.find((p) => p.id === parentId);
        if (parent?.sprintId) {
          next.sprintId = parent.sprintId;
        }
      }
      return next;
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    if (Object.keys(pendingChanges).length === 0) return;
    const mergedType = pendingChanges.type ?? task.type;
    const mergedParentId =
      pendingChanges.parentId !== undefined ? pendingChanges.parentId : task.parentId;
    if (mergedType === "subtask" && !mergedParentId) {
      toast.error(t("form.parent.required"));
      return;
    }
    const payload = { ...pendingChanges };
    if (mergedType !== "subtask") {
      payload.parentId = null;
    }
    updateMutation.mutate(
      { id: task.id, data: payload },
      { onSuccess: () => { setPendingChanges({}); setIsDirty(false); } }
    );
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;
    setIsUploading(true);
    try {
      const { TaskService } = await import("../api/tasks.service");
      const url = await TaskService.uploadTaskAttachment(companyId, file);
      const current = task.attachments || [];
      updateMutation.mutate({ id: task.id, data: { attachments: [...current, url] } });
    } catch {
      // silent — toast handled in mutation
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = (url: string) => {
    const current = task.attachments || [];
    updateMutation.mutate({ id: task.id, data: { attachments: current.filter((a: string) => a !== url) } });
  };

  const handleLogTime = () => {
    if (!logHours && !logMinutes) return;
    const h = parseInt(logHours) || 0;
    const m = parseInt(logMinutes) || 0;
    if (h === 0 && m === 0) return;

    const newLog = {
      id: crypto.randomUUID(),
      userId:
        allUsers?.find((u) => u.id === baseTask?.assigneeId)?.id || "unknown",
      hours: h,
      minutes: m,
      description: logDesc,
      date: new Date().toISOString(),
    };

    const currentLogs = task.timeLogs || [];
    handleInlineChange("timeLogs", [...currentLogs, newLog]);
    setLogHours("");
    setLogMinutes("");
    setLogDesc("");
  };

  const parentCandidates =
    allTasksResponse?.data?.filter(
      (t: Task) => t.type !== "subtask" && t.id !== task.id
    ) ?? [];
  const parentTaskRecord = task.parentId
    ? allTasksResponse?.data?.find((t: Task) => t.id === task.parentId)
    : null;
  const parentOptions =
    parentTaskRecord && !parentCandidates.some((p) => p.id === parentTaskRecord.id)
      ? [parentTaskRecord, ...parentCandidates]
      : parentCandidates;

  const activeSprint = task.sprintId
    ? allSprints?.data?.find((s) => s.id === task.sprintId)
    : null;
  const sprintName = activeSprint?.name || t("detail.sections.noActiveSprint");

  const progressPercent =
    task.status === "done"
      ? 100
      : task.status === "in_progress"
      ? 50
      : task.status === "in_review"
      ? 80
      : 0;

  const totalLoggedMinutes = (task.timeLogs || []).reduce(
    (acc: number, l: any) => acc + l.hours * 60 + l.minutes,
    0
  );
  const loggedHours = Math.floor(totalLoggedMinutes / 60);
  const loggedMins = totalLoggedMinutes % 60;

  const taskRef = `TSK-${taskId?.slice(0, 6).toUpperCase()}`;
  const typeIconClass = TYPE_ICON_COLOR[task.type] || TYPE_ICON_COLOR.task;
  const isRtl = i18n.language === "ar";

  const assigneeName = task.assignee
    ? isRtl
      ? task.assignee.nameAr || task.assignee.name
      : task.assignee.name
    : null;

  const displayUserName = (user: { name: string; nameAr?: string | null }) =>
    isRtl && user.nameAr ? user.nameAr : user.name;

  const copyTaskRef = () => {
    navigator.clipboard.writeText(taskRef);
  };

  return (
    <div className="animate-in fade-in pb-24 duration-300">
      <nav className="mb-3 flex items-center gap-1 px-4 text-sm text-default-500 md:px-6">
        <Link to="/tasks" className="hover:text-primary">
          {t("module_name")}
        </Link>
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <Link to="/tasks/work" className="hover:text-primary">
          {t("workspace.title")}
        </Link>
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="max-w-[200px] truncate font-medium text-default-800" dir="auto">
          {task.title}
        </span>
      </nav>

      <div className="flex min-h-[calc(100vh-64px)] flex-col lg:flex-row">
        {/* LEFT SIDEBAR */}
        <aside className="flex w-full shrink-0 flex-col border-b border-default-200 bg-content1 lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] lg:w-[280px] lg:border-b-0 lg:border-e">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <Button
              variant="bordered"
              size="sm"
              className="w-fit border-default-200 font-medium"
              startContent={
                <ChevronLeft className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
              }
              onPress={() => navigate("/tasks/work")}
            >
              {tc("actions.back")}
            </Button>

            <div className="overflow-hidden rounded-lg border border-default-200 bg-content1 shadow-sm">
              <div className="border-b border-default-200 bg-default-50/90 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeIconClass}`}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-default-500">
                      {t("detail.sections.taskId")}
                    </p>
                    <button
                      type="button"
                      onClick={copyTaskRef}
                      className="mt-0.5 flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground transition-colors hover:text-primary"
                    >
                      {taskRef}
                      <Copy className="h-3.5 w-3.5 text-default-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

              {task.parentId && parentTaskRecord && (
                <div className="rounded-lg border border-default-200 bg-content1 p-3 shadow-sm">
                  <p className="mb-1.5 text-[11px] font-medium text-default-500">
                    {t("detail.parentTask")}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/tasks/${parentTaskRecord.id}`)}
                    className="w-full truncate text-start text-sm font-semibold text-primary hover:underline"
                  >
                    {parentTaskRecord.title}
                  </button>
                </div>
              )}

              <div className="space-y-2.5 rounded-lg border border-default-200 bg-content1 p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-default-500">{t("detail.sections.progress")}</span>
                <span className="text-sm font-semibold text-primary">{progressPercent}%</span>
              </div>
              <Progress
                value={progressPercent}
                color="primary"
                size="sm"
                radius="sm"
                className="w-full"
                aria-label={t("detail.sections.progress")}
              />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <Chip size="sm" variant="flat" color="primary" radius="sm" className="font-medium">
                  {t(`status.${task.status}`)}
                </Chip>
                <Chip size="sm" variant="flat" color={PRIORITY_CHIP_COLOR[task.priority]} radius="sm" className="font-medium">
                  {t(`priority.${task.priority}`)}
                </Chip>
                <Chip size="sm" variant="bordered" radius="sm" className="font-medium">
                  {t(`type.${task.type}`)}
                </Chip>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="rounded-lg border border-default-200 bg-content1 p-3 shadow-sm">
                <p className="text-[11px] font-medium text-default-500">{t("form.sprint.label")}</p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground" title={sprintName}>
                  {sprintName}
                </p>
              </div>

              {totalLoggedMinutes > 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary-50/30 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[11px] font-medium text-primary">{t("detail.sections.logHoursTitle")}</p>
                  </div>
                  <p className="text-base font-semibold text-foreground">
                    {loggedHours}h {loggedMins}m
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-default-200 bg-content1 p-3 shadow-sm">
                <p className="mb-1.5 text-[11px] font-medium text-default-500">{t("form.tags.label")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags && task.tags.length > 0 ? (
                    task.tags.map((tag: string) => (
                      <Chip key={tag} size="sm" variant="flat" radius="sm" className="font-medium">
                        {tag}
                      </Chip>
                    ))
                  ) : (
                    <span className="text-xs text-default-400">{t("detail.sections.noTags")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="border-b border-default-200 bg-content1 px-4 py-4 md:px-6">
            <h1
              className="max-w-4xl text-start text-xl font-bold leading-tight text-default-900 md:text-2xl"
              dir="auto"
            >
              {task.title}
            </h1>
            <p className="mt-1.5 text-start text-xs text-default-500">
              {t("detail.sections.createdBy", {
                name: task.reporter?.name || t("history.unknownUser"),
                date: formatDate(task.createdAt),
              })}
            </p>
          </header>

          <nav className="sticky top-0 z-20 border-b border-default-200 bg-default-50/90 px-3 py-2 md:px-4">
            <TasksTabBar
              tabs={NAV_TABS.map(({ key, label, icon }) => ({
                key,
                label: t(`detail.tabs.${key}`, label),
                icon,
                active: activeTab === key,
                onClick: () => scrollToSection(key),
                badge:
                  key === "comments"
                    ? task.commentsCount || 0
                    : key === "attachments"
                    ? task.attachments?.length || 0
                    : undefined,
              }))}
            />
          </nav>

          {/* Scrollable Content */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-24">
            <SectionCard
              id="section-details"
              title={t("detail.sections.detailsTitle")}
              subtitle={t("detail.sections.detailsSubtitle")}
              icon={<ListTodo className="w-5 h-5" />}
            >
              <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                  {task.type === "subtask" && (
                    <div className="sm:col-span-2">
                      <SearchableSelect
                        label={t("form.parent.label")}
                        aria-label={t("form.parent.label")}
                        placeholder={t("form.parent.placeholder")}
                        searchPlaceholder={t("form.search.placeholder")}
                        selectedKey={task.parentId ?? undefined}
                        onSelectionChange={(key) =>
                          handleParentChange(key ? String(key) : null)
                        }
                      >
                        {parentOptions.map((p) => (
                          <SelectItem key={p.id} textValue={p.title}>
                            <div className="flex flex-col text-start">
                              <span dir="auto">{p.title}</span>
                              <span className="text-tiny text-default-400">
                                {t(`type.${p.type}`)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SearchableSelect>
                    </div>
                  )}

                  <SearchableSelect
                    label={t("detail.sections.associatedSprint")}
                    aria-label={t("form.sprint.label")}
                    searchPlaceholder={t("form.search.placeholder")}
                    selectedKey={task.sprintId ?? "no-sprint"}
                    triggerLabel={
                      task.sprintId
                        ? allSprints?.data?.find((s) => s.id === task.sprintId)?.name ??
                          t("form.sprint.unassigned")
                        : t("form.sprint.unassigned")
                    }
                    onSelectionChange={(key) => {
                      const val = key as string;
                      handleInlineChange("sprintId", val === "no-sprint" ? null : val);
                    }}
                  >
                    {[
                      <SelectItem key="no-sprint" textValue={t("form.sprint.unassigned")}>
                        {t("form.sprint.unassigned")}
                      </SelectItem>,
                      ...(allSprints?.data || []).map((s) => (
                        <SelectItem key={s.id} textValue={s.name}>
                          <span dir="auto">{s.name}</span>
                        </SelectItem>
                      )),
                    ]}
                  </SearchableSelect>

                  <SearchableSelect
                    label={t("detail.sections.assignedTo")}
                    aria-label={t("form.assignee.label")}
                    placeholder={t("form.assignee.placeholder")}
                    searchPlaceholder={t("form.assignee.searchPlaceholder")}
                    selectedKey={task.assigneeId ?? null}
                    triggerLabel={assigneeName ?? undefined}
                    startContent={
                      task.assigneeId ? (
                        <Avatar
                          size="sm"
                          src={task.assignee?.avatar}
                          fallback={(assigneeName ?? "U").charAt(0).toUpperCase()}
                          showFallback
                          className="shrink-0"
                        />
                      ) : (
                        <UserRound className="w-4 h-4 text-default-400 shrink-0" />
                      )
                    }
                    renderValue={
                      assigneeName
                        ? () => (
                            <span className="truncate" dir="auto">
                              {assigneeName}
                            </span>
                          )
                        : undefined
                    }
                    onSelectionChange={(key) => {
                      const val = key as string | null;
                      handleInlineChange(
                        "assigneeId",
                        !val || val === "unassigned" ? null : val
                      );
                    }}
                  >
                    {[
                      <SelectItem key="unassigned" textValue={t("form.assignee.unassigned")}>
                        {t("form.assignee.unassigned")}
                      </SelectItem>,
                      ...(allUsers || []).map((u) => {
                        const name = displayUserName(u);
                        return (
                          <SelectItem
                            key={u.id}
                            textValue={name}
                            // @ts-expect-error custom prop used by SearchableSelect filter
                            searchValue={`${name} ${u.email}`}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar
                                size="sm"
                                src={u.avatar}
                                fallback={name.charAt(0).toUpperCase()}
                                showFallback
                              />
                              <div className="flex flex-col text-start min-w-0">
                                <span className="text-small font-medium" dir="auto">
                                  {name}
                                </span>
                                <span className="text-tiny text-default-400" dir="ltr">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      }),
                    ]}
                  </SearchableSelect>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                    <SearchableSelect
                      label={t("form.statusLabel")}
                      aria-label={t("form.statusLabel")}
                      searchPlaceholder={t("form.search.placeholder")}
                      selectedKey={task.status}
                      triggerLabel={t(`status.${task.status}`)}
                      renderValue={() => <StatusBadge status={task.status} />}
                      onSelectionChange={(key) =>
                        key && handleInlineChange("status", key)
                      }
                    >
                      {TASK_STATUSES.map((s) => (
                        <SelectItem key={s} textValue={t(`status.${s}`)}>
                          {t(`status.${s}`)}
                        </SelectItem>
                      ))}
                    </SearchableSelect>

                    <SearchableSelect
                      label={t("detail.sections.priority")}
                      aria-label={t("detail.sections.priority")}
                      searchPlaceholder={t("form.search.placeholder")}
                      selectedKey={task.priority}
                      triggerLabel={t(`priority.${task.priority}`)}
                      renderValue={() => <PriorityBadge priority={task.priority} />}
                      onSelectionChange={(key) =>
                        key && handleInlineChange("priority", key)
                      }
                    >
                      {TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p} textValue={t(`priority.${p}`)}>
                          <PriorityBadge priority={p} />
                        </SelectItem>
                      ))}
                    </SearchableSelect>

                    <SearchableSelect
                      label={t("detail.sections.itemType")}
                      aria-label={t("detail.sections.itemType")}
                      searchPlaceholder={t("form.search.placeholder")}
                      selectedKey={task.type}
                      triggerLabel={t(`type.${task.type}`)}
                      onSelectionChange={(key) =>
                        key && handleTypeChange(String(key))
                      }
                    >
                      <SelectItem key="task" textValue={t("type.task")}>
                        {t("type.task")}
                      </SelectItem>
                      <SelectItem key="subtask" textValue={t("type.subtask")}>
                        {t("type.subtask")}
                      </SelectItem>
                    </SearchableSelect>

                    <FieldBox label={t("detail.sections.startDate")} icon={<CalendarRange className="w-3.5 h-3.5" />}>
                      <AppDatePicker
                        aria-label={t("detail.sections.startDate")}
                        radius="sm"
                        classNames={{
                          base: "w-full",
                          inputWrapper:
                            "bg-transparent shadow-none border-none w-full min-h-0 h-8 px-0",
                          label: "sr-only",
                        }}
                        value={
                          task.startDate
                            ? parseDate(task.startDate.split("T")[0])
                            : null
                        }
                        onChange={(date: any) =>
                          handleInlineChange(
                            "startDate",
                            date ? date.toString() : null
                          )
                        }
                      />
                    </FieldBox>

                    <FieldBox label={t("detail.sections.endDate")} icon={<CalendarRange className="w-3.5 h-3.5" />}>
                      <AppDatePicker
                        aria-label={t("detail.sections.endDate")}
                        radius="sm"
                        classNames={{
                          base: "w-full",
                          inputWrapper:
                            "bg-transparent shadow-none border-none w-full min-h-0 h-8 px-0",
                          label: "sr-only",
                        }}
                        value={
                          task.dueDate
                            ? parseDate(task.dueDate.split("T")[0])
                            : null
                        }
                        onChange={(date: any) =>
                          handleInlineChange(
                            "dueDate",
                            date ? date.toString() : null
                          )
                        }
                      />
                    </FieldBox>
                  </div>
              </div>
            </SectionCard>

            <SectionCard
              id="section-description"
              title={t("detail.sections.descriptionTitle")}
              subtitle={t("detail.sections.descriptionSubtitle")}
              icon={<AlignLeft className="w-5 h-5" />}
            >
              <Textarea
                value={task.description || ""}
                onValueChange={(val) => handleFieldChange("description", val)}
                placeholder={t("detail.sections.descriptionPlaceholder")}
                minRows={4}
                variant="bordered"
                radius="sm"
                classNames={{
                  input: "text-sm whitespace-pre-wrap leading-relaxed text-start",
                  inputWrapper: "bg-content1 border-default-200 rounded-md",
                }}
              />
            </SectionCard>

            <SectionCard
              id="section-comments"
              title={t("detail.sections.commentsTitle")}
              subtitle={
                (task.commentsCount || 0) === 1
                  ? t("detail.sections.commentsSubtitle_one", { count: 1 })
                  : t("detail.sections.commentsSubtitle_other", { count: task.commentsCount || 0 })
              }
              icon={<MessageSquare className="w-5 h-5" />}
              bare
            >
              <TaskComments taskId={task.id} />
            </SectionCard>

            <SectionCard
              id="section-history"
              title={t("detail.history")}
              subtitle={t("detail.historySubtitle")}
              icon={<History className="w-5 h-5" />}
              bare
            >
              <TaskHistory task={task} />
            </SectionCard>

            <SectionCard
              id="section-attachments"
              title={t("detail.sections.attachmentsTitle")}
              subtitle={t("detail.sections.attachmentsSubtitle")}
              icon={<Paperclip className="w-5 h-5" />}
              action={
                <>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="font-semibold"
                    startContent={<Plus className="w-4 h-4" />}
                    isLoading={isUploading}
                    onPress={() => fileInputRef.current?.click()}
                  >
                    {t("detail.sections.upload")}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleUploadAttachment}
                  />
                </>
              }
            >
              {task.attachments && task.attachments.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {task.attachments.map((url: string, idx: number) => (
                    <AttachmentThumbnail
                      key={`${url}-${idx}`}
                      url={url}
                      index={idx}
                      onPreview={() => setPreviewUrl(url)}
                      onDelete={(e) => {
                        e.stopPropagation();
                        handleDeleteAttachment(url);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group mx-auto flex max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-default-200 px-6 py-8 transition-colors hover:border-primary/40 hover:bg-primary-50/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-default-100 transition-colors group-hover:bg-primary-100">
                    <Paperclip className="h-5 w-5 text-default-400 transition-colors group-hover:text-primary" />
                  </div>
                  <p className="text-sm font-medium text-default-500 group-hover:text-primary">
                    {t("detail.sections.clickToUpload")}
                  </p>
                </div>
              )}
            </SectionCard>

            <SectionCard
              id="section-log-hours"
              title={t("detail.sections.logHoursTitle")}
              subtitle={
                totalLoggedMinutes > 0
                  ? t("detail.sections.totalLogged", { hours: loggedHours, minutes: loggedMins })
                  : t("detail.sections.logHoursSubtitle")
              }
              icon={<Timer className="w-5 h-5" />}
              bare
            >
              <div className="space-y-6">
                <div className="max-w-xl space-y-4 rounded-lg border border-default-200 bg-default-50/50 p-4 md:p-5">
                  <div className="flex flex-wrap gap-3">
                    <Input
                      type="number"
                      label={t("detail.sections.hours")}
                      placeholder="0"
                      labelPlacement="inside"
                      value={logHours}
                      onValueChange={setLogHours}
                      className="w-[120px]"
                      variant="bordered"
                    />
                    <Input
                      type="number"
                      label={t("detail.sections.minutes")}
                      placeholder="0"
                      labelPlacement="inside"
                      value={logMinutes}
                      onValueChange={setLogMinutes}
                      className="w-[120px]"
                      variant="bordered"
                    />
                  </div>
                  <Textarea
                    label={t("form.description.label")}
                    placeholder={t("detail.sections.logDescPlaceholder")}
                    labelPlacement="inside"
                    value={logDesc}
                    onValueChange={setLogDesc}
                    minRows={2}
                    variant="bordered"
                  />
                  <Button color="primary" size="sm" className="font-semibold" onPress={handleLogTime}>
                    {t("detail.sections.saveLog")}
                  </Button>
                </div>
                <div className="max-w-xl space-y-3">
                  {task.timeLogs && task.timeLogs.length > 0 ? (
                    task.timeLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 rounded-lg border border-default-200 bg-content1 p-4"
                      >
                        <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <span className="font-bold text-foreground">
                              {log.hours}h {log.minutes}m
                            </span>
                            <span className="shrink-0 text-xs text-default-400">
                              {formatDate(log.date)}
                            </span>
                          </div>
                          <p className="text-sm text-default-600">
                            {log.description || t("detail.noDescription")}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg border border-dashed border-default-200 py-4 text-center text-sm text-default-400">
                      {t("detail.sections.noTimeLogged")}
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              id="section-subitems"
              title={t("detail.sections.subitemsTitle")}
              subtitle={t("detail.sections.subitemsSubtitle")}
              icon={<Layers className="w-5 h-5" />}
              className="border-b-0"
              action={
                task.type !== "subtask" ? (
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    startContent={<Plus className="w-4 h-4" />}
                    className="font-semibold"
                    onPress={() => navigate(`/tasks/new?parentId=${task.id}`)}
                  >
                    {t("detail.addSubtask")}
                  </Button>
                ) : undefined
              }
            >
              <SubtasksList parentId={task.id} />
            </SectionCard>
          </div>

          <footer className="sticky bottom-0 z-30 flex shrink-0 items-center justify-between gap-4 border-t border-default-200 bg-default-50/90 px-4 py-2.5 md:px-6">
            <Button
              color="danger"
              variant="flat"
              size="sm"
              radius="sm"
              onPress={() => setIsDeleteModalOpen(true)}
              startContent={<Trash2 className="w-4 h-4" />}
              className="font-medium"
            >
              {t("detail.sections.delete")}
            </Button>
            <div className="flex items-center gap-2">
              {isDirty && (
                <Chip size="sm" variant="flat" color="warning" radius="sm" className="font-medium">
                  {t("detail.sections.unsavedChanges")}
                </Chip>
              )}
              <Button
                color="primary"
                size="sm"
                radius="sm"
                isDisabled={!isDirty}
                isLoading={updateMutation.isPending}
                onPress={handleSave}
                startContent={<Save className="w-4 h-4" />}
                className="font-semibold min-w-[130px]"
              >
                {t("detail.saveChanges")}
              </Button>
            </div>
          </footer>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        size="sm"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader>
                <h3 className="text-lg font-bold">{t("delete.title")}</h3>
              </ModalHeader>
              <ModalBody>
                <p>{t("delete.message")}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => setIsDeleteModalOpen(false)}
                >
                  {tc("actions.cancel")}
                </Button>
                <Button
                  color="danger"
                  onPress={() =>
                    deleteMutation.mutate(task.id, {
                      onSuccess: () => navigate("/tasks/work"),
                    })
                  }
                  isLoading={deleteMutation.isPending}
                >
                  {tc("actions.delete")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={!!previewUrl}
        onOpenChange={(open) => {
          if (!open) setPreviewUrl(null);
        }}
        size="4xl"
        classNames={{
          base: "bg-transparent shadow-none",
          backdrop: "bg-black/80 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalBody className="p-0 relative flex items-center justify-center min-h-[50vh]">
                <Button
                  isIconOnly
                  variant="flat"
                  className="absolute top-4 right-4 z-50 bg-black/50 text-white hover:bg-black/70"
                  onPress={onClose}
                >
                  <X className="w-5 h-5" />
                </Button>
                {previewUrl && (
                  isLikelyImageUrl(previewUrl) ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                    />
                  ) : (
                    <iframe
                      src={previewUrl}
                      className="w-full h-[85vh] rounded-xl bg-white"
                      title="Preview"
                    />
                  )
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
