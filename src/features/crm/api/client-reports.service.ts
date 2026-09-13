import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApiResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import type {
  ClientReport,
  CreateClientReportDTO,
  UpdateClientReportDTO,
} from "../types/client-reports.types";

const SERVICE_NAME = "ClientReportsService";

function mapClientReportDoc(id: string, data: Record<string, unknown>): ClientReport {
  return {
    id,
    companyId: typeof data.companyId === "string" ? data.companyId : "",
    contactId: typeof data.contactId === "string" ? data.contactId : "",
    contactName: typeof data.contactName === "string" ? data.contactName : "",
    dealId: typeof data.dealId === "string" ? data.dealId : undefined,
    dealTitle: typeof data.dealTitle === "string" ? data.dealTitle : undefined,
    authorId: typeof data.authorId === "string" ? data.authorId : "",
    authorName: typeof data.authorName === "string" ? data.authorName : "",
    authorEmail: typeof data.authorEmail === "string" ? data.authorEmail : undefined,
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : undefined,
    reportType: (data.reportType as ClientReport["reportType"]) || "general",
    content: typeof data.content === "string" ? data.content : "",
    keyOutcomes: Array.isArray(data.keyOutcomes) ? data.keyOutcomes : [],
    actionItems: Array.isArray(data.actionItems) ? data.actionItems : [],
    clientMood: (data.clientMood as ClientReport["clientMood"]) || "satisfied",
    satisfactionRating: typeof data.satisfactionRating === "number" ? data.satisfactionRating : 5,
    status: (data.status as ClientReport["status"]) || "submitted",
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt as string) || new Date().toISOString(),
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : (data.updatedAt as string) || new Date().toISOString(),
  };
}

export const ClientReportsService = {
  async getClientReports(
    companyId: string,
    filters?: {
      contactId?: string;
      dealId?: string;
      authorId?: string;
      reportType?: string;
      clientMood?: string;
    }
  ): Promise<ApiResponse<ClientReport[]>> {
    return withLogging(SERVICE_NAME, "getClientReports", (async () => {
      const reportsRef = collection(db, "companies", companyId, "client_reports");
      let q = query(reportsRef, orderBy("createdAt", "desc"));

      if (filters?.contactId) {
        q = query(reportsRef, where("contactId", "==", filters.contactId), orderBy("createdAt", "desc"));
      } else if (filters?.authorId) {
        q = query(reportsRef, where("authorId", "==", filters.authorId), orderBy("createdAt", "desc"));
      }

      const querySnapshot = await getDocs(q);
      let reports = querySnapshot.docs.map((docSnap) => mapClientReportDoc(docSnap.id, docSnap.data()));

      if (filters?.dealId) {
        reports = reports.filter((r) => r.dealId === filters.dealId);
      }
      if (filters?.reportType) {
        reports = reports.filter((r) => r.reportType === filters.reportType);
      }
      if (filters?.clientMood) {
        reports = reports.filter((r) => r.clientMood === filters.clientMood);
      }

      return {
        data: reports,
        message: "Fetched client reports successfully",
      };
    })());
  },

  async getClientReportById(companyId: string, reportId: string): Promise<ApiResponse<ClientReport>> {
    return withLogging(SERVICE_NAME, "getClientReportById", (async () => {
      const reportRef = doc(db, "companies", companyId, "client_reports", reportId);
      const docSnap = await getDoc(reportRef);
      if (!docSnap.exists()) {
        throw new Error("Client report not found");
      }
      return {
        data: mapClientReportDoc(docSnap.id, docSnap.data()),
        message: "Client report fetched successfully",
      };
    })());
  },

  async createClientReport(
    companyId: string,
    payload: CreateClientReportDTO,
    author: { id: string; name: string; email?: string }
  ): Promise<ApiResponse<ClientReport>> {
    return withLogging(SERVICE_NAME, "createClientReport", (async () => {
      const reportsRef = collection(db, "companies", companyId, "client_reports");

      const docData: Record<string, unknown> = {
        companyId,
        contactId: payload.contactId,
        contactName: payload.contactName,
        dealId: payload.dealId || null,
        dealTitle: payload.dealTitle || null,
        authorId: author.id,
        authorName: author.name,
        authorEmail: author.email || null,
        title: payload.title,
        description: payload.description || null,
        reportType: payload.reportType || "general",
        content: payload.content,
        keyOutcomes: payload.keyOutcomes || [],
        actionItems: payload.actionItems || [],
        clientMood: payload.clientMood || "satisfied",
        satisfactionRating: payload.satisfactionRating || 5,
        status: payload.status || "submitted",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(reportsRef, docData);
      const createdSnap = await getDoc(docRef);

      return {
        data: mapClientReportDoc(docRef.id, createdSnap.data() || {}),
        message: "تم حفظ تقرير العميل بنجاح",
      };
    })());
  },

  async updateClientReport(
    companyId: string,
    reportId: string,
    payload: UpdateClientReportDTO
  ): Promise<ApiResponse<ClientReport>> {
    return withLogging(SERVICE_NAME, "updateClientReport", (async () => {
      const reportRef = doc(db, "companies", companyId, "client_reports", reportId);

      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (payload.contactId !== undefined) updateData.contactId = payload.contactId;
      if (payload.contactName !== undefined) updateData.contactName = payload.contactName;
      if (payload.dealId !== undefined) updateData.dealId = payload.dealId || null;
      if (payload.dealTitle !== undefined) updateData.dealTitle = payload.dealTitle || null;
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.description !== undefined) updateData.description = payload.description || null;
      if (payload.reportType !== undefined) updateData.reportType = payload.reportType;
      if (payload.content !== undefined) updateData.content = payload.content;
      if (payload.keyOutcomes !== undefined) updateData.keyOutcomes = payload.keyOutcomes;
      if (payload.actionItems !== undefined) updateData.actionItems = payload.actionItems;
      if (payload.clientMood !== undefined) updateData.clientMood = payload.clientMood;
      if (payload.satisfactionRating !== undefined) updateData.satisfactionRating = payload.satisfactionRating;
      if (payload.status !== undefined) updateData.status = payload.status;

      await updateDoc(reportRef, updateData);
      const updatedSnap = await getDoc(reportRef);

      return {
        data: mapClientReportDoc(reportId, updatedSnap.data() || {}),
        message: "تم تحديث تقرير العميل بنجاح",
      };
    })());
  },

  async deleteClientReport(companyId: string, reportId: string): Promise<ApiResponse<void>> {
    return withLogging(SERVICE_NAME, "deleteClientReport", (async () => {
      const reportRef = doc(db, "companies", companyId, "client_reports", reportId);
      await deleteDoc(reportRef);
      return {
        data: undefined,
        message: "تم حذف تقرير العميل بنجاح",
      };
    })());
  },
};
