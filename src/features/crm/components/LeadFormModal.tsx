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
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { leadFormSchema, toCreateLeadDTO, type LeadFormValues } from "../schemas/lead.schema";
import { useCreateLeadMutation, useUpdateLeadMutation } from "../hooks/use-leads";
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES, normalizeLeadStatus } from "../constants/lead-workflow";
import { selectFieldProps } from "@/components/shared/select-field";
import type { Lead } from "../types/leads.types";

interface LeadFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

export function LeadFormModal({ isOpen, onOpenChange, lead }: LeadFormModalProps) {
  const { t } = useTranslation("crm");
  const { data: users } = useAllUsers();
  const createLead = useCreateLeadMutation();
  const updateLead = useUpdateLeadMutation();
  const isEdit = !!lead;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "new",
      source: "other",
      priority: "medium",
      assignedTo: null,
      notes: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (lead) {
      reset({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: normalizeLeadStatus(lead.status),
        source: (lead.source as LeadFormValues["source"]) ?? "other",
        priority: lead.priority ?? "medium",
        assignedTo: lead.assignedTo,
        notes: lead.notes,
      });
    } else {
      reset({
        name: "",
        email: "",
        phone: "",
        company: "",
        status: "new",
        source: "other",
        priority: "medium",
        assignedTo: null,
        notes: "",
      });
    }
  }, [isOpen, lead, reset]);

  const onSubmit = async (values: LeadFormValues) => {
    if (isEdit && lead) {
      await updateLead.mutateAsync({ id: lead.id, data: toCreateLeadDTO(values) });
    } else {
      await createLead.mutateAsync(toCreateLeadDTO(values));
    }
    onOpenChange(false);
  };

  const busy = isSubmitting || createLead.isPending || updateLead.isPending;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {isEdit ? t("leads.form.editTitle") : t("leads.form.createTitle")}
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label={t("leads.form.name")}
                {...register("name")}
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
                isRequired
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("leads.form.phone")}
                  {...register("phone")}
                  isInvalid={!!errors.phone}
                  errorMessage={errors.phone?.message}
                />
                <Input
                  label={t("leads.form.email")}
                  type="email"
                  {...register("email")}
                  isInvalid={!!errors.email}
                  errorMessage={errors.email?.message}
                />
              </div>
              <Input
                label={t("leads.form.company")}
                {...register("company")}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="source"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...selectFieldProps()}
                      label={t("leads.form.source")}
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys)[0] as string;
                        field.onChange(v);
                      }}
                    >
                      {LEAD_SOURCES.map((s) => (
                        <SelectItem key={s} textValue={t(`leads.source.${s}`)}>{t(`leads.source.${s}`)}</SelectItem>
                      ))}
                    </Select>
                  )}
                />
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...selectFieldProps()}
                      label={t("leads.form.priority")}
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys)[0] as string;
                        field.onChange(v);
                      }}
                    >
                      {LEAD_PRIORITIES.map((p) => (
                        <SelectItem key={p} textValue={t(`leads.priority.${p}`)}>{t(`leads.priority.${p}`)}</SelectItem>
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
                      {...selectFieldProps()}
                      label={t("leads.form.status")}
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys)[0] as string;
                        field.onChange(v);
                      }}
                    >
                      {LEAD_STATUSES.map((s) => (
                        <SelectItem key={s} textValue={t(`leads.status.${s}`)}>{t(`leads.status.${s}`)}</SelectItem>
                      ))}
                    </Select>
                  )}
                />
              )}
              <Controller
                name="assignedTo"
                control={control}
                render={({ field }) => (
                  <Select
                    {...selectFieldProps()}
                    label={t("leads.form.assignedTo")}
                    selectedKeys={field.value ? [field.value] : []}
                    onSelectionChange={(keys) => {
                      const v = Array.from(keys)[0] as string | undefined;
                      field.onChange(v ?? null);
                    }}
                  >
                    {(users ?? []).map((u) => (
                      <SelectItem key={u.id} textValue={u.name ?? u.id}>{u.name}</SelectItem>
                    ))}
                  </Select>
                )}
              />
              <Textarea
                label={t("leads.form.notes")}
                {...register("notes")}
                minRows={3}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("leads.form.cancel")}
              </Button>
              <Button color="primary" type="submit" isLoading={busy}>
                {isEdit ? t("leads.form.save") : t("leads.form.create")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
