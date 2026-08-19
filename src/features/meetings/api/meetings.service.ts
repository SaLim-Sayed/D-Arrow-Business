import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApiResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import {
  mapDocWithTimestamps,
  stripUndefined,
} from "@/features/crm/utils/firestore-mappers";
import type {
  Meeting,
  CreateMeetingDTO,
  UpdateMeetingDTO,
} from "../types/meeting.types";

const SERVICE_NAME = "MeetingsService";

const meetingsRef = (companyId: string) =>
  collection(db, "companies", companyId, "meetings");

/** Meetings that already ended long ago are never needed by the UI. */
export function meetingsWindowStart(now = new Date()): string {
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  return start.toISOString();
}

export const MeetingsService = {
  async getMeetings(companyId: string): Promise<ApiResponse<Meeting[]>> {
    return withLogging(
      SERVICE_NAME,
      "getMeetings",
      (async () => {
        // startAt is an ISO string, so a lexicographic range is a time range.
        const q = query(
          meetingsRef(companyId),
          where("startAt", ">=", meetingsWindowStart()),
          orderBy("startAt", "asc"),
          limit(300)
        );
        const snapshot = await getDocs(q);
        return {
          data: snapshot.docs.map((docSnap) =>
            mapDocWithTimestamps<Meeting>(
              docSnap.id,
              docSnap.data() as Record<string, unknown>
            )
          ),
          message: "Success",
        };
      })()
    );
  },

  async createMeeting(
    companyId: string,
    data: CreateMeetingDTO
  ): Promise<ApiResponse<Meeting>> {
    return withLogging(
      SERVICE_NAME,
      "createMeeting",
      (async () => {
        const payload = stripUndefined({
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        } as Record<string, unknown>);
        const docRef = await addDoc(meetingsRef(companyId), payload);
        const created = await getDoc(docRef);
        return {
          data: mapDocWithTimestamps<Meeting>(
            created.id,
            created.data() as Record<string, unknown>
          ),
          message: "Created successfully",
        };
      })()
    );
  },

  async updateMeeting(
    companyId: string,
    id: string,
    data: UpdateMeetingDTO
  ): Promise<ApiResponse<Meeting>> {
    return withLogging(
      SERVICE_NAME,
      "updateMeeting",
      (async () => {
        const docRef = doc(db, "companies", companyId, "meetings", id);
        await updateDoc(
          docRef,
          stripUndefined({ ...data, updatedAt: serverTimestamp() } as Record<
            string,
            unknown
          >)
        );
        const updated = await getDoc(docRef);
        return {
          data: mapDocWithTimestamps<Meeting>(
            updated.id,
            updated.data() as Record<string, unknown>
          ),
          message: "Updated successfully",
        };
      })()
    );
  },

  async deleteMeeting(companyId: string, id: string): Promise<void> {
    return withLogging(
      SERVICE_NAME,
      "deleteMeeting",
      (async () => {
        await deleteDoc(doc(db, "companies", companyId, "meetings", id));
      })()
    );
  },

  /**
   * Records that `userId` was reminded. Written before the notification is
   * created so a second tab/device cannot fire the same reminder twice.
   */
  async markReminded(
    companyId: string,
    id: string,
    userId: string
  ): Promise<void> {
    return withLogging(
      SERVICE_NAME,
      "markReminded",
      (async () => {
        await updateDoc(doc(db, "companies", companyId, "meetings", id), {
          remindedUserIds: arrayUnion(userId),
        });
      })()
    );
  },
};
