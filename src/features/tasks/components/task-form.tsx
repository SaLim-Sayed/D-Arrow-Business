import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Avatar,
  Spinner,
  DatePicker,
} from "@heroui/react";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth.store";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useAllTasksQuery, useSprintsQuery } from "../hooks/use-tasks";
import type { CreateTaskDTO, Task } from "../types/task.types";
import { toast } from "sonner";
import { parseDate } from "@internationalized/date";

/** Roles that can approve tasks (move in_review → done) */
const APPROVER_ROLES = new Set(["super_admin", "admin", "manager"]);

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  type: z.enum(["task", "epic", "subtask"]),
  assigneeId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  defaultValues?: Partial<Task>;
  onSubmit: (data: CreateTaskDTO) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export function TaskForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  onCancel,
}: TaskFormProps) {
  const { t } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const { data: allUsers } = useAllUsers();
  const { data: allTasks } = useAllTasksQuery();
  const { data: allSprints } = useSprintsQuery();
  const { user: currentUser } = useAuthStore();
  const canApprove = APPROVER_ROLES.has(currentUser?.role ?? "");

  const epics = allTasks?.data?.filter(t => t.type === "epic") || [];
  const sprints = allSprints?.data || [];

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      status: defaultValues?.status ?? "todo",
      priority: defaultValues?.priority ?? "medium",
      type: defaultValues?.type ?? "task",
      assigneeId: defaultValues?.assigneeId ?? null,
      parentId: defaultValues?.parentId ?? null,
      sprintId: defaultValues?.sprintId ?? null,
      dueDate: defaultValues?.dueDate
        ? defaultValues.dueDate.split("T")[0]
        : null,
    },
  });

  const {
    control,
    watch,
    formState: { errors },
  } = form;

  const taskType = watch("type");

  function handleSubmit(values: TaskFormValues) {
    if (
      !canApprove &&
      values.status === "done" &&
      defaultValues?.status === "in_review"
    ) {
      toast.error(t("errors.approvePermission"));
      return;
    }

    let isoDueDate = null;
    if (values.dueDate) {
      const d = new Date(values.dueDate);
      if (!isNaN(d.getTime())) {
        isoDueDate = d.toISOString();
      }
    }

    onSubmit({
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority,
      type: values.type,
      parentId: values.parentId,
      sprintId: values.sprintId,
      assigneeId: values.assigneeId,
      dueDate: isoDueDate,
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6 w-full"
    >
      <Controller
        name="title"
        control={control}
        render={({ field }: { field: any }) => (
          <Input
            {...field}
            label={t("form.title.label")}
            placeholder={t("form.title.placeholder")}
            variant="flat"
            fullWidth
            isInvalid={!!errors.title}
            errorMessage={errors.title?.message}
          />
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }: { field: any }) => (
          <Textarea
            {...field}
            label={t("form.description.label")}
            placeholder={t("form.description.placeholder")}
            variant="flat"
            fullWidth
            isInvalid={!!errors.description}
            errorMessage={errors.description?.message}
          />
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="type"
          control={control}
          render={({ field }: { field: any }) => (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground/80">
                {t("form.type.label", "Task Type")}
              </span>
              <Select
                aria-label="Task Type"
                selectedKeys={new Set([field.value])}
                className="h-11"
                onSelectionChange={(keys) =>
                  field.onChange(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="task" textValue="Task">Task</SelectItem>
                <SelectItem key="epic" textValue="Epic">Epic</SelectItem>
                <SelectItem key="subtask" textValue="Subtask">Subtask</SelectItem>
              </Select>
            </div>
          )}
        />

        <Controller
          name="sprintId"
          control={control}
          render={({ field }: { field: any }) => (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground/80">
                {t("form.sprint.label", "Sprint")}
              </span>
              <Select
                aria-label="Sprint"
                selectedKeys={new Set([field.value || "no-sprint"])}
                className="h-11"
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  field.onChange(val === "no-sprint" ? null : val);
                }}
              >
                {[
                  <SelectItem key="no-sprint" textValue="No Sprint">No Sprint</SelectItem>,
                  ...sprints.map((s) => (
                    <SelectItem key={s.id} textValue={s.name}>{s.name}</SelectItem>
                  ))
                ]}
              </Select>
            </div>
          )}
        />
      </div>

      {taskType === "subtask" && (
        <Controller
          name="parentId"
          control={control}
          render={({ field }: { field: any }) => (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="text-sm font-semibold tracking-tight text-foreground/80">
                {t("form.parent.label", "Parent Task (Epic)")}
              </span>
              <Select
                aria-label="Parent Task"
                selectedKeys={new Set([field.value || "no-parent"])}
                className="h-11"
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  field.onChange(val === "no-parent" ? null : val);
                }}
              >
                {[
                  <SelectItem key="no-parent" textValue="No Parent">No Parent</SelectItem>,
                  ...epics.map((e) => (
                    <SelectItem key={e.id} textValue={e.title}>{e.title}</SelectItem>
                  ))
                ]}
              </Select>
            </div>
          )}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="status"
          control={control}
          render={({ field }: { field: any }) => (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground/80">
                {t("form.status.label")}
              </span>
              <Select
                aria-label={t("form.status.label")}
                selectedKeys={new Set([field.value])}
                className="h-11"
                onSelectionChange={(keys) =>
                  field.onChange(Array.from(keys)[0] as string)
                }
              >
                {TASK_STATUSES.map((status) => (
                  <SelectItem
                    key={status}
                    textValue={t(`status.${status}`)}
                    isDisabled={
                      status === "done" &&
                      defaultValues?.status === "in_review" &&
                      !canApprove
                    }
                  >
                    {t(`status.${status}`)}
                    {status === "done" &&
                      defaultValues?.status === "in_review" &&
                      !canApprove && (
                        <span className="text-xs text-default-400 ml-1">
                          ({t("errors.approveOnly")})
                        </span>
                      )}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}
        />

        <Controller
          name="priority"
          control={control}
          render={({ field }: { field: any }) => (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground/80">
                {t("form.priority.label")}
              </span>
              <Select
                aria-label={t("form.priority.label")}
                selectedKeys={new Set([field.value])}
                className="h-11"
                onSelectionChange={(keys) =>
                  field.onChange(Array.from(keys)[0] as string)
                }
              >
                {TASK_PRIORITIES.map((priority) => (
                  <SelectItem
                    key={priority}
                    textValue={t(`priority.${priority}`)}
                  >
                    {t(`priority.${priority}`)}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}
        />
      </div>

      <Controller
        name="assigneeId"
        control={control}
        render={({ field }: { field: any }) => (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold tracking-tight text-foreground/80">
              {t("form.assignee.label")}
            </span>
            <Select
              aria-label={t("form.assignee.label")}
              color="primary"
              className="h-11"
              selectedKeys={new Set([field.value || "unassigned"])}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                field.onChange(val === "unassigned" ? null : val);
              }}
              renderValue={() => {
                const selectedKey = field.value;
                if (selectedKey && selectedKey !== "unassigned") {
                  const user =
                    allUsers?.find((u) => u.id === selectedKey) || currentUser;
                  return (
                    <div className="flex items-center gap-2">
                      <Avatar
                        size="sm"
                        src={user?.avatar}
                        fallback={(user?.name ?? "").charAt(0).toUpperCase()}
                        showFallback
                      />
                      <span>{user?.name}</span>
                    </div>
                  );
                }
                return <span>{t("form.assignee.placeholder")}</span>;
              }}
            >
              {[
                {
                  id: "unassigned",
                  type: "unassigned",
                  text: t("form.assignee.unassigned"),
                },
                ...(currentUser
                  ? [{ id: currentUser.id, type: "me", user: currentUser }]
                  : []),
                ...(allUsers || [])
                  .filter((user) => user.id !== currentUser?.id)
                  .map((user) => ({ id: user.id, type: "other", user })),
              ].map((option) => {
                if (option.type === "unassigned") {
                  return (
                    <SelectItem
                      key={option.id}
                      textValue={(option as any).text}
                    >
                      {(option as any).text}
                    </SelectItem>
                  );
                }
                const user = option.user!;
                return (
                  <SelectItem key={option.id} textValue={user.name}>
                    <div className="flex items-center gap-2">
                      <Avatar
                        size="sm"
                        src={user.avatar}
                        fallback={user.name.charAt(0).toUpperCase()}
                        showFallback
                      />
                      <div className="flex flex-col">
                        <span className="text-small font-medium">
                          {user.name}
                        </span>
                        <span className="text-tiny text-default-400">
                          {option.type === "me"
                            ? t("form.assignee.me")
                            : user.email}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </Select>
          </div>
        )}
      />

      <Controller
        name="dueDate"
        control={control}
        render={({ field }: { field: any }) => (
          <div className="flex flex-col">
            <DatePicker
              label={t("form.dueDate.label")}
              className="max-w-full"
              variant="flat"
              value={field.value ? parseDate(field.value) : null}
              onChange={(date: any) => field.onChange(date?.toString() || null)}
              isInvalid={!!errors.dueDate}
              errorMessage={errors.dueDate?.message}
            />
          </div>
        )}
      />

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="flat"
            onPress={onCancel}
            isDisabled={isSubmitting}
            className="h-11 font-semibold px-6"
          >
            {tc("actions.cancel")}
          </Button>
        )}
        <Button
          type="submit"
          color="primary"
          variant="solid"
          isDisabled={isSubmitting}
          className={`h-11 font-semibold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 ${!onCancel ? 'w-full' : 'px-8'}`}
        >
          {isSubmitting ? (
            <Spinner size="sm" color="current" className="mr-2" />
          ) : null}
          {isSubmitting ? tc("actions.loading") : tc("actions.save")}
        </Button>
      </div>
    </form>
  );
}
