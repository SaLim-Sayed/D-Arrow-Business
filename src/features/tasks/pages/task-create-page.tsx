import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreateTask } from "../hooks/use-task-mutations";
import { useTaskQuery } from "../hooks/use-tasks";
import { TaskForm } from "../components/task-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody, Chip } from "@heroui/react";
import { ListTodo, Layers } from "lucide-react";

export function TaskCreatePage() {
  const { t } = useTranslation("tasks");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentId = searchParams.get("parentId");
  const createTask = useCreateTask();
  const { data: parentTaskResponse } = useTaskQuery(parentId ?? "");
  const parentTask = parentId ? parentTaskResponse?.data : null;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title={parentId ? t("detail.addSubtask") : t("form.createTitle")}
        onBack={() => (parentId ? navigate(`/tasks/${parentId}`) : navigate(-1))}
      />

      {parentTask && (
        <div className="rounded-xl border border-primary/20 bg-primary-50/40 px-4 py-3 flex items-center gap-3">
          <Layers className="w-5 h-5 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-default-500 uppercase tracking-wide">
              {t("form.createSubtaskFor")}
            </p>
            <Chip variant="flat" color="primary" className="mt-1 font-semibold max-w-full">
              <span className="truncate">{parentTask.title}</span>
            </Chip>
          </div>
        </div>
      )}

      <Card className="border border-default-200/60 shadow-lg shadow-default-200/20 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary via-violet-500 to-blue-500" />
        <CardBody className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-default-100">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {parentId ? t("type.subtask") : "New work item"}
              </p>
              <p className="text-xs text-default-500">
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
                    navigate("/tasks/list");
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
