import { Spinner } from "@heroui/react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  className,
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] items-center justify-center p-8",
        className
      )}
    >
      <Spinner color="primary" size={size} label="Loading..." />
    </div>
  );
}
