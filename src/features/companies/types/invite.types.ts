import type { UserRole } from "@/features/auth/types/auth.types";
import type { PortalId } from "@/lib/portal-permissions";
import type { PortalSubRoles } from "@/lib/permissions/sub-roles";

export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

export interface TeamInvite {
  id: string;
  token: string;
  email: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  invitedBy: string;
  invitedByName: string;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
  portalAccess?: PortalId[] | null;
  portalSubRoles?: PortalSubRoles | null;
}

export interface CreateInviteInput {
  email: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  invitedBy: string;
  invitedByName: string;
  portalAccess?: PortalId[] | null;
  portalSubRoles?: PortalSubRoles | null;
}
