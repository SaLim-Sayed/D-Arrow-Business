export type ProjectStatus = "active" | "completed" | "on_hold" | "cancelled";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  members: string[]; // array of user IDs
  createdBy: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateProjectDTO = Omit<Project, "id" | "createdAt" | "updatedAt">;
export type UpdateProjectDTO = Partial<CreateProjectDTO>;
