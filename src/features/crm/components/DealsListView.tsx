import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
} from "@heroui/react";
import { useDealsQuery } from "../hooks/use-deals";
import { useContactsQuery } from "../hooks/use-contacts";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { DEAL_STAGE_COLORS, normalizeDealStage, normalizeDealProbability } from "../constants/deal-workflow";
import type { DealStage } from "../types/deals.types";
import { contactDisplayName } from "../utils/contacts-list.utils";
import { formatCurrency } from "@/lib/utils";

function formatAmount(amount: number, currency: string) {
  return formatCurrency(amount, currency);
}

export function DealsListView() {
  const { t } = useTranslation("crm");
  const { data: dealsRes, isLoading: dealsLoading } = useDealsQuery();
  const { data: contactsRes, isLoading: contactsLoading } = useContactsQuery();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const deals = dealsRes?.data ?? [];
    const contacts = contactsRes?.data ?? [];
    const q = search.trim().toLowerCase();
    return deals
      .filter((d) => !q || d.title.toLowerCase().includes(q))
      .map((deal) => {
        const contact = contacts.find((c) => c.id === deal.contactId);
        return {
          ...deal,
          stage: normalizeDealStage(deal.stage) as DealStage,
          contactName: contact ? contactDisplayName(contact) : "—",
        };
      });
  }, [dealsRes?.data, contactsRes?.data, search]);

  if (dealsLoading || contactsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder={t("deals.searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xs px-3 py-2 text-sm rounded-xl bg-default-100 border-none focus:ring-2 focus:ring-primary/20"
      />
      <Table aria-label={t("deals.title")} removeWrapper className="bg-transparent">
        <TableHeader>
          <TableColumn>{t("deals.form.title")}</TableColumn>
          <TableColumn>{t("deals.form.contact")}</TableColumn>
          <TableColumn>{t("deals.form.stage")}</TableColumn>
          <TableColumn>{t("deals.form.amount")}</TableColumn>
          <TableColumn>{t("deals.form.probability")}</TableColumn>
          <TableColumn>{t("leads.columns.actions")}</TableColumn>
        </TableHeader>
        <TableBody emptyContent={t("deals.empty")}>
          {rows.map((deal) => (
            <TableRow key={deal.id}>
              <TableCell className="font-semibold">{deal.title}</TableCell>
              <TableCell>{deal.contactName}</TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" color={DEAL_STAGE_COLORS[deal.stage]}>
                  {t(`deals.stage.${deal.stage}`)}
                </Chip>
              </TableCell>
              <TableCell>{formatAmount(deal.amount, deal.currency)}</TableCell>
              <TableCell>{normalizeDealProbability(deal.probability)}/10</TableCell>
              <TableCell>
                <Button as={Link} to={`/crm/deals/${deal.id}`} size="sm" variant="light" color="primary">
                  {t("leads.details")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
