import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCreateTask } from "../hooks/use-task-mutations";
import { TaskForm } from "../components/task-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Card, CardBody } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

export function TaskCreatePage() {
  const { t } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const createTask = useCreateTask();

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={t("form.createTitle")}
        actions={
          <Button
            variant="light"
            onPress={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {tc("actions.back")}
          </Button>
        }
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
