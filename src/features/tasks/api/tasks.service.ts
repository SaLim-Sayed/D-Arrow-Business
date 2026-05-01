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
  limit,
  serverTimestamp,
  Timestamp
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import type {
  Task,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskFilters,
} from "../types/task.types";

const SERVICE_NAME = "TaskService";

/**
 * Task Service (Lite)
 * Handles task management using Firestore Lite to reduce network overhead.
 */
export const TaskService = {
  async getTasks(
    companyId: string,
    filters?: TaskFilters & { projectId?: string }
  ): Promise<PaginatedResponse<Task>> {
    return withLogging(SERVICE_NAME, "getTasks", (async () => {
      const tasksRef = collection(db, "companies", companyId, "tasks");
      
      // Implement basic server-side filtering where possible
      // to reduce the amount of data transferred.
      let q = query(tasksRef);
      
      if (filters?.projectId) {
        q = query(q, where("projectId", "==", filters.projectId));
      }
      
      // Limit results to avoid massive data transfer
      // Increased limit to 500 for safety since we still do some client-side sorting/filtering
      q = query(q, limit(500));
      
      const querySnapshot = await getDocs(q);
      
      let tasks: Task[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate().toISOString() : data.dueDate,
          tags: data.tags || [],
        } as Task;
      });

      // Remaining Client-side Filtering
      if (filters?.status?.length) {
        tasks = tasks.filter(t => filters.status!.includes(t.status));
      }
      if (filters?.priority?.length) {
        tasks = tasks.filter(t => filters.priority!.includes(t.priority));
      }
      if (filters?.assigneeId) {
        tasks = tasks.filter(t => t.assigneeId === filters.assigneeId);
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        tasks = tasks.filter(t => 
          t.title.toLowerCase().includes(search) || 
          t.description.toLowerCase().includes(search)
        );
      }

      // Client-side Sorting
      const sortBy = filters?.sortBy || "createdAt";
      const sortOrder = filters?.sortOrder || "desc";

      tasks.sort((a: any, b: any) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      // Client-side Pagination
      const pageSize = filters?.pageSize || 10;
      const page = filters?.page || 1;
      const startIndex = (page - 1) * pageSize;
      const paginatedTasks = tasks.slice(startIndex, startIndex + pageSize);

      return {
        data: paginatedTasks,
        total: tasks.length, 
        page,
        pageSize,
        totalPages: Math.ceil(tasks.length / pageSize),
      };
    })());
  },

  async getTask(companyId: string, id: string): Promise<ApiResponse<Task>> {
    return withLogging(SERVICE_NAME, "getTask", (async () => {
      const docRef = doc(db, "companies", companyId, "tasks", id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Task not found");
      }

      const data = docSnap.data();
      return {
        data: { 
          id: docSnap.id, 
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate().toISOString() : data.dueDate,
          tags: data.tags || [],
        } as Task,
        message: "Success",
      };
    })());
  },

  async createTask(
    companyId: string,
    data: CreateTaskDTO & { projectId?: string }
  ): Promise<ApiResponse<Task>> {
    return withLogging(SERVICE_NAME, "createTask", (async () => {
      const tasksRef = collection(db, "companies", companyId, "tasks");
      const docRef = await addDoc(tasksRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        commentsCount: 0,
      });

      const newDoc = await getDoc(docRef);
      const docData = newDoc.data()!;

      return {
        data: { 
          id: newDoc.id, 
          ...docData,
          createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate().toISOString() : docData.createdAt,
          updatedAt: docData.updatedAt instanceof Timestamp ? docData.updatedAt.toDate().toISOString() : docData.updatedAt,
          dueDate: docData.dueDate instanceof Timestamp ? docData.dueDate.toDate().toISOString() : docData.dueDate,
          tags: docData.tags || [],
        } as Task,
        message: "Task created successfully",
      };
    })());
  },

  async updateTask(
    companyId: string,
    id: string,
    data: UpdateTaskDTO
  ): Promise<ApiResponse<Task>> {
    return withLogging(SERVICE_NAME, "updateTask", (async () => {
      const docRef = doc(db, "companies", companyId, "tasks", id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      const updatedDoc = await getDoc(docRef);
      const docData = updatedDoc.data()!;

      return {
        data: { 
          id: updatedDoc.id, 
          ...docData,
          createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate().toISOString() : docData.createdAt,
          updatedAt: docData.updatedAt instanceof Timestamp ? docData.updatedAt.toDate().toISOString() : docData.updatedAt,
          dueDate: docData.dueDate instanceof Timestamp ? docData.dueDate.toDate().toISOString() : docData.dueDate,
          tags: docData.tags || [],
        } as Task,
        message: "Task updated successfully",
      };
    })());
  },

  async deleteTask(companyId: string, id: string): Promise<void> {
    return withLogging(SERVICE_NAME, "deleteTask", (async () => {
      const docRef = doc(db, "companies", companyId, "tasks", id);
      await deleteDoc(docRef);
    })());
  }
};
