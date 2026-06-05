import type { Contact } from "../types/contacts.types";

export type ContactSortField = "name" | "email" | "accountName" | "createdAt";
export type ContactSortOrder = "asc" | "desc";

export interface ContactsListParams {
  search?: string;
  assignedTo?: string;
  sortField?: ContactSortField;
  sortOrder?: ContactSortOrder;
  page?: number;
  pageSize?: number;
}

export function contactDisplayName(contact: Contact): string {
  return `${contact.firstName} ${contact.lastName}`.trim() || contact.email || "—";
}

function contactMatchesSearch(contact: Contact, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [
    contact.firstName,
    contact.lastName,
    contactDisplayName(contact),
    contact.email,
    contact.phone,
    contact.accountName,
    contact.jobTitle,
    contact.department,
  ]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

export function filterContacts(contacts: Contact[], params: ContactsListParams): Contact[] {
  return contacts.filter((contact) => {
    if (params.search && !contactMatchesSearch(contact, params.search)) return false;
    if (params.assignedTo === "__unassigned__" && contact.assignedTo) return false;
    if (
      params.assignedTo &&
      params.assignedTo !== "__unassigned__" &&
      contact.assignedTo !== params.assignedTo
    )
      return false;
    return true;
  });
}

export function sortContacts(
  contacts: Contact[],
  field: ContactSortField = "createdAt",
  order: ContactSortOrder = "desc"
): Contact[] {
  const dir = order === "asc" ? 1 : -1;
  return [...contacts].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";
    switch (field) {
      case "name":
        av = contactDisplayName(a).toLowerCase();
        bv = contactDisplayName(b).toLowerCase();
        break;
      case "email":
        av = (a.email || "").toLowerCase();
        bv = (b.email || "").toLowerCase();
        break;
      case "accountName":
        av = (a.accountName || "").toLowerCase();
        bv = (b.accountName || "").toLowerCase();
        break;
      case "createdAt":
      default:
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
        break;
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

export function paginateContacts<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
  };
}

export function applyContactsListPipeline(contacts: Contact[], params: ContactsListParams) {
  const filtered = filterContacts(contacts, params);
  const sorted = sortContacts(filtered, params.sortField, params.sortOrder);
  return paginateContacts(sorted, params.page ?? 1, params.pageSize ?? 10);
}
