import {
  useState,
  useMemo,
  useCallback,
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { Select, SelectItem, Input, type SelectProps } from "@heroui/react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Key } from "@react-types/shared";
import { selectFieldProps } from "./select-field";
import { cn } from "@/lib/utils";
import { selectionKeyToString } from "@/lib/selection-key";

function getItemSearchText(child: ReactElement): string {
  const props = child.props as {
    textValue?: string;
    searchValue?: string;
    children?: ReactNode;
  };
  if (props.searchValue) return props.searchValue;
  if (props.textValue) return props.textValue;
  if (typeof props.children === "string") return props.children;
  return "";
}

function filterItemChildren(children: ReactNode, query: string): ReactNode {
  const q = query.trim().toLowerCase();
  const items = Children.toArray(children).filter(isValidElement) as ReactElement[];

  const filtered = !q
    ? items
    : items.filter((child) =>
        getItemSearchText(child).toLowerCase().includes(q)
      );

  return filtered.map((child) => {
    if (child.type === SelectItem) return child;
    const props = child.props as Record<string, unknown>;
    return (
      <SelectItem key={child.key ?? (props.key as Key)} {...props}>
        {props.children as ReactNode}
      </SelectItem>
    );
  });
}

type SelectedItems = Parameters<NonNullable<SelectProps["renderValue"]>>[0];

function defaultRenderValue(items: SelectedItems) {
  if (!items.length) return null;
  const item = items[0];
  if (item.rendered != null) return item.rendered;
  return item.textValue ?? null;
}

function getSelectItemKey(child: ReactElement): string | null {
  const props = child.props as { key?: Key };
  const raw = child.key ?? props.key;
  const normalized = selectionKeyToString(raw);
  if (!normalized) return null;
  if (normalized.startsWith(".$")) return normalized.slice(2);
  return normalized;
}

function toSelectedKeysSet(selectedKey: Key | null | undefined): Set<Key> {
  const normalized = selectionKeyToString(selectedKey);
  if (!normalized) return new Set();
  return new Set<Key>([normalized]);
}

/** Fallback when HeroUI selectedItems is empty but selectedKey is set. */
function renderSelectedFromChildren(
  children: ReactNode,
  selectedKey: Key | null | undefined
): ReactNode {
  const normalized = selectionKeyToString(selectedKey);
  if (!normalized) return null;

  const items = Children.toArray(children).filter(isValidElement) as ReactElement[];
  for (const child of items) {
    if (getSelectItemKey(child) !== normalized) continue;
    const props = child.props as { children?: ReactNode; textValue?: string };
    if (props.textValue) return props.textValue;
    return props.children ?? null;
  }
  return null;
}

export type SearchableSelectProps = Omit<
  SelectProps,
  "children" | "selectedKeys" | "onSelectionChange" | "defaultSelectedKeys"
> & {
  children: ReactNode;
  selectedKey?: Key | null;
  onSelectionChange?: (key: Key | null) => void;
  searchPlaceholder?: string;
  compact?: boolean;
  /** Shown in the trigger when HeroUI has no matching selected item (e.g. badges). */
  triggerLabel?: string;
};

export function SearchableSelect({
  children,
  selectedKey,
  onSelectionChange,
  searchPlaceholder,
  compact,
  triggerLabel,
  listboxProps,
  classNames,
  placeholder,
  onOpenChange,
  renderValue: renderValueProp,
  ...props
}: SearchableSelectProps) {
  const { t } = useTranslation();
  const { t: tt } = useTranslation("tasks");
  const [query, setQuery] = useState("");
  const field = selectFieldProps({ compact, classNames });
  const hasSelection = selectedKey != null && selectedKey !== "";

  const filteredChildren = useMemo(
    () => filterItemChildren(children, query),
    [children, query]
  );

  const triggerFallbackContent = useMemo(() => {
    if (!hasSelection) return undefined;
    if (renderValueProp) {
      return renderValueProp([]);
    }
    return renderSelectedFromChildren(children, selectedKey) ?? undefined;
  }, [children, hasSelection, renderValueProp, selectedKey]);

  const resolvedPlaceholder = useMemo(() => {
    if (!hasSelection) return placeholder;
    if (triggerLabel) return triggerLabel;
    const fallback = triggerFallbackContent;
    if (typeof fallback === "string") return fallback;
    return placeholder;
  }, [hasSelection, placeholder, triggerFallbackContent, triggerLabel]);

  const renderValue: SelectProps["renderValue"] = useCallback(
    (items: SelectedItems) => {
      if (hasSelection && renderValueProp) {
        return renderValueProp(items);
      }
      if (items.length > 0) {
        return defaultRenderValue(items);
      }
      if (hasSelection) {
        return renderSelectedFromChildren(children, selectedKey);
      }
      return null;
    },
    [children, hasSelection, renderValueProp, selectedKey]
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) setQuery("");
    onOpenChange?.(open);
  };

  const menuSearch = (
    <div
      className="px-2 pt-2 pb-1 border-b border-default-100 sticky top-0 z-10 bg-content1"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Input
        size="sm"
        variant="flat"
        aria-label={searchPlaceholder ?? tt("form.search.placeholder")}
        placeholder={searchPlaceholder ?? tt("form.search.placeholder")}
        value={query}
        onValueChange={setQuery}
        startContent={<Search className="h-3.5 w-3.5 text-default-400 shrink-0" />}
        isClearable
        autoFocus
        classNames={{ input: "text-start", inputWrapper: "bg-default-100/80" }}
      />
    </div>
  );

  return (
    <Select
      variant="bordered"
      labelPlacement="outside"
      radius="sm"
      placeholder={resolvedPlaceholder}
      {...field}
      classNames={{
        ...field.classNames,
        ...classNames,
        value: cn(
          field.classNames?.value,
          classNames?.value,
          "w-full min-w-0",
          !hasSelection && resolvedPlaceholder && "text-default-400"
        ),
        innerWrapper: cn(
          field.classNames?.innerWrapper,
          classNames?.innerWrapper,
          "w-full min-w-0"
        ),
      }}
      {...props}
      renderValue={renderValue}
      selectedKeys={toSelectedKeysSet(selectedKey)}
      onOpenChange={handleOpenChange}
      onSelectionChange={(keys) => {
        const key = (Array.from(keys)[0] as Key | undefined) ?? null;
        const normalized = selectionKeyToString(key);
        if (normalized == null && selectedKey != null && selectedKey !== "") {
          return;
        }
        onSelectionChange?.(normalized);
        setQuery("");
      }}
      listboxProps={{
        ...field.listboxProps,
        topContent: menuSearch,
        emptyContent: t("actions.noResults"),
        ...listboxProps,
      }}
    >
      {filteredChildren as SelectProps["children"]}
    </Select>
  );
}
