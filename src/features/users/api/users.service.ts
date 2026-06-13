import { doc, updateDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserRole } from "@/features/auth/types/auth.types";
import type { PortalId } from "@/lib/portal-permissions";
import type { PortalSubRoles } from "@/lib/permissions/sub-roles";
import { withLogging } from "@/lib/service-utils";
import {
  canAssignRole,
  canManageUserRole,
} from "@/lib/permissions/role-assignment";
import { canManagePortalAccess } from "@/lib/permissions/portal-access";

const SERVICE_NAME = "UsersService";

export const UsersService = {
  async updateUserRole(
    companyId: string,
    actorId: string,
    actorRole: UserRole,
    targetUserId: string,
    newRole: UserRole
  ): Promise<void> {
    return withLogging(SERVICE_NAME, "updateUserRole", (async () => {
      if (!canManageUserRole(actorRole, actorId, targetUserId)) {
        throw new Error("You cannot change this user's role");
      }
      if (!canAssignRole(actorRole, newRole)) {
        throw new Error("You cannot assign this role");
      }

      await updateDoc(doc(db, "users", targetUserId), {
        role: newRole,
        portalAccess: [],
        portalSubRoles: {},
        updatedAt: new Date().toISOString(),
      });

      const employeesRef = collection(db, "companies", companyId, "employees");
      const empQuery = query(employeesRef, where("userId", "==", targetUserId));
      const empSnap = await getDocs(empQuery);

      await Promise.all(
        empSnap.docs.map((empDoc) =>
          updateDoc(empDoc.ref, {
            role: newRole,
            updatedAt: new Date().toISOString(),
          })
        )
      );
    })());
  },

  async updateUserPortalAccess(
    actorRole: UserRole,
    targetUserId: string,
    portalAccess: PortalId[] | null,
    portalSubRoles?: PortalSubRoles | null
  ): Promise<void> {
    return withLogging(SERVICE_NAME, "updateUserPortalAccess", (async () => {
      if (!canManagePortalAccess(actorRole)) {
        throw new Error("Only super admins can manage portal access");
      }

      const payload: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (portalAccess === null) {
        payload.portalAccess = [];
      } else {
        payload.portalAccess = portalAccess;
      }

      if (portalSubRoles !== undefined) {
        payload.portalSubRoles = portalSubRoles ?? {};
      }

      await updateDoc(doc(db, "users", targetUserId), payload);
    })());
  },
};
