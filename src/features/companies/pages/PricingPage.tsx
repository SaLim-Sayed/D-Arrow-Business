import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardBody,
} from "@heroui/react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PermissionGuard } from "../components/PermissionGuard";
import { PricingFormModal } from "../components/PricingFormModal";
import {
  usePricingList,
  useDeletePriceMutation,
} from "../hooks/use-pricing";
import { useAppPermissions } from "../hooks/use-app-permissions";
import { useCompanyProfile } from "../hooks/use-company-profile";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { formatCurrency } from "@/lib/utils";
import type { ProductPrice } from "../types/pricing.types";

export function PricingPage() {
  const { t } = useTranslation("settings");
  const { data: prices = [], isLoading } = usePricingList();
  const { data: company } = useCompanyProfile();
  const deletePrice = useDeletePriceMutation();
  const { canManagePricing } = useAppPermissions();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductPrice | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (price: ProductPrice) => {
    setEditing(price);
    setModalOpen(true);
  };

  return (
    <PermissionGuard permission="pricing.view">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black">{t("pricing.pageTitle")}</h1>
            <p className="text-sm text-default-500">{t("pricing.pageSubtitle")}</p>
            {company?.commercialRegister && (
              <p className="text-xs text-default-400 mt-1">
                {t("pricing.crRef", { cr: company.commercialRegister })}
              </p>
            )}
          </div>
          {canManagePricing && (
            <Button
              color="primary"
              className="rounded-full font-bold"
              startContent={<Plus className="h-4 w-4" />}
              onPress={openCreate}
            >
              {t("pricing.add")}
            </Button>
          )}
        </div>

        <Card className="border border-default-100">
          <CardBody className="p-0">
            {isLoading ? (
              <div className="p-8">
                <LoadingSpinner />
              </div>
            ) : prices.length === 0 ? (
              <p className="p-8 text-sm text-default-500 text-center">
                {t("pricing.empty")}
              </p>
            ) : (
              <Table aria-label={t("pricing.pageTitle")} removeWrapper>
                <TableHeader>
                  <TableColumn>{t("pricing.fields.name")}</TableColumn>
                  <TableColumn>{t("pricing.fields.sku")}</TableColumn>
                  <TableColumn>{t("pricing.fields.unitPrice")}</TableColumn>
                  <TableColumn>{t("pricing.fields.taxRate")}</TableColumn>
                  <TableColumn>{t("pricing.fields.status")}</TableColumn>
                  <TableColumn>{t("pricing.actions")}</TableColumn>
                </TableHeader>
                <TableBody>
                  {prices.map((price) => (
                    <TableRow key={price.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-sm">{price.name}</p>
                          {price.nameAr && (
                            <p className="text-xs text-default-400" dir="rtl">
                              {price.nameAr}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{price.sku || "—"}</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(price.unitPrice, price.currency)}
                      </TableCell>
                      <TableCell>
                        {price.taxRate != null ? `${price.taxRate}%` : "—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={price.status === "active" ? "success" : "default"}
                        >
                          {t(`pricing.status.${price.status}`)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {canManagePricing ? (
                          <div className="flex gap-1">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => openEdit(price)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              isLoading={deletePrice.isPending}
                              onPress={() => deletePrice.mutate(price.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>

      <PricingFormModal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        price={editing}
      />
    </PermissionGuard>
  );
}
