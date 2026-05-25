import React from "react";
import { cn } from "@/lib/utils";

interface FieldBoxProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function FieldBox({ label, icon, children, className, onClick }: FieldBoxProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-default-200/80 bg-content1 shadow-sm transition-all duration-200",
        "hover:border-primary/30 hover:shadow-md hover:shadow-primary/5",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="absolute -top-2.5 left-3 px-1.5 bg-content1 flex items-center gap-1.5 z-[1]">
        {icon && <span className="text-default-400 group-hover:text-primary transition-colors">{icon}</span>}
        <span className="text-[11px] font-semibold text-default-500 uppercase tracking-wide group-hover:text-default-700 transition-colors">
          {label}
        </span>
      </div>
      <div className="p-4 pt-5 min-h-[52px] flex items-center text-sm">{children}</div>
    </div>
  );
}
