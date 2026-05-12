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
        <svg
          viewBox="0 0 60 60"
          className={cn("object-contain", sizes[size])}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5 10L30 30L5 50V10Z" fill="url(#logo-gradient-icon)" />
          <path
            d="M35 5C50 5 60 15 60 30C60 45 50 55 35 55"
            stroke="url(#logo-gradient-icon)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient
              id="logo-gradient-icon"
              x1="0"
              y1="0"
              x2="60"
              y2="60"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#ff6b4a" />
              <stop offset="1" stopColor="#d53a81" />
            </linearGradient>
          </defs>
        </svg>
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
