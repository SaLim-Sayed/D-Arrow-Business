import type { MouseEvent, ReactNode } from "react";
import { User } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { initialsFromName } from "@/lib/localized-name";
import { cn } from "@/lib/utils";

interface EmployeeProfileLinkProps {
  employeeId?: string;
  name: string;
  description?: ReactNode;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  avatarClassName?: string;
  nameClassName?: string;
}

/** Avatar + name that opens `/people/:id` without triggering a parent row click. */
export function EmployeeProfileLink({
  employeeId,
  name,
  description,
  avatarUrl,
  size = "sm",
  className,
  avatarClassName,
  nameClassName,
}: EmployeeProfileLinkProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("people");
  const canOpen = Boolean(employeeId);

  const openProfile = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (!employeeId) return;
    navigate(`/people/${employeeId}`);
  };

  return (
    <button
      type="button"
      onClick={openProfile}
      disabled={!canOpen}
      className={cn(
        "inline-flex max-w-full rounded-xl text-start",
        canOpen ? "cursor-pointer hover:opacity-80" : "cursor-default",
        className
      )}
      aria-label={canOpen ? t("profile.open", { name }) : name}
    >
      <User
        name={
          <span
            className={cn(
              "block max-w-[180px] truncate font-semibold",
              canOpen && "underline-offset-2 group-hover:underline",
              nameClassName
            )}
            title={name}
          >
            {name}
          </span>
        }
        description={description}
        avatarProps={{
          src: avatarUrl,
          name,
          fallback: initialsFromName(name),
          showFallback: true,
          size,
          className: cn("bg-primary/10 text-primary font-bold", avatarClassName),
        }}
      />
    </button>
  );
}
