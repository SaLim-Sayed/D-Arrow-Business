import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTaskQuery } from "../hooks/use-tasks";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useUpdateTask, useDeleteTask } from "../hooks/use-task-mutations";
import { TaskForm } from "../components/task-form";
import { TaskComments } from "../components/task-comments";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button, Card, CardBody, Avatar, Chip, Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Divider as Separator, Spinner } from "@heroui/react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function TaskDetailPage() {
  const { t } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { data: allUsers } = useAllUsers();
  const { data, isLoading: isTaskLoading } = useTaskQuery(taskId!);
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isLoading = isTaskLoading || !allUsers;

  if (isLoading) return <LoadingSpinner />;

  const task = data?.data;
  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-default-400">Task not found</p>
        <Button
          variant="light"
          className="mt-4"
          onPress={() => navigate(-1)}
        >
          {tc("actions.back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={task.title}
        actions={
          <div className="flex gap-2">
            <Button
              variant="light"
              onPress={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {tc("actions.back")}
            </Button>
            <Button
              variant="bordered"
              onPress={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              {tc("actions.edit")}
            </Button>
            <Button
              color="danger" variant="solid"
              onPress={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {tc("actions.delete")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="bg-content1">
            <CardBody>
              <Tabs color="primary" variant="solid" classNames={{ tabList: "flex gap-4 border-b border-default-200 mb-4" }}>
                <Tab key="details" title={t("detail.details")}>
                  <div className="space-y-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-medium text-default-500">
                        {t("form.description.label")}
                      </h3>
                      <p className="text-default-700 whitespace-pre-wrap">
                        {task.description || t("detail.noDescription")}
                      </p>
                    </div>

                    <Separator className="h-px bg-default-100" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-medium text-default-500">
                          {t("form.assignee.label")}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar 
                            size="sm" 
                            src={task.assignee?.avatar} 
                            fallback={((task.assignee?.name ?? "U").charAt(0).toUpperCase())} 
                            showFallback 
                          />
                          <span>
                            {task.assignee?.name ||
                              t("form.assignee.unassigned")}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-medium text-default-500">
                          {t("form.dueDate.label")}
                        </h3>
                        <p className="mt-1">
                          {task.dueDate
                            ? formatDate(task.dueDate)
                            : t("detail.noDueDate")}
                        </p>
                      </div>
                    </div>
                  </div>
                </Tab>
                <Tab key="comments" title={
                  <div className="flex items-center space-x-2">
                    <span>{t("detail.comments")}</span>
                    <Chip size="sm" variant="flat" color="secondary">{task.commentsCount}</Chip>
                  </div>
                }>
                  <TaskComments taskId={task.id} />
                </Tab>
                <Tab key="history" title={t("detail.history")}>
                  <p className="text-sm text-default-500 py-8 text-center">
                    {t("detail.historyPlaceholder")}
                  </p>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-content1">
            <CardBody className="p-6 space-y-4">
              <div>
                <p className="text-xs text-default-400 mb-1">
                  {t("form.status.label")}
                </p>
                <StatusBadge status={task.status} />
              </div>
              <Separator />
              <div>
                <p className="text-xs text-default-400 mb-1">
                  {t("form.priority.label")}
                </p>
                <PriorityBadge priority={task.priority} />
              </div>
              {task.tags && task.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-default-400 mb-1">
                      {t("form.tags.label")}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag) => (
                        <Chip key={tag} size="sm" variant="flat">
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} size="md">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>
                <h3 className="text-lg font-bold">{t("detail.editTask")}</h3>
              </ModalHeader>
              <ModalBody>
                <TaskForm
                defaultValues={task}
                onSubmit={(data) => {
                  updateMutation.mutate(
                    { id: task.id, data },
                    { onSuccess: () => setIsEditModalOpen(false) },
                  );
                }}
                isSubmitting={updateMutation.isPending}
              />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} size="sm">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>
                <h3 className="text-lg font-bold">{t("detail.deleteTask")}</h3>
              </ModalHeader>
              <ModalBody>
                <p>{t("detail.deleteConfirmation")}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => setIsDeleteModalOpen(false)}
                >
                  {tc("actions.cancel")}
                </Button>
                <Button
                  color="danger" variant="solid"
                  onPress={() =>
                    deleteMutation.mutate(task.id, {
                      onSuccess: () => navigate("/tasks/list"),
                    })
                  }
                  isDisabled={deleteMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {deleteMutation.isPending && (
                    <Spinner size="sm" color="current" />
                  )}
                  {tc("actions.delete")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
