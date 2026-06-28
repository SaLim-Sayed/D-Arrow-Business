import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function TasksPageHeader({
  title,
  description,
  breadcrumbLabel,
  breadcrumbTo = "/tasks",
  action,
}: {
  title: string;
  description?: string;
  breadcrumbLabel?: string;
  breadcrumbTo?: string;
  action?: React.ReactNode;
}) {
  const { t } = useTranslation("tasks");
  const rootLabel = breadcrumbLabel ?? t("module_name");

  return (
    <>
      <nav className="mb-3 flex items-center gap-1 text-sm text-default-500">
        <Link to={breadcrumbTo} className="hover:text-primary">
          {rootLabel}
        </Link>
        {title !== rootLabel && (
          <>
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
            <span className="font-medium text-default-800">{title}</span>
          </>
        )}
      </nav>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-default-900">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-default-500">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </>
  );
}

export function TasksMetricCards({
  items,
}: {
  items: {
    key: string;
    label: string;
    value: string | number;
    icon: React.ElementType;
    className: string;
    onPress?: () => void;
  }[];
}) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
      {items.map(({ key, label, value, icon: Icon, className, onPress }) => {
        const Wrapper = onPress ? "button" : "div";
        return (
          <Wrapper
            key={key}
            type={onPress ? "button" : undefined}
            onClick={onPress}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-default-200 bg-content1 px-3 py-2.5 text-start shadow-sm transition-colors",
              onPress && "hover:bg-primary/[0.03] cursor-pointer"
            )}
          >
            <div className={cn("rounded-lg p-2", className)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-default-500">{label}</p>
              <p className="truncate text-base font-bold tabular-nums text-default-900">
                {value}
              </p>
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}

export function TasksPanel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border border-default-200 bg-content1 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-default-200 bg-default-50/90 px-4 py-3">
        <h3 className="text-sm font-bold text-default-800">{title}</h3>
        {action}
      </div>
      <div className="flex flex-1 flex-col p-4">{children}</div>
    </div>
  );
}

export function TasksTabBar({
  tabs,
}: {
  tabs: {
    key: string;
    label: string;
    icon: React.ElementType;
    active: boolean;
    onClick?: () => void;
    to?: string;
    badge?: number;
  }[];
}) {
  return (
    <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map(({ key, label, icon: Icon, active, onClick, to, badge }) => {
        const className = cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-content1 text-default-600 hover:bg-default-100 dark:bg-content1"
        );
        const content = (
          <>
            <Icon className="h-3.5 w-3.5" />
            {label}
            {badge !== undefined && badge > 0 && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  active ? "bg-primary-foreground/20" : "bg-default-200"
                )}
              >
                {badge}
              </span>
            )}
          </>
        );
        if (to) {
          return (
            <Link key={key} to={to} className={className}>
              {content}
            </Link>
          );
        }
        return (
          <button key={key} type="button" onClick={onClick} className={className}>
            {content}
          </button>
        );
      })}
    </div>
  );
}

export function TasksShell({
  toolbar,
  children,
  className,
}: {
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-default-200 bg-content1 shadow-sm",
        className
      )}
    >
      {toolbar && (
        <div className="border-b border-default-200 bg-default-50/90 px-3 py-2">
          {toolbar}
        </div>
      )}
      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}
