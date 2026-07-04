import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Invoice } from "../schemas/invoice";
import type { Bill } from "../schemas/bill";

export function invoiceStatusClass(status: Invoice["status"]) {
  if (status === "paid") return "bg-success/10 text-success";
  if (status === "overdue") return "bg-danger/10 text-danger";
  if (status === "sent") return "bg-primary/10 text-primary";
  if (status === "cancelled") return "bg-default-100 text-default-400";
  return "bg-default-100 text-default-500";
}

export function billStatusClass(status: Bill["status"]) {
  if (status === "paid") return "bg-success/10 text-success";
  if (status === "overdue") return "bg-danger/10 text-danger";
  if (status === "open") return "bg-warning/10 text-warning-700 dark:text-warning";
  if (status === "cancelled") return "bg-default-100 text-default-400";
  return "bg-default-100 text-default-500";
}

export function AccountingBreadcrumb({
  items,
}: {
  items: { label: string; to?: string }[];
}) {
  return (
    <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-default-500">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-default-800">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function AccountingPageHeader({
  title,
  description,
  breadcrumbItems,
  action,
}: {
  title: string;
  description?: string;
  breadcrumbItems: { label: string; to?: string }[];
  action?: React.ReactNode;
}) {
  return (
    <>
      <AccountingBreadcrumb items={breadcrumbItems} />
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

export function AccountingMetricCards({
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
              onPress && "cursor-pointer hover:border-primary/30 hover:bg-primary/[0.02]"
            )}
          >
            <div className={cn("rounded-lg p-2", className)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-default-500">{label}</p>
              <p className="truncate text-base font-bold tabular-nums text-default-900" dir="ltr">
                {value}
              </p>
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}

export function AccountingListShell({
  toolbar,
  filterBar,
  footer,
  children,
}: {
  toolbar: React.ReactNode;
  filterBar?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-default-200 bg-content1 shadow-sm">
      <div className="border-b border-default-200 bg-default-50/90">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">{toolbar}</div>
        {filterBar && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-default-100 px-3 py-1.5">
            {filterBar}
          </div>
        )}
      </div>
      {children}
      {footer && (
        <div className="flex items-center justify-between border-t border-default-200 bg-default-50/50 px-3 py-2 text-xs text-default-500">
          {footer}
        </div>
      )}
    </div>
  );
}

export function ContactAvatar({ name }: { name: string }) {
  const initial = (name.trim()[0] || "?").toUpperCase();
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
      {initial}
    </span>
  );
}

export function AccountingAppTile({
  to,
  icon: Icon,
  title,
  description,
  badge,
  iconClassName,
}: {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string | number;
  iconClassName?: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-xl border border-default-200 bg-content1 p-4 shadow-sm transition-all hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            iconClassName ?? "bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {badge !== undefined && badge !== "" && (
          <span className="rounded-full bg-default-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-default-600">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-sm font-bold text-default-900 group-hover:text-primary">{title}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-default-500">{description}</p>
    </Link>
  );
}

export function StatusFilterChips<T extends string>({
  chips,
  active,
  onChange,
  countLabel,
}: {
  chips: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
  countLabel?: string;
}) {
  return (
    <>
      {chips.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            active === key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-content1 text-default-600 hover:bg-default-100"
          )}
        >
          {label}
        </button>
      ))}
      {countLabel && (
        <span className="ms-auto text-xs text-default-400">{countLabel}</span>
      )}
    </>
  );
}

/** Daftra-style grouped module section on the accounting landing page */
export function AccountingModuleSection({
  title,
  description,
  icon: Icon,
  iconClassName,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ElementType;
  iconClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            iconClassName ?? "bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-default-900">{title}</h2>
          {description && (
            <p className="text-xs text-default-500">{description}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

/** Compact quick-action button for Daftra-style landing toolbar */
export function AccountingQuickAction({
  to,
  icon: Icon,
  label,
  color = "primary",
  onPress,
}: {
  to?: string;
  icon: React.ElementType;
  label: string;
  color?: "primary" | "danger" | "default";
  onPress?: () => void;
}) {
  const className = cn(
    "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm",
    color === "primary" &&
      "bg-primary text-primary-foreground hover:bg-primary/90",
    color === "danger" &&
      "bg-danger text-danger-foreground hover:bg-danger/90",
    color === "default" &&
      "border border-default-200 bg-content1 text-default-800 hover:bg-default-50"
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onPress} className={className}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
