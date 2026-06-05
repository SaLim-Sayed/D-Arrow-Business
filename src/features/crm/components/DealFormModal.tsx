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
  DatePicker,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { parseDate } from "@internationalized/date";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { dealFormSchema, toCreateDealDTO, type DealFormValues } from "../schemas/deal.schema";
import { useCreateDealMutation, useUpdateDealMutation } from "../hooks/use-deals";
import { useContactsQuery } from "../hooks/use-contacts";
import { DEAL_STAGES, normalizeDealStage } from "../constants/deal-workflow";
import type { Deal } from "../types/deals.types";

interface DealFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
}

function contactLabel(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim() || firstName;
}

export function DealFormModal({ isOpen, onOpenChange, deal }: DealFormModalProps) {
  const { t } = useTranslation("crm");
  const { data: users } = useAllUsers();
  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data ?? [];
  const createDeal = useCreateDealMutation();
  const updateDeal = useUpdateDealMutation();
  const isEdit = !!deal;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      title: "",
      contactId: null,
      amount: 0,
      currency: "USD",
      stage: "lead",
      probability: 10,
      expectedCloseDate: null,
      assignedTo: null,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (deal) {
      reset({
        title: deal.title,
        contactId: deal.contactId ?? null,
        amount: deal.amount,
        currency: deal.currency,
        stage: normalizeDealStage(deal.stage),
        probability: deal.probability,
        expectedCloseDate: deal.expectedCloseDate ?? null,
        assignedTo: deal.assignedTo ?? null,
      });
    } else {
      reset({
        title: "",
        contactId: null,
        amount: 0,
        currency: "USD",
        stage: "lead",
        probability: 10,
        expectedCloseDate: null,
        assignedTo: null,
      });
    }
  }, [isOpen, deal, reset]);

  const onSubmit = async (values: DealFormValues) => {
    const dto = toCreateDealDTO(values);
    if (isEdit && deal) {
      await updateDeal.mutateAsync({ id: deal.id, data: dto });
    } else {
      await createDeal.mutateAsync(dto);
    }
    onOpenChange(false);
  };

  const busy = isSubmitting || createDeal.isPending || updateDeal.isPending;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {isEdit ? t("deals.form.editTitle") : t("deals.form.createTitle")}
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label={t("deals.form.title")}
                {...register("title")}
                isInvalid={!!errors.title}
                errorMessage={errors.title?.message}
                isRequired
              />
              <Controller
                name="contactId"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t("deals.form.contact")}
                    selectedKeys={field.value ? [field.value] : []}
                    onSelectionChange={(keys) => {
                      const v = Array.from(keys)[0] as string | undefined;
                      field.onChange(v ?? null);
                    }}
                  >
                    {contacts.map((c) => (
                      <SelectItem key={c.id}>
                        {contactLabel(c.firstName, c.lastName)}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label={t("deals.form.amount")}
                  type="number"
                  {...register("amount", { valueAsNumber: true })}
                  isInvalid={!!errors.amount}
                  errorMessage={errors.amount?.message}
                  isRequired
                />
                <Input
                  label={t("deals.form.currency")}
                  {...register("currency")}
                  isInvalid={!!errors.currency}
                  errorMessage={errors.currency?.message}
                />
                <Input
                  label={t("deals.form.probability")}
                  type="number"
                  {...register("probability", { valueAsNumber: true })}
                  isInvalid={!!errors.probability}
                  errorMessage={errors.probability?.message}
                />
              </div>
              {isEdit && (
                <Controller
                  name="stage"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={t("deals.form.stage")}
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys)[0] as string;
                        field.onChange(v);
                      }}
                    >
                      {DEAL_STAGES.map((s) => (
                        <SelectItem key={s}>{t(`deals.stage.${s}`)}</SelectItem>
                      ))}
                    </Select>
                  )}
                />
              )}
              <Controller
                name="expectedCloseDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label={t("deals.form.expectedCloseDate")}
                    value={
                      field.value
                        ? parseDate(
                            field.value.includes("T")
                              ? field.value.split("T")[0]
                              : field.value
                          )
                        : null
                    }
                    onChange={(date: { toString(): string } | null) =>
                      field.onChange(date?.toString() ?? null)
                    }
                  />
                )}
              />
              <Controller
                name="assignedTo"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t("deals.form.assignedTo")}
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
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("deals.form.cancel")}
              </Button>
              <Button color="primary" type="submit" isLoading={busy}>
                {isEdit ? t("deals.form.save") : t("deals.form.create")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
