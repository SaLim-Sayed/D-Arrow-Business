import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApiResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import type { CompanyProfile, UpdateCompanyProfileDTO } from "../types/company.types";

const SERVICE_NAME = "CompanyService";

function mapCompanyDoc(
  companyId: string,
  data: Record<string, unknown>
): CompanyProfile {
  return {
    id: companyId,
    name: (data.name as string) ?? "",
    nameAr: data.nameAr as string | undefined,
    commercialRegister: (data.commercialRegister as string) ?? "",
    taxNumber: data.taxNumber as string | undefined,
    legalName: data.legalName as string | undefined,
    email: data.email as string | undefined,
    phone: data.phone as string | undefined,
    address: data.address as string | undefined,
    city: data.city as string | undefined,
    country: data.country as string | undefined,
    defaultCurrency: (data.defaultCurrency as string) ?? "USD",
    createdAt: (data.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (data.updatedAt as string) ?? new Date().toISOString(),
  };
}

export const CompanyService = {
  async getProfile(companyId: string): Promise<ApiResponse<CompanyProfile | null>> {
    return withLogging(SERVICE_NAME, "getProfile", (async () => {
      const snap = await getDoc(doc(db, "companies", companyId));
      if (!snap.exists()) {
        return { data: null, message: "No profile" };
      }
      return {
        data: mapCompanyDoc(companyId, snap.data() as Record<string, unknown>),
        message: "Success",
      };
    })());
  },

  async createProfile(
    companyId: string,
    data: UpdateCompanyProfileDTO & { name: string; commercialRegister: string }
  ): Promise<ApiResponse<CompanyProfile>> {
    return withLogging(SERVICE_NAME, "createProfile", (async () => {
      const ref = doc(db, "companies", companyId);
      const payload = {
        ...data,
        defaultCurrency: data.defaultCurrency ?? "USD",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, payload);
      const snap = await getDoc(ref);
      return {
        data: mapCompanyDoc(companyId, snap.data() as Record<string, unknown>),
        message: "Created successfully",
      };
    })());
  },

  async updateProfile(
    companyId: string,
    data: UpdateCompanyProfileDTO
  ): Promise<ApiResponse<CompanyProfile>> {
    return withLogging(SERVICE_NAME, "updateProfile", (async () => {
      const ref = doc(db, "companies", companyId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        return CompanyService.createProfile(companyId, {
          name: data.name ?? companyId,
          commercialRegister: data.commercialRegister ?? "",
          ...data,
        });
      }
      await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      const updated = await getDoc(ref);
      return {
        data: mapCompanyDoc(companyId, updated.data() as Record<string, unknown>),
        message: "Updated successfully",
      };
    })());
  },
};
