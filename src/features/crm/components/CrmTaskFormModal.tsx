import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  DatePicker,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { parseDate } from "@internationalized/date";
import { useAllUsers } from "@/features/users/hooks/use-users";
import {
  crmTaskFormSchema,
  toCreateCrmTaskDTO,
  type CrmTaskFormValues,
} from "../schemas/crm-task.schema";
import {
  useCreateCrmTaskGlobalMutation,
  useUpdateCrmTaskMutation,
} from "../hooks/use-crm-tasks";
import {
  CRM_TASK_TYPES,
  CRM_TASK_STATUSES,
  normalizeCrmTaskStatus,
} from "../constants/crm-task.constants";
import type { CrmTask, CrmTaskPriority } from "../types/crm-tasks.types";

const CRM_TASK_PRIORITIES: CrmTaskPriority[] = ["low", "medium", "high"];

interface CrmTaskFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task?: CrmTask | null;
}

export function CrmTaskFormModal({ isOpen, onOpenChange, task }: CrmTaskFormModalProps) {
  const { t } = useTranslation("crm");
  const { data: users } = useAllUsers();
  const createTask = useCreateCrmTaskGlobalMutation();
  const updateTask = useUpdateCrmTaskMutation();
  const isEdit = !!task;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CrmTaskFormValues>({
    resolver: zodResolver(crmTaskFormSchema),
    defaultValues: {
      title: "",
      taskType: "call",
      status: "pending",
      priority: "medium",
      assigneeId: null,
      dueDate: null,
      description: "",
      entityType: "crm_task",
      entityId: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (task) {
      reset({
        title: task.title,
        taskType: task.taskType,
        status: normalizeCrmTaskStatus(task.status),
        priority: task.priority,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate ?? null,
        description: task.description ?? "",
        entityType: task.entityType,
        entityId: task.entityId,
      });
    } else {
      reset({
        title: "",
        taskType: "call",
        status: "pending",
        priority: "medium",
        assigneeId: null,
        dueDate: null,
        description: "",
        entityType: "crm_task",
        entityId: "",
      });
    }
  }, [isOpen, task, reset]);

  const onSubmit = async (values: CrmTaskFormValues) => {
    const dto = toCreateCrmTaskDTO(values);
    if (isEdit && task) {
      await updateTask.mutateAsync({ id: task.id, data: dto });
    } else {
      await createTask.mutateAsync(dto);
    }
    onOpenChange(false);
  };

  const busy = isSubmitting || createTask.isPending || updateTask.isPending;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {isEdit ? t("crmTasks.form.editTitle") : t("crmTasks.form.createTitle")}
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label={t("crmTasks.form.title")}
                {...register("title")}
                isInvalid={!!errors.title}
                errorMessage={errors.title?.message}
                isRequired
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="taskType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={t("crmTasks.form.taskType")}
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys)[0] as string;
                        field.onChange(v);
                      }}
                    >
                      {CRM_TASK_TYPES.map((type) => (
                        <SelectItem key={type}>{t(`crmTasks.type.${type}`)}</SelectItem>
                      ))}
                    </Select>
                  )}
                />
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={t("crmTasks.form.priority")}
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys)[0] as string;
                        field.onChange(v);
                      }}
                    >
                      {CRM_TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p}>{t(`crmTasks.priority.${p}`)}</SelectItem>
                      ))}
                    </Select>
                  )}
                />
              </div>
              {isEdit && (
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={t("crmTasks.form.status")}
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys)[0] as string;
                        field.onChange(v);
                      }}
                    >
                      {CRM_TASK_STATUSES.map((s) => (
                        <SelectItem key={s}>{t(`crmTasks.status.${s}`)}</SelectItem>
                      ))}
                    </Select>
                  )}
                />
              )}
              <Controller
                name="assigneeId"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t("crmTasks.form.assignee")}
                    selectedKeys={field.value ? [field.value] : []}
                    onSelectionChange={(keys) => {
                      const v = Array.from(keys)[0] as string | undefined;
                      field.onChange(v ?? null);
                    }}
                  >
                    {(users ?? []).map((u) => (
                      <SelectItem key={u.id}>{u.name}</SelectItem>
                    ))}
                  </Select>
                )}
              />
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label={t("crmTasks.form.dueDate")}
                    value={
                      field.value
                        ? parseDate(
                            field.value.includes("T")
                              ? field.value.split("T")[0]
                              : field.value
                          )
                        : null
                    }
                    onChange={(date) => field.onChange(date?.toString() ?? null)}
                  />
                )}
              />
              <Textarea
                label={t("crmTasks.form.description")}
                {...register("description")}
                minRows={3}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("crmTasks.form.cancel")}
              </Button>
              <Button color="primary" type="submit" isLoading={busy}>
                {isEdit ? t("crmTasks.form.save") : t("crmTasks.form.create")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
