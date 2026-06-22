import { useCallback, useEffect, useRef, useState } from "react";
import { DatePicker, type DatePickerProps } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { cn } from "@/lib/utils";

export const datePickerClassNames: NonNullable<DatePickerProps["classNames"]> = {
  label: "text-start font-semibold text-foreground/80",
  input: "text-start",
  segment: "text-start",
  inputWrapper: "cursor-pointer bg-content1 min-h-11",
  innerWrapper: "w-full",
};

export function datePickerFieldProps(options?: {
  classNames?: DatePickerProps["classNames"];
}): Pick<DatePickerProps, "classNames"> {
  return {
    classNames: options?.classNames
      ? { ...datePickerClassNames, ...options.classNames }
      : datePickerClassNames,
  };
}

export function AppDatePicker<T extends DateValue = DateValue>({
  classNames,
  isOpen: isOpenProp,
  onOpenChange,
  isDisabled,
  isReadOnly,
  variant = "bordered",
  labelPlacement = "outside",
  showMonthAndYearPickers = true,
  visibleMonths = 1,
  ...props
}: DatePickerProps<T>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpenProp !== undefined;
  const isOpen = isControlled ? isOpenProp : internalOpen;
  const containerRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const setOpen = useCallback(
    (open: boolean) => {
      if (!isControlled) setInternalOpen(open);
      onOpenChange?.(open);
    },
    [isControlled, onOpenChange]
  );

  useEffect(() => {
    const wrapper = containerRef.current?.querySelector(
      '[data-slot="input-wrapper"]'
    );
    if (!wrapper) return;

    const handlePointerDown = (event: Event) => {
      if (isDisabled || isReadOnly) return;
      const target = event.target as HTMLElement;
      if (target.closest('button[aria-haspopup="dialog"]')) return;
      setOpen(!isOpenRef.current);
    };

    wrapper.addEventListener("pointerdown", handlePointerDown);
    return () => wrapper.removeEventListener("pointerdown", handlePointerDown);
  }, [isDisabled, isReadOnly, setOpen]);

  return (
    <div ref={containerRef} className="w-full">
      <DatePicker
        variant={variant}
        labelPlacement={labelPlacement}
        showMonthAndYearPickers={showMonthAndYearPickers}
        visibleMonths={visibleMonths}
        {...props}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        isOpen={isOpen}
        onOpenChange={setOpen}
        classNames={{
          ...datePickerClassNames,
          ...classNames,
          inputWrapper: cn(
            datePickerClassNames.inputWrapper,
            classNames?.inputWrapper
          ),
        }}
      />
    </div>
  );
}
