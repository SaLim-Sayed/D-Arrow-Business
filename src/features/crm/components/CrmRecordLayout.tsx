import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CrmBreadcrumbItem {
  label: string;
  href?: string;
}

interface CrmRecordHeaderProps {
  breadcrumbs: CrmBreadcrumbItem[];
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  stageBar?: React.ReactNode;
  smartButtons?: React.ReactNode;
  onBack?: () => void;
}

export function CrmRecordHeader({
  breadcrumbs,
  title,
  subtitle,
  badge,
  actions,
  stageBar,
  smartButtons,
}: CrmRecordHeaderProps) {
  return (
    <div className="space-y-3">
      <nav className="flex items-center gap-1 text-xs font-semibold text-default-400 flex-wrap">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
            {crumb.href ? (
              <Link to={crumb.href} className="hover:text-primary transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-default-600">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight truncate">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="text-sm text-default-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>

      {stageBar}
      {smartButtons}
    </div>
  );
}

interface CrmRecordLayoutProps {
  header: React.ReactNode;
  main: React.ReactNode;
  chatter: React.ReactNode;
  className?: string;
}

/** Odoo/Zoho-style: form left, chatter right */
export function CrmRecordLayout({ header, main, chatter, className }: CrmRecordLayoutProps) {
  return (
    <div className={cn("space-y-4 animate-in fade-in duration-500", className)}>
      {header}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_22rem] gap-4 items-start">
        <div className="min-w-0 space-y-4">{main}</div>
        <aside className="xl:sticky xl:top-4 min-w-0">{chatter}</aside>
      </div>
    </div>
  );
}
