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
  compact = false,
}: {
  title: string;
  description?: string;
  breadcrumbLabel?: string;
  breadcrumbTo?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  const { t } = useTranslation("tasks");
  const rootLabel = breadcrumbLabel ?? t("module_name");

  return (
    <>
      <nav
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium text-default-500",
          compact ? "mb-1" : "mb-2.5"
        )}
      >
        <Link to={breadcrumbTo} className="transition-colors hover:text-primary">
          {rootLabel}
        </Link>
        {title !== rootLabel && (
          <>
            <ChevronRight className="h-3 w-3 text-default-400 rtl:rotate-180" />
            <span className="font-semibold text-default-800">{title}</span>
          </>
        )}
      </nav>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 min-w-0",
          compact ? "mb-2" : "mb-4"
        )}
      >
        <div className="min-w-0">
          <h1
            className={cn(
              "font-extrabold tracking-tight text-foreground",
              compact ? "text-base md:text-lg" : "text-xl md:text-2xl"
            )}
          >
            {title}
          </h1>
          {!compact && description && (
            <p className="mt-1 max-w-2xl text-xs md:text-sm text-default-500 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && <div className="w-full min-w-0 sm:w-auto sm:shrink-0">{action}</div>}
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
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ key, label, value, icon: Icon, className, onPress }) => {
        const Wrapper = onPress ? "button" : "div";
        return (
          <Wrapper
            key={key}
            type={onPress ? "button" : undefined}
            onClick={onPress}
            className={cn(
              "group relative flex min-w-0 items-center gap-3 rounded-2xl border border-default-200/70 bg-background/70 p-3 text-start shadow-sm backdrop-blur-xl transition-all duration-300 sm:gap-4 sm:rounded-3xl sm:p-4",
              onPress &&
                "cursor-pointer hover:-translate-y-1 hover:border-primary/40 hover:bg-background/90 hover:shadow-lg hover:shadow-primary/5 active:translate-y-0"
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-sm",
                className
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-default-400">
                {label}
              </p>
              <p className="truncate text-2xl font-black tabular-nums tracking-tight text-foreground mt-0.5">
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
        "flex h-full flex-col overflow-hidden rounded-3xl border border-default-200/70 bg-background/80 shadow-sm backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-default-100/70 bg-default-50/50 px-6 py-4">
        <h3 className="text-sm font-black text-foreground tracking-tight">{title}</h3>
        {action}
      </div>
      <div className="flex flex-1 flex-col p-4 md:p-6">{children}</div>
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
    <div className="inline-flex items-center gap-1 rounded-2xl border border-default-200/70 bg-default-100/60 p-1.5 backdrop-blur-md">
      {tabs.map(({ key, label, icon: Icon, active, onClick, to, badge }) => {
        const className = cn(
          "inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all duration-200",
          active
            ? "bg-background text-primary shadow-sm ring-1 ring-default-200/80"
            : "text-default-600 hover:bg-background/50 hover:text-foreground"
        );
        const content = (
          <>
            <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-default-400")} />
            {label}
            {badge !== undefined && badge > 0 && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums",
                  active
                    ? "bg-primary/15 text-primary"
                    : "bg-default-200 text-default-700"
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
  bleed = false,
}: {
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Full-height board layout without inner padding */
  bleed?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-default-200/80 bg-background/80 shadow-md backdrop-blur-xl",
        className
      )}
    >
      {toolbar && (
        <div
          className={cn(
            "shrink-0 border-b border-default-100 bg-default-50/60 px-3 sm:px-5",
            bleed ? "py-2.5" : "py-3.5"
          )}
        >
          {toolbar}
        </div>
      )}
      <div
        className={cn(
          bleed ? "flex min-h-0 flex-1 flex-col" : "p-4 md:p-6"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function TasksAppTile({
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
      className="group relative flex flex-col justify-between rounded-3xl border border-default-200/70 bg-background/70 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-background/90 hover:shadow-xl hover:shadow-primary/5"
    >
      <div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex h-13 w-13 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110",
              iconClassName ?? "bg-primary/10 text-primary border border-primary/20"
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          {badge !== undefined && badge !== "" && (
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black tabular-nums text-primary shadow-sm">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-base font-extrabold text-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-default-500 font-medium">
          {description}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 rtl:-translate-x-1 rtl:group-hover:translate-x-0">
        <span>الانتقال للموديل</span>
        <ChevronRight size={14} className="rtl:rotate-180" />
      </div>
    </Link>
  );
}

export function TasksModuleSection({
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
    <section className="mb-8 space-y-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm border",
            iconClassName ?? "bg-primary/10 text-primary border-primary/20"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-black tracking-tight text-foreground">{title}</h2>
          {description && (
            <p className="text-xs font-medium text-default-400">{description}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

export function TasksQuickAction({
  to,
  icon: Icon,
  label,
  color = "primary",
  onPress,
}: {
  to?: string;
  icon: React.ElementType;
  label: string;
  color?: "primary" | "default";
  onPress?: () => void;
}) {
  const className = cn(
    "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-extrabold transition-all duration-200 shadow-md hover:-translate-y-0.5 active:translate-y-0",
    color === "primary" &&
      "bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-primary/25 hover:shadow-lg hover:shadow-primary/30",
    color === "default" &&
      "border border-default-200/80 bg-background text-foreground hover:border-default-300 hover:bg-default-50"
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
