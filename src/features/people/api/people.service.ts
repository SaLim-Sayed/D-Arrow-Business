import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  query,
  where,
  serverTimestamp,
  Timestamp
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import type { ApiResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import type {
  Employee,
  LeaveRequest,
  PerformanceReview,
  Attendance,
  LeaveStatus
} from "../types/people.types";

const SERVICE_NAME = "PeopleService";

export const PeopleService = {
  // Employee Management
  async getEmployees(companyId: string): Promise<ApiResponse<Employee[]>> {
    return withLogging(SERVICE_NAME, "getEmployees", (async () => {
      const employeesRef = collection(db, "companies", companyId, "employees");
      const querySnapshot = await getDocs(employeesRef);
      
      const employees = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          joiningDate: data.joiningDate instanceof Timestamp ? data.joiningDate.toDate().toISOString() : data.joiningDate,
        } as Employee;
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
  async checkIn(companyId: string, employeeId: string): Promise<ApiResponse<Attendance>> {
    return withLogging(SERVICE_NAME, "checkIn", (async () => {
      const attendanceRef = collection(db, "companies", companyId, "attendance");
      const date = new Date().toISOString().split('T')[0];
      
      const docRef = await addDoc(attendanceRef, {
        employeeId,
        date,
        checkIn: serverTimestamp(),
        status: "present",
        createdAt: serverTimestamp(),
      });

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

  async checkOut(companyId: string, attendanceId: string, employeeId: string, nextStatus: "on-break" | "off-duty" = "off-duty"): Promise<ApiResponse<Attendance>> {
    return withLogging(SERVICE_NAME, "checkOut", (async () => {
      const docRef = doc(db, "companies", companyId, "attendance", attendanceId);
      const snap = await getDoc(docRef);
      const data = snap.data()!;
      
      const checkIn = data.checkIn instanceof Timestamp ? data.checkIn.toDate() : new Date(data.checkIn);
      const checkOut = new Date();
      const totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

      await updateDoc(docRef, {
        checkOut: serverTimestamp(),
        totalHours,
        updatedAt: serverTimestamp(),
      });

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

  // Hiring
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
  }
};

