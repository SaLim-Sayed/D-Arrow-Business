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
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { FieldBox } from "@/components/shared/field-box";
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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DatePicker,
  Textarea,
  Input,
  Progress,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import {
  FileText,
  Copy,
  Plus,
  CheckCircle2,
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
} from "lucide-react";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

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
  task: "from-primary to-violet-500",
  story: "from-emerald-500 to-teal-500",
  bug: "from-danger to-orange-500",
  epic: "from-amber-500 to-orange-400",
  subtask: "from-sky-500 to-blue-500",
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
    <section
      id={id}
      className={`scroll-mt-24 p-6 md:p-8 border-b border-default-100/80 ${className}`}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">{icon}</div>
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
              {subtitle && <p className="text-xs text-default-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
        {bare ? (
          children
        ) : (
          <div className="rounded-2xl border border-default-200/60 bg-content1/80 backdrop-blur-sm shadow-sm p-5 md:p-6">
            {children}
          </div>
        )}
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
      <div className="text-center py-8 rounded-xl border border-dashed border-default-200 bg-default-50/50 space-y-4">
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
          <div className="flex items-center justify-between p-4 rounded-xl border border-default-200/80 bg-default-50/50 hover:border-primary/30 hover:bg-primary-50/30 transition-all">
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
  const sprintName = activeSprint?.name || "No Active Sprint";
  const sprintLongName = activeSprint ? `${activeSprint.name}` : "Not Assigned";

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
  const typeGradient = TYPE_ICON_COLOR[task.type] || TYPE_ICON_COLOR.task;

  const copyTaskRef = () => {
    navigator.clipboard.writeText(taskRef);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-default-50 via-content1 to-default-100/80">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
        {/* LEFT SIDEBAR */}
        <aside className="w-full lg:w-[300px] shrink-0 border-b lg:border-b-0 lg:border-r border-default-200/80 bg-content1/90 backdrop-blur-md flex flex-col lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] shadow-sm">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <Button
              variant="light"
              size="sm"
              className="w-fit -ml-1 font-semibold text-default-500"
              startContent={<ChevronLeft className="w-4 h-4" />}
              onPress={() => navigate("/tasks/list")}
            >
              {tc("actions.back")}
            </Button>

            <div className="rounded-2xl overflow-hidden border border-default-200/60 shadow-sm">
              <div className={`h-20 bg-gradient-to-br ${typeGradient} opacity-90`} />
              <div className="px-4 pb-4 -mt-10 relative">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${typeGradient} text-white flex items-center justify-center shadow-lg ring-4 ring-content1`}>
                  <FileText className="w-7 h-7" />
                </div>
                <p className="mt-3 text-xs font-bold text-default-500 uppercase tracking-widest">Task ID</p>
                <button
                  type="button"
                  onClick={copyTaskRef}
                  className="mt-1 flex items-center gap-2 font-mono text-sm font-bold text-foreground hover:text-primary transition-colors"
                >
                  {taskRef}
                  <Copy className="w-3.5 h-3.5 text-default-400" />
                </button>
              </div>
            </div>

              {task.parentId && parentTaskRecord && (
                <div className="rounded-xl p-4 border border-default-200/60 bg-content1">
                  <p className="text-[10px] font-bold text-default-500 uppercase tracking-widest mb-2">
                    {t("detail.parentTask")}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/tasks/${parentTaskRecord.id}`)}
                    className="w-full text-left font-bold text-sm text-primary hover:underline truncate"
                  >
                    {parentTaskRecord.title}
                  </button>
                </div>
              )}

              <div className="rounded-xl border border-default-200/60 p-4 bg-default-50/50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-default-500 uppercase tracking-wide">Progress</span>
                <span className="text-sm font-black text-primary">{progressPercent}%</span>
              </div>
              <Progress
                value={progressPercent}
                color="primary"
                size="sm"
                className="w-full"
                aria-label="Task progress"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                <Chip size="sm" variant="flat" color="primary" className="capitalize font-semibold">
                  {t(`status.${task.status}`)}
                </Chip>
                <Chip size="sm" variant="flat" color={PRIORITY_CHIP_COLOR[task.priority]} className="capitalize font-semibold">
                  {t(`priority.${task.priority}`)}
                </Chip>
                <Chip size="sm" variant="bordered" className="capitalize font-semibold">
                  {t(`type.${task.type}`)}
                </Chip>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl p-4 border border-warning-200/60 bg-warning-50/40">
                <p className="text-[10px] font-bold text-warning-700 uppercase tracking-widest">Sprint</p>
                <p className="font-bold text-sm text-foreground mt-1 truncate" title={sprintName}>
                  {sprintName}
                </p>
              </div>

              {totalLoggedMinutes > 0 && (
                <div className="rounded-xl p-4 border border-primary-200/60 bg-primary-50/40">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-primary" />
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Time logged</p>
                  </div>
                  <p className="font-black text-lg text-foreground">
                    {loggedHours}h {loggedMins}m
                  </p>
                </div>
              )}

              <div className="rounded-xl p-4 border border-default-200/60 bg-content1">
                <p className="text-[10px] font-bold text-default-500 uppercase tracking-widest mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags && task.tags.length > 0 ? (
                    task.tags.map((tag: string) => (
                      <Chip key={tag} size="sm" variant="flat" className="font-medium">
                        {tag}
                      </Chip>
                    ))
                  ) : (
                    <span className="text-xs text-default-400">No tags</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Main Header */}
          <header className="px-6 md:px-8 pt-6 pb-4 border-b border-default-100/80 bg-content1/60 backdrop-blur-sm">
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-tight max-w-4xl">
              {task.title}
            </h1>
            <p className="text-sm text-default-500 mt-2">
              Created by{" "}
              <span className="font-semibold text-foreground">{task.reporter?.name || "Unknown"}</span>
              {" · "}
              <span className="font-semibold text-foreground">{formatDate(task.createdAt)}</span>
            </p>
          </header>

          {/* Sticky ScrollSpy Nav */}
          <nav className="sticky top-0 z-20 bg-content1/95 backdrop-blur-md border-b border-default-200/80 px-4 md:px-6 py-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {NAV_TABS.map(({ key, label, icon: TabIcon }) => {
                const isActive = activeTab === key;
                const count = key === "comments" ? task.commentsCount || 0 : key === "attachments" ? task.attachments?.length || 0 : null;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => scrollToSection(key)}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "text-default-600 hover:bg-default-100"
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {label}
                    {count !== null && count > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-default-200"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Scrollable Content */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-24">
            <SectionCard
              id="section-details"
              title="Task Details"
              subtitle="Sprint, assignee, status, and scheduling"
              icon={<ListTodo className="w-5 h-5" />}
            >
              <div className="space-y-8">
              <div>
                <h3 className="text-xs font-bold text-default-500 uppercase tracking-widest mb-4">Primary</h3>
                <div className="grid grid-cols-1 gap-4 max-w-2xl">
                  {task.type === "subtask" && (
                    <Dropdown>
                      <DropdownTrigger>
                        <div className="w-full">
                          <FieldBox
                            label={t("form.parent.label")}
                            className="cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center justify-between w-full gap-2">
                              {parentTaskRecord ? (
                                <button
                                  type="button"
                                  className="font-medium text-sm text-primary hover:underline truncate text-left"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/tasks/${parentTaskRecord.id}`);
                                  }}
                                >
                                  {parentTaskRecord.title}
                                </button>
                              ) : (
                                <span className="text-sm text-warning font-medium">
                                  {t("form.parent.placeholder")}
                                </span>
                              )}
                              <ArrowRight className="w-4 h-4 text-default-400 shrink-0" />
                            </div>
                          </FieldBox>
                        </div>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label={t("form.parent.label")}
                        onAction={(key) =>
                          handleParentChange(key === "none" ? null : key.toString())
                        }
                      >
                        {[
                          <DropdownItem key="none">{t("form.parent.placeholder")}</DropdownItem>,
                          ...parentOptions.map((p) => (
                            <DropdownItem key={p.id} textValue={p.title}>
                              <div className="flex flex-col">
                                <span>{p.title}</span>
                                <span className="text-tiny text-default-400 capitalize">
                                  {t(`type.${p.type}`)}
                                </span>
                              </div>
                            </DropdownItem>
                          )),
                        ]}
                      </DropdownMenu>
                    </Dropdown>
                  )}

                  <Dropdown>
                    <DropdownTrigger>
                      <div className="w-full">
                        <FieldBox
                          label="Associated Sprint"
                          className="cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-default-700 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                              {sprintLongName}
                            </span>
                          </div>
                        </FieldBox>
                      </div>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Sprint"
                      onAction={(key) =>
                        handleInlineChange(
                          "sprintId",
                          key === "none" ? null : key.toString()
                        )
                      }
                    >
                      {[
                        <DropdownItem key="none">No Sprint</DropdownItem>,
                        ...(allSprints?.data || []).map((s) => (
                          <DropdownItem key={s.id}>{s.name}</DropdownItem>
                        )),
                      ]}
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-default-500 uppercase tracking-widest mb-4">Properties</h3>
                <div className="space-y-4">
                  <Dropdown>
                    <DropdownTrigger>
                      <div className="w-full">
                        <FieldBox
                          label="Assigned to"
                          className="cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 bg-default-100 py-1 px-2 rounded-md">
                            <Avatar
                              size="sm"
                              src={task.assignee?.avatar}
                              fallback={(task.assignee?.name ?? "U")
                                .charAt(0)
                                .toUpperCase()}
                              showFallback
                              className="w-5 h-5 text-[10px]"
                            />
                            <span className="font-medium text-xs">
                              {(i18n.language === "ar"
                                ? task.assignee?.nameAr
                                : task.assignee?.name) ||
                                t("form.assignee.unassigned")}
                            </span>
                          </div>
                        </FieldBox>
                      </div>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Assignee"
                      onAction={(key) =>
                        handleInlineChange(
                          "assigneeId",
                          key === "unassigned" ? null : key.toString()
                        )
                      }
                    >
                      {[
                        <DropdownItem key="unassigned">
                          {t("form.assignee.unassigned")}
                        </DropdownItem>,
                        ...(allUsers || []).map((u: any) => (
                          <DropdownItem key={u.id}>{u.name}</DropdownItem>
                        )),
                      ]}
                    </DropdownMenu>
                  </Dropdown>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Dropdown>
                      <DropdownTrigger>
                        <div className="w-full">
                          <FieldBox
                            label="Status"
                            className="cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span className="text-success">
                                  <CheckCircle2 className="w-4 h-4 fill-success text-white" />
                                </span>
                                <span className="font-bold text-sm text-foreground capitalize">
                                  {t(`status.${task.status}`)}
                                </span>
                              </div>
                            </div>
                          </FieldBox>
                        </div>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Status"
                        onAction={(key) => handleInlineChange("status", key)}
                      >
                        {TASK_STATUSES.map((s) => (
                          <DropdownItem key={s}>{t(`status.${s}`)}</DropdownItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>

                    <FieldBox label="Epic">
                      <span className="font-bold text-sm text-foreground">
                        None
                      </span>
                    </FieldBox>

                    <Dropdown>
                      <DropdownTrigger>
                        <div className="w-full">
                          <FieldBox
                            label="Item Type"
                            className="cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="font-bold text-sm text-foreground capitalize">
                                {t(`type.${task.type}`)}
                              </span>
                            </div>
                          </FieldBox>
                        </div>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Item Type"
                        onAction={(key) => handleTypeChange(key.toString())}
                      >
                        <DropdownItem key="task">{t("type.task")}</DropdownItem>
                        <DropdownItem key="epic">{t("type.epic")}</DropdownItem>
                        <DropdownItem key="subtask">{t("type.subtask")}</DropdownItem>
                      </DropdownMenu>
                    </Dropdown>

                    <Dropdown>
                      <DropdownTrigger>
                        <div className="w-full">
                          <FieldBox
                            label="Priority"
                            className="cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                  task.priority === "urgent"
                                    ? "bg-danger"
                                    : task.priority === "high"
                                    ? "bg-warning"
                                    : task.priority === "medium"
                                    ? "bg-primary"
                                    : "bg-default-400"
                                }`}
                              />
                              <span className="font-bold text-sm text-foreground capitalize">
                                {t(`priority.${task.priority}`)}
                              </span>
                            </div>
                          </FieldBox>
                        </div>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Priority"
                        onAction={(key) => handleInlineChange("priority", key)}
                      >
                        {TASK_PRIORITIES.map((p) => (
                          <DropdownItem key={p}>
                            {t(`priority.${p}`)}
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>

                    <FieldBox label="Start Date">
                      <DatePicker
                        aria-label="Start Date"
                        classNames={{
                          base: "w-full -mt-2",
                          inputWrapper:
                            "bg-transparent shadow-none w-full min-h-0 h-8",
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

                    <FieldBox label="End Date">
                      <DatePicker
                        aria-label="End Date"
                        classNames={{
                          base: "w-full -mt-2",
                          inputWrapper:
                            "bg-transparent shadow-none w-full min-h-0 h-8",
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
              </div>
              </div>
            </SectionCard>

            <SectionCard
              id="section-description"
              title="Description"
              subtitle="Add context, acceptance criteria, or notes"
              icon={<AlignLeft className="w-5 h-5" />}
            >
              <Textarea
                value={task.description || ""}
                onValueChange={(val) => handleFieldChange("description", val)}
                placeholder="No description provided. Type to add one."
                minRows={5}
                variant="bordered"
                classNames={{
                  input: "text-sm whitespace-pre-wrap leading-relaxed",
                  inputWrapper: "bg-default-50/80 border-default-200 rounded-xl",
                }}
              />
            </SectionCard>

            <SectionCard
              id="section-comments"
              title="Comments"
              subtitle={`${task.commentsCount || 0} discussion${(task.commentsCount || 0) === 1 ? "" : "s"}`}
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
              title="Attachments"
              subtitle="Files linked to this task"
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
                    Upload
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
                  className="cursor-pointer border-2 border-dashed border-default-200/80 rounded-xl py-8 px-6 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary-50/20 transition-all group max-w-md mx-auto"
                >
                  <div className="w-10 h-10 rounded-full bg-default-100 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    <Paperclip className="w-5 h-5 text-default-400 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm text-default-500 group-hover:text-primary font-medium">
                    Click to upload files
                  </p>
                </div>
              )}
            </SectionCard>

            <SectionCard
              id="section-log-hours"
              title="Log Hours"
              subtitle={totalLoggedMinutes > 0 ? `Total logged: ${loggedHours}h ${loggedMins}m` : "Track time spent on this task"}
              icon={<Timer className="w-5 h-5" />}
              bare
            >
              <div className="space-y-6">
                <div className="rounded-2xl border border-default-200/60 bg-gradient-to-br from-primary-50/50 to-content1 p-5 md:p-6 space-y-4 max-w-xl shadow-sm">
                  <div className="flex flex-wrap gap-3">
                    <Input
                      type="number"
                      label="Hours"
                      placeholder="0"
                      labelPlacement="inside"
                      value={logHours}
                      onValueChange={setLogHours}
                      className="w-[120px]"
                      variant="bordered"
                      classNames={{
                        inputWrapper: "bg-content1 shadow-sm",
                        label: "text-default-500 font-semibold",
                      }}
                    />
                    <Input
                      type="number"
                      label="Minutes"
                      placeholder="0"
                      labelPlacement="inside"
                      value={logMinutes}
                      onValueChange={setLogMinutes}
                      className="w-[120px]"
                      variant="bordered"
                      classNames={{
                        inputWrapper: "bg-content1 shadow-sm",
                        label: "text-default-500 font-semibold",
                      }}
                    />
                  </div>
                  <Textarea
                    label="Description"
                    placeholder="What did you work on?"
                    labelPlacement="inside"
                    value={logDesc}
                    onValueChange={setLogDesc}
                    minRows={2}
                    variant="bordered"
                    classNames={{
                      inputWrapper: "bg-content1 shadow-sm",
                      label: "text-default-500 font-semibold",
                    }}
                  />
                  <Button color="primary" className="font-bold" onPress={handleLogTime}>
                    Save Log
                  </Button>
                </div>
                <div className="space-y-3 max-w-xl">
                  {task.timeLogs && task.timeLogs.length > 0 ? (
                    task.timeLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="p-4 rounded-xl border border-default-200/80 bg-content1 flex gap-4 items-start shadow-sm"
                      >
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="font-bold text-foreground">
                              {log.hours}h {log.minutes}m
                            </span>
                            <span className="text-xs text-default-400 shrink-0">
                              {formatDate(log.date)}
                            </span>
                          </div>
                          <p className="text-sm text-default-600">
                            {log.description || "No description."}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-default-400 text-sm py-4 text-center rounded-xl border border-dashed border-default-200">
                      No time logged yet.
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              id="section-subitems"
              title="Subitems"
              subtitle="Child tasks linked to this item"
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

          {/* Sticky footer — scoped to main column */}
          <footer className="shrink-0 sticky bottom-0 z-30 bg-content1/95 backdrop-blur-md border-t border-default-200/80 px-6 md:px-8 py-3 flex items-center justify-between gap-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
            <Button
              color="danger"
              variant="flat"
              size="sm"
              onPress={() => setIsDeleteModalOpen(true)}
              startContent={<Trash2 className="w-4 h-4" />}
              className="font-semibold"
            >
              Delete
            </Button>
            <div className="flex items-center gap-3">
              {isDirty && (
                <Chip size="sm" variant="flat" color="warning" className="font-semibold animate-pulse">
                  Unsaved changes
                </Chip>
              )}
              <Button
                color="primary"
                size="sm"
                isDisabled={!isDirty}
                isLoading={updateMutation.isPending}
                onPress={handleSave}
                startContent={<Save className="w-4 h-4" />}
                className="font-bold shadow-md shadow-primary/25 min-w-[140px]"
              >
                Save Changes
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
                      onSuccess: () => navigate("/tasks/list"),
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
