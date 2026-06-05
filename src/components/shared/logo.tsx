import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
}

export function Logo({ className, size = "md", variant = "full" }: LogoProps) {
  const sizes = {
    sm: "h-10",
    md: "h-16",
    lg: "h-28",
    xl: "h-48",
  };

  if (variant === "icon") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <img
          src="/sm-logo-light.png"
          alt="D-Arrow Logo"
          className={cn("object-contain dark:hidden", sizes[size])}
        />
        <img
          src="/sm-logo.png"
          alt="D-Arrow Logo"
          className={cn("object-contain hidden dark:block", sizes[size])}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      {/* Light Mode Logo (Transparent) */}
      <img
        src="/DR_LOGO__2_-2-01-removebg-preview.png"
        alt="D-Arrow Logo"
        className={cn("w-full object-fill dark:hidden", sizes[size])}
      />
      {/* Dark Mode Logo (Original) */}
      <img
        src="/DR LOGO (2)-2-01.png"
        alt="D-Arrow Logo"
        className={cn("w-full object-fill hidden dark:block", sizes[size])}
      />
    </div>
  );
}
