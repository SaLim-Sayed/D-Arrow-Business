import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
  Task,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskFilters,
} from "../types/task.types";

// const TASKS_COLLECTION = "tasks";

export async function getTasks(
  companyId: string,
  filters?: TaskFilters & { projectId?: string }
): Promise<PaginatedResponse<Task>> {
  const tasksRef = collection(db, "companies", companyId, "tasks");
  
  // To avoid complex composite index requirements during development,
  // we'll fetch all tasks for the company and filter/sort them on the client side.
  // In a large-scale production app, you would create composite indexes in Firebase
  // and use server-side filtering/sorting for performance.
  const querySnapshot = await getDocs(tasksRef);
  
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

  // Client-side Filtering
  if (filters?.projectId) {
    tasks = tasks.filter(t => (t as any).projectId === filters.projectId);
  }
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
}

export async function getTask(companyId: string, id: string): Promise<ApiResponse<Task>> {
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
}

export async function createTask(
  companyId: string,
  data: CreateTaskDTO & { projectId?: string }
): Promise<ApiResponse<Task>> {
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
}

export async function updateTask(
  companyId: string,
  id: string,
  data: UpdateTaskDTO
): Promise<ApiResponse<Task>> {
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
}

export async function deleteTask(companyId: string, id: string): Promise<void> {
  const docRef = doc(db, "companies", companyId, "tasks", id);
  await deleteDoc(docRef);
}
