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
        "group relative rounded-lg border border-default-200 bg-content1 transition-colors duration-200",
        "hover:border-primary/40",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="absolute -top-2.5 start-3 px-1.5 bg-content1 flex items-center gap-1.5 z-[1]">
        {icon && (
          <span className="text-default-400 group-hover:text-primary transition-colors shrink-0">
            {icon}
          </span>
        )}
        <span className="text-xs font-semibold text-default-600 text-start group-hover:text-foreground transition-colors">
          {label}
        </span>
      </div>
      <div className="p-3 pt-4 min-h-[44px] flex items-center text-sm text-start w-full">
        {children}
      </div>
    </div>
  );
}
