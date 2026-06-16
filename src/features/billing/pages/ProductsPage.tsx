import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Chip,
  Input,
} from "@heroui/react";
import { Plus, Search, Edit2, Trash2, Package, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/page-header";
import { useProducts, useDeleteProductMutation, useProductCategories, useProductUnits } from "../hooks/use-products";
import { ProductFormModal } from "../components/ProductFormModal";
import type { Product } from "../schemas/product";
import { formatCurrency } from "@/lib/utils";

export default function ProductsPage() {
  const { t } = useTranslation("billing");
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useProductCategories();
  const { data: units = [] } = useProductUnits();
  const deleteProduct = useDeleteProductMutation();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const getCategoryName = (id?: string | null) => {
    if (!id) return "—";
    return categories.find((c) => c.id === id)?.name ?? id;
  };

  const getUnitName = (id?: string | null) => {
    if (!id) return "";
    return units.find((u) => u.id === id)?.abbreviation ?? "";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("products.title")}
        description={t("products.description")}
        actions={
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
            onPress={handleCreate}
          >
            {t("products.add")}
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Input
          placeholder={t("products.search")}
          value={search}
          onValueChange={setSearch}
          startContent={<Search className="h-4 w-4 text-default-400" />}
          className="max-w-md"
        />
      </div>

      <Table aria-label={t("products.title")} className="mt-4">
        <TableHeader>
          <TableColumn>{t("products.columns.type")}</TableColumn>
          <TableColumn>{t("products.columns.name_sku")}</TableColumn>
          <TableColumn>{t("products.columns.category")}</TableColumn>
          <TableColumn>{t("products.columns.price")}</TableColumn>
          <TableColumn>{t("products.columns.status")}</TableColumn>
          <TableColumn align="end">{t("products.columns.actions")}</TableColumn>
        </TableHeader>
        <TableBody items={filteredProducts} isLoading={isLoading}>
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>
                {item.type === "goods" ? (
                  <Chip size="sm" variant="flat" color="primary" startContent={<Package className="h-3 w-3" />}>
                    {t("products.types.goods")}
                  </Chip>
                ) : (
                  <Chip size="sm" variant="flat" color="secondary" startContent={<Wrench className="h-3 w-3" />}>
                    {t("products.types.service")}
                  </Chip>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{item.name}</span>
                  {item.sku && <span className="text-xs text-default-500">{item.sku}</span>}
                </div>
              </TableCell>
              <TableCell>{getCategoryName(item.categoryId)}</TableCell>
              <TableCell>
                {formatCurrency(item.price, "USD")} {getUnitName(item.unitId) ? `/ ${getUnitName(item.unitId)}` : ""}
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="dot" color={item.isActive ? "success" : "default"}>
                  {item.isActive ? t("products.status.active") : t("products.status.inactive")}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => handleEdit(item)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => item.id && deleteProduct.mutate(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <ProductFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        product={editingProduct}
      />
    </div>
  );
}
