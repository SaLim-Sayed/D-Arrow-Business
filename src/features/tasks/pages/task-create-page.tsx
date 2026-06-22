import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreateTask } from "../hooks/use-task-mutations";
import { useTaskQuery } from "../hooks/use-tasks";
import { TaskForm } from "../components/task-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody, Chip } from "@heroui/react";
import { ListTodo, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function TaskCreatePage() {
  const { t, i18n } = useTranslation("tasks");
  const isRtl = i18n.language === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentId = searchParams.get("parentId");
  const createTask = useCreateTask();
  const { data: parentTaskResponse } = useTaskQuery(parentId ?? "");
  const parentTask = parentId ? parentTaskResponse?.data : null;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title={parentId ? t("detail.addSubtask") : t("form.createTitle")}
        onBack={() => (parentId ? navigate(`/tasks/${parentId}`) : navigate(-1))}
      />

      {parentTask && (
        <div className="rounded-lg border border-primary/20 bg-primary-50/40 px-4 py-3 flex items-center gap-3">
          <Layers className="w-5 h-5 text-primary shrink-0" />
          <div className="min-w-0 text-start flex-1">
            <p className="text-xs font-bold text-default-500 uppercase tracking-wide">
              {t("form.createSubtaskFor")}
            </p>
            <Chip variant="flat" color="primary" className="mt-1 font-semibold max-w-full">
              <span className="truncate" dir="auto">
                {parentTask.title}
              </span>
            </Chip>
          </div>
        </div>
      )}

      <Card
        radius="sm"
        className="border border-default-200 shadow-sm overflow-hidden"
      >
        <div
          className={cn(
            "h-1 bg-gradient-to-r from-primary via-violet-500 to-blue-500",
            isRtl && "bg-gradient-to-l"
          )}
        />
        <CardBody className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-default-100">
            <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
              <ListTodo className="w-4 h-4" />
            </div>
            <div className="min-w-0 text-start flex-1">
              <p className="text-sm font-semibold text-foreground">
                {parentId ? t("type.subtask") : t("type.task")}
              </p>
              <p className="text-xs text-default-500 mt-0.5">
                {parentId ? t("form.parent.linkedTo") : t("form.createHint")}
              </p>
            </div>
          </div>
          <TaskForm
            parentTaskId={parentId}
            onSubmit={(data) => {
              createTask.mutate(data, {
                onSuccess: () => {
                  if (parentId) {
                    navigate(`/tasks/${parentId}`);
                  } else {
                    navigate("/tasks/work");
                  }
                },
              });
            }}
            isSubmitting={createTask.isPending}
          />
        </CardBody>
      </Card>
    </div>
  );
}
