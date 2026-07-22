import type { User } from "../types/auth.types";
import type { PortalId } from "@/lib/portal-permissions";
import { parsePortalSubRoles } from "@/lib/permissions/sub-roles";

export function parsePortalAccess(raw: unknown): PortalId[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const valid = raw.filter(
    (p): p is PortalId =>
      p === "tasks" ||
      p === "crm" ||
      p === "people" ||
      p === "billing" ||
      p === "chat"
  );
  return valid.length ? valid : undefined;
}

export function mapFirestoreUser(
  id: string,
  data: Record<string, unknown> | undefined,
  fallbacks: Partial<User> = {}
): User {
  return {
    id,
    email: (data?.email as string) || fallbacks.email || "",
    name:
      (data?.name as string) ||
      fallbacks.name ||
      fallbacks.email?.split("@")[0] ||
      "User",
    nameAr: (data?.nameAr as string) || fallbacks.nameAr || "",
    avatar:
      (data?.avatar as string) ||
      fallbacks.avatar ||
      `https://avatar.vercel.sh/${id}`,
    role: (data?.role as User["role"]) || fallbacks.role || "employee",
    companyId: (data?.companyId as string) || fallbacks.companyId || "default-company",
    companyName:
      (data?.companyName as string) || fallbacks.companyName || "D-Arrow Business",
    portalAccess: parsePortalAccess(data?.portalAccess),
    portalSubRoles: parsePortalSubRoles(data?.portalSubRoles),
  };
}
