import { useCallback, useEffect, useRef } from "react";
import { DatePicker, type DatePickerProps } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { cn } from "@/lib/utils";

export const datePickerClassNames: NonNullable<DatePickerProps["classNames"]> = {
  base: "gap-2.5 w-full",
  label: "text-start font-semibold text-default-600 text-sm",
  input: "text-start text-sm",
  segment: "text-start",
  inputWrapper: "cursor-pointer bg-content1 min-h-10 rounded-md",
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

function getSelectorButton(container: HTMLElement | null) {
  return container?.querySelector(
    'button[aria-haspopup="dialog"]'
  ) as HTMLButtonElement | null;
}

function getPopoverElement(container: HTMLElement | null) {
  const controlsId = getSelectorButton(container)?.getAttribute("aria-controls");
  return controlsId ? document.getElementById(controlsId) : null;
}

export function AppDatePicker<T extends DateValue = DateValue>({
  classNames,
  isOpen: isOpenProp,
  onOpenChange,
  popoverProps,
  isDisabled,
  isReadOnly,
  variant = "bordered",
  labelPlacement = "outside",
  radius = "sm",
  showMonthAndYearPickers = true,
  visibleMonths = 1,
  ...props
}: DatePickerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isControlled = isOpenProp !== undefined;

  const setOpen = useCallback(
    (open: boolean) => {
      onOpenChange?.(open);
    },
    [onOpenChange]
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

      if (isControlled) {
        setOpen(!isOpenProp);
        return;
      }

      getSelectorButton(containerRef.current)?.click();
    };

    wrapper.addEventListener("pointerdown", handlePointerDown);
    return () => wrapper.removeEventListener("pointerdown", handlePointerDown);
  }, [isControlled, isDisabled, isOpenProp, isReadOnly, setOpen]);

  useEffect(() => {
    if (isDisabled || isReadOnly) return;
    if (isControlled && !isOpenProp) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const container = containerRef.current;
      if (!container) return;
      if (container.contains(target)) return;

      const popover = getPopoverElement(container);
      if (popover?.contains(target)) return;

      if (isControlled) {
        setOpen(false);
        return;
      }

      if (container.querySelector('[data-open="true"]')) {
        getSelectorButton(container)?.click();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [isControlled, isDisabled, isOpenProp, isReadOnly, setOpen]);

  return (
    <div ref={containerRef} className="w-full">
      <DatePicker
        variant={variant}
        labelPlacement={labelPlacement}
        radius={radius}
        showMonthAndYearPickers={showMonthAndYearPickers}
        visibleMonths={visibleMonths}
        {...props}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        {...(isControlled
          ? { isOpen: isOpenProp, onOpenChange: setOpen }
          : {})}
        popoverProps={{
          isDismissable: true,
          ...popoverProps,
        }}
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
