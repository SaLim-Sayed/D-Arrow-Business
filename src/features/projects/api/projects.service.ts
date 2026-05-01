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
import type { Project, CreateProjectDTO, UpdateProjectDTO } from "../types/projects.types";

const SERVICE_NAME = "ProjectService";

/**
 * Project Service (Lite)
 * Handles project management using Firestore Lite to reduce network overhead.
 */
export const ProjectService = {
  async getProjects(companyId: string): Promise<ApiResponse<Project[]>> {
    return withLogging(SERVICE_NAME, "getProjects", (async () => {
      const projectsRef = collection(db, "companies", companyId, "projects");
      const q = query(projectsRef, orderBy("createdAt", "desc"), limit(100));
      
      const querySnapshot = await getDocs(q);
      const projects: Project[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));

      return {
        data: projects,
        message: "Success",
      };
    })());
  },

  async createProject(companyId: string, data: CreateProjectDTO): Promise<ApiResponse<Project>> {
    return withLogging(SERVICE_NAME, "createProject", (async () => {
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
    })());
  },

  async updateProject(companyId: string, projectId: string, data: UpdateProjectDTO): Promise<ApiResponse<Project>> {
    return withLogging(SERVICE_NAME, "updateProject", (async () => {
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
    })());
  },

  async deleteProject(companyId: string, projectId: string): Promise<void> {
    return withLogging(SERVICE_NAME, "deleteProject", (async () => {
      const projectRef = doc(db, "companies", companyId, "projects", projectId);
      await deleteDoc(projectRef);
    })());
  }
};
