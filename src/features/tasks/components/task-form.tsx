import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  TextArea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopover,
  ListBox,
  ListBoxItem,
  Avatar,
  AvatarImage,
  AvatarFallback,
  TextField,
  Label,
  FieldError,
  Spinner,
  Form,
} from "@heroui/react";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth.store";
import { useAllUsers } from "@/features/users/hooks/use-users";
import type { CreateTaskDTO, Task } from "../types/task.types";

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  defaultValues?: Partial<Task>;
  onSubmit: (data: CreateTaskDTO) => void;
  isSubmitting?: boolean;
}

export function TaskForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: TaskFormProps) {
  const { t } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const { data: allUsers } = useAllUsers();
  const { user: currentUser } = useAuthStore();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      status: defaultValues?.status ?? "todo",
      priority: defaultValues?.priority ?? "medium",
      assigneeId: defaultValues?.assigneeId ?? null,
      dueDate: defaultValues?.dueDate
        ? defaultValues.dueDate.split("T")[0]
        : null,
    },
  });

  const {
    control,
    formState: { errors },
  } = form;

  function handleSubmit(values: TaskFormValues) {
    onSubmit({
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority,
      assigneeId: values.assigneeId,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
    });
  }

  return (
    <Form className="space-y-6">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Controller
          name="title"
          control={control}
          render={({ field }: { field: any }) => (
            <TextField isInvalid={!!errors.title} fullWidth>
              <Label className="text-sm font-medium mb-1 inline-block">
                {t("form.title.label")}
              </Label>
              <Input
                {...field}
                placeholder={t("form.title.placeholder")}
                variant="primary"
                fullWidth
              />
              <FieldError className="text-xs text-danger mt-1">
                {errors.title?.message}
              </FieldError>
            </TextField>
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }: { field: any }) => (
            <TextField isInvalid={!!errors.description} fullWidth>
              <Label className="text-sm font-medium mb-1 inline-block">
                {t("form.description.label")}
              </Label>
              <TextArea
                {...field}
                placeholder={t("form.description.placeholder")}
                variant="primary"
                fullWidth
              />
              <FieldError className="text-xs text-danger mt-1">
                {errors.description?.message}
              </FieldError>
            </TextField>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="status"
            control={control}
            render={({ field }: { field: any }) => (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-default-700">
                  {t("form.status.label")}
                </span>
                <Select
                  selectedKey={field.value}
                  onSelectionChange={(key) => field.onChange(key)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopover>
                    <ListBox>
                      {TASK_STATUSES.map((status) => (
                        <ListBoxItem key={status} id={status}>
                          {t(`status.${status}`)}
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </SelectPopover>
                </Select>
              </div>
            )}
          />

          <Controller
            name="priority"
            control={control}
            render={({ field }: { field: any }) => (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-default-700">
                  {t("form.priority.label")}
                </span>
                <Select
                  selectedKey={field.value}
                  onSelectionChange={(key) => field.onChange(key)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopover>
                    <ListBox>
                      {TASK_PRIORITIES.map((priority) => (
                        <ListBoxItem key={priority} id={priority}>
                          {t(`priority.${priority}`)}
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </SelectPopover>
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
              <span className="text-sm font-medium text-default-700">
                {t("form.assignee.label")}
              </span>
              <Select
                variant="primary"
                selectedKey={field.value || "unassigned"}
                onSelectionChange={(key) => {
                  const val = key as string;
                  field.onChange(val === "unassigned" ? null : val);
                }}
              >
                <SelectTrigger>
                  <SelectValue>
                    {(value) => {
                      const selectedKey = value.state.selectedKey as string;
                      if (selectedKey && selectedKey !== "unassigned") {
                        const user =
                          allUsers?.find((u) => u.id === selectedKey) ||
                          currentUser;
                        return (
                          <div className="flex items-center gap-2">
                            <Avatar size="sm">
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback>
                                {(user?.name ?? "")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user?.name}</span>
                          </div>
                        );
                      }
                      return <span>{t("form.assignee.placeholder")}</span>;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopover>
                  <ListBox>
                    <ListBoxItem
                      id="unassigned"
                      textValue={t("form.assignee.unassigned")}
                    >
                      {t("form.assignee.unassigned")}
                    </ListBoxItem>
                    {currentUser && (
                      <ListBoxItem
                        id={currentUser.id}
                        textValue={currentUser.name}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarImage src={currentUser.avatar} />
                            <AvatarFallback>
                              {currentUser.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-small font-medium">
                              {currentUser.name}
                            </span>
                            <span className="text-tiny text-default-400">
                              {t("form.assignee.me")}
                            </span>
                          </div>
                        </div>
                      </ListBoxItem>
                    )}
                    {(allUsers || [])
                      .filter((user) => user.id !== currentUser?.id)
                      .map((user) => (
                        <ListBoxItem
                          key={user.id}
                          id={user.id}
                          textValue={user.name}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar size="sm">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-small font-medium">
                                {user.name}
                              </span>
                              <span className="text-tiny text-default-400">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </ListBoxItem>
                      ))}
                  </ListBox>
                </SelectPopover>
              </Select>
            </div>
          )}
        />

        <Controller
          name="dueDate"
          control={control}
          render={({ field }: { field: any }) => (
            <TextField isInvalid={!!errors.dueDate} fullWidth>
              <Label className="text-sm font-medium mb-1 inline-block">
                {t("form.dueDate.label")}
              </Label>
              <Input
                {...field}
                type="date"
                value={field.value || ""}
                variant="primary"
                fullWidth
              />
              <FieldError className="text-xs text-danger mt-1">
                {errors.dueDate?.message}
              </FieldError>
            </TextField>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            variant="primary"
            isDisabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2"
          >
            {isSubmitting && <Spinner size="sm" color="current" />}
            {isSubmitting ? tc("actions.loading") : tc("actions.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
