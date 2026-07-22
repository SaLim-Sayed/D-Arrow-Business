import emailjs from "@emailjs/browser";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { withLogging } from "@/lib/service-utils";
import { canAssignRole } from "@/lib/permissions/role-assignment";
import type { UserRole } from "@/features/auth/types/auth.types";
import type { CreateInviteInput, TeamInvite } from "../types/invite.types";

const SERVICE_NAME = "InvitesService";
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function mapInvite(id: string, data: Record<string, unknown>): TeamInvite {
  return {
    id,
    token: String(data.token ?? id),
    email: String(data.email ?? "").toLowerCase(),
    role: (data.role as UserRole) || "employee",
    companyId: String(data.companyId ?? ""),
    companyName: String(data.companyName ?? ""),
    invitedBy: String(data.invitedBy ?? ""),
    invitedByName: String(data.invitedByName ?? ""),
    status: (data.status as TeamInvite["status"]) || "pending",
    createdAt: toIso(data.createdAt),
    expiresAt: toIso(data.expiresAt),
    acceptedAt: data.acceptedAt ? toIso(data.acceptedAt) : null,
    acceptedBy: data.acceptedBy ? String(data.acceptedBy) : null,
    portalAccess: (data.portalAccess as TeamInvite["portalAccess"]) ?? null,
    portalSubRoles: (data.portalSubRoles as TeamInvite["portalSubRoles"]) ?? null,
  };
}

function inviteLink(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/invite/${token}`;
}

async function sendInviteEmail(params: {
  email: string;
  inviteUrl: string;
  companyName: string;
  inviterName: string;
  role: string;
}): Promise<"sent" | "logged"> {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
  // Prefer attendance template (user configured invite link there), then dedicated invite, then OTP
  const templateId =
    (import.meta.env.VITE_EMAILJS_ATTENDANCE_TEMPLATE_ID as string) ||
    (import.meta.env.VITE_EMAILJS_INVITE_TEMPLATE_ID as string) ||
    (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string);
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;

  const subject = `Invitation to join ${params.companyName}`;
  const message = [
    `Hello,`,
    ``,
    `${params.inviterName} invited you to join ${params.companyName} on D-Arrow Business.`,
    `Role: ${params.role}`,
    ``,
    `Click the link below to set your password and enter the system:`,
    params.inviteUrl,
    ``,
    `This invitation expires in 7 days.`,
  ].join("\n");

  if (!serviceId || !templateId || !publicKey) {
    console.warn(`[INVITE DEV] Link for ${params.email}: ${params.inviteUrl}`);
    return "logged";
  }

  await emailjs.send(
    serviceId,
    templateId,
    {
      to_email: params.email,
      to_name: params.email.split("@")[0],
      from_name: params.inviterName || "D-Arrow",
      subject,
      message,
      // Invite-specific
      invite_link: params.inviteUrl,
      company_name: params.companyName,
      inviter_name: params.inviterName,
      role_name: params.role,
      // Attendance template field mapping (same template as attendance emails)
      employee_name: params.inviterName || params.companyName,
      action_type: "Team Invitation — Set Password",
      total_time: params.inviteUrl,
      // OTP template fallback
      otp_code: params.inviteUrl,
      expiry_minutes: String(7 * 24 * 60),
    },
    { publicKey }
  );
  return "sent";
}

export const InvitesService = {
  async createInvite(
    actorRole: UserRole,
    input: CreateInviteInput
  ): Promise<{ invite: TeamInvite; inviteUrl: string; emailMode: "sent" | "logged" }> {
    return withLogging(SERVICE_NAME, "createInvite", (async () => {
      const email = input.email.trim().toLowerCase();
      if (!email || !email.includes("@")) {
        throw new Error("Invalid email");
      }
      if (!canAssignRole(actorRole, input.role)) {
        throw new Error("You cannot assign this role");
      }

      const existingUsers = await getDocs(
        query(collection(db, "users"), where("companyId", "==", input.companyId))
      );
      if (
        existingUsers.docs.some(
          (snap) =>
            String(snap.data().email || "").toLowerCase() === email
        )
      ) {
        throw new Error("USER_EXISTS");
      }

      const pending = await getDocs(
        query(
          collection(db, "invites"),
          where("companyId", "==", input.companyId),
          where("email", "==", email),
          where("status", "==", "pending")
        )
      );
      if (!pending.empty) {
        throw new Error("INVITE_EXISTS");
      }

      const token =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, "")
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
      const ref = doc(db, "invites", token);
      const payload = {
        token,
        email,
        role: input.role,
        companyId: input.companyId,
        companyName: input.companyName,
        invitedBy: input.invitedBy,
        invitedByName: input.invitedByName,
        status: "pending" as const,
        createdAt: serverTimestamp(),
        expiresAt,
        acceptedAt: null,
        acceptedBy: null,
        portalAccess: input.portalAccess ?? null,
        portalSubRoles: input.portalSubRoles ?? null,
      };

      await setDoc(ref, payload);

      const invite = mapInvite(token, {
        ...payload,
        createdAt: new Date().toISOString(),
      });
      const inviteUrl = inviteLink(token);
      const emailMode = await sendInviteEmail({
        email,
        inviteUrl,
        companyName: input.companyName,
        inviterName: input.invitedByName,
        role: input.role,
      });

      return { invite, inviteUrl, emailMode };
    })());
  },

  async listPending(companyId: string): Promise<TeamInvite[]> {
    return withLogging(SERVICE_NAME, "listPending", (async () => {
      const snapshot = await getDocs(
        query(
          collection(db, "invites"),
          where("companyId", "==", companyId),
          where("status", "==", "pending")
        )
      );
      const now = Date.now();
      return snapshot.docs
        .map((snap) => mapInvite(snap.id, snap.data() as Record<string, unknown>))
        .filter((invite) => new Date(invite.expiresAt).getTime() > now)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    })());
  },

  async getByToken(token: string): Promise<TeamInvite | null> {
    return withLogging(SERVICE_NAME, "getByToken", (async () => {
      const snap = await getDoc(doc(db, "invites", token));
      if (!snap.exists()) return null;
      const invite = mapInvite(snap.id, snap.data() as Record<string, unknown>);
      if (invite.status !== "pending") return invite;
      if (new Date(invite.expiresAt).getTime() < Date.now()) {
        return { ...invite, status: "expired" };
      }
      return invite;
    })());
  },

  async revoke(token: string): Promise<void> {
    return withLogging(SERVICE_NAME, "revoke", (async () => {
      await deleteDoc(doc(db, "invites", token));
    })());
  },

  /** Hard-delete every invite for a company (pending / revoked / expired). */
  async deleteAllForCompany(companyId: string): Promise<number> {
    return withLogging(SERVICE_NAME, "deleteAllForCompany", (async () => {
      const snapshot = await getDocs(
        query(collection(db, "invites"), where("companyId", "==", companyId))
      );
      if (snapshot.empty) return 0;

      const docs = snapshot.docs;
      const chunkSize = 400;
      for (let i = 0; i < docs.length; i += chunkSize) {
        const batch = writeBatch(db);
        for (const snap of docs.slice(i, i + chunkSize)) {
          batch.delete(snap.ref);
        }
        await batch.commit();
      }
      return docs.length;
    })());
  },

  async markAccepted(token: string, userId: string): Promise<void> {
    return withLogging(SERVICE_NAME, "markAccepted", (async () => {
      await updateDoc(doc(db, "invites", token), {
        status: "accepted",
        acceptedAt: new Date().toISOString(),
        acceptedBy: userId,
      });
    })());
  },
};
