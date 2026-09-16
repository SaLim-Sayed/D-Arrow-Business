import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { TaskService } from "../api/tasks.service";
import { TaskNotificationService } from "../api/task-notifications.service";
import { DailyReportsService } from "@/features/people/api/daily-reports.service";
import { useSprintsQuery } from "./use-tasks";
import type { CreateTaskDTO, UpdateTaskDTO } from "../types/task.types";
import { toast } from "sonner";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuth } from "@/features/auth/context/auth-context";
import i18n from "@/lib/i18n";

const t = (key: string) => i18n.t(key, { ns: "tasks" });

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: CreateTaskDTO) =>
      TaskService.createTask(companyId!, data, {
        userId: user?.id ?? "unknown",
        userName: user?.name,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
      toast.success(t("toast.created"));

      if (response?.data && companyId) {
        TaskNotificationService.notifyTaskChange(response.data, companyId, "created", user?.email);
      }
    },
    onError: () => {
      toast.error(t("toast.createFailed"));
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDTO }) =>
      TaskService.updateTask(companyId!, id, data, {
        userId: user?.id ?? "unknown",
        userName: user?.name,
      }),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.all });

      // Snapshot the previous values for all matching queries
      const previousQueries = queryClient.getQueriesData({ queryKey: QUERY_KEYS.tasks.all });

      // Optimistically update to the new value across all matching queries
      queryClient.setQueriesData({ queryKey: QUERY_KEYS.tasks.all }, (old: any) => {
        if (!old || !old.data) return old;
        
        // Handle list queries (where data is an array of tasks)
        if (Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((task: any) =>
              task.id === id ? { ...task, ...data } : task
            ),
          };
        }
        
        // Handle detail queries (where data is a single task object)
        if (old.data.id === id) {
          return {
            ...old,
            data: { ...old.data, ...data }
          };
        }

        return old;
      });

      // Return a context object with the snapshotted values
      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, roll back all affected queries
      context?.previousQueries?.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });
      toast.error(t("toast.updateFailed"));
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.tasks.detail(variables.id),
      });
      toast.success(t("toast.updated"));

      if (response?.data && companyId) {
        const updateType = variables.data.assigneeId ? "assigned" : "updated";
        TaskNotificationService.notifyTaskChange(response.data, companyId, updateType, user?.email);

        // Automatically generate daily report when task status is completed/done
        if (variables.data.status === "done" && user) {
          try {
            const taskTitle = response.data.title || "المهمة المكتملة";
            DailyReportsService.createDailyReport(companyId, {
              employeeId: user.id,
              employeeName: user.name || "سالم السيد",
              userPhotoUrl: user.avatar || undefined,
              attendanceId: "auto-generated",
              tasksCompleted: [
                {
                  id: variables.id,
                  title: taskTitle,
                  status: "done",
                },
              ],
              tasksInProgress: [],
              summary: `تم إكمال وتأكيد المهمة تلقائياً: "${taskTitle}"`,
              blockers: "",
              planTomorrow: "",
              productivityRating: 5,
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: ["daily_reports", companyId] });
              toast.success(
                i18n.language === "ar"
                  ? `🎉 تم إغلاق المهمة وإنشاء التقرير اليومي تلقائياً لسالم!`
                  : `🎉 Task closed & daily report generated automatically!`
              );
            });
          } catch (err) {
            console.error("Auto daily report creation error:", err);
          }
        }
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we are in sync with the server
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
    },
  });
}

export function useSeedWorkedTasks() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();
  const { data: allSprints } = useSprintsQuery();

  return useMutation({
    mutationFn: async () => {
      if (!companyId || !user) return;
      const activeSprint = allSprints?.data?.find((s) => s.status === "active") || allSprints?.data?.[0];
      const sprintId = activeSprint?.id || null;

      const workedTasks = [
        {
          title: "تحسين تصميم لوحة المهام وجداول العرض (Kanban & Table UI Enhancement)",
          description: "تحسين استجابة الجداول (Responsive Table)، تقليل الحشو والشاشات، وإصلاح مشاكل التجاوز والتمرير الأفقي في الواجهة.",
          status: "done" as const,
          priority: "high" as const,
          type: "task" as const,
          sprintId,
          assigneeId: user.id,
        },
        {
          title: "نظام الجولة التعليمية التفاعلية لنظام المهام (Interactive Tasks Onboarding Tour)",
          description: "إضافة الدليل التدريبي والتعليمي التفاعلي لكيفية استخدام نظام المهام والسبرنتات للشركة.",
          status: "done" as const,
          priority: "urgent" as const,
          type: "task" as const,
          sprintId,
          assigneeId: user.id,
        },
        {
          title: "إدارة دورات التطوير وتعيين الدورة النشطة (Sprints & Active Sprint Management)",
          description: "إضافة إمكانية تعيين الدورة النشطة وإكمال الدورات ومزامنة الحالات تلقائياً حسب التاريخ.",
          status: "done" as const,
          priority: "high" as const,
          type: "task" as const,
          sprintId,
          assigneeId: user.id,
        },
        {
          title: "تتبع تقدم الدورات تلقائياً بناءً على التواريخ (Date-Based Sprint Metrics & Progress)",
          description: "إظهار نسبة الإنجاز وعدد الأيام المتبقية والمنقضية في بطاقة الدورة بناءً على توازين البدء والانتهاء.",
          status: "done" as const,
          priority: "medium" as const,
          type: "task" as const,
          sprintId,
          assigneeId: user.id,
        },
        {
          title: "ربط اختيار الدورة وتخصيص الفلاتر الافتراضية (Mandatory Sprint Requirement & Workspace Filter)",
          description: "جعل اختيار الدورة إجبارياً وتحديد الدورة النشطة تلقائياً عند إنشاء مهمة وفي فلتر لوحة المهام.",
          status: "done" as const,
          priority: "high" as const,
          type: "task" as const,
          sprintId,
          assigneeId: user.id,
        },
        {
          title: "توليد التقارير اليومية تلقائياً عند إغلاق المهمة (Auto Daily Report Generation)",
          description: "إنشاء وتوثيق تقرير الإنجاز اليومي لسالم السيد فور تغيير حالة المهمة إلى مكتملة (done).",
          status: "done" as const,
          priority: "urgent" as const,
          type: "task" as const,
          sprintId,
          assigneeId: user.id,
        },
        {
          title: "ضبط اتجاهات الأسهم في الواجهات العربية (RTL Arrow Alignment & Chevrons Fix)",
          description: "إصلاح اتجاهات أسهم التمرير وأيقونات التنقل في نمط اتجاه النص العربي RTL.",
          status: "done" as const,
          priority: "medium" as const,
          type: "task" as const,
          sprintId,
          assigneeId: user.id,
        },
        {
          title: "تطوير واجهة التقرير اليومي وتكامل البيانات (Tasks Daily Reports Integration)",
          description: "متابعة التقارير اليومية وتفاصيل الساعات المنجزة والتقييم الذاتي للموظفين.",
          status: "in_progress" as const,
          priority: "high" as const,
          type: "task" as const,
          sprintId,
          assigneeId: user.id,
        },
      ];

      let createdCount = 0;
      const completedTasksForReport = [];

      for (const taskData of workedTasks) {
        const res = await TaskService.createTask(companyId, taskData, {
          userId: user.id,
          userName: user.name || "سالم السيد",
        });
        createdCount++;

        if (taskData.status === "done" && res.data) {
          completedTasksForReport.push({
            id: res.data.id,
            title: res.data.title,
            status: "done",
          });
        }
      }

      // Create a master daily report for the completed work
      if (completedTasksForReport.length > 0) {
        try {
          await DailyReportsService.createDailyReport(companyId, {
            employeeId: user.id,
            employeeName: user.name || "سالم السيد",
            userPhotoUrl: user.avatar || undefined,
            attendanceId: "auto-generated",
            tasksCompleted: completedTasksForReport,
            tasksInProgress: [
              {
                id: "in-prog-1",
                title: "تطوير واجهة التقرير اليومي وتكامل البيانات (Tasks Daily Reports Integration)",
                status: "in_progress",
              },
            ],
            summary: "تم تنفيذ وتطوير كافة ميزات ولوحات المهام والدورات والتقارير اليومية بنجاح 🚀",
            blockers: "لا توجد عوائق حالياً",
            planTomorrow: "الاستمرار في تحسين تجربة المستخدم وإضافة الميزات الجديدة",
            productivityRating: 5,
          });
        } catch (reportErr) {
          console.error("Failed to create master daily report:", reportErr);
        }
      }

      return createdCount;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
      queryClient.invalidateQueries({ queryKey: ["daily_reports", companyId] });
      toast.success(
        i18n.language === "ar"
          ? `تم إضافة مهام الأيام السابقة (${count} مهمة) لسالم وتوليد التقرير اليومي تلقائياً 🚀`
          : `Added recent worked tasks (${count}) for Salem and generated daily report 🚀`
      );
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (id: string) => TaskService.deleteTask(companyId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
      toast.success(t("toast.deleted"));
    },
    onError: () => {
      toast.error(t("toast.deleteFailed"));
    },
  });
}

export function useDeleteAllTasks() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: () => TaskService.deleteAllTasks(companyId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
      toast.success(i18n.language === "ar" ? "تم حذف جميع المهام بنجاح! 🧹" : "All tasks deleted successfully! 🧹");
    },
    onError: () => {
      toast.error(i18n.language === "ar" ? "فشل حذف جميع المهام" : "Failed to delete all tasks");
    },
  });
}
