import { doc, updateDoc, getDocs, collection, query, where, deleteDoc } from "firebase/firestore";
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

  async updateUserCustomPermissions(
    _actorRole: UserRole,
    targetUserId: string,
    customPermissions: string[]
  ): Promise<void> {
    return withLogging(SERVICE_NAME, "updateUserCustomPermissions", (async () => {
      await updateDoc(doc(db, "users", targetUserId), {
        customPermissions: customPermissions ?? [],
        updatedAt: new Date().toISOString(),
      });
    })());
  },

  async deleteUser(
    companyId: string,
    targetUserId: string,
    targetEmail?: string
  ): Promise<void> {
    return withLogging(SERVICE_NAME, "deleteUser", (async () => {
      // 1. Delete from users collection by ID
      try {
        const userRef = doc(db, "users", targetUserId);
        await deleteDoc(userRef);
      } catch (e) {
        console.warn(`[UsersService.deleteUser] Error deleting user doc ${targetUserId}:`, e);
      }

      // 2. If email provided or can be queried
      const email = targetEmail ? targetEmail.toLowerCase().trim() : null;
      if (email) {
        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", email));
          const qSnap = await getDocs(q);
          for (const d of qSnap.docs) {
            await deleteDoc(d.ref);
          }
        } catch (e) {
          console.warn(`[UsersService.deleteUser] Error deleting user by email ${email}:`, e);
        }
      }

      // 3. Delete matching employee records
      if (companyId) {
        try {
          const empRef = collection(db, "companies", companyId, "employees");
          const qEmpUser = query(empRef, where("userId", "==", targetUserId));
          const empSnap = await getDocs(qEmpUser);
          for (const d of empSnap.docs) {
            await deleteDoc(d.ref);
          }

          if (email) {
            const qEmpEmail = query(empRef, where("email", "==", email));
            const empEmailSnap = await getDocs(qEmpEmail);
            for (const d of empEmailSnap.docs) {
              await deleteDoc(d.ref);
            }
          }
        } catch (e) {
          console.warn(`[UsersService.deleteUser] Error deleting employee records:`, e);
        }

        // 4. Delete invites
        if (email) {
          try {
            const compInvites = collection(db, "companies", companyId, "invites");
            const qInv = query(compInvites, where("email", "==", email));
            const invSnap = await getDocs(qInv);
            for (const d of invSnap.docs) {
              await deleteDoc(d.ref);
            }

            const topInvites = collection(db, "invites");
            const qTopInv = query(topInvites, where("email", "==", email));
            const topInvSnap = await getDocs(qTopInv);
            for (const d of topInvSnap.docs) {
              await deleteDoc(d.ref);
            }
          } catch (e) {
            console.warn(`[UsersService.deleteUser] Error deleting invites:`, e);
          }
        }
      }
    })());
  },

  async deleteUserByEmail(companyId: string, emailToClean: string): Promise<number> {
    return withLogging(SERVICE_NAME, "deleteUserByEmail", (async () => {
      const email = emailToClean.toLowerCase().trim();
      if (!email) throw new Error("Email is required");

      let deletedCount = 0;

      // 1. Delete all user documents with this email
      const usersRef = collection(db, "users");
      const qUsers = query(usersRef, where("email", "==", email));
      const usersSnap = await getDocs(qUsers);
      for (const d of usersSnap.docs) {
        await deleteDoc(d.ref);
        deletedCount++;
      }

      // 2. Delete all employees with this email
      if (companyId) {
        const empRef = collection(db, "companies", companyId, "employees");
        const qEmp = query(empRef, where("email", "==", email));
        const empSnap = await getDocs(qEmp);
        for (const d of empSnap.docs) {
          await deleteDoc(d.ref);
          deletedCount++;
        }

        // 3. Delete invites
        const compInvRef = collection(db, "companies", companyId, "invites");
        const qInv = query(compInvRef, where("email", "==", email));
        const invSnap = await getDocs(qInv);
        for (const d of invSnap.docs) {
          await deleteDoc(d.ref);
          deletedCount++;
        }

        const topInvRef = collection(db, "invites");
        const qTopInv = query(topInvRef, where("email", "==", email));
        const topSnap = await getDocs(qTopInv);
        for (const d of topSnap.docs) {
          await deleteDoc(d.ref);
          deletedCount++;
        }
      }

      return deletedCount;
    })());
  },
};
