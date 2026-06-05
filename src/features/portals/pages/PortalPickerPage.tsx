import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardBody } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import {
  useAccessiblePortals,
  getLastPortalPath,
  setLastPortal,
} from "../hooks/use-portals";
import { PORTAL_PATHS, type PortalId } from "@/lib/portal-permissions";
import { useAuthStore } from "@/stores/auth.store";
import type { UserRole } from "@/features/auth/types/auth.types";
import { PORTAL_META } from "../constants/portal-meta";
import { usePortalStat } from "../hooks/use-portal-stats";

function PortalCard({ portal }: { portal: PortalId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const meta = PORTAL_META[portal];
  const Icon = meta.icon;
  const stat = usePortalStat(portal);

  return (
    <Card
      isPressable
      onPress={() => {
        setLastPortal(portal);
        navigate(PORTAL_PATHS[portal]);
      }}
      className="border border-default-100 hover:border-primary/40 hover:shadow-lg transition-all group"
    >
      <CardBody className="p-8 space-y-4">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Icon className="w-8 h-8" />
          </div>
          <ArrowRight className="w-5 h-5 text-default-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
        <div>
          <h3 className="text-xl font-black tracking-tight">{t(meta.titleKey)}</h3>
          <p className="text-sm text-default-500 mt-1">{t(meta.descKey)}</p>
        </div>
        {stat !== null && (
          <p className="text-xs font-bold text-primary uppercase tracking-wider">
            {t(meta.statKey, { count: stat })}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

export function PortalPickerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const portals = useAccessiblePortals();
  const role = useAuthStore((s) => s.user?.role) as UserRole | undefined;
  const choosePortal = Boolean(
    (location.state as { choosePortal?: boolean } | null)?.choosePortal
  );

  useEffect(() => {
    if (portals.length === 1) {
      setLastPortal(portals[0]);
      navigate(PORTAL_PATHS[portals[0]], { replace: true });
      return;
    }
    if (choosePortal) return;
    const lastPath = getLastPortalPath(role);
    if (lastPath) {
      navigate(lastPath, { replace: true });
    }
  }, [portals, navigate, role, choosePortal]);

  if (portals.length <= 1) return null;

  return (
    <div className="max-w-5xl mx-auto py-8 md:py-16 space-y-10 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          {t("portals.pickerTitle")}
        </h1>
        <p className="text-default-500">{t("portals.pickerSubtitle")}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {portals.map((portal) => (
          <PortalCard key={portal} portal={portal} />
        ))}
      </div>
    </div>
  );
}
