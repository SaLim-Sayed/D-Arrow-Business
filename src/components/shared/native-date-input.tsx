import { forwardRef } from "react";
import { Input, type InputProps } from "@heroui/react";
import { cn } from "@/lib/utils";

function resolveNativeDateInput(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return null;

  if (element instanceof HTMLInputElement && element.type === "date") {
    return element;
  }

  return element
    .closest('[data-slot="input-wrapper"]')
    ?.querySelector('input[type="date"]') as HTMLInputElement | null;
}

function toggleNativeDatePicker(target: EventTarget | null) {
  const input = resolveNativeDateInput(target);
  if (!input) return;

  if (document.activeElement === input) {
    input.blur();
    return;
  }

  input.focus();
  input.showPicker?.();
}

export const NativeDateInput = forwardRef<HTMLInputElement, InputProps>(
  function NativeDateInput({ classNames, onClick, onBlur, ...props }, ref) {
    return (
      <Input
        ref={ref}
        type="date"
        variant={props.variant ?? "bordered"}
        labelPlacement={props.labelPlacement ?? "outside"}
        {...props}
        classNames={{
          ...classNames,
          label: cn("text-start font-semibold text-foreground/80", classNames?.label),
          input: cn("text-start cursor-pointer", classNames?.input),
          inputWrapper: cn(
            "cursor-pointer bg-content1 min-h-11",
            classNames?.inputWrapper
          ),
        }}
        onBlur={onBlur}
        onClick={(event) => {
          toggleNativeDatePicker(event.target);
          onClick?.(event);
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") {
            toggleNativeDatePicker(event.target);
          }
          props.onPointerDown?.(event);
        }}
      />
    );
  }
);
