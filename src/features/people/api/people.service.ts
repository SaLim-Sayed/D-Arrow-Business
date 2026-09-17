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
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApiResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import type {
  Employee,
  LeaveRequest,
  PerformanceReview,
  Attendance,
  LeaveStatus,
  Asset,
  Announcement,
  WorkLocation,
  CreateWorkLocationDTO,
  AttendanceGeoPayload,
} from "../types/people.types";

const SERVICE_NAME = "PeopleService";

function enrichEmployeeFromUser(
  id: string,
  data: Record<string, unknown>,
  usersById: Map<string, Record<string, unknown>>,
  usersByEmail: Map<string, Record<string, unknown>>
): Employee {
  const userId = String(data.userId || "");
  const email = String(data.email || "")
    .trim()
    .toLowerCase();
  const user =
    (userId && usersById.get(userId)) ||
    (email && usersByEmail.get(email)) ||
    null;

  const userName = typeof user?.name === "string" ? user.name.trim() : "";
  const userNameAr =
    typeof user?.nameAr === "string" ? user.nameAr.trim() : "";
  const userAvatar =
    (typeof user?.avatar === "string" && user.avatar.trim()) ||
    (typeof user?.photoURL === "string" &&
      (user.photoURL as string).trim()) ||
    "";
  const userEmail =
    typeof user?.email === "string" ? user.email.trim() : "";

  const firstName = String(data.firstName || "").trim();
  const lastName = String(data.lastName || "").trim();
  const name =
    String(data.name || "").trim() || userName || undefined;
  const nameAr =
    String(data.nameAr || "").trim() || userNameAr || undefined;
  const avatarUrl =
    String(data.avatarUrl || "").trim() || userAvatar || undefined;
  const joiningDate =
    data.joiningDate instanceof Timestamp
      ? data.joiningDate.toDate().toISOString()
      : data.joiningDate;

  return {
    id,
    ...data,
    firstName,
    lastName,
    name,
    nameAr,
    avatarUrl,
    email: String(data.email || "").trim() || userEmail,
    joiningDate,
  } as Employee;
}

export const PeopleService = {
  // Employee Management
  async getEmployees(companyId: string): Promise<ApiResponse<Employee[]>> {
    return withLogging(SERVICE_NAME, "getEmployees", (async () => {
      const employeesRef = collection(db, "companies", companyId, "employees");
      const usersQuery = query(
        collection(db, "users"),
        where("companyId", "==", companyId)
      );
      const [querySnapshot, usersSnap] = await Promise.all([
        getDocs(employeesRef),
        getDocs(usersQuery),
      ]);

      const usersById = new Map<string, Record<string, unknown>>();
      const usersByEmail = new Map<string, Record<string, unknown>>();
      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data() as Record<string, unknown>;
        usersById.set(userDoc.id, userData);
        const email = String(userData.email || "")
          .trim()
          .toLowerCase();
        if (email) usersByEmail.set(email, userData);
      }

      const employees = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        return enrichEmployeeFromUser(
          docSnap.id,
          data,
          usersById,
          usersByEmail
        );
      });

      return {
        data: employees,
        message: "Success",
      };
    })());
  },

  async updateEmployee(companyId: string, employeeId: string, data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    return withLogging(SERVICE_NAME, "updateEmployee", (async () => {
      const docRef = doc(db, "companies", companyId, "employees", employeeId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      const updatedDoc = await getDoc(docRef);
      return {
        data: { id: updatedDoc.id, ...updatedDoc.data() } as Employee,
        message: "Employee updated successfully",
      };
    })());
  },

  async getEmployee(companyId: string, employeeId: string): Promise<ApiResponse<Employee>> {
    return withLogging(SERVICE_NAME, "getEmployee", (async () => {
      const docRef = doc(db, "companies", companyId, "employees", employeeId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Employee not found");

      const data = snap.data() as Record<string, unknown>;
      const usersQuery = query(
        collection(db, "users"),
        where("companyId", "==", companyId)
      );
      const usersSnap = await getDocs(usersQuery);
      const usersById = new Map<string, Record<string, unknown>>();
      const usersByEmail = new Map<string, Record<string, unknown>>();
      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data() as Record<string, unknown>;
        usersById.set(userDoc.id, userData);
        const email = String(userData.email || "")
          .trim()
          .toLowerCase();
        if (email) usersByEmail.set(email, userData);
      }

      return {
        data: enrichEmployeeFromUser(snap.id, data, usersById, usersByEmail),
        message: "Success",
      };
    })());
  },

  // Leave Management
  async getLeaveRequests(companyId: string): Promise<ApiResponse<LeaveRequest[]>> {
    return withLogging(SERVICE_NAME, "getLeaveRequests", (async () => {
      const leaveRef = collection(db, "companies", companyId, "leave_requests");
      const querySnapshot = await getDocs(leaveRef);
      
      const requests = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : data.startDate,
          endDate: data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : data.endDate,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as LeaveRequest;
      });

      return {
        data: requests,
        message: "Success",
      };
    })());
  },

  async submitLeaveRequest(companyId: string, data: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<LeaveRequest>> {
    return withLogging(SERVICE_NAME, "submitLeaveRequest", (async () => {
      const leaveRef = collection(db, "companies", companyId, "leave_requests");
      const docRef = await addDoc(leaveRef, {
        ...data,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const newDoc = await getDoc(docRef);
      return {
        data: { id: newDoc.id, ...newDoc.data() } as LeaveRequest,
        message: "Leave request submitted successfully",
      };
    })());
  },

  // Leave Management
  async updateLeaveRequestStatus(companyId: string, requestId: string, status: LeaveStatus, approvedById: string): Promise<ApiResponse<void>> {
    return withLogging(SERVICE_NAME, "updateLeaveRequestStatus", (async () => {
      const docRef = doc(db, "companies", companyId, "leave_requests", requestId);
      await updateDoc(docRef, {
        status,
        approvedById,
        updatedAt: serverTimestamp(),
      });
      return { data: undefined as void, message: `Leave request ${status} successfully` };
    })());
  },

  // Attendance & Time Tracking
  async checkIn(
    companyId: string,
    employeeId: string,
    geo?: AttendanceGeoPayload
  ): Promise<ApiResponse<Attendance>> {
    return withLogging(SERVICE_NAME, "checkIn", (async () => {
      const attendanceRef = collection(db, "companies", companyId, "attendance");
      const date = new Date().toISOString().split('T')[0];

      const payload: Record<string, unknown> = {
        employeeId,
        date,
        checkIn: serverTimestamp(),
        status: "present",
        createdAt: serverTimestamp(),
      };
      if (geo) {
        payload.checkInLat = geo.lat;
        payload.checkInLng = geo.lng;
        payload.location = geo.locationName;
        if (geo.locationId) payload.checkInLocationId = geo.locationId;
        if (geo.locationName) payload.checkInLocationName = geo.locationName;
        if (geo.distanceMeters != null) payload.checkInDistanceMeters = geo.distanceMeters;
      }
      
      const docRef = await addDoc(attendanceRef, payload);

      // Global status update for persistence across browsers
      const employeeRef = doc(db, "companies", companyId, "employees", employeeId);
      await updateDoc(employeeRef, {
        shiftStatus: "working",
        updatedAt: serverTimestamp(),
      });

      const newDoc = await getDoc(docRef);
      return {
        data: { id: newDoc.id, ...newDoc.data() } as Attendance,
        message: "Checked in successfully",
      };
    })());
  },

  async checkOut(
    companyId: string,
    attendanceId: string,
    employeeId: string,
    nextStatus: "on-break" | "off-duty" = "off-duty",
    geo?: AttendanceGeoPayload
  ): Promise<ApiResponse<Attendance>> {
    return withLogging(SERVICE_NAME, "checkOut", (async () => {
      const docRef = doc(db, "companies", companyId, "attendance", attendanceId);
      const snap = await getDoc(docRef);
      const data = snap.data()!;
      
      const checkIn = data.checkIn instanceof Timestamp ? data.checkIn.toDate() : new Date(data.checkIn);
      const checkOut = new Date();
      const totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

      const update: Record<string, unknown> = {
        checkOut: serverTimestamp(),
        totalHours,
        updatedAt: serverTimestamp(),
      };
      if (geo) {
        update.checkOutLat = geo.lat;
        update.checkOutLng = geo.lng;
        if (geo.locationId) update.checkOutLocationId = geo.locationId;
        if (geo.locationName) update.checkOutLocationName = geo.locationName;
        if (geo.distanceMeters != null) update.checkOutDistanceMeters = geo.distanceMeters;
      }

      await updateDoc(docRef, update);

      // Global status update
      const employeeRef = doc(db, "companies", companyId, "employees", employeeId);
      await updateDoc(employeeRef, {
        shiftStatus: nextStatus,
        updatedAt: serverTimestamp(),
      });

      const updatedDoc = await getDoc(docRef);
      return {
        data: { id: updatedDoc.id, ...updatedDoc.data() } as Attendance,
        message: "Checked out successfully",
      };
    })());
  },

  async getAttendance(companyId: string, employeeId: string): Promise<ApiResponse<Attendance[]>> {
    return withLogging(SERVICE_NAME, "getAttendance", (async () => {
      const attendanceRef = collection(db, "companies", companyId, "attendance");
      let q = query(attendanceRef, where("employeeId", "==", employeeId));
      
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          checkIn: data.checkIn instanceof Timestamp ? data.checkIn.toDate().toISOString() : data.checkIn,
          checkOut: data.checkOut instanceof Timestamp ? data.checkOut.toDate().toISOString() : data.checkOut,
        } as Attendance;
      });

      return {
        data: records,
        message: "Success",
      };
    })());
  },

  async getAllAttendance(companyId: string): Promise<ApiResponse<Attendance[]>> {
    return withLogging(SERVICE_NAME, "getAllAttendance", (async () => {
      const attendanceRef = collection(db, "companies", companyId, "attendance");
      
      const querySnapshot = await getDocs(attendanceRef);
      const records = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          checkIn: data.checkIn instanceof Timestamp ? data.checkIn.toDate().toISOString() : data.checkIn,
          checkOut: data.checkOut instanceof Timestamp ? data.checkOut.toDate().toISOString() : data.checkOut,
        } as Attendance;
      });

      return {
        data: records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        message: "Success",
      };
    })());
  },

  // Hiring & Deletion
  async createEmployee(companyId: string, employeeData: Omit<Employee, 'id'>): Promise<ApiResponse<Employee>> {
    return withLogging(SERVICE_NAME, "createEmployee", (async () => {
      const employeesRef = collection(db, "companies", companyId, "employees");
      const docRef = await addDoc(employeesRef, {
        ...employeeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const newDoc = await getDoc(docRef);
      return {
        data: { id: newDoc.id, ...newDoc.data() } as Employee,
        message: "Employee hired successfully",
      };
    })());
  },

  async deleteEmployee(companyId: string, employeeId: string): Promise<ApiResponse<void>> {
    return withLogging(SERVICE_NAME, "deleteEmployee", (async () => {
      const empRef = doc(db, "companies", companyId, "employees", employeeId);
      const empSnap = await getDoc(empRef);
      const empData = empSnap.exists() ? empSnap.data() : null;

      // 1. Delete employee document from company
      await deleteDoc(empRef);

      const email = empData?.email ? String(empData.email).toLowerCase().trim() : null;
      const userId = empData?.userId ? String(empData.userId).trim() : null;

      // 2. Delete user profile from Firestore users collection if userId exists
      if (userId) {
        try {
          const userDocRef = doc(db, "users", userId);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            await deleteDoc(userDocRef);
          }
        } catch (e) {
          console.warn(`[deleteEmployee] Failed to delete user doc for ${userId}:`, e);
        }
      }

      // 3. If email exists, delete matching user documents from users collection
      if (email) {
        try {
          const usersRef = collection(db, "users");
          const qUsers = query(usersRef, where("email", "==", email));
          const usersSnap = await getDocs(qUsers);
          for (const uDoc of usersSnap.docs) {
            await deleteDoc(uDoc.ref);
          }
        } catch (e) {
          console.warn(`[deleteEmployee] Failed to delete user by email ${email}:`, e);
        }

        // 4. Delete matching company invites and top-level invites
        try {
          const companyInvitesRef = collection(db, "companies", companyId, "invites");
          const qCompanyInvites = query(companyInvitesRef, where("email", "==", email));
          const compInvSnap = await getDocs(qCompanyInvites);
          for (const iDoc of compInvSnap.docs) {
            await deleteDoc(iDoc.ref);
          }
        } catch (e) {
          console.warn(`[deleteEmployee] Failed to delete company invites for ${email}:`, e);
        }

        try {
          const topInvitesRef = collection(db, "invites");
          const qTopInvites = query(topInvitesRef, where("email", "==", email));
          const topInvSnap = await getDocs(qTopInvites);
          for (const iDoc of topInvSnap.docs) {
            await deleteDoc(iDoc.ref);
          }
        } catch (e) {
          console.warn(`[deleteEmployee] Failed to delete top-level invites for ${email}:`, e);
        }
      }

      return {
        data: undefined,
        message: "Employee and Firebase user records deleted successfully",
      };
    })());
  },

  // Performance Reviews
  async getPerformanceReviews(companyId: string, employeeId: string): Promise<ApiResponse<PerformanceReview[]>> {
    return withLogging(SERVICE_NAME, "getPerformanceReviews", (async () => {
      const reviewsRef = collection(db, "companies", companyId, "performance_reviews");
      const q = query(reviewsRef, where("employeeId", "==", employeeId));
      const querySnapshot = await getDocs(q);
      
      const reviews = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
        } as PerformanceReview;
      });

      return {
        data: reviews,
        message: "Success",
      };
    })());
  },

  async createPerformanceReview(companyId: string, data: Omit<PerformanceReview, 'id'>): Promise<ApiResponse<PerformanceReview>> {
    return withLogging(SERVICE_NAME, "createPerformanceReview", (async () => {
      const reviewsRef = collection(db, "companies", companyId, "performance_reviews");
      const docRef = await addDoc(reviewsRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const newDoc = await getDoc(docRef);
      return {
        data: { id: newDoc.id, ...newDoc.data() } as PerformanceReview,
        message: "Performance review created successfully",
      };
    })());
  },

  // Assets Management
  async getAssets(companyId: string): Promise<ApiResponse<Asset[]>> {
    return withLogging(SERVICE_NAME, "getAssets", (async () => {
      const assetsRef = collection(db, "companies", companyId, "assets");
      const querySnapshot = await getDocs(assetsRef);
      
      const assets = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          assignedDate: data.assignedDate instanceof Timestamp ? data.assignedDate.toDate().toISOString() : data.assignedDate,
          returnedDate: data.returnedDate instanceof Timestamp ? data.returnedDate.toDate().toISOString() : data.returnedDate,
        } as Asset;
      });

      return {
        data: assets,
        message: "Success",
      };
    })());
  },

  async createAsset(companyId: string, data: Omit<Asset, 'id'>): Promise<ApiResponse<Asset>> {
    return withLogging(SERVICE_NAME, "createAsset", (async () => {
      const assetsRef = collection(db, "companies", companyId, "assets");
      const docRef = await addDoc(assetsRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const newDoc = await getDoc(docRef);
      return {
        data: { id: newDoc.id, ...newDoc.data() } as Asset,
        message: "Asset created successfully",
      };
    })());
  },

  async updateAsset(companyId: string, assetId: string, data: Partial<Asset>): Promise<ApiResponse<Asset>> {
    return withLogging(SERVICE_NAME, "updateAsset", (async () => {
      const docRef = doc(db, "companies", companyId, "assets", assetId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      const updatedDoc = await getDoc(docRef);
      return {
        data: { id: updatedDoc.id, ...updatedDoc.data() } as Asset,
        message: "Asset updated successfully",
      };
    })());
  },

  // Announcements
  async getAnnouncements(companyId: string): Promise<ApiResponse<Announcement[]>> {
    return withLogging(SERVICE_NAME, "getAnnouncements", (async () => {
      const annRef = collection(db, "companies", companyId, "announcements");
      const querySnapshot = await getDocs(annRef);
      
      const announcements = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        } as Announcement;
      });

      return {
        data: announcements.sort((a, b) => new Date(b.createdAt as Date | string).getTime() - new Date(a.createdAt as Date | string).getTime()),
        message: "Success",
      };
    })());
  },

  async createAnnouncement(companyId: string, data: Omit<Announcement, 'id'>): Promise<ApiResponse<Announcement>> {
    return withLogging(SERVICE_NAME, "createAnnouncement", (async () => {
      const annRef = collection(db, "companies", companyId, "announcements");
      const docRef = await addDoc(annRef, {
        ...data,
        createdAt: serverTimestamp(),
      });

      const newDoc = await getDoc(docRef);
      return {
        data: { id: newDoc.id, ...newDoc.data() } as Announcement,
        message: "Announcement created successfully",
      };
    })());
  },

  async getWorkLocations(companyId: string): Promise<ApiResponse<WorkLocation[]>> {
    return withLogging(SERVICE_NAME, "getWorkLocations", (async () => {
      const ref = collection(db, "companies", companyId, "work_locations");
      const snapshot = await getDocs(ref);
      const locations = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as WorkLocation[];
      return {
        data: locations.sort((a, b) => a.name.localeCompare(b.name)),
        message: "Success",
      };
    })());
  },

  async createWorkLocation(
    companyId: string,
    data: CreateWorkLocationDTO
  ): Promise<ApiResponse<WorkLocation>> {
    return withLogging(SERVICE_NAME, "createWorkLocation", (async () => {
      const ref = collection(db, "companies", companyId, "work_locations");
      const docRef = await addDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(docRef);
      return {
        data: { id: snap.id, ...snap.data() } as WorkLocation,
        message: "Work location created",
      };
    })());
  },

  async updateWorkLocation(
    companyId: string,
    locationId: string,
    data: Partial<CreateWorkLocationDTO>
  ): Promise<ApiResponse<WorkLocation>> {
    return withLogging(SERVICE_NAME, "updateWorkLocation", (async () => {
      const docRef = doc(db, "companies", companyId, "work_locations", locationId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(docRef);
      return {
        data: { id: snap.id, ...snap.data() } as WorkLocation,
        message: "Work location updated",
      };
    })());
  },

  async deleteWorkLocation(companyId: string, locationId: string): Promise<void> {
    return withLogging(SERVICE_NAME, "deleteWorkLocation", (async () => {
      await deleteDoc(doc(db, "companies", companyId, "work_locations", locationId));
    })());
  },
};

