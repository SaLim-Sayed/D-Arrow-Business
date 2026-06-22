import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller, type FieldErrors, type Resolver } from "react-hook-form";
import { useCompany } from "@/features/companies/context/company-context";
import { TaskService } from "../api/tasks.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Paperclip, UserRound } from "lucide-react";
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
  SelectItem,
  Avatar,
  Modal,
  ModalContent,
  ModalBody,
  Chip,
} from "@heroui/react";
import { AppDatePicker } from "@/components/shared/app-date-picker";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useAuthStore } from "@/stores/auth.store";
import { useTasksPermissions } from "../hooks/use-tasks-permissions";
import { useAllTasksQuery, useSprintsQuery } from "../hooks/use-tasks";
import type { CreateTaskDTO, Task, TaskPriority, TaskStatus } from "../types/task.types";
import { toast } from "sonner";
import { parseDate } from "@internationalized/date";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/shared/searchable-select";
import {
  normalizeTaskPriorityValue,
  normalizeTaskStatusValue,
  normalizeTaskTypeValue,
} from "../utils/task-field-normalizers";

const TASK_STATUS_VALUES = ["todo", "in_progress", "in_review", "done"] as const;
const TASK_PRIORITY_VALUES = ["low", "medium", "high", "urgent"] as const;
const TASK_TYPE_VALUES = ["task", "subtask"] as const;

type TaskFormValues = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: "task" | "subtask";
  assigneeId?: string | null;
  parentId?: string | null;
  sprintId?: string | null;
  dueDate?: string | null;
};

const taskSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string(),
    status: z.enum(TASK_STATUS_VALUES),
    priority: z.enum(TASK_PRIORITY_VALUES),
    type: z.enum(TASK_TYPE_VALUES),
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

const taskFormResolver: Resolver<TaskFormValues> = (values, context, options) =>
  zodResolver(taskSchema)(
    {
      ...(values as TaskFormValues),
      status: normalizeTaskStatusValue(values.status),
      priority: normalizeTaskPriorityValue(values.priority),
      type: normalizeTaskTypeValue(values.type),
    },
    context,
    options
  );

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
  const { t, i18n } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const isRtl = i18n.language === "ar";
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
    base: "gap-2.5 w-full",
    inputWrapper:
      "bg-content1 border border-default-200 shadow-none group-data-[focus=true]:border-primary rounded-md min-h-10",
    label: "text-default-600 font-semibold text-sm text-start mb-0.5",
    input: "text-start text-sm",
    innerWrapper: "w-full",
  };

  const displayUserName = (user: { name: string; nameAr?: string | null }) =>
    isRtl && user.nameAr ? user.nameAr : user.name;

  const form = useForm<TaskFormValues>({
    resolver: taskFormResolver,
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      status: normalizeTaskStatusValue(defaultValues?.status ?? "todo"),
      priority: normalizeTaskPriorityValue(defaultValues?.priority ?? "medium"),
      type: parentTaskId
        ? "subtask"
        : normalizeTaskTypeValue(defaultValues?.type ?? "task"),
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
    if (!companyId) {
      toast.error(t("toast.createFailed"));
      return;
    }

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
      status: normalizeTaskStatusValue(values.status),
      priority: normalizeTaskPriorityValue(values.priority),
      type: values.type === "subtask" ? "subtask" : "task",
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

  const onInvalid = (fieldErrors: FieldErrors<TaskFormValues>) => {
    const first = Object.values(fieldErrors).find(
      (e) => e && typeof e === "object" && "message" in e && e.message
    ) as { message?: string } | undefined;
    toast.error(first?.message ?? t("form.checkFields"));
  };

  const submitForm = () => {
    void form.handleSubmit(handleSubmit, onInvalid)();
  };

  const totalAttachments = existingAttachments.length + selectedFiles.length;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitForm();
      }}
      className="space-y-8 w-full"
    >
      <div className="space-y-6">
        <Controller
          name="title"
          control={control}
          render={({ field }: { field: any }) => (
            <Input
              {...field}
              label={t("form.title.label")}
              labelPlacement="outside"
              placeholder={t("form.title.placeholder")}
              variant="bordered"
              radius="sm"
              size="md"
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
              labelPlacement="outside"
              placeholder={t("form.description.placeholder")}
              variant="bordered"
              radius="sm"
              minRows={3}
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

      <div className="rounded-lg border border-default-200 bg-default-50/40 p-5 md:p-6 space-y-6">
        <p className="text-sm font-semibold text-foreground text-start pb-1">
          {t("detail.details")}
        </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
        <Controller
          name="type"
          control={control}
          render={({ field }: { field: any }) => (
            <SearchableSelect
              label={t("form.type.label")}
              aria-label={t("form.type.label")}
              searchPlaceholder={t("form.search.placeholder")}
              isDisabled={!!parentTaskId}
              selectedKey={field.value}
              triggerLabel={field.value ? t(`type.${field.value}`) : undefined}
              onSelectionChange={(key) => {
                if (key) field.onChange(normalizeTaskTypeValue(key));
              }}
            >
              <SelectItem key="task" textValue={t("type.task")} description={t("type.taskHint")}>
                {t("type.task")}
              </SelectItem>
              <SelectItem key="subtask" textValue={t("type.subtask")} description={t("type.subtaskHint")}>
                {t("type.subtask")}
              </SelectItem>
            </SearchableSelect>
          )}
        />

        <Controller
          name="sprintId"
          control={control}
          render={({ field }: { field: any }) => (
            <SearchableSelect
              label={t("form.sprint.label")}
              aria-label={t("form.sprint.label")}
              searchPlaceholder={t("form.search.placeholder")}
              selectedKey={field.value ?? "no-sprint"}
              triggerLabel={
                field.value
                  ? sprints.find((s) => s.id === field.value)?.name ??
                    t("form.sprint.unassigned")
                  : t("form.sprint.unassigned")
              }
              onSelectionChange={(key) => {
                const val = key as string;
                field.onChange(val === "no-sprint" ? null : val);
              }}
            >
              {[
                <SelectItem key="no-sprint" textValue={t("form.sprint.unassigned")}>{t("form.sprint.unassigned")}</SelectItem>,
                ...sprints.map((s) => (
                  <SelectItem key={s.id} textValue={s.name}>
                    <span dir="auto">{s.name}</span>
                  </SelectItem>
                ))
              ]}
            </SearchableSelect>
          )}
        />
      </div>

      {isSubtaskMode && (
        <Controller
          name="parentId"
          control={control}
          render={({ field }: { field: any }) => (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              {parentTaskId && lockedParent ? (
                <div className="space-y-2">
                  <span className="text-sm font-semibold text-foreground text-start block">
                    {t("form.parent.label")}
                  </span>
                  <div className="rounded-md border border-primary/20 bg-primary-50/40 p-3 text-start">
                    <p className="text-xs text-default-500 mb-1">{t("form.parent.linkedTo")}</p>
                    <Chip variant="flat" color="primary" className="font-semibold max-w-full">
                      <span className="truncate" dir="auto">
                        {lockedParent.title}
                      </span>
                    </Chip>
                  </div>
                </div>
              ) : (
                <SearchableSelect
                  label={t("form.parent.label")}
                  aria-label={t("form.parent.label")}
                  placeholder={t("form.parent.placeholder")}
                  searchPlaceholder={t("form.search.placeholder")}
                  selectedKey={field.value ?? undefined}
                  isInvalid={!!errors.parentId}
                  errorMessage={errors.parentId?.message as string | undefined}
                  onSelectionChange={(key) => {
                    const val = key as string | null;
                    field.onChange(val || null);
                    const parent = parentCandidates.find((p) => p.id === val);
                    if (parent?.sprintId) {
                      form.setValue("sprintId", parent.sprintId);
                    }
                  }}
                >
                  {parentCandidates.map((p) => (
                    <SelectItem key={p.id} textValue={p.title}>
                      <div className="flex flex-col text-start">
                        <span dir="auto">{p.title}</span>
                        <span className="text-tiny text-default-400 capitalize">
                          {t(`type.${p.type}`)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SearchableSelect>
              )}
            </div>
          )}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
        <Controller
          name="status"
          control={control}
          render={({ field }: { field: any }) => (
            <SearchableSelect
              label={t("form.statusLabel")}
              aria-label={t("form.statusLabel")}
              searchPlaceholder={t("form.search.placeholder")}
              selectedKey={field.value}
              triggerLabel={field.value ? t(`status.${field.value}`) : undefined}
              onSelectionChange={(key) => {
                if (key) field.onChange(normalizeTaskStatusValue(key));
              }}
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
                      <span className="text-xs text-default-400 ms-1">
                        ({t("errors.approveOnly")})
                      </span>
                    )}
                </SelectItem>
              ))}
            </SearchableSelect>
          )}
        />

        <Controller
          name="priority"
          control={control}
          render={({ field }: { field: any }) => (
            <SearchableSelect
              label={t("form.priority.label")}
              aria-label={t("form.priority.label")}
              searchPlaceholder={t("form.search.placeholder")}
              selectedKey={field.value}
              triggerLabel={field.value ? t(`priority.${field.value}`) : undefined}
              onSelectionChange={(key) => {
                if (key) field.onChange(normalizeTaskPriorityValue(key));
              }}
            >
              {TASK_PRIORITIES.map((priority) => (
                <SelectItem
                  key={priority}
                  textValue={t(`priority.${priority}`)}
                >
                  {t(`priority.${priority}`)}
                </SelectItem>
              ))}
            </SearchableSelect>
          )}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">

      <Controller
        name="assigneeId"
        control={control}
        render={({ field }: { field: any }) => {
          const selectedUser = field.value
            ? allUsers?.find((u) => u.id === field.value) ||
              (currentUser?.id === field.value ? currentUser : null)
            : null;

          return (
            <SearchableSelect
              label={t("form.assignee.label")}
              aria-label={t("form.assignee.label")}
              placeholder={t("form.assignee.placeholder")}
              searchPlaceholder={t("form.assignee.searchPlaceholder")}
              selectedKey={field.value ?? null}
              triggerLabel={
                selectedUser ? displayUserName(selectedUser) : undefined
              }
              startContent={
                selectedUser ? (
                  <Avatar
                    size="sm"
                    src={selectedUser.avatar}
                    fallback={displayUserName(selectedUser).charAt(0).toUpperCase()}
                    showFallback
                    className="shrink-0"
                  />
                ) : (
                  <UserRound className="w-4 h-4 text-default-400 shrink-0" />
                )
              }
              renderValue={
                selectedUser
                  ? () => (
                      <span className="truncate" dir="auto">
                        {displayUserName(selectedUser)}
                      </span>
                    )
                  : undefined
              }
              onSelectionChange={(key) => {
                const val = key as string | null;
                field.onChange(!val || val === "unassigned" ? null : val);
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
                const name = displayUserName(user);
                const searchLabel =
                  option.type === "me"
                    ? `${name} ${t("form.assignee.me")} ${user.email}`
                    : `${name} ${user.email}`;
                return (
                  <SelectItem
                    key={option.id}
                    textValue={name}
                    // @ts-expect-error custom prop used by SearchableSelect filter
                    searchValue={searchLabel}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Avatar
                        size="sm"
                        src={user.avatar}
                        fallback={name.charAt(0).toUpperCase()}
                        showFallback
                      />
                      <div className="flex flex-col text-start min-w-0">
                        <span className="text-small font-medium" dir="auto">
                          {name}
                        </span>
                        <span className="text-tiny text-default-400" dir="ltr">
                          {option.type === "me"
                            ? t("form.assignee.me")
                            : user.email}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SearchableSelect>
          );
        }}
      />

      <Controller
        name="dueDate"
        control={control}
        render={({ field }: { field: any }) => (
          <AppDatePicker
            label={t("form.dueDate.label")}
            radius="sm"
            className="max-w-full"
            value={field.value ? parseDate(field.value) : null}
            onChange={(date: any) => field.onChange(date?.toString() || null)}
            isInvalid={!!errors.dueDate}
            errorMessage={errors.dueDate?.message}
          />
        )}
      />
      </div>
      </div>

      <div className="space-y-5 pt-2">
        <div className="text-start">
          <div className="flex items-center gap-2 flex-wrap justify-start">
            <span className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-primary shrink-0" />
              {t("form.attachments.label")}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-default-500 bg-default-100 px-2 py-0.5 rounded-md">
              {t("form.attachments.optional")}
            </span>
            {totalAttachments > 0 && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
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

      <div
        className={cn(
          "flex flex-col-reverse sm:flex-row gap-3 pt-6 mt-2 border-t border-default-100",
          isRtl ? "sm:justify-start" : "sm:justify-end"
        )}
      >
        {onCancel && (
          <Button
            type="button"
            variant="flat"
            radius="sm"
            onPress={onCancel}
            isDisabled={isSubmitting || isUploading}
            className="h-10 font-medium px-5"
          >
            {tc("actions.cancel")}
          </Button>
        )}
        <Button
          type="button"
          color="primary"
          radius="sm"
          isDisabled={isSubmitting || isUploading}
          isLoading={isSubmitting || isUploading}
          onPress={submitForm}
          className={`h-10 font-semibold ${!onCancel ? "w-full sm:w-auto sm:min-w-[140px]" : "px-6"}`}
        >
          {(isSubmitting || isUploading) ? tc("actions.loading") : tc("actions.save")}
        </Button>
      </div>
    </form>
  );
}
