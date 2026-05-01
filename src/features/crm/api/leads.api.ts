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
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApiResponse } from "@/types/api.types";
import type { Lead, CreateLeadDTO, UpdateLeadDTO } from "../types/leads.types";

export async function getLeads(companyId: string): Promise<ApiResponse<Lead[]>> {
  const leadsRef = collection(db, "companies", companyId, "leads");
  const q = query(leadsRef, orderBy("createdAt", "desc"));
  
  const querySnapshot = await getDocs(q);
  const leads: Lead[] = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as object)
  } as Lead));

  return {
    data: leads,
    message: "Success",
  };
}

export async function createLead(companyId: string, data: CreateLeadDTO): Promise<ApiResponse<Lead>> {
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
}

export async function updateLead(companyId: string, leadId: string, data: UpdateLeadDTO): Promise<ApiResponse<Lead>> {
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
}

export async function deleteLead(companyId: string, leadId: string): Promise<void> {
  const leadRef = doc(db, "companies", companyId, "leads", leadId);
  await deleteDoc(leadRef);
}
