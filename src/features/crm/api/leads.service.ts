import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  orderBy, 
  limit,
  serverTimestamp 
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import type { ApiResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import type { Lead, CreateLeadDTO, UpdateLeadDTO } from "../types/leads.types";

const SERVICE_NAME = "LeadsService";

/**
 * Leads Service (Lite)
 * Handles CRM leads using Firestore Lite to reduce network overhead.
 */
export const LeadsService = {
  async getLeads(companyId: string): Promise<ApiResponse<Lead[]>> {
    return withLogging(SERVICE_NAME, "getLeads", (async () => {
      const leadsRef = collection(db, "companies", companyId, "leads");
      // Use basic server-side sorting and limit
      const q = query(leadsRef, orderBy("createdAt", "desc"), limit(100));
      
      const querySnapshot = await getDocs(q);
      const leads: Lead[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as object)
      } as Lead));

      return {
        data: leads,
        message: "Success",
      };
    })());
  },

  async createLead(companyId: string, data: CreateLeadDTO): Promise<ApiResponse<Lead>> {
    return withLogging(SERVICE_NAME, "createLead", (async () => {
      const leadsRef = collection(db, "companies", companyId, "leads");
      
      const docRef = await addDoc(leadsRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const newDoc = await getDoc(docRef);

      return {
        data: { id: newDoc.id, ...newDoc.data() } as Lead,
        message: "Lead created successfully",
      };
    })());
  },

  async updateLead(companyId: string, leadId: string, data: UpdateLeadDTO): Promise<ApiResponse<Lead>> {
    return withLogging(SERVICE_NAME, "updateLead", (async () => {
      const leadRef = doc(db, "companies", companyId, "leads", leadId);
      
      await updateDoc(leadRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      const updatedDoc = await getDoc(leadRef);

      return {
        data: { id: updatedDoc.id, ...updatedDoc.data() } as Lead,
        message: "Lead updated successfully",
      };
    })());
  },

  async deleteLead(companyId: string, leadId: string): Promise<void> {
    return withLogging(SERVICE_NAME, "deleteLead", (async () => {
      const leadRef = doc(db, "companies", companyId, "leads", leadId);
      await deleteDoc(leadRef);
    })());
  }
};
