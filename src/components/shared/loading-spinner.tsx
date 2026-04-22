import { Spinner } from "@heroui/react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ 
  className,
  size = "md" 
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center p-4", className)}>
      <Spinner color="secondary" size={size} />
    </div>
  );
}
