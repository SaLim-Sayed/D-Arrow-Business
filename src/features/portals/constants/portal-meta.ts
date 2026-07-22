import type { PortalId } from "@/lib/portal-permissions";
import { CheckSquare, Handshake, ListTodo, Calculator, MessageSquare } from "lucide-react";

export const PORTAL_META: Record<
  PortalId,
  {
    icon: typeof ListTodo;
    titleKey: string;
    descKey: string;
    shortKey: string;
    statKey: string;
  }
> = {
  tasks: {
    icon: ListTodo,
    titleKey: "portals.tasks.title",
    descKey: "portals.tasks.description",
    shortKey: "portals.tasks.short",
    statKey: "portals.tasks.stat",
  },
  crm: {
    icon: Handshake,
    titleKey: "portals.crm.title",
    descKey: "portals.crm.description",
    shortKey: "portals.crm.short",
    statKey: "portals.crm.stat",
  },
  people: {
    icon: CheckSquare,
    titleKey: "portals.people.title",
    descKey: "portals.people.description",
    shortKey: "portals.people.short",
    statKey: "portals.people.stat",
  },
  billing: {
    icon: Calculator,
    titleKey: "portals.billing.title",
    descKey: "portals.billing.description",
    shortKey: "portals.billing.short",
    statKey: "portals.billing.stat",
  },
  chat: {
    icon: MessageSquare,
    titleKey: "portals.chat.title",
    descKey: "portals.chat.description",
    shortKey: "portals.chat.short",
    statKey: "portals.chat.stat",
  },
};
