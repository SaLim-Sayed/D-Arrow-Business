import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const ASSETS = {
  full: "/DR_LOGO__2_-2-01-removebg-preview.png",
  iconLight: "/sm-logo-light.png",
  iconDark: "/sm-logo.png",
} as const;

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  /** When set, the logo navigates to this path on press. */
  to?: string;
  title?: string;
  onClick?: () => void;
}

const heightBySize = {
  sm: "h-10",
  md: "h-16",
  lg: "h-24",
  xl: "h-32",
};

export function Logo({
  className,
  size = "md",
  variant = "full",
  to,
  title,
  onClick,
}: LogoProps) {
  const mark =
    variant === "icon" ? (
      <div className={cn("flex items-center justify-center shrink-0", !to && className)}>
        <img
          src={ASSETS.iconLight}
          alt="D-Arrow"
          className={cn(
            "object-contain dark:hidden transition-all duration-200 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.08)] group-hover:drop-shadow-[0_2px_8px_rgba(249,115,22,0.25)]",
            heightBySize[size]
          )}
        />
        <img
          src={ASSETS.iconDark}
          alt="D-Arrow"
          className={cn(
            "object-contain hidden dark:block transition-all duration-200 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] group-hover:drop-shadow-[0_2px_8px_rgba(249,115,22,0.35)]",
            heightBySize[size]
          )}
        />
      </div>
    ) : (
      <div className={cn("flex items-center shrink-0", !to && className)}>
        <img
          src={ASSETS.full}
          alt="D-Arrow Marketing"
          className={cn(
            "w-auto max-w-full object-contain transition-all duration-200 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.08)] group-hover:drop-shadow-[0_3px_10px_rgba(249,115,22,0.2)]",
            heightBySize[size]
          )}
        />
      </div>
    );

  if (!to) return mark;

  return (
    <Link
      to={to}
      title={title}
      aria-label={title ?? "D-Arrow"}
      onClick={onClick}
      className={cn(
        "group inline-flex items-center justify-center rounded-xl outline-none transition-all duration-200 hover:scale-[1.04] active:scale-95 hover:brightness-105 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
        className
      )}
    >
      {mark}
    </Link>
  );
}
