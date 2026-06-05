import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Input,
  Listbox,
  ListboxItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { Search, UserPlus, Users, Handshake } from "lucide-react";
import { useLeadsQuery } from "../hooks/use-leads";
import { useContactsQuery } from "../hooks/use-contacts";
import { useDealsQuery } from "../hooks/use-deals";
import { contactDisplayName } from "../utils/contacts-list.utils";

export function CrmGlobalSearch() {
  const { t } = useTranslation("crm");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const { data: leads } = useLeadsQuery();
  const { data: contacts } = useContactsQuery();
  const { data: deals } = useDealsQuery();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const items: {
      id: string;
      type: "lead" | "contact" | "deal";
      label: string;
      sub: string;
      href: string;
      icon: typeof UserPlus;
    }[] = [];

    for (const l of leads?.data ?? []) {
      if ([l.name, l.company, l.email].some((v) => v?.toLowerCase().includes(q))) {
        items.push({
          id: l.id,
          type: "lead",
          label: l.name,
          sub: l.company || t("nav.leads"),
          href: `/crm/leads/${l.id}`,
          icon: UserPlus,
        });
      }
    }
    for (const c of contacts?.data ?? []) {
      const name = contactDisplayName(c);
      if ([name, c.email, c.accountName].some((v) => v?.toLowerCase().includes(q))) {
        items.push({
          id: c.id,
          type: "contact",
          label: name,
          sub: c.accountName || t("nav.contacts"),
          href: `/crm/contacts/${c.id}`,
          icon: Users,
        });
      }
    }
    for (const d of deals?.data ?? []) {
      if (d.title.toLowerCase().includes(q)) {
        items.push({
          id: d.id,
          type: "deal",
          label: d.title,
          sub: t("nav.deals"),
          href: `/crm/deals/${d.id}`,
          icon: Handshake,
        });
      }
    }
    return items.slice(0, 8);
  }, [query, leads, contacts, deals, t]);

  return (
    <Popover isOpen={open && results.length > 0} onOpenChange={setOpen} placement="bottom-end">
      <PopoverTrigger>
        <Input
          size="sm"
          className="w-44 sm:w-56"
          placeholder={t("ui.search.placeholder")}
          value={query}
          onValueChange={(v) => {
            setQuery(v);
            setOpen(v.trim().length >= 2);
          }}
          startContent={<Search className="h-3.5 w-3.5 text-default-400" />}
          classNames={{ inputWrapper: "rounded-full bg-default-100 border-none" }}
        />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-72">
        <Listbox aria-label={t("ui.search.results")} onAction={(key) => {
          const item = results.find((r) => r.id === key);
          if (item) {
            navigate(item.href);
            setQuery("");
            setOpen(false);
          }
        }}>
          {results.map((r) => (
            <ListboxItem key={r.id} startContent={<r.icon className="h-4 w-4 text-default-400" />}>
              <div>
                <p className="text-sm font-semibold">{r.label}</p>
                <p className="text-[10px] text-default-400">{r.sub}</p>
              </div>
            </ListboxItem>
          ))}
        </Listbox>
      </PopoverContent>
    </Popover>
  );
}
