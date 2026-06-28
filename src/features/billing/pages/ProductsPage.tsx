import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Checkbox,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Spinner,
} from "@heroui/react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Edit2,
  Filter,
  Layers,
  Package,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import {
  useDeleteProductMutation,
  useProductCategories,
  useProductUnits,
  useProducts,
} from "../hooks/use-products";
import { useBillingSettings } from "../hooks/use-billing-settings";
import { ProductFormModal } from "../components/ProductFormModal";
import type { Product } from "../schemas/product";
import { downloadProductsCsv } from "../utils/product-export";
import {
  categoryLabel,
  taxLabel,
  unitLabel,
} from "../utils/product-labels";

type TypeFilter = "all" | Product["type"];
type StatusFilter = "all" | "active" | "inactive";

function ProductRow({
  product,
  selected,
  onToggle,
  onEdit,
  onDelete,
  isDeleting,
  categoryName,
  unitLabel,
  t,
}: {
  product: Product;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  categoryName: string;
  unitLabel: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <tr
      className={cn(
        "border-b border-default-100 text-sm transition-colors hover:bg-primary/[0.03]",
        !product.isActive && "opacity-60",
        selected && "bg-primary/[0.06]"
      )}
    >
      <td className="w-10 px-3 py-2">
        <Checkbox
          size="sm"
          isSelected={selected}
          onValueChange={onToggle}
          aria-label={product.name}
        />
      </td>
      <td className="px-3 py-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium",
            product.type === "goods"
              ? "bg-primary/10 text-primary"
              : "bg-secondary/10 text-secondary"
          )}
        >
          {product.type === "goods" ? (
            <Package className="h-3 w-3" />
          ) : (
            <Wrench className="h-3 w-3" />
          )}
          {t(`products.types.${product.type}`)}
        </span>
      </td>
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-col items-start text-start hover:text-primary"
        >
          <span className="font-medium text-default-900">{product.name}</span>
          {product.sku && (
            <span className="font-mono text-xs text-default-500" dir="ltr">
              {product.sku}
            </span>
          )}
        </button>
      </td>
      <td className="hidden px-3 py-2 text-default-600 md:table-cell">
        {categoryName}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-end">
        <span className="tabular-nums font-medium text-default-900" dir="ltr">
          {formatCurrency(product.price, "USD")}
          {unitLabel ? (
            <span className="ms-1 text-xs font-normal text-default-400">
              / {unitLabel}
            </span>
          ) : null}
        </span>
      </td>
      <td className="hidden px-3 py-2 sm:table-cell">
        <span
          className={cn(
            "inline-block rounded px-1.5 py-0.5 text-xs",
            product.isActive
              ? "bg-success/10 text-success"
              : "bg-default-100 text-default-400"
          )}
        >
          {product.isActive
            ? t("products.status.active")
            : t("products.status.inactive")}
        </span>
      </td>
      <td className="w-20 px-2 py-2">
        <div className="flex justify-end gap-0.5">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            aria-label={t("products.edit")}
            onPress={onEdit}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="danger"
            aria-label={t("products.delete")}
            onPress={onDelete}
            isLoading={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function ProductsPage() {
  const { t } = useTranslation("billing");
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useProductCategories();
  const { data: units = [] } = useProductUnits();
  const { data: settings } = useBillingSettings();
  const deleteProduct = useDeleteProductMutation();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [groupByType, setGroupByType] = useState(true);
  const [collapsedTypes, setCollapsedTypes] = useState<Set<Product["type"]>>(
    new Set()
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getCategoryName = (id?: string | null) => {
    if (!id) return "—";
    const category = categories.find((c) => c.id === id);
    if (!category) return "—";
    return categoryLabel(t, category.name);
  };

  const getUnitLabel = (id?: string | null) => {
    if (!id) return "";
    const unit = units.find((u) => u.id === id);
    if (!unit) return "";
    return unit.abbreviation ?? unitLabel(t, unit.name);
  };

  const getTaxName = (id?: string | null) => {
    if (!id) return "";
    const tax = settings?.taxes?.find((tx) => tx.id === id);
    if (!tax) return "";
    return taxLabel(t, tax);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (statusFilter === "active" && !p.isActive) return false;
      if (statusFilter === "inactive" && p.isActive) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    });
  }, [products, search, typeFilter, statusFilter]);

  const grouped = useMemo(() => {
    if (!groupByType) return null;
    return (["goods", "service"] as const)
      .map((type) => ({
        type,
        items: filtered.filter((p) => p.type === type),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered, groupByType]);

  const allSelected =
    filtered.length > 0 &&
    filtered.every((p) => p.id && selectedIds.has(p.id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else
      setSelectedIds(new Set(filtered.map((p) => p.id!).filter(Boolean)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTypeSection = (type: Product["type"]) => {
    setCollapsedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteProduct.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    const toExport =
      selectedIds.size > 0
        ? filtered.filter((p) => p.id && selectedIds.has(p.id))
        : filtered;

    if (toExport.length === 0) {
      toast.error(t("products.export_empty"));
      return;
    }

    downloadProductsCsv(
      toExport,
      [
        t("products.columns.type"),
        t("products.columns.name_sku"),
        "SKU",
        t("products.columns.category"),
        t("products.form.unit"),
        t("products.columns.price"),
        t("products.form.tax_rate"),
        t("products.columns.status"),
      ],
      (p) => [
        t(`products.types.${p.type}`),
        p.name,
        p.sku ?? "",
        getCategoryName(p.categoryId),
        getUnitLabel(p.unitId),
        p.price,
        getTaxName(p.taxRateId),
        p.isActive ? t("products.status.active") : t("products.status.inactive"),
      ]
    );
    toast.success(t("products.export_success"));
  };

  const typeChips: { key: TypeFilter; label: string }[] = [
    { key: "all", label: t("products.filters.all") },
    { key: "goods", label: t("products.types.goods") },
    { key: "service", label: t("products.types.service") },
  ];

  const statusChips: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("products.filters.all") },
    { key: "active", label: t("products.status.active") },
    { key: "inactive", label: t("products.status.inactive") },
  ];

  const renderRow = (product: Product) => (
    <ProductRow
      key={product.id}
      product={product}
      selected={!!product.id && selectedIds.has(product.id)}
      onToggle={() => product.id && toggleOne(product.id)}
      onEdit={() => handleEdit(product)}
      onDelete={() => product.id && handleDelete(product.id)}
      isDeleting={deletingId === product.id}
      categoryName={getCategoryName(product.categoryId)}
      unitLabel={getUnitLabel(product.unitId)}
      t={t}
    />
  );

  return (
    <div className="pb-20 animate-in fade-in duration-300">
      <nav className="mb-3 flex items-center gap-1 text-sm text-default-500">
        <Link to="/billing" className="hover:text-primary">
          {t("module_name")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="font-medium text-default-800">{t("products.title")}</span>
      </nav>

      <p className="mb-3 text-sm text-default-500">{t("products.description")}</p>

      <div className="overflow-hidden rounded-lg border border-default-200 bg-content1 shadow-sm">
        <div className="border-b border-default-200 bg-default-50/90">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <Button
              size="sm"
              color="primary"
              className="font-semibold"
              startContent={<Plus className="h-4 w-4" />}
              onPress={handleCreate}
            >
              {t("products.add")}
            </Button>

            <Button
              size="sm"
              variant="flat"
              startContent={<Download className="h-4 w-4" />}
              onPress={handleExport}
            >
              {t("products.export")}
            </Button>

            <div className="mx-1 hidden h-5 w-px bg-default-200 sm:block" />

            <Input
              size="sm"
              variant="flat"
              className="min-w-[200px] flex-1 max-w-xl"
              placeholder={t("products.search")}
              value={search}
              onValueChange={setSearch}
              startContent={<Search className="h-4 w-4 text-default-400" />}
              classNames={{
                inputWrapper:
                  "bg-white dark:bg-content1 shadow-none border border-default-200",
              }}
            />

            <Dropdown>
              <DropdownTrigger>
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<Filter className="h-4 w-4" />}
                >
                  {t("products.filters.type")}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label={t("products.filters.type")}
                selectedKeys={new Set([typeFilter])}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as TypeFilter;
                  if (key) setTypeFilter(key);
                }}
              >
                {typeChips.map(({ key, label }) => (
                  <DropdownItem key={key}>{label}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <Dropdown>
              <DropdownTrigger>
                <Button size="sm" variant="flat">
                  {t("products.filters.status")}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label={t("products.filters.status")}
                selectedKeys={new Set([statusFilter])}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as StatusFilter;
                  if (key) setStatusFilter(key);
                }}
              >
                {statusChips.map(({ key, label }) => (
                  <DropdownItem key={key}>{label}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <Button
              size="sm"
              variant={groupByType ? "solid" : "flat"}
              color={groupByType ? "primary" : "default"}
              startContent={<Layers className="h-4 w-4" />}
              onPress={() => setGroupByType((v) => !v)}
            >
              {t("products.groupBy.type")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-default-100 px-3 py-1.5">
            {typeChips.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTypeFilter(key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  typeFilter === key
                    ? "bg-primary text-white"
                    : "bg-white text-default-600 hover:bg-default-100 dark:bg-content1"
                )}
              >
                {label}
              </button>
            ))}
            <span className="ms-auto text-xs text-default-400">
              {t("products.itemCount", { count: filtered.length })}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner color="primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-default-500">
              {t("products.empty")}
            </div>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-start">
              <thead>
                <tr className="border-b border-default-200 bg-default-50/50 text-xs uppercase tracking-wide text-default-500">
                  <th className="w-10 px-3 py-2.5">
                    <Checkbox
                      size="sm"
                      isSelected={allSelected}
                      onValueChange={toggleAll}
                    />
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("products.columns.type")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("products.columns.name_sku")}
                  </th>
                  <th className="hidden px-3 py-2.5 font-semibold md:table-cell">
                    {t("products.columns.category")}
                  </th>
                  <th className="px-3 py-2.5 text-end font-semibold">
                    {t("products.columns.price")}
                  </th>
                  <th className="hidden px-3 py-2.5 font-semibold sm:table-cell">
                    {t("products.columns.status")}
                  </th>
                  <th className="w-20 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {groupByType && grouped
                  ? grouped.flatMap((group) => {
                      const collapsed = collapsedTypes.has(group.type);
                      return [
                        <tr
                          key={`group-${group.type}`}
                          className="border-b border-default-200 bg-default-100/80"
                        >
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => toggleTypeSection(group.type)}
                              className="rounded p-0.5 text-default-600 hover:bg-default-200/80"
                            >
                              {collapsed ? (
                                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td colSpan={5} className="px-3 py-2">
                            <span className="text-sm font-bold text-default-800">
                              {t(`products.types.${group.type}`)}
                            </span>
                            <span className="ms-2 text-xs text-default-500">
                              ({group.items.length})
                            </span>
                          </td>
                          <td />
                        </tr>,
                        ...(collapsed ? [] : group.items.map(renderRow)),
                      ];
                    })
                  : filtered.map(renderRow)}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-default-200 bg-default-50/50 px-4 py-2 text-xs text-default-500">
          <span>
            {selectedIds.size > 0
              ? t("products.selectedCount", { count: selectedIds.size })
              : t("products.itemCount", { count: filtered.length })}
          </span>
          <span>1 / 1</span>
        </div>
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        product={editingProduct}
      />
    </div>
  );
}
