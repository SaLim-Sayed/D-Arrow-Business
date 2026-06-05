import { Chip } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { LEAD_STATUS_COLORS, normalizeLeadStatus } from "../constants/lead-workflow";
import type { LeadStatus } from "../types/leads.types";

interface LeadStatusChipProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function LeadStatusChip({ status, size = "sm" }: LeadStatusChipProps) {
  const { t } = useTranslation("crm");
  const normalized = normalizeLeadStatus(status) as LeadStatus;
  return (
    <Chip
      color={LEAD_STATUS_COLORS[normalized]}
      variant="flat"
      size={size}
      className="font-bold uppercase text-[10px]"
    >
      {t(`leads.status.${normalized}`)}
    </Chip>
  );
}
