import {
  useState,
  useMemo,
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

function getItemTextValue(child: ReactElement): string {
  const props = child.props as { textValue?: string; children?: ReactNode };
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
        getItemTextValue(child).toLowerCase().includes(q)
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

export type SearchableSelectProps = Omit<
  SelectProps,
  "children" | "selectedKeys" | "onSelectionChange" | "defaultSelectedKeys"
> & {
  children: ReactNode;
  selectedKey?: Key | null;
  onSelectionChange?: (key: Key | null) => void;
  searchPlaceholder?: string;
  compact?: boolean;
};

export function SearchableSelect({
  children,
  selectedKey,
  onSelectionChange,
  searchPlaceholder,
  compact,
  listboxProps,
  classNames,
  placeholder,
  onOpenChange,
  ...props
}: SearchableSelectProps) {
  const { t } = useTranslation();
  const { t: tt } = useTranslation("tasks");
  const [query, setQuery] = useState("");
  const field = selectFieldProps({ compact, classNames });

  const filteredChildren = useMemo(
    () => filterItemChildren(children, query),
    [children, query]
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
      placeholder={placeholder}
      {...field}
      {...props}
      selectedKeys={
        selectedKey != null && selectedKey !== ""
          ? new Set([selectedKey])
          : new Set()
      }
      onOpenChange={handleOpenChange}
      onSelectionChange={(keys) => {
        const key = (Array.from(keys)[0] as Key | undefined) ?? null;
        onSelectionChange?.(key);
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
