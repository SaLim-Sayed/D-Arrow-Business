import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { PortalId } from "@/lib/portal-permissions";
import { PortalSubNav } from "@/features/portals/components/PortalSubNav";

const FULL_BLEED_PATHS = ["/crm/deals"];

function isFullBleedPath(pathname: string) {
  if (FULL_BLEED_PATHS.some((p) => pathname.startsWith(p))) return true;
  return pathname === "/tasks/work";
}

interface PortalPageShellProps {
  portal: PortalId;
  maxWidth?: "7xl" | "wide";
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

export function PortalPageShell({
  portal,
  maxWidth = "7xl",
  toolbar,
  children,
}: PortalPageShellProps) {
  const { pathname } = useLocation();
  const fullBleed = isFullBleedPath(pathname);

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 duration-500 w-full mx-auto",
        fullBleed
          ? "-mx-4 md:-mx-6 max-w-none"
          : maxWidth === "wide"
            ? "max-w-[1600px]"
            : "max-w-7xl"
      )}
    >
      <div className="md:hidden sticky top-[var(--header-height)] z-30 -mx-4 px-4 py-2.5 glass border-b border-default-100/80 mb-4 shadow-sm">
        <PortalSubNav portal={portal} />
      </div>

      {toolbar && (
        <div className="mb-4 flex items-center gap-2 flex-wrap sm:justify-end">
          {toolbar}
        </div>
      )}

      <div className={cn(fullBleed && "min-h-[calc(100dvh-var(--header-height))]")}>
        {children}
      </div>
    </div>
  );
}
