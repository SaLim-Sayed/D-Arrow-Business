import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTaskQuery } from "../hooks/use-tasks";
import { useUpdateTask, useDeleteTask } from "../hooks/use-task-mutations";
import { TaskForm } from "../components/task-form";
import { TaskComments } from "../components/task-comments";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  Button,
  Card,
  CardContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Chip,
  ChipLabel,
  TabsRoot,
  TabList,
  Tab,
  TabPanel,
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Separator,
  Spinner,
} from "@heroui/react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function TaskDetailPage() {
  const { t } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useTaskQuery(taskId!);
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (isLoading) return <LoadingSpinner />;

  const task = data?.data;
  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-default-400">Task not found</p>
        <Button
          variant="tertiary"
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
              variant="tertiary"
              onPress={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {tc("actions.back")}
            </Button>
            <Button
              variant="outline"
              onPress={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              {tc("actions.edit")}
            </Button>
            <Button
              variant="danger"
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
            <CardContent>
              <TabsRoot variant="primary">
                <TabList className="flex gap-4 border-b border-default-200 mb-4">
                  <Tab
                    id="details"
                    className="pb-2 px-1 focus:outline-none data-[selected]:border-b-2 data-[selected]:border-primary data-[selected]:text-primary cursor-pointer"
                  >
                    {t("detail.details")}
                  </Tab>
                  <Tab
                    id="comments"
                    className="pb-2 px-1 focus:outline-none data-[selected]:border-b-2 data-[selected]:border-primary data-[selected]:text-primary cursor-pointer"
                  >
                    {t("detail.comments")}
                    <Chip
                      size="sm"
                      variant="soft"
                      color="accent"
                      className="ml-2"
                    >
                      <ChipLabel>{task.commentsCount}</ChipLabel>
                    </Chip>
                  </Tab>
                  <Tab
                    id="history"
                    className="pb-2 px-1 focus:outline-none data-[selected]:border-b-2 data-[selected]:border-primary data-[selected]:text-primary cursor-pointer"
                  >
                    {t("detail.history")}
                  </Tab>
                </TabList>

                <TabPanel id="details">
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
                          <Avatar size="sm">
                            <AvatarImage src={task.assignee?.avatar} />
                            <AvatarFallback>
                              {(task.assignee?.name ?? "U")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
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
                </TabPanel>

                <TabPanel id="comments">
                  <TaskComments taskId={task.id} />
                </TabPanel>

                <TabPanel id="history">
                  <p className="text-sm text-default-500 py-8 text-center">
                    {t("detail.historyPlaceholder")}
                  </p>
                </TabPanel>
              </TabsRoot>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-content1">
            <CardContent className="p-6 space-y-4">
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
              {task.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-default-400 mb-1">
                      {t("form.tags.label")}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag) => (
                        <Chip key={tag} size="sm" variant="soft">
                          <ChipLabel>{tag}</ChipLabel>
                        </Chip>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ModalRoot isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <ModalBackdrop />
        <ModalContainer size="md">
          <ModalDialog>
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
          </ModalDialog>
        </ModalContainer>
      </ModalRoot>

      <ModalRoot isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <ModalBackdrop />
        <ModalContainer size="sm">
          <ModalDialog>
            <ModalHeader>
              <h3 className="text-lg font-bold">{t("detail.deleteTask")}</h3>
            </ModalHeader>
            <ModalBody>
              <p>{t("detail.deleteConfirmation")}</p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="tertiary"
                onPress={() => setIsDeleteModalOpen(false)}
              >
                {tc("actions.cancel")}
              </Button>
              <Button
                variant="danger"
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
          </ModalDialog>
        </ModalContainer>
      </ModalRoot>
    </div>
  );
}
