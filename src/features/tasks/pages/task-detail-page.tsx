import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTaskQuery, useSprintsQuery } from "../hooks/use-tasks";
import { useAllUsers } from "@/features/users/hooks/use-users";
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
  CardBody,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Divider as Separator,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DatePicker,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import {
  Pencil,
  Trash2,
  ArrowRight,
  Calendar,
  User,
  AlignLeft,
  Clock,
  Target,
  Flag,
  Activity,
} from "lucide-react";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { useTasksQuery } from "../hooks/use-tasks";
import { Link } from "react-router-dom";

function SubtasksList({ parentId }: { parentId: string }) {
  const { data, isLoading } = useTasksQuery({ parentId, pageSize: 50 });

  if (isLoading) return <Spinner size="sm" />;

  const subtasks = data?.data || [];

  if (subtasks.length === 0) {
    return <p className="text-sm text-default-500">No subtasks found.</p>;
  }

  return (
    <div className="space-y-2">
      {subtasks.map((st) => (
        <Link key={st.id} to={`/tasks/${st.id}`} className="block">
          <div className="flex items-center justify-between p-3 rounded-lg border border-default-200 hover:bg-default-100 transition-colors">
            <div className="flex items-center gap-3">
              <StatusBadge status={st.status} />
              <span className="font-medium text-sm">{st.title}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-default-400" />
          </div>
        </Link>
      ))}
    </div>
  );
}

function ParentTaskCard({ parentId }: { parentId: string }) {
  const { data, isLoading } = useTaskQuery(parentId);

  if (isLoading) return <Spinner size="sm" />;

  const parent = data?.data;
  if (!parent) return null;

  return (
    <Card className="bg-content1 shadow-md border border-default-200">
      <CardBody className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-default-500" />
          <h3 className="text-lg font-bold">Parent Task</h3>
        </div>
        <Link to={`/tasks/${parent.id}`} className="block">
          <div className="flex items-center justify-between p-3 rounded-lg border border-default-200 hover:bg-default-100 transition-colors">
            <div className="flex items-center gap-3">
              <StatusBadge status={parent.status} />
              <span className="font-medium text-sm">{parent.title}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-default-400" />
          </div>
        </Link>
      </CardBody>
    </Card>
  );
}

export function TaskDetailPage() {
  const { t, i18n } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { data: allUsers } = useAllUsers();
  const { data, isLoading: isTaskLoading } = useTaskQuery(taskId!);
  const { data: allSprints } = useSprintsQuery();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>({});

  const isLoading = isTaskLoading || !allUsers;

  if (isLoading) return <LoadingSpinner />;

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const handleInlineChange = (field: string, value: any) => {
    setPendingChanges((prev: any) => ({ ...prev, [field]: value }));
  };

  const baseTask = data?.data;
  const task = baseTask
    ? {
        ...baseTask,
        ...pendingChanges,
        assignee: allUsers?.find(
          (u) => u.id === (pendingChanges.assigneeId !== undefined ? pendingChanges.assigneeId : baseTask.assigneeId)
        ) || null,
      }
    : null;
  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-default-400">{t("detail.notFound")}</p>
        <Button variant="light" className="mt-4" onPress={() => navigate(-1)}>
          {tc("actions.back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>{task.title}</span>
            <Chip
              size="lg"
              variant="flat"
              color={
                task.type === "epic"
                  ? "secondary"
                  : task.type === "subtask"
                    ? "default"
                    : "primary"
              }
              classNames={{
                content: "leading-lg",
              }}
            >
              {task.type}
            </Chip>
          </div>
        }
        onBack={() => navigate(-1)}
        actions={
          <div className="flex gap-2">
            {hasChanges ? (
              <>
                <Button
                  variant="light"
                  onPress={() => setPendingChanges({})}
                  className="rounded-full font-bold"
                >
                  {tc("actions.cancel")}
                </Button>
                <Button
                  color="primary"
                  variant="solid"
                  onPress={() => {
                    updateMutation.mutate(
                      { id: task!.id, data: pendingChanges },
                      { onSuccess: () => setPendingChanges({}) }
                    );
                  }}
                  isLoading={updateMutation.isPending}
                  className="flex items-center gap-2 rounded-full font-bold shadow-lg shadow-primary/20"
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                {!isEditing && (
                  <Button
                    variant="bordered"
                    onPress={() => setIsEditing(true)}
                    className="flex items-center gap-2 rounded-full font-bold"
                  >
                    <Pencil className="h-4 w-4" />
                    {tc("actions.edit")}
                  </Button>
                )}
                <Button
                  color="danger"
                  variant="solid"
                  onPress={() => setIsDeleteModalOpen(true)}
                  className="flex items-center gap-2 rounded-full font-bold shadow-lg shadow-danger/20"
                >
                  <Trash2 className="h-4 w-4" />
                  {tc("actions.delete")}
                </Button>
              </>
            )}
          </div>
        }
      />

      {isEditing ? (
        <Card className="bg-content1 shadow-md border border-default-200 p-2 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
          <CardBody>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Pencil className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">{t("detail.editTask")}</h2>
            </div>
            <TaskForm
              defaultValues={task}
              onSubmit={(data) => {
                updateMutation.mutate(
                  { id: task.id, data },
                  { onSuccess: () => setIsEditing(false) },
                );
              }}
              isSubmitting={updateMutation.isPending}
              onCancel={() => setIsEditing(false)}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card className="bg-content1">
              <CardBody>
                <Tabs
                  color="primary"
                  variant="solid"
                  classNames={{
                    tabList: "flex gap-4 border-b border-default-200 mb-4",
                  }}
                >
                  <Tab key="details" title={t("detail.details")}>
                    <div className="space-y-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-default-500">
                          <AlignLeft className="w-4 h-4" />
                          <h3 className="text-sm font-semibold uppercase tracking-wider">
                            {t("form.description.label")}
                          </h3>
                        </div>
                        <div className="bg-default-50 p-4 rounded-xl border border-default-100 min-h-[100px]">
                          <p className="text-default-700 whitespace-pre-wrap leading-relaxed text-sm">
                            {task.description || t("detail.noDescription")}
                          </p>
                        </div>
                      </div>

                      <Separator className="h-px bg-default-100" />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-default-50 border border-default-100">
                          <div className="flex items-center gap-2 text-default-500">
                            <User className="w-4 h-4" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider">
                              {t("form.assignee.label")}
                            </h3>
                          </div>
                          <Dropdown>
                            <DropdownTrigger>
                              <div className="flex items-center gap-3 mt-1 cursor-pointer hover:bg-default-200 p-1.5 -ml-1.5 rounded-lg transition-colors">
                                <Avatar
                                  size="sm"
                                  src={task.assignee?.avatar}
                                  fallback={(task.assignee?.name ?? "U")
                                    .charAt(0)
                                    .toUpperCase()}
                                  showFallback
                                  className="ring-2 ring-primary/20"
                                />
                                <span className="font-medium text-sm">
                                  {(i18n.language === "ar"
                                    ? task.assignee?.nameAr
                                    : task.assignee?.name) ||
                                    t("form.assignee.unassigned")}
                                </span>
                              </div>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label="Change Assignee"
                              onAction={(key) => {
                                const newAssigneeId =
                                  key === "unassigned" ? null : key.toString();
                                handleInlineChange("assigneeId", newAssigneeId);
                              }}
                            >
                              {[
                                <DropdownItem key="unassigned">
                                  {t("form.assignee.unassigned")}
                                </DropdownItem>,
                                ...(allUsers || []).map((user: any) => (
                                  <DropdownItem key={user.id}>
                                    {user.name}
                                  </DropdownItem>
                                )),
                              ]}
                            </DropdownMenu>
                          </Dropdown>
                        </div>

                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-default-50 border border-default-100">
                          <div className="flex items-center gap-2 text-default-500">
                            <Calendar className="w-4 h-4" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider">
                              {t("form.dueDate.label")}
                            </h3>
                          </div>
                          <DatePicker
                            aria-label="Due Date"
                            variant="underlined"
                            size="sm"
                            className="max-w-xs mt-1 pl-1"
                            value={
                              task.dueDate
                                ? parseDate(task.dueDate.split("T")[0])
                                : null
                            }
                            onChange={(date: any) => {
                              handleInlineChange("dueDate", date ? date.toString() : null);
                            }}
                          />
                        </div>

                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-default-50 border border-default-100">
                          <div className="flex items-center gap-2 text-default-500">
                            <Target className="w-4 h-4" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider">
                              Sprint
                            </h3>
                          </div>
                          <Dropdown>
                            <DropdownTrigger>
                              <div className="mt-1 cursor-pointer hover:bg-default-200 p-1.5 -ml-1.5 rounded-lg transition-colors">
                                <p className="font-medium text-sm pl-1 truncate">
                                  {task.sprintId
                                    ? (allSprints?.data?.find(s => s.id === task.sprintId)?.name || "Assigned to Sprint")
                                    : "No Sprint"}
                                </p>
                              </div>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label="Change Sprint"
                              onAction={(key) => {
                                const newSprintId =
                                  key === "no-sprint" ? null : key.toString();
                                handleInlineChange("sprintId", newSprintId);
                              }}
                            >
                              {[
                                <DropdownItem key="no-sprint">
                                  No Sprint
                                </DropdownItem>,
                                ...(allSprints?.data || []).map(
                                  (sprint: any) => (
                                    <DropdownItem key={sprint.id}>
                                      {sprint.name}
                                    </DropdownItem>
                                  ),
                                ),
                              ]}
                            </DropdownMenu>
                          </Dropdown>
                        </div>

                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-default-50 border border-default-100">
                          <div className="flex items-center gap-2 text-default-500">
                            <Clock className="w-4 h-4" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider">
                              Created At
                            </h3>
                          </div>
                          <p className="mt-1 font-medium text-sm pl-1">
                            {formatDate(task.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Tab>
                  <Tab
                    key="comments"
                    title={
                      <div className="flex items-center space-x-2">
                        <span>{t("detail.comments")}</span>
                        <Chip size="sm" variant="flat" color="secondary">
                          {task.commentsCount}
                        </Chip>
                      </div>
                    }
                  >
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
            <Card className="bg-content1 shadow-md border border-default-200">
              <CardBody className="p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-default-500 mb-2">
                    <Activity className="w-4 h-4" />
                    <p className="text-xs font-semibold uppercase tracking-wider">
                      {t("form.status.label")}
                    </p>
                  </div>
                  <Dropdown>
                    <DropdownTrigger>
                      <div className="pl-1 cursor-pointer inline-block hover:opacity-80 transition-opacity">
                        <StatusBadge status={task.status} />
                      </div>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Change Status"
                      onAction={(key) => {
                        handleInlineChange("status", key);
                      }}
                    >
                      {TASK_STATUSES.map((status) => (
                        <DropdownItem key={status}>
                          {t(`status.${status}`)}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                </div>

                <Separator className="bg-default-100" />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-default-500 mb-2">
                    <Flag className="w-4 h-4" />
                    <p className="text-xs font-semibold uppercase tracking-wider">
                      {t("form.priority.label")}
                    </p>
                  </div>
                  <Dropdown>
                    <DropdownTrigger>
                      <div className="pl-1 cursor-pointer inline-block hover:opacity-80 transition-opacity">
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Change Priority"
                      onAction={(key) => {
                        handleInlineChange("priority", key);
                      }}
                    >
                      {TASK_PRIORITIES.map((priority) => (
                        <DropdownItem key={priority}>
                          {t(`priority.${priority}`)}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                </div>

                {task.tags && task.tags.length > 0 && (
                  <>
                    <Separator className="bg-default-100" />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-default-500 mb-2">
                        {t("form.tags.label")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag: string) => (
                          <Chip
                            key={tag}
                            size="sm"
                            variant="dot"
                            color="primary"
                            className="border-default-200"
                          >
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

          {task.type === "subtask" && task.parentId && (
            <ParentTaskCard parentId={task.parentId} />
          )}
          {(task.type === "epic" || task.type === "task") && (
            <Card className="bg-content1 shadow-md border border-default-200">
              <CardBody className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlignLeft className="w-5 h-5 text-default-500" />
                  <h3 className="text-lg font-bold">Subtasks</h3>
                </div>
                <SubtasksList parentId={task.id} />
              </CardBody>
            </Card>
          )}
        </div>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        size="sm"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader>
                <h3 className="text-lg font-bold">{t("delete.title")}</h3>
              </ModalHeader>
              <ModalBody>
                <p>{t("delete.message")}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => setIsDeleteModalOpen(false)}
                >
                  {tc("actions.cancel")}
                </Button>
                <Button
                  color="danger"
                  variant="solid"
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
