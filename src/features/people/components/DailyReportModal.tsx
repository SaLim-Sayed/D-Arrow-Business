import { useState, useEffect } from "react";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Textarea, 
  Checkbox, 
  Chip, 
  Divider,
  Input
} from "@heroui/react";
import { 
  ClipboardCheck, 
  AlertTriangle, 
  Send, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  ListTodo, 
  Sparkles
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/context/auth-context";
import { useCompany } from "@/features/companies/context/company-context";
import { TaskService } from "@/features/tasks/api/tasks.service";
import type { Task } from "@/features/tasks/types/task.types";
import { DailyReportsService } from "../api/daily-reports.service";
import type { TaskSummaryRef } from "../types/daily-report.types";

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessCheckOut: () => Promise<void>;
  attendance: any;
  liveSeconds?: number;
  accumulatedSeconds?: number;
}

export function DailyReportModal({
  isOpen,
  onClose,
  onSuccessCheckOut,
  attendance,
  liveSeconds = 0,
  accumulatedSeconds = 0,
}: DailyReportModalProps) {
  const { t } = useTranslation("people");
  const { user } = useAuth();
  const { companyId } = useCompany();

  // Form states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedCompletedTasks, setSelectedCompletedTasks] = useState<string[]>([]);
  const [selectedInProgressTasks, setSelectedInProgressTasks] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [blockers, setBlockers] = useState("");
  const [planTomorrow, setPlanTomorrow] = useState("");
  
  // Emergency Skip States
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch active user tasks
  useEffect(() => {
    if (isOpen && companyId && user?.id) {
      setLoadingTasks(true);
      TaskService.getTasks(companyId, { assigneeId: user.id })
        .then((res) => {
          if (res.data) {
            setTasks(res.data);
            // Auto-select completed tasks today
            const doneToday = res.data.filter((t) => t.status === "done").map((t) => t.id);
            const inProgress = res.data.filter((t) => t.status === "in_progress").map((t) => t.id);
            setSelectedCompletedTasks(doneToday);
            setSelectedInProgressTasks(inProgress);
          }
        })
        .catch((err) => {
          console.error("Failed to load user tasks for daily report:", err);
        })
        .finally(() => {
          setLoadingTasks(false);
        });
    }
  }, [isOpen, companyId, user?.id]);

  const totalSeconds = accumulatedSeconds + liveSeconds;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const toggleTaskCompleted = (taskId: string) => {
    setSelectedCompletedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
    // Remove from in progress if added to completed
    setSelectedInProgressTasks((prev) => prev.filter((id) => id !== taskId));
  };

  const toggleTaskInProgress = (taskId: string) => {
    setSelectedInProgressTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
    setSelectedCompletedTasks((prev) => prev.filter((id) => id !== taskId));
  };

  const handleSubmitReport = async () => {
    if (!summary.trim() && !showSkipConfirm) {
      toast.error(t("daily_report.error_summary_required") || "يرجى كتابة ملخص ما تم إنجازه اليوم");
      return;
    }

    if (!companyId || !user?.id || !attendance?.id) {
      toast.error("بيانات غير مكتملة لتسجيل التقرير");
      return;
    }

    setIsSubmitting(true);
    try {
      const completedRefs: TaskSummaryRef[] = tasks
        .filter((t) => selectedCompletedTasks.includes(t.id))
        .map((t) => ({ id: t.id, title: t.title, status: t.status }));

      const inProgressRefs: TaskSummaryRef[] = tasks
        .filter((t) => selectedInProgressTasks.includes(t.id))
        .map((t) => ({ id: t.id, title: t.title, status: t.status }));

      await DailyReportsService.createDailyReport(companyId, {
        employeeId: user.id,
        employeeName: user.name || "موظف",
        userPhotoUrl: user.avatar,
        attendanceId: attendance.id,
        checkInTime: attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        totalHours: Number((totalSeconds / 3600).toFixed(2)),
        tasksCompleted: completedRefs,
        tasksInProgress: inProgressRefs,
        summary: summary.trim(),
        blockers: blockers.trim(),
        planTomorrow: planTomorrow.trim(),
        isSkipped: false,
      });

      toast.success(t("daily_report.submit_success") || "تم إرسال التقرير اليومي وتسجيل الخروج بنجاح");
      onClose();
      await onSuccessCheckOut();
    } catch (err) {
      console.error("Failed to submit daily report:", err);
      toast.error("حدث خطأ أثناء حفظ التقرير اليومي");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipReport = async () => {
    if (!companyId || !user?.id || !attendance?.id) return;

    setIsSubmitting(true);
    try {
      await DailyReportsService.createDailyReport(companyId, {
        employeeId: user.id,
        employeeName: user.name || "موظف",
        userPhotoUrl: user.avatar,
        attendanceId: attendance.id,
        checkInTime: attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        totalHours: Number((totalSeconds / 3600).toFixed(2)),
        tasksCompleted: [],
        tasksInProgress: [],
        summary: "تخطي إدخال التقرير اليومي (خروج طارئ)",
        isSkipped: true,
        skipReason: skipReason.trim() || "خروج طارئ",
      });

      toast.warning(t("daily_report.skipped_notice") || "تم تخطي التقرير وتسجيل الخروج");
      setShowSkipConfirm(false);
      onClose();
      await onSuccessCheckOut();
    } catch (err) {
      console.error("Failed to skip report checkout:", err);
      toast.error("حدث خطأ أثناء تسجيل الخروج");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="2xl" 
      scrollBehavior="inside"
      backdrop="blur"
      className="bg-background/95 backdrop-blur-2xl border border-default-200/50 shadow-2xl rounded-3xl"
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 border-b border-default-100/60 pb-4 pt-6 px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <ClipboardCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      {t("daily_report.title") || "التقرير اليومي لإنجاز العمل"}
                      <Sparkles size={16} className="text-warning animate-pulse" />
                    </h3>
                    <p className="text-xs text-default-400 font-normal">
                      {t("daily_report.subtitle") || "قم بتأكيد إنجازات اليوم وملخص العمل قبل تسجيل الخروج"}
                    </p>
                  </div>
                </div>

                {/* Shift time summary badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-default-100 border border-default-200/60">
                  <Clock size={15} className="text-primary" />
                  <span className="text-xs font-mono font-bold text-foreground">
                    {hours} س {minutes} د
                  </span>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className="py-6 px-6 space-y-6">
              {!showSkipConfirm ? (
                <>
                  {/* Tasks Checklist Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase text-default-500 tracking-wider flex items-center gap-1.5">
                        <ListTodo size={14} className="text-primary" />
                        {t("daily_report.tasks_worked_on") || "المهام التي تم العمل عليها اليوم"}
                      </label>
                      <Chip size="sm" variant="flat" color="primary" className="text-[10px] font-bold">
                        {tasks.length} {t("daily_report.tasks_count") || "مهام"}
                      </Chip>
                    </div>

                    {loadingTasks ? (
                      <div className="p-4 text-center text-xs text-default-400">
                        {t("daily_report.loading_tasks")}
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-default-50 border border-dashed border-default-200 text-center text-xs text-default-400">
                        {t("daily_report.no_tasks_assigned")}
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {tasks.map((task) => (
                          <div 
                            key={task.id} 
                            className="p-3 rounded-2xl bg-default-50 border border-default-100 hover:border-primary/30 transition-all flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <span className="text-sm font-medium text-foreground truncate">
                                {task.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <label className="flex items-center gap-1 text-[11px] font-semibold text-success cursor-pointer">
                                <Checkbox 
                                  size="sm"
                                  color="success"
                                  isSelected={selectedCompletedTasks.includes(task.id)}
                                  onValueChange={() => toggleTaskCompleted(task.id)}
                                />
                                {t("daily_report.task_completed")}
                              </label>
                              <label className="flex items-center gap-1 text-[11px] font-semibold text-warning cursor-pointer">
                                <Checkbox 
                                  size="sm"
                                  color="warning"
                                  isSelected={selectedInProgressTasks.includes(task.id)}
                                  onValueChange={() => toggleTaskInProgress(task.id)}
                                />
                                {t("daily_report.task_in_progress")}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Divider className="my-2" />

                  {/* Achievements Summary */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-default-500 tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-success" />
                      {t("daily_report.summary")} <span className="text-danger">*</span>
                    </label>
                    <Textarea
                      placeholder={t("daily_report.summary_placeholder")}
                      minRows={3}
                      value={summary}
                      onValueChange={setSummary}
                      variant="bordered"
                      classNames={{
                        inputWrapper: "rounded-2xl border-default-200 focus-within:border-primary",
                      }}
                    />
                  </div>

                  {/* Blockers & Challenges */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-default-500 tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-warning" />
                      {t("daily_report.blockers")}
                    </label>
                    <Textarea
                      placeholder={t("daily_report.blockers_placeholder")}
                      minRows={2}
                      value={blockers}
                      onValueChange={setBlockers}
                      variant="bordered"
                      classNames={{
                        inputWrapper: "rounded-2xl border-default-200 focus-within:border-warning",
                      }}
                    />
                  </div>

                  {/* Plan for Tomorrow */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-default-500 tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-primary" />
                      {t("daily_report.plan_tomorrow")}
                    </label>
                    <Textarea
                      placeholder={t("daily_report.plan_tomorrow_placeholder")}
                      minRows={2}
                      value={planTomorrow}
                      onValueChange={setPlanTomorrow}
                      variant="bordered"
                      classNames={{
                        inputWrapper: "rounded-2xl border-default-200 focus-within:border-primary",
                      }}
                    />
                  </div>

                </>
              ) : (
                /* Emergency Skip UI */
                <div className="py-4 space-y-4 text-center">
                  <div className="p-4 rounded-3xl bg-warning/10 text-warning mx-auto w-16 h-16 flex items-center justify-center">
                    <AlertTriangle size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-foreground">
                      {t("daily_report.skip_confirm_title")}
                    </h4>
                    <p className="text-xs text-default-400 mt-1 max-w-md mx-auto">
                      {t("daily_report.skip_confirm_desc")}
                    </p>
                  </div>

                  <Input
                    placeholder={t("daily_report.skip_reason_placeholder")}
                    value={skipReason}
                    onValueChange={setSkipReason}
                    variant="bordered"
                    className="max-w-md mx-auto"
                  />
                </div>
              )}
            </ModalBody>

            <ModalFooter className="border-t border-default-100/60 pt-4 pb-6 px-6 flex items-center justify-between">
              {!showSkipConfirm ? (
                <>
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => setShowSkipConfirm(true)}
                    className="font-bold text-xs"
                  >
                    {t("daily_report.skip_button")}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="flat" 
                      color="default" 
                      onPress={onClose}
                      className="font-bold text-xs"
                    >
                      {t("daily_report.cancel")}
                    </Button>
                    <Button 
                      color="primary" 
                      variant="shadow"
                      onPress={handleSubmitReport}
                      isLoading={isSubmitting}
                      className="font-bold text-xs bg-gradient-to-r from-primary to-indigo-600 shadow-primary/30"
                      startContent={!isSubmitting && <Send size={15} />}
                    >
                      {t("daily_report.submit_and_checkout")}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setShowSkipConfirm(false)}
                    className="font-bold text-xs"
                  >
                    {t("daily_report.back_to_report")}
                  </Button>

                  <Button
                    color="danger"
                    variant="shadow"
                    onPress={handleSkipReport}
                    isLoading={isSubmitting}
                    className="font-bold text-xs shadow-danger/30"
                    startContent={!isSubmitting && <LogOut size={15} />}
                  >
                    {t("daily_report.confirm_emergency_checkout")}
                  </Button>
                </div>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
