import { useState } from "react";
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Select,
  SelectItem,
  Progress,
} from "@heroui/react";
import { NativeDateInput } from "@/components/shared/native-date-input";
import {
  Calendar,
  Flag,
  Plus,
  ArrowRight,
  CheckCircle2,
  Pencil,
  Zap,
  Play,
  Sparkles,
  CalendarCheck,
} from "lucide-react";
import { useSprintsQuery } from "../hooks/use-tasks";
import { TaskService } from "../api/tasks.service";
import { useCompany } from "@/features/companies/context/company-context";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { TasksPageHeader, TasksPanel } from "../components/tasks-ui";
import type { Sprint } from "../types/task.types";

/**
 * Calculates date metrics for a sprint relative to today's date
 */
function getSprintDateMetrics(startDate: string, endDate: string) {
  if (!startDate || !endDate) return null;
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const totalDays = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );

  const elapsedMs = now.getTime() - start.getTime();
  const elapsedDays = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)) + 1);
  const remainingDays = Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const isTodayInRange = now >= start && now <= end;
  const isPast = now > end;
  const isFuture = now < start;

  const progressPercent = isPast
    ? 100
    : isFuture
    ? 0
    : Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

  return {
    totalDays,
    elapsedDays,
    remainingDays,
    isTodayInRange,
    isPast,
    isFuture,
    progressPercent,
  };
}

export function SprintsPage() {
  const { t, i18n } = useTranslation("tasks");
  const isAr = i18n.language === "ar";
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: sprintsResponse, isLoading } = useSprintsQuery();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [newSprint, setNewSprint] = useState<{
    name: string;
    startDate: string;
    endDate: string;
    goal: string;
    status: NonNullable<Sprint["status"]>;
  }>({
    name: "",
    startDate: "",
    endDate: "",
    goal: "",
    status: "planned",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingSprintId, setEditingSprintId] = useState<string | null>(null);

  const sprints = sprintsResponse?.data || [];

  const handleSaveSprint = async () => {
    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) {
      toast.error(t("sprints.msgFillRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSprintId) {
        await TaskService.updateSprint(companyId!, editingSprintId, newSprint);
        toast.success(t("sprints.msgUpdateSuccess"));
      } else {
        await TaskService.createSprint(companyId!, {
          ...newSprint,
          status: newSprint.status || "planned",
        });
        toast.success(t("sprints.msgCreateSuccess"));
      }
      queryClient.invalidateQueries({ queryKey: ["sprints", companyId] });
      onOpenChange();
      setNewSprint({ name: "", startDate: "", endDate: "", goal: "", status: "planned" });
      setEditingSprintId(null);
    } catch {
      toast.error(
        editingSprintId ? t("sprints.msgUpdateError") : t("sprints.msgCreateError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetActiveSprint = async (sprint: Sprint, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!companyId) return;

    try {
      // Deactivate other active sprints if any
      const activeSprints = sprints.filter((s) => s.id !== sprint.id && s.status === "active");
      for (const s of activeSprints) {
        await TaskService.updateSprint(companyId, s.id, { status: "completed" });
      }

      // Activate current sprint
      await TaskService.updateSprint(companyId, sprint.id, { status: "active" });

      toast.success(
        isAr
          ? `تم تعيين الدورة "${sprint.name}" كدورة نشطة بنجاح 🚀`
          : `Sprint "${sprint.name}" is now set as active 🚀`
      );
      queryClient.invalidateQueries({ queryKey: ["sprints", companyId] });
    } catch (err) {
      console.error("Failed to set active sprint:", err);
      toast.error(isAr ? "فشل تغيير حالة الدورة" : "Failed to activate sprint");
    }
  };

  const handleCompleteSprint = async (sprint: Sprint, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!companyId) return;

    try {
      await TaskService.updateSprint(companyId, sprint.id, { status: "completed" });
      toast.success(
        isAr
          ? `تم إكمال الدورة "${sprint.name}" بنجاح 🎉`
          : `Sprint "${sprint.name}" completed 🎉`
      );
      queryClient.invalidateQueries({ queryKey: ["sprints", companyId] });
    } catch (err) {
      console.error("Failed to complete sprint:", err);
      toast.error(isAr ? "فشل إكمال الدورة" : "Failed to complete sprint");
    }
  };

  const handleSyncSprintsByDate = async () => {
    if (!companyId || sprints.length === 0) return;
    setIsSyncing(true);
    try {
      let updatedCount = 0;
      for (const s of sprints) {
        const metrics = getSprintDateMetrics(s.startDate, s.endDate);
        if (!metrics) continue;

        let expectedStatus: Sprint["status"] = s.status;
        if (metrics.isTodayInRange) {
          expectedStatus = "active";
        } else if (metrics.isPast) {
          expectedStatus = "completed";
        } else if (metrics.isFuture) {
          expectedStatus = "planned";
        }

        if (expectedStatus !== s.status) {
          await TaskService.updateSprint(companyId, s.id, { status: expectedStatus });
          updatedCount++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["sprints", companyId] });
      toast.success(
        isAr
          ? `تم تحديث حالات الدورات تلقائياً بناءً على تاريخ اليوم (${updatedCount} دورة 📅)`
          : `Synced sprint statuses based on dates (${updatedCount} updated)`
      );
    } catch (err) {
      console.error("Failed to sync sprint statuses by date:", err);
      toast.error(isAr ? "فشل تحديث الحالات بالتواريخ" : "Failed to sync statuses by date");
    } finally {
      setIsSyncing(false);
    }
  };

  const openEditModal = (sprint: Sprint) => {
    setEditingSprintId(sprint.id);
    setNewSprint({
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      goal: sprint.goal || "",
      status: sprint.status || "planned",
    });
    onOpen();
  };

  const getStatusChip = (status: string, metrics?: ReturnType<typeof getSprintDateMetrics>) => {
    const isActive = status === "active" || (metrics?.isTodayInRange && status !== "completed");

    if (isActive) {
      return (
        <Chip
          color="primary"
          variant="solid"
          size="sm"
          startContent={<Zap className="h-3.5 w-3.5 animate-pulse" />}
          className="font-black text-xs shadow-sm bg-primary text-primary-foreground"
        >
          {isAr ? "🚀 الدورة النشطة الحالية" : t("sprints.statusActive")}
        </Chip>
      );
    }

    if (status === "completed" || (metrics?.isPast && status === "completed")) {
      return (
        <Chip
          color="success"
          variant="flat"
          size="sm"
          startContent={<CheckCircle2 className="h-3 w-3" />}
          className="font-bold text-xs"
        >
          {t("sprints.statusCompleted")}
        </Chip>
      );
    }

    return (
      <Chip
        color="default"
        variant="flat"
        size="sm"
        startContent={<Flag className="h-3 w-3" />}
        className="font-bold text-xs"
      >
        {t("sprints.statusPlanned")}
      </Chip>
    );
  };

  const updateDateAndAutoSetStatus = (field: "startDate" | "endDate", value: string) => {
    const updated = { ...newSprint, [field]: value };
    if (updated.startDate && updated.endDate) {
      const metrics = getSprintDateMetrics(updated.startDate, updated.endDate);
      if (metrics) {
        if (metrics.isTodayInRange) updated.status = "active";
        else if (metrics.isPast) updated.status = "completed";
        else updated.status = "planned";
      }
    }
    setNewSprint(updated);
  };

  return (
    <div className="animate-in fade-in pb-24 duration-300 space-y-6">
      <TasksPageHeader
        title={t("sprints.title")}
        description={t("sprints.description")}
        breadcrumbLabel={t("nav.dashboard")}
        breadcrumbTo="/tasks"
        action={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {sprints.length > 0 && (
              <Button
                color="secondary"
                variant="flat"
                size="sm"
                isLoading={isSyncing}
                className="font-bold rounded-2xl h-10 px-3.5"
                startContent={!isSyncing && <CalendarCheck className="h-4 w-4" />}
                onPress={handleSyncSprintsByDate}
              >
                {isAr ? "مزامنة الدورة بالتواريخ 📅" : "Sync by Dates 📅"}
              </Button>
            )}
            <Button
              color="primary"
              size="sm"
              className="font-bold rounded-2xl h-10 px-4"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => {
                setEditingSprintId(null);
                setNewSprint({ name: "", startDate: "", endDate: "", goal: "", status: "planned" });
                onOpen();
              }}
            >
              {t("sprints.newSprint")}
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" color="primary" />
        </div>
      ) : sprints.length === 0 ? (
        <TasksPanel title={t("sprints.noSprints")}>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="mb-3 h-10 w-10 text-default-300" />
            <p className="text-sm text-default-500">{t("sprints.noSprintsHint")}</p>
            <Button
              color="primary"
              size="sm"
              className="mt-4 font-bold rounded-xl"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => {
                setEditingSprintId(null);
                setNewSprint({ name: "", startDate: "", endDate: "", goal: "", status: "planned" });
                onOpen();
              }}
            >
              {t("sprints.newSprint")}
            </Button>
          </div>
        </TasksPanel>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sprints.map((sprint) => {
            const metrics = getSprintDateMetrics(sprint.startDate, sprint.endDate);
            const isActive =
              sprint.status === "active" ||
              (metrics?.isTodayInRange && sprint.status !== "completed");

            return (
              <div
                key={sprint.id}
                onClick={() => navigate(`/tasks/work?sprintId=${sprint.id}`)}
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden rounded-3xl border text-start shadow-sm backdrop-blur-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-md",
                  isActive
                    ? "border-primary border-2 bg-gradient-to-br from-primary/5 via-purple-500/5 to-background shadow-primary/10"
                    : "border-default-200/80 bg-background/80 hover:border-primary/40"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-default-100/80 bg-default-50/60 px-5 py-3.5">
                    {getStatusChip(sprint.status, metrics || undefined)}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        className="h-8 w-8 min-w-0 rounded-xl"
                        onPress={() => openEditModal(sprint)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-default-400 group-hover:text-primary" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5 space-y-3">
                    <h3 className="line-clamp-1 text-base font-black text-foreground">
                      {sprint.name}
                    </h3>

                    {sprint.goal ? (
                      <p className="line-clamp-2 text-xs text-default-500 font-medium leading-relaxed">
                        {sprint.goal}
                      </p>
                    ) : (
                      <p className="text-xs text-default-300 italic">
                        {isAr ? "لا يوجد هدف محدد للدورة" : "No goal defined"}
                      </p>
                    )}

                    <div className="space-y-2 rounded-2xl border border-default-100 bg-default-50/70 p-3">
                      <div className="flex items-center gap-2 text-xs text-default-600 font-semibold">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                        <span>{format(new Date(sprint.startDate), "MMM d, yyyy")}</span>
                        <ArrowRight className="h-3 w-3 shrink-0 rtl:rotate-180 text-default-400" />
                        <span>{format(new Date(sprint.endDate), "MMM d, yyyy")}</span>
                      </div>

                      {/* Date Progress Metrics */}
                      {metrics && (
                        <div className="space-y-1.5 pt-1 border-t border-default-200/40">
                          <div className="flex items-center justify-between text-[11px] font-bold text-default-500">
                            <span>
                              {metrics.isTodayInRange
                                ? isAr
                                  ? `اليوم ${metrics.elapsedDays} من ${metrics.totalDays} (متبقي ${metrics.remainingDays} يوم)`
                                  : `Day ${metrics.elapsedDays} of ${metrics.totalDays} (${metrics.remainingDays}d left)`
                                : metrics.isPast
                                ? isAr
                                  ? "انتهت فترة الدورة"
                                  : "Sprint period ended"
                                : isAr
                                ? `تبدأ بعد ${Math.abs(metrics.elapsedDays)} يوم`
                                : "Starts soon"}
                            </span>
                            <span className="text-primary font-black">{metrics.progressPercent}%</span>
                          </div>
                          <Progress
                            value={metrics.progressPercent}
                            color={isActive ? "primary" : metrics.isPast ? "success" : "default"}
                            size="sm"
                            className="h-1.5 rounded-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 border-t border-default-100 bg-default-50/40 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  {!isActive ? (
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      startContent={<Play size={13} className="fill-primary" />}
                      onPress={(e) => handleSetActiveSprint(sprint, e as unknown as React.MouseEvent)}
                      className="font-extrabold text-xs rounded-xl w-full h-9"
                    >
                      {isAr ? "تعيين كدورة نشطة 🚀" : "Set Active Sprint 🚀"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      color="success"
                      variant="flat"
                      startContent={<CheckCircle2 size={14} />}
                      onPress={(e) => handleCompleteSprint(sprint, e as unknown as React.MouseEvent)}
                      className="font-extrabold text-xs rounded-xl w-full h-9"
                    >
                      {isAr ? "إكمال الدورة ✅" : "Complete Sprint ✅"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Sprint Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
        <ModalContent dir={isAr ? "rtl" : "ltr"}>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b border-default-100 p-5">
                <div className="flex items-center gap-2 text-foreground font-black text-lg">
                  <Sparkles size={20} className="text-primary" />
                  <span>{editingSprintId ? t("sprints.editSprint") : t("sprints.createSprint")}</span>
                </div>
              </ModalHeader>
              <ModalBody className="space-y-4 p-5">
                <Input
                  label={t("sprints.nameLabel", "اسم الدورة (Sprint Name)")}
                  placeholder={t("sprints.namePlaceholder", "مثال: Sprint 1 - تطوير ميزات المستندات")}
                  variant="bordered"
                  value={newSprint.name}
                  onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                  classNames={{ inputWrapper: "rounded-2xl" }}
                />

                <Select
                  label={isAr ? "حالة الدورة (Status)" : "Sprint Status"}
                  selectedKeys={[newSprint.status]}
                  onChange={(e) =>
                    setNewSprint({
                      ...newSprint,
                      status: (e.target.value || "planned") as NonNullable<Sprint["status"]>,
                    })
                  }
                  variant="bordered"
                  classNames={{ trigger: "rounded-2xl" }}
                >
                  <SelectItem key="planned" startContent={<Flag size={14} />}>
                    {isAr ? "مخطط له (Planned)" : "Planned"}
                  </SelectItem>
                  <SelectItem key="active" startContent={<Zap size={14} className="text-primary" />}>
                    {isAr ? "🚀 نشط - الدورة الحالية (Active)" : "Active"}
                  </SelectItem>
                  <SelectItem key="completed" startContent={<CheckCircle2 size={14} className="text-success" />}>
                    {isAr ? "✅ مكتمل (Completed)" : "Completed"}
                  </SelectItem>
                </Select>

                <div className="grid grid-cols-2 gap-4">
                  <NativeDateInput
                    label={t("sprints.startDate", "تاريخ البدء")}
                    variant="bordered"
                    value={newSprint.startDate ? newSprint.startDate.split("T")[0] : ""}
                    onChange={(e) => updateDateAndAutoSetStatus("startDate", e.target.value)}
                  />
                  <NativeDateInput
                    label={t("sprints.endDate", "تاريخ الانتهاء")}
                    variant="bordered"
                    value={newSprint.endDate ? newSprint.endDate.split("T")[0] : ""}
                    onChange={(e) => updateDateAndAutoSetStatus("endDate", e.target.value)}
                  />
                </div>
                <Input
                  label={t("sprints.goalLabel", "هدف الدورة (Sprint Goal)")}
                  placeholder={t("sprints.goalPlaceholder", "اكتب الأهداف الرئيسية المطلوب تحقيقها...")}
                  variant="bordered"
                  value={newSprint.goal}
                  onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                  classNames={{ inputWrapper: "rounded-2xl" }}
                />
              </ModalBody>
              <ModalFooter className="border-t border-default-100 p-4">
                <Button variant="flat" onPress={onClose} className="font-bold text-xs rounded-xl">
                  {t("sprints.cancel")}
                </Button>
                <Button color="primary" onPress={handleSaveSprint} isLoading={isSubmitting} className="font-bold text-xs rounded-xl">
                  {editingSprintId ? t("sprints.saveChanges") : t("sprints.createBtn")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
