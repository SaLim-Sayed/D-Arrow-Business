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
}

const heightBySize = {
  sm: "h-10",
  md: "h-16",
  lg: "h-24",
  xl: "h-32",
};

export function Logo({ className, size = "md", variant = "full" }: LogoProps) {
  if (variant === "icon") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <img
          src={ASSETS.iconLight}
          alt="D-Arrow"
          className={cn("object-contain dark:hidden", heightBySize[size])}
        />
        <img
          src={ASSETS.iconDark}
          alt="D-Arrow"
          className={cn("object-contain hidden dark:block", heightBySize[size])}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={ASSETS.full}
        alt="D-Arrow Marketing"
        className={cn(
          "w-auto max-w-full object-contain",
          heightBySize[size]
        )}
      />
    </div>
  );
}
