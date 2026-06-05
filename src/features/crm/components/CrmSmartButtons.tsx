import { Button } from "@heroui/react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface SmartButtonItem {
  key: string;
  label: string;
  count?: number;
  icon: LucideIcon;
  onPress?: () => void;
  href?: string;
  color?: "default" | "primary" | "success" | "warning" | "danger";
}

interface CrmSmartButtonsProps {
  items: SmartButtonItem[];
  className?: string;
}

export function CrmSmartButtons({ items, className }: CrmSmartButtonsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <Button
          key={item.key}
          as={item.href ? "a" : undefined}
          href={item.href}
          size="sm"
          variant="bordered"
          className={cn(
            "h-auto py-2 px-3 flex-col items-start gap-0.5 rounded-xl border-default-200 min-w-[5.5rem]",
            item.color === "success" && "border-success/30 bg-success/5",
            item.color === "warning" && "border-warning/30 bg-warning/5",
            item.color === "danger" && "border-danger/30 bg-danger/5"
          )}
          onPress={item.onPress}
        >
          <div className="flex items-center gap-1.5 w-full">
            <item.icon className="h-3.5 w-3.5 text-default-500" />
            <span className="text-[10px] font-bold text-default-500 uppercase">{item.label}</span>
          </div>
          {item.count !== undefined && (
            <span className="text-lg font-black text-foreground leading-none">{item.count}</span>
          )}
        </Button>
      ))}
    </div>
  );
}
