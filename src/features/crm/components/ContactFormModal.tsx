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
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAllUsers } from "@/features/users/hooks/use-users";
import {
  contactFormSchema,
  toCreateContactDTO,
  type ContactFormValues,
} from "../schemas/contact.schema";
import { useCreateContactMutation, useUpdateContactMutation } from "../hooks/use-contacts";
import type { Contact } from "../types/contacts.types";

interface ContactFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
}

export function ContactFormModal({ isOpen, onOpenChange, contact }: ContactFormModalProps) {
  const { t } = useTranslation("crm");
  const { data: users } = useAllUsers();
  const createContact = useCreateContactMutation();
  const updateContact = useUpdateContactMutation();
  const isEdit = !!contact;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      department: "",
      accountName: "",
      assignedTo: null,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (contact) {
      reset({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        jobTitle: contact.jobTitle ?? "",
        department: contact.department ?? "",
        accountName: contact.accountName ?? "",
        assignedTo: contact.assignedTo ?? null,
      });
    } else {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        department: "",
        accountName: "",
        assignedTo: null,
      });
    }
  }, [isOpen, contact, reset]);

  const onSubmit = async (values: ContactFormValues) => {
    const dto = toCreateContactDTO(values);
    if (isEdit && contact) {
      await updateContact.mutateAsync({ id: contact.id, data: dto });
    } else {
      await createContact.mutateAsync(dto);
    }
    onOpenChange(false);
  };

  const busy = isSubmitting || createContact.isPending || updateContact.isPending;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {isEdit ? t("contacts.form.editTitle") : t("contacts.form.createTitle")}
            </ModalHeader>
            <ModalBody className="gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("contacts.form.firstName")}
                  {...register("firstName")}
                  isInvalid={!!errors.firstName}
                  errorMessage={errors.firstName?.message}
                  isRequired
                />
                <Input
                  label={t("contacts.form.lastName")}
                  {...register("lastName")}
                  isInvalid={!!errors.lastName}
                  errorMessage={errors.lastName?.message}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("contacts.form.email")}
                  type="email"
                  {...register("email")}
                  isInvalid={!!errors.email}
                  errorMessage={errors.email?.message}
                />
                <Input
                  label={t("contacts.form.phone")}
                  {...register("phone")}
                  isInvalid={!!errors.phone}
                  errorMessage={errors.phone?.message}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t("contacts.form.jobTitle")} {...register("jobTitle")} />
                <Input label={t("contacts.form.department")} {...register("department")} />
              </div>
              <Input label={t("contacts.form.accountName")} {...register("accountName")} />
              <Controller
                name="assignedTo"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t("contacts.form.assignedTo")}
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
                {t("contacts.form.cancel")}
              </Button>
              <Button color="primary" type="submit" isLoading={busy}>
                {isEdit ? t("contacts.form.save") : t("contacts.form.create")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
