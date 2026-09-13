import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { PortalId } from "@/lib/portal-permissions";
import { PortalSubNav } from "@/features/portals/components/PortalSubNav";

const FULL_BLEED_PATHS = ["/crm/deals", "/chat"];

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
        "animate-in fade-in slide-in-from-bottom-4 duration-500 w-full mx-auto flex flex-col",
        fullBleed
          ? "-mx-4 md:-mx-6 max-w-none h-[calc(100dvh-var(--header-height)-3.5rem)] min-h-0 overflow-hidden"
          : maxWidth === "wide"
            ? "max-w-[1600px]"
            : "max-w-7xl"
      )}
    >
      <div
        className={cn(
          "md:hidden shrink-0 sticky top-[var(--header-height)] z-30 -mx-4 px-4 py-2 glass border-b border-default-100/80 shadow-sm",
          fullBleed ? "mb-2" : "mb-4"
        )}
      >
        <PortalSubNav portal={portal} />
      </div>

      {toolbar && (
        <div className="shrink-0 mb-3 flex items-center gap-2 flex-wrap sm:justify-end">
          {toolbar}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
