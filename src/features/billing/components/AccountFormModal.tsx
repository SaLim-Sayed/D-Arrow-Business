import { useEffect } from "react";
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
  Switch,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ACCOUNT_TYPES,
  ACCOUNT_SUB_TYPES,
  accountSchema,
  type Account,
  type AccountType,
} from "../schemas/account";
import {
  useCreateAccountMutation,
  useUpdateAccountMutation,
} from "../hooks/use-accounts";
import { useBillingSettings } from "../hooks/use-billing-settings";
import { selectFieldProps } from "@/components/shared/select-field";

const SUB_TYPES_BY_TYPE: Record<AccountType, readonly string[]> = {
  asset: [
    "cash",
    "bank",
    "accounts_receivable",
    "inventory",
    "current_asset",
    "fixed_asset",
  ],
  liability: [
    "accounts_payable",
    "current_liability",
    "long_term_liability",
    "credit_card",
  ],
  equity: ["equity", "retained_earnings"],
  income: ["operating_income", "other_income"],
  expense: ["operating_expense", "cost_of_goods_sold", "other_expense"],
};

interface AccountFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null;
  allAccounts?: Account[];
}

export function AccountFormModal({
  isOpen,
  onOpenChange,
  account,
  allAccounts = [],
}: AccountFormModalProps) {
  const { t } = useTranslation("billing");
  const { t: tc } = useTranslation("common");
  const createAccount = useCreateAccountMutation();
  const updateAccount = useUpdateAccountMutation();
  const { data: settings } = useBillingSettings();
  const isEdit = !!account?.id;

  const formSchema = accountSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "expense" as AccountType,
      subType: "operating_expense",
      parentId: undefined as string | undefined,
      description: "",
      isActive: true,
      isSystemAccount: false,
      currency: "USD",
      currentBalance: 0,
    },
  });

  const watchType = watch("type") as AccountType;
  const allowedSubTypes = SUB_TYPES_BY_TYPE[watchType] ?? ACCOUNT_SUB_TYPES;

  useEffect(() => {
    if (!isOpen) return;
    if (account) {
      reset({
        code: account.code,
        name: account.name,
        type: account.type,
        subType: account.subType,
        parentId: account.parentId,
        description: account.description ?? "",
        isActive: account.isActive,
        isSystemAccount: account.isSystemAccount,
        currency: account.currency,
        currentBalance: account.currentBalance ?? 0,
      });
    } else {
      reset({
        code: "",
        name: "",
        type: "expense",
        subType: "operating_expense",
        parentId: undefined,
        description: "",
        isActive: true,
        isSystemAccount: false,
        currency:
          settings?.currencies?.find((c) => c.isDefault)?.code ?? "USD",
        currentBalance: 0,
      });
    }
  }, [isOpen, account, reset, settings]);

  useEffect(() => {
    if (!allowedSubTypes.includes(watch("subType"))) {
      setValue("subType", allowedSubTypes[0] as typeof ACCOUNT_SUB_TYPES[number]);
    }
  }, [watchType, allowedSubTypes, setValue, watch]);

  const onSubmit = async (data: Account) => {
    try {
      if (isEdit && account?.id) {
        await updateAccount.mutateAsync({
          id: account.id,
          data: {
            code: data.code,
            name: data.name,
            type: data.type,
            subType: data.subType,
            parentId: data.parentId || undefined,
            description: data.description,
            isActive: data.isActive,
            currency: data.currency,
          },
        });
        toast.success(t("accounts.form.updated"));
      } else {
        await createAccount.mutateAsync({
          ...data,
          parentId: data.parentId || undefined,
          isSystemAccount: false,
          currentBalance: 0,
        });
        toast.success(t("accounts.form.created"));
      }
      onOpenChange(false);
    } catch {
      toast.error(t("accounts.form.error"));
    }
  };

  const parentOptions = allAccounts.filter(
    (a) =>
      a.id &&
      a.id !== account?.id &&
      a.type === watchType &&
      !a.isSystemAccount
  );

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {isEdit ? t("accounts.form.edit_title") : t("accounts.form.add_title")}
            </ModalHeader>
            <ModalBody className="gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label={t("accounts.form.code")}
                  variant="bordered"
                  {...register("code")}
                  isInvalid={!!errors.code}
                  errorMessage={errors.code?.message as string}
                  isDisabled={account?.isSystemAccount}
                />
                <Input
                  label={t("accounts.form.name")}
                  variant="bordered"
                  {...register("name")}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message as string}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      {...selectFieldProps()}
                      label={t("accounts.columns.type")}
                      variant="bordered"
                      selectedKeys={[field.value]}
                      onSelectionChange={(keys) => {
                        const key = Array.from(keys)[0];
                        if (key) field.onChange(String(key));
                      }}
                      isDisabled={account?.isSystemAccount}
                    >
                      {ACCOUNT_TYPES.map((type) => (
                        <SelectItem key={type} textValue={t(`accounts.types.${type}`)}>
                          {t(`accounts.types.${type}`)}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />
                <Controller
                  control={control}
                  name="subType"
                  render={({ field }) => (
                    <Select
                      {...selectFieldProps()}
                      label={t("accounts.columns.internal_type")}
                      variant="bordered"
                      selectedKeys={[field.value]}
                      onSelectionChange={(keys) => {
                        const key = Array.from(keys)[0];
                        if (key) field.onChange(String(key));
                      }}
                      isDisabled={account?.isSystemAccount}
                    >
                      {allowedSubTypes.map((st) => (
                        <SelectItem
                          key={st}
                          textValue={t(`accounts.sub_types.${st}`)}
                        >
                          {t(`accounts.sub_types.${st}`)}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />
              </div>

              <Controller
                control={control}
                name="parentId"
                render={({ field }) => (
                  <Select
                    {...selectFieldProps()}
                    label={t("accounts.form.parent")}
                    placeholder={t("accounts.form.parent_placeholder")}
                    variant="bordered"
                    selectedKeys={field.value ? [field.value] : []}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0];
                      field.onChange(key ? String(key) : undefined);
                    }}
                    isDisabled={account?.isSystemAccount}
                  >
                    {parentOptions.map((a) => (
                      <SelectItem
                        key={a.id!}
                        textValue={`${a.code} — ${a.name}`}
                      >
                        {a.code} — {a.name}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />

              <Textarea
                label={t("accounts.form.description")}
                variant="bordered"
                {...register("description")}
              />

              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch isSelected={field.value} onValueChange={field.onChange}>
                    {t("accounts.form.active")}
                  </Switch>
                )}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {tc("actions.cancel")}
              </Button>
              <Button color="primary" type="submit" isLoading={isSubmitting}>
                {tc("actions.save")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
