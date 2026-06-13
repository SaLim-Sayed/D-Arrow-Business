import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { useCompany } from "@/features/companies/context/company-context";
import { TaskService } from "../api/tasks.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Paperclip } from "lucide-react";
import {
  AttachmentThumbnail,
  AttachmentUploadZone,
  PendingFileThumbnail,
  isLikelyImageUrl,
} from "./attachment-thumbnail";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Avatar,
  Spinner,
  DatePicker,
  Modal,
  ModalContent,
  ModalBody,
  Chip,
} from "@heroui/react";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useAuthStore } from "@/stores/auth.store";
import { useTasksPermissions } from "../hooks/use-tasks-permissions";
import { useAllTasksQuery, useSprintsQuery } from "../hooks/use-tasks";
import type { CreateTaskDTO, Task } from "../types/task.types";
import { toast } from "sonner";
import { parseDate } from "@internationalized/date";

const taskSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string(),
    status: z.enum(["todo", "in_progress", "in_review", "done"]),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    type: z.enum(["task", "epic", "subtask"]),
    assigneeId: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(),
    sprintId: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "subtask" && !data.parentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Parent task is required for subtasks",
        path: ["parentId"],
      });
    }
  });

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  defaultValues?: Partial<Task>;
  /** When set, creates a subtask locked to this parent */
  parentTaskId?: string | null;
  onSubmit: (data: CreateTaskDTO) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export function TaskForm({
  defaultValues,
  parentTaskId,
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
  const { canApproveTasks: canApprove } = useTasksPermissions();

  const editingTaskId = defaultValues?.id;
  const parentCandidates =
    allTasks?.data?.filter(
      (t) => t.type !== "subtask" && t.id !== editingTaskId
    ) || [];
  const lockedParent = parentTaskId
    ? allTasks?.data?.find((t) => t.id === parentTaskId)
    : null;
  const sprints = allSprints?.data || [];
  const { companyId } = useCompany();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>(
    defaultValues?.attachments ?? []
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fieldClassNames = {
    inputWrapper: "bg-default-50/80 border border-default-200 shadow-sm group-data-[focus=true]:border-primary",
    label: "text-default-600 font-semibold",
  };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      status: defaultValues?.status ?? "todo",
      priority: defaultValues?.priority ?? "medium",
      type: parentTaskId ? "subtask" : (defaultValues?.type ?? "task"),
      assigneeId: defaultValues?.assigneeId ?? null,
      parentId: parentTaskId ?? defaultValues?.parentId ?? null,
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
  const parentIdValue = watch("parentId");
  const isSubtaskMode = !!parentTaskId || taskType === "subtask";

  useEffect(() => {
    if (!parentTaskId) return;
    form.setValue("type", "subtask");
    form.setValue("parentId", parentTaskId);
    if (lockedParent?.sprintId) {
      form.setValue("sprintId", lockedParent.sprintId);
    }
  }, [parentTaskId, lockedParent?.sprintId, form]);

  useEffect(() => {
    if (taskType !== "subtask" || parentIdValue || parentTaskId) return;
    form.setValue("parentId", null);
  }, [taskType, parentIdValue, parentTaskId, form]);

  async function handleSubmit(values: TaskFormValues) {
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

    let attachmentUrls: string[] = [...existingAttachments];

    if (selectedFiles.length > 0 && companyId) {
      setIsUploading(true);
      const results = await Promise.allSettled(
        selectedFiles.map((file) => TaskService.uploadTaskAttachment(companyId, file))
      );
      const uploadedUrls = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
        .map((r) => r.value);
      const failedCount = results.filter((r) => r.status === "rejected").length;
      attachmentUrls = [...attachmentUrls, ...uploadedUrls];
      setIsUploading(false);
      if (failedCount > 0 && uploadedUrls.length > 0) {
        toast.warning(t("form.attachments.partialUpload"));
      } else if (failedCount > 0) {
        toast.warning(t("form.attachments.uploadFailed"));
      }
    }

    const payload: CreateTaskDTO = {
      title: values.title,
      description: values.description ?? "",
      status: values.status,
      priority: values.priority,
      type: values.type,
      parentId: values.type === "subtask" ? values.parentId : null,
      sprintId: values.sprintId ?? null,
      assigneeId: values.assigneeId ?? null,
      dueDate: isoDueDate,
    };

    if (attachmentUrls.length > 0) {
      payload.attachments = attachmentUrls;
    }

    onSubmit(payload);
  }

  const totalAttachments = existingAttachments.length + selectedFiles.length;

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-8 w-full"
    >
      <div className="space-y-5">
        <Controller
          name="title"
          control={control}
          render={({ field }: { field: any }) => (
            <Input
              {...field}
              label={t("form.title.label")}
              placeholder={t("form.title.placeholder")}
              variant="bordered"
              size="lg"
              fullWidth
              isInvalid={!!errors.title}
              errorMessage={errors.title?.message}
              classNames={fieldClassNames}
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
              variant="bordered"
              minRows={4}
              fullWidth
              isInvalid={!!errors.description}
              errorMessage={errors.description?.message}
              classNames={{
                ...fieldClassNames,
                input: "text-sm leading-relaxed",
              }}
            />
          )}
        />
      </div>

      <div className="rounded-2xl border border-default-200/60 bg-default-50/30 p-5 space-y-5">
        <p className="text-xs font-bold text-default-500 uppercase tracking-widest">Task settings</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="type"
          control={control}
          render={({ field }: { field: any }) => (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-foreground">
                {t("form.type.label", "Task Type")}
              </span>
              <Select
                aria-label="Task Type"
                variant="bordered"
                isDisabled={!!parentTaskId}
                selectedKeys={new Set([field.value])}
                classNames={{ trigger: "bg-content1 min-h-11" }}
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
                variant="bordered"
                selectedKeys={new Set([field.value || "no-sprint"])}
                classNames={{ trigger: "bg-content1 min-h-11" }}
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

      {isSubtaskMode && (
        <Controller
          name="parentId"
          control={control}
          render={({ field }: { field: any }) => (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="text-sm font-semibold text-foreground">
                {t("form.parent.label")}
              </span>
              {parentTaskId && lockedParent ? (
                <div className="rounded-xl border border-primary/20 bg-primary-50/40 p-4">
                  <p className="text-xs text-default-500 mb-1">{t("form.parent.linkedTo")}</p>
                  <Chip variant="flat" color="primary" className="font-semibold max-w-full">
                    <span className="truncate">{lockedParent.title}</span>
                  </Chip>
                </div>
              ) : (
                <Select
                  aria-label={t("form.parent.label")}
                  variant="bordered"
                  placeholder={t("form.parent.placeholder")}
                  selectedKeys={field.value ? new Set([field.value]) : new Set()}
                  isInvalid={!!errors.parentId}
                  errorMessage={errors.parentId?.message as string | undefined}
                  classNames={{ trigger: "bg-content1 min-h-11" }}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string;
                    field.onChange(val || null);
                    const parent = parentCandidates.find((p) => p.id === val);
                    if (parent?.sprintId) {
                      form.setValue("sprintId", parent.sprintId);
                    }
                  }}
                >
                  {parentCandidates.map((p) => (
                    <SelectItem key={p.id} textValue={p.title}>
                      <div className="flex flex-col">
                        <span>{p.title}</span>
                        <span className="text-tiny text-default-400 capitalize">
                          {t(`type.${p.type}`)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              )}
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
                variant="bordered"
                selectedKeys={new Set([field.value])}
                classNames={{ trigger: "bg-content1 min-h-11" }}
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
                variant="bordered"
                selectedKeys={new Set([field.value])}
                classNames={{ trigger: "bg-content1 min-h-11" }}
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
            <span className="text-sm font-semibold text-foreground">
              {t("form.assignee.label")}
            </span>
            <Select
              aria-label={t("form.assignee.label")}
              variant="bordered"
              placeholder={t("form.assignee.placeholder")}
              classNames={{ trigger: "bg-content1 min-h-11", value: "text-foreground" }}
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
                return (
                  <span className="text-default-500">{t("form.assignee.placeholder")}</span>
                );
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
          <DatePicker
            label={t("form.dueDate.label")}
            className="max-w-full"
            variant="bordered"
            value={field.value ? parseDate(field.value) : null}
            onChange={(date: any) => field.onChange(date?.toString() || null)}
            isInvalid={!!errors.dueDate}
            errorMessage={errors.dueDate?.message}
            classNames={fieldClassNames}
          />
        )}
      />
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-primary" />
              {t("form.attachments.label")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-default-400 bg-default-100 px-2 py-0.5 rounded-full">
              {t("form.attachments.optional")}
            </span>
            {totalAttachments > 0 && (
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {totalAttachments}
              </span>
            )}
          </div>
          <p className="text-xs text-default-500 mt-1">{t("form.attachments.hint")}</p>
        </div>

        <AttachmentUploadZone
          disabled={isSubmitting || isUploading}
          fileCount={selectedFiles.length}
          onFilesSelected={(files) =>
            setSelectedFiles((prev) => [...prev, ...files])
          }
        />

        {totalAttachments > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingAttachments.map((url, i) => (
              <AttachmentThumbnail
                key={`existing-${url}`}
                url={url}
                index={i}
                onPreview={() => setPreviewUrl(url)}
                onDelete={(e) => {
                  e.stopPropagation();
                  setExistingAttachments((prev) => prev.filter((u) => u !== url));
                }}
              />
            ))}
            {selectedFiles.map((file, i) => (
              <PendingFileThumbnail
                key={`pending-${file.name}-${i}`}
                file={file}
                onRemove={() =>
                  setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))
                }
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!previewUrl}
        onOpenChange={(open) => !open && setPreviewUrl(null)}
        size="4xl"
        classNames={{ backdrop: "bg-black/80 backdrop-blur-sm" }}
      >
        <ModalContent>
          {() => (
            <ModalBody className="p-4 flex items-center justify-center min-h-[40vh]">
              {previewUrl &&
                (isLikelyImageUrl(previewUrl) ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-[80vh] object-contain rounded-xl"
                  />
                ) : (
                  <iframe
                    src={previewUrl}
                    title="Preview"
                    className="w-full h-[80vh] rounded-xl bg-white"
                  />
                ))}
            </ModalBody>
          )}
        </ModalContent>
      </Modal>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2 border-t border-default-100">
        {onCancel && (
          <Button
            type="button"
            variant="flat"
            onPress={onCancel}
            isDisabled={isSubmitting || isUploading}
            className="h-11 font-semibold px-6"
          >
            {tc("actions.cancel")}
          </Button>
        )}
        <Button
          type="submit"
          color="primary"
          variant="shadow"
          isDisabled={isSubmitting || isUploading}
          className={`h-12 font-bold shadow-lg shadow-primary/25 ${!onCancel ? "w-full sm:w-auto sm:min-w-[160px]" : "px-8"}`}
        >
          {(isSubmitting || isUploading) ? (
            <Spinner size="sm" color="current" className="mr-2" />
          ) : null}
          {(isSubmitting || isUploading) ? tc("actions.loading") : tc("actions.save")}
        </Button>
      </div>
    </form>
  );
}
