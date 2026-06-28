import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCreateTask } from "../hooks/use-task-mutations";
import { useTaskQuery } from "../hooks/use-tasks";
import { TaskForm } from "../components/task-form";
import { Button, Chip } from "@heroui/react";
import { ArrowLeft, Layers, ListTodo } from "lucide-react";
import { TasksPageHeader, TasksShell } from "../components/tasks-ui";

export function TaskCreatePage() {
  const { t } = useTranslation("tasks");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentId = searchParams.get("parentId");
  const createTask = useCreateTask();
  const { data: parentTaskResponse } = useTaskQuery(parentId ?? "");
  const parentTask = parentId ? parentTaskResponse?.data : null;

  const backTo = parentId ? `/tasks/${parentId}` : "/tasks/work";
  const title = parentId ? t("detail.addSubtask") : t("form.createTitle");

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in pb-24 duration-300">
      <TasksPageHeader
        title={title}
        description={parentId ? t("form.createSubtaskFor") : t("form.createHint")}
        breadcrumbLabel={t("nav.dashboard")}
        breadcrumbTo="/tasks"
        action={
          <Button
            as={Link}
            to={backTo}
            size="sm"
            variant="bordered"
            className="border-default-200 font-medium"
            startContent={<ArrowLeft className="h-4 w-4 rtl:rotate-180" />}
          >
            {t("nav.back")}
          </Button>
        }
      />

      {parentTask && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary-50/40 px-4 py-3">
          <Layers className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1 text-start">
            <p className="text-xs font-bold uppercase tracking-wide text-default-500">
              {t("form.createSubtaskFor")}
            </p>
            <Chip variant="flat" color="primary" className="mt-1 max-w-full font-semibold">
              <span className="truncate" dir="auto">
                {parentTask.title}
              </span>
            </Chip>
          </div>
        </div>
      )}

      <TasksShell>
        <div className="mb-6 flex items-center gap-3 border-b border-default-100 pb-5">
          <div className="shrink-0 rounded-md bg-primary/10 p-2 text-primary">
            <ListTodo className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 text-start">
            <p className="text-sm font-semibold text-foreground">
              {parentId ? t("type.subtask") : t("type.task")}
            </p>
            <p className="mt-0.5 text-xs text-default-500">
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
      </TasksShell>
    </div>
  );
}
