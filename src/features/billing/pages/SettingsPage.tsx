import { PageHeader } from "@/components/shared/page-header";
import { Button, Input, Card, CardBody, CardHeader, Divider, Tabs, Tab } from "@heroui/react";
import { Settings, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { billingSettingsSchema } from "../schemas/settings";

export default function SettingsPage() {
  const { t } = useTranslation("billing");
  const { t: tc } = useTranslation("common");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(billingSettingsSchema),
    defaultValues: {
      companyProfile: {
        name: "",
        address: "",
        email: "",
      },
      invoiceSequence: {
        prefix: "INV-",
        nextNumber: 1,
        padding: 4,
      },
      currencies: [],
      taxes: [],
      paymentMethods: [],
    },
  });

  const onSubmit = async (data: any) => {
    try {
      // TODO: Hook up to API
      console.log(data);
      toast.success(t("settings.saved_successfully") || "Settings saved successfully");
    } catch (error) {
      toast.error(tc("errors.general") || "An error occurred");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title={t("settings.title") || "Billing Settings"}
        description={t("settings.subtitle") || "Manage company profile and billing preferences"}
        eyebrow={t("module_name") || "Billing"}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Tabs aria-label="Settings Tabs" color="primary" variant="underlined" classNames={{ cursor: "w-full" }}>
          <Tab key="general" title={t("settings.tab_general") || "General"}>
            <div className="space-y-6 mt-4">
              {/* Company Profile Settings */}
              <Card className="bg-white dark:bg-content1 rounded-2xl shadow-sm border border-default-100">
                <CardHeader className="px-6 py-4 flex items-center gap-3">
                  <Settings className="text-primary" size={24} />
                  <h2 className="text-xl font-bold">{t("settings.company_profile") || "Company Profile"}</h2>
                </CardHeader>
                <Divider />
                <CardBody className="px-6 py-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={t("settings.company_name") || "Company Name"}
                      placeholder="e.g. Acme Corp"
                      {...register("companyProfile.name")}
                      isInvalid={!!(errors?.companyProfile as any)?.name}
                      errorMessage={(errors?.companyProfile as any)?.name?.message}
                      variant="bordered"
                    />
                    <Input
                      label={t("settings.tax_number") || "Tax Number (VAT)"}
                      placeholder="e.g. 1234567890"
                      {...register("companyProfile.taxNumber")}
                      variant="bordered"
                    />
                  </div>

                  <Input
                    label={t("settings.address") || "Address"}
                    placeholder="Full business address"
                    {...register("companyProfile.address")}
                    isInvalid={!!(errors?.companyProfile as any)?.address}
                    errorMessage={(errors?.companyProfile as any)?.address?.message}
                    variant="bordered"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={t("settings.email") || "Email Address"}
                      type="email"
                      placeholder="billing@example.com"
                      {...register("companyProfile.email")}
                      isInvalid={!!(errors?.companyProfile as any)?.email}
                      errorMessage={(errors?.companyProfile as any)?.email?.message}
                      variant="bordered"
                    />
                    <Input
                      label={t("settings.phone") || "Phone Number"}
                      placeholder="+1 234 567 8900"
                      {...register("companyProfile.phone")}
                      variant="bordered"
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Invoice Sequence Settings */}
              <Card className="bg-white dark:bg-content1 rounded-2xl shadow-sm border border-default-100">
                <CardHeader className="px-6 py-4">
                  <h2 className="text-xl font-bold">{t("settings.invoice_sequence") || "Invoice Sequencing"}</h2>
                </CardHeader>
                <Divider />
                <CardBody className="px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label={t("settings.prefix") || "Prefix"}
                    placeholder="INV-"
                    {...register("invoiceSequence.prefix")}
                    variant="bordered"
                  />
                  <Input
                    label={t("settings.next_number") || "Next Number"}
                    type="number"
                    {...register("invoiceSequence.nextNumber", { valueAsNumber: true })}
                    variant="bordered"
                  />
                  <Input
                    label={t("settings.padding") || "Number Padding"}
                    type="number"
                    placeholder="e.g. 4 for 0001"
                    {...register("invoiceSequence.padding", { valueAsNumber: true })}
                    variant="bordered"
                  />
                </CardBody>
              </Card>
            </div>
          </Tab>
          <Tab key="financial" title={t("settings.tab_financial") || "Financial"}>
            <div className="space-y-6 mt-4">
              <Card className="bg-white dark:bg-content1 rounded-2xl shadow-sm border border-default-100">
                <CardHeader className="px-6 py-4">
                  <h2 className="text-xl font-bold">{t("settings.financial_settings") || "Financial Configuration"}</h2>
                </CardHeader>
                <Divider />
                <CardBody className="px-6 py-6 text-default-500">
                  <p>Currency, Tax Rates, and Payment Methods configuration will go here.</p>
                </CardBody>
              </Card>
            </div>
          </Tab>
        </Tabs>

        <div className="flex justify-end gap-3 mt-8">
          <Button type="submit" color="primary" variant="shadow" className="font-bold rounded-full" startContent={<Save size={18} />} isLoading={isSubmitting}>
            {tc("actions.save") || "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
