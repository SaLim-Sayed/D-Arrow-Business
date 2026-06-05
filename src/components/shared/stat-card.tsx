import type { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardBody } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  bg?: string;
  gradient?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-primary",
  bg = "bg-primary/10",
  gradient = "from-primary/20 to-secondary/20",
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "glass-card border-none overflow-hidden relative group card-hover-lift",
        className
      )}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <p className="text-[10px] font-black text-default-400 uppercase tracking-[0.15em] line-clamp-2">
          {label}
        </p>
        <div
          className={cn(
            "rounded-2xl p-3 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0",
            bg
          )}
        >
          <Icon className={cn("h-5 w-5", color)} />
        </div>
      </CardHeader>
      <CardBody className="py-4 relative z-10">
        <div className="text-3xl sm:text-4xl font-black tracking-tight truncate">
          {value}
        </div>
        <div className="mt-2 h-1 w-12 rounded-full bg-default-200 group-hover:w-full transition-all duration-500" />
      </CardBody>
    </Card>
  );
}

export function StatCardGrid({
  children,
  columns = "grid-cols-2 lg:grid-cols-4",
  className,
}: {
  children: React.ReactNode;
  columns?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:gap-6", columns, className)}>
      {children}
    </div>
  );
}
