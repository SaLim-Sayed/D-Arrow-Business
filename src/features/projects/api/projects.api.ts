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
import type { Project, CreateProjectDTO, UpdateProjectDTO } from "../types/projects.types";

export async function getProjects(companyId: string): Promise<ApiResponse<Project[]>> {
  const projectsRef = collection(db, "companies", companyId, "projects");
  const q = query(projectsRef, orderBy("createdAt", "desc"));
  
  const querySnapshot = await getDocs(q);
  const projects: Project[] = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Project));

  return {
    data: projects,
    message: "Success",
  };
}

export async function createProject(companyId: string, data: CreateProjectDTO): Promise<ApiResponse<Project>> {
  const projectsRef = collection(db, "companies", companyId, "projects");
  
  const docRef = await addDoc(projectsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const newDoc = await getDoc(docRef);

  return {
    data: { id: newDoc.id, ...newDoc.data() } as Project,
    message: "Project created successfully",
  };
}

export async function updateProject(companyId: string, projectId: string, data: UpdateProjectDTO): Promise<ApiResponse<Project>> {
  const projectRef = doc(db, "companies", companyId, "projects", projectId);
  
  await updateDoc(projectRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  const updatedDoc = await getDoc(projectRef);

  return {
    data: { id: updatedDoc.id, ...updatedDoc.data() } as Project,
    message: "Project updated successfully",
  };
}

export async function deleteProject(companyId: string, projectId: string): Promise<void> {
  const projectRef = doc(db, "companies", companyId, "projects", projectId);
  await deleteDoc(projectRef);
}
