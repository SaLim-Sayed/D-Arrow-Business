import type { SelectProps } from "@heroui/react";

export const selectClassNames: NonNullable<SelectProps["classNames"]> = {
  base: "w-full",
  trigger: "bg-content1 min-h-11",
  label: "text-start font-semibold text-foreground/80",
  value: "text-start w-full",
  innerWrapper: "w-full",
  mainWrapper: "w-full",
};

export const compactSelectClassNames: NonNullable<SelectProps["classNames"]> = {
  ...selectClassNames,
  trigger: "bg-content1 min-h-9",
};

export const selectListboxProps: NonNullable<SelectProps["listboxProps"]> = {
  itemClasses: {
    base: "text-start",
  },
};

/** Shared RTL-friendly props for HeroUI Select fields. */
export function selectFieldProps(options?: {
  compact?: boolean;
  classNames?: SelectProps["classNames"];
}): Pick<SelectProps, "classNames" | "listboxProps"> {
  const base = options?.compact ? compactSelectClassNames : selectClassNames;
  return {
    classNames: options?.classNames ? { ...base, ...options.classNames } : base,
    listboxProps: selectListboxProps,
  };
}
