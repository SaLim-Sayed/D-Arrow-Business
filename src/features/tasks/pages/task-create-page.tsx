import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCreateTask } from "../hooks/use-task-mutations";
import { TaskForm } from "../components/task-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody } from "@heroui/react";

export function TaskCreatePage() {
  const { t } = useTranslation("tasks");
  const navigate = useNavigate();
  const createTask = useCreateTask();

  return (
    <div className=" mx-auto">
      <PageHeader
        title={t("form.createTitle")}
        onBack={() => navigate(-1)}
      />

      <Card className="bg-content1">
        <CardBody className="p-6">
          <TaskForm
            onSubmit={(data) => {
              createTask.mutate(data, {
                onSuccess: () => navigate("/tasks/list"),
              });
            }}
            isSubmitting={createTask.isPending}
          />
        </CardBody>
      </Card>
    </div>
  );
}
