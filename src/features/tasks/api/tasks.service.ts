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
} from "firebase/firestore";
import { db, storage, auth } from "@/lib/firebase";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import type {
  Task,
  Sprint,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskFilters,
  TaskHistoryEntry,
} from "../types/task.types";
import {
  buildCreatedHistoryEntry,
  buildHistoryFromChanges,
} from "../utils/task-history.utils";

const SERVICE_NAME = "TaskService";

export interface TaskActor {
  userId: string;
  userName?: string;
}

function mapHistoryEntry(entry: TaskHistoryEntry & { timestamp?: unknown }): TaskHistoryEntry {
  const ts = entry.timestamp as unknown;
  let timestamp = new Date().toISOString();
  if (ts instanceof Timestamp) {
    timestamp = ts.toDate().toISOString();
  } else if (typeof ts === "string") {
    timestamp = ts;
  }
  return { ...entry, timestamp };
}

function normalizeTaskType(type: unknown): Task["type"] {
  if (type === "subtask") return "subtask";
  return "task";
}

function mapTaskDoc(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    ...data,
    type: normalizeTaskType(data.type),
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt as string),
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : (data.updatedAt as string),
    dueDate:
      data.dueDate instanceof Timestamp
        ? data.dueDate.toDate().toISOString()
        : (data.dueDate as string | null),
    startDate:
      data.startDate instanceof Timestamp
        ? data.startDate.toDate().toISOString()
        : (data.startDate as string | null),
    tags: (data.tags as string[]) || [],
    attachments: (data.attachments as string[]) || [],
    timeLogs: (data.timeLogs as Task["timeLogs"]) || [],
    history: ((data.history as TaskHistoryEntry[]) || []).map(mapHistoryEntry),
  } as Task;
}

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
      
      let q = query(tasksRef);
      
      if (filters?.projectId) {
        q = query(q, where("projectId", "==", filters.projectId));
      }

      if (filters?.parentId !== undefined) {
        q = query(q, where("parentId", "==", filters.parentId));
      }

      if (filters?.sprintId !== undefined) {
        q = query(q, where("sprintId", "==", filters.sprintId));
      }
      
      q = query(q, limit(500));
      
      const querySnapshot = await getDocs(q);
      
      let tasks: Task[] = querySnapshot.docs.map((docSnap) =>
        mapTaskDoc(docSnap.id, docSnap.data() as Record<string, unknown>)
      );

      // Remaining Client-side Filtering
      if (filters?.status?.length) {
        tasks = tasks.filter(t => filters.status!.includes(t.status));
      }
      if (filters?.priority?.length) {
        tasks = tasks.filter(t => filters.priority!.includes(t.priority));
      }
      if (filters?.type?.length) {
        tasks = tasks.filter(t => filters.type!.includes(t.type));
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
      if (filters?.overdueOnly) {
        const now = new Date();
        tasks = tasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
        );
      }
      if (filters?.completedThisWeek) {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        tasks = tasks.filter(
          (t) =>
            t.status === "done" &&
            t.completedAt &&
            new Date(t.completedAt) >= weekAgo
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
        data: mapTaskDoc(docSnap.id, data as Record<string, unknown>),
        message: "Success",
      };
    })());
  },

  async createTask(
    companyId: string,
    data: CreateTaskDTO & { projectId?: string },
    actor?: TaskActor
  ): Promise<ApiResponse<Task>> {
    return withLogging(SERVICE_NAME, "createTask", (async () => {
      const tasksRef = collection(db, "companies", companyId, "tasks");
      const { attachments, tags, timeLogs, ...rest } = data;
      const initialHistory = actor?.userId
        ? [buildCreatedHistoryEntry(actor)]
        : [];

      const docRef = await addDoc(tasksRef, {
        ...rest,
        type: data.type || "task",
        parentId: data.parentId ?? null,
        sprintId: data.sprintId ?? null,
        description: data.description ?? "",
        tags: tags ?? [],
        attachments: attachments?.length ? attachments : [],
        ...(timeLogs?.length ? { timeLogs } : {}),
        history: initialHistory,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        commentsCount: 0,
      });

      const newDoc = await getDoc(docRef);

      return {
        data: mapTaskDoc(newDoc.id, newDoc.data() as Record<string, unknown>),
        message: "Task created successfully",
      };
    })());
  },

  async updateTask(
    companyId: string,
    id: string,
    data: UpdateTaskDTO,
    actor?: TaskActor
  ): Promise<ApiResponse<Task>> {
    return withLogging(SERVICE_NAME, "updateTask", (async () => {
      const docRef = doc(db, "companies", companyId, "tasks", id);
      const currentSnap = await getDoc(docRef);
      if (!currentSnap.exists()) {
        throw new Error("Task not found");
      }

      const currentData = currentSnap.data() as Record<string, unknown>;
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      const existingHistory = (currentData.history as TaskHistoryEntry[]) || [];
      const newHistory =
        actor?.userId && Object.keys(cleanData).length > 0
          ? buildHistoryFromChanges(currentData, data, actor)
          : [];

      await updateDoc(docRef, {
        ...cleanData,
        ...(newHistory.length > 0
          ? { history: [...existingHistory, ...newHistory] }
          : {}),
        updatedAt: serverTimestamp(),
      });

      const updatedDoc = await getDoc(docRef);

      return {
        data: mapTaskDoc(updatedDoc.id, updatedDoc.data() as Record<string, unknown>),
        message: "Task updated successfully",
      };
    })());
  },

  async uploadTaskAttachment(companyId: string, file: File): Promise<string> {
    return withLogging(SERVICE_NAME, "uploadTaskAttachment", (async () => {
      try {
        const ext = file.name.split(".").pop() ?? "jpg";
        const randomId = Math.random().toString(36).substring(2, 15);
        const path = `tasks/${companyId}/attachments/${randomId}.${ext}`;
        const bucket = storage.app.options.storageBucket;
        
        // Use REST API for upload to bypass SDK multipart issues
        const token = await auth.currentUser?.getIdToken();
        const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(path)}`;
        
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: file
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        const downloadToken = data.downloadTokens;
        
        if (downloadToken) {
          return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;
        } else {
          // Fallback to SDK getDownloadURL if token is missing
          const { ref, getDownloadURL } = await import("firebase/storage");
          const storageRef = ref(storage, path);
          return await getDownloadURL(storageRef);
        }
      } catch (error) {
        console.warn("Firebase Storage REST upload failed. Falling back to Base64 string.", error);
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    })());
  },

  async deleteTask(companyId: string, id: string): Promise<void> {
    return withLogging(SERVICE_NAME, "deleteTask", (async () => {
      const docRef = doc(db, "companies", companyId, "tasks", id);
      await deleteDoc(docRef);
    })());
  },

  // Sprint Management
  async getSprints(companyId: string): Promise<ApiResponse<Sprint[]>> {
    return withLogging(SERVICE_NAME, "getSprints", (async () => {
      const sprintsRef = collection(db, "companies", companyId, "sprints");
      const querySnapshot = await getDocs(sprintsRef);
      
      const sprints = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : data.startDate,
          endDate: data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : data.endDate,
        } as Sprint;
      });

      return {
        data: sprints,
        message: "Success",
      };
    })());
  },

  async createSprint(companyId: string, data: Partial<Sprint>): Promise<ApiResponse<Sprint>> {
    return withLogging(SERVICE_NAME, "createSprint", (async () => {
      const sprintsRef = collection(db, "companies", companyId, "sprints");
      const docRef = await addDoc(sprintsRef, {
        ...data,
        status: data.status || "planned",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const newDoc = await getDoc(docRef);
      const docData = newDoc.data()!;

      return {
        data: { 
          id: newDoc.id, 
          ...docData,
          createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate().toISOString() : docData.createdAt,
          updatedAt: docData.updatedAt instanceof Timestamp ? docData.updatedAt.toDate().toISOString() : docData.updatedAt,
          startDate: docData.startDate instanceof Timestamp ? docData.startDate.toDate().toISOString() : docData.startDate,
          endDate: docData.endDate instanceof Timestamp ? docData.endDate.toDate().toISOString() : docData.endDate,
        } as Sprint,
        message: "Sprint created successfully",
      };
    })());
  },

  async updateSprint(companyId: string, id: string, data: Partial<Sprint>): Promise<ApiResponse<Sprint>> {
    return withLogging(SERVICE_NAME, "updateSprint", (async () => {
      const docRef = doc(db, "companies", companyId, "sprints", id);
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      await updateDoc(docRef, {
        ...cleanData,
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
          startDate: docData.startDate instanceof Timestamp ? docData.startDate.toDate().toISOString() : docData.startDate,
          endDate: docData.endDate instanceof Timestamp ? docData.endDate.toDate().toISOString() : docData.endDate,
        } as Sprint,
        message: "Sprint updated successfully",
      };
    })());
  }
};
