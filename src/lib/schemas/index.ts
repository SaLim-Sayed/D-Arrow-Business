import { z } from "zod";

// Base schemas
export const baseUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  avatar: z.string().url().optional(),
  role: z.enum(["admin", "user", "manager"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const baseTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigneeId: z.string().nullable(),
  assignee: baseUserSchema.nullable().optional(),
  reporterId: z.string(),
  reporter: baseUserSchema.nullable().optional(),
  tags: z.array(z.string()),
  dueDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
  commentsCount: z.number(),
});

export const baseCommentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  content: z.string().min(1, "Comment content is required"),
  authorId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Form schemas
export const loginFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const taskFormSchema = baseTaskSchema.pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  assigneeId: true,
  dueDate: true,
}).extend({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

export const taskFilterSchema = z.object({
  status: z.enum(["todo", "in_progress", "in_review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
});

export const commentFormSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment too long"),
});

// API response schemas
export const userResponseSchema = baseUserSchema;
export const taskResponseSchema = baseTaskSchema.extend({
  assignee: baseUserSchema.optional(),
  creator: baseUserSchema,
  comments: z.array(baseCommentSchema).optional(),
});

export const taskListResponseSchema = z.object({
  tasks: z.array(taskResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export const commentResponseSchema = baseCommentSchema.extend({
  author: baseUserSchema,
});

// Type exports
export type User = z.infer<typeof baseUserSchema>;
export type Task = z.infer<typeof baseTaskSchema>;
export type Comment = z.infer<typeof baseCommentSchema>;
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type TaskFormData = z.infer<typeof taskFormSchema>;
export type TaskFilterData = z.infer<typeof taskFilterSchema>;
export type CommentFormData = z.infer<typeof commentFormSchema>;
export type TaskResponse = z.infer<typeof taskResponseSchema>;
export type TaskListResponse = z.infer<typeof taskListResponseSchema>;
export type CommentResponse = z.infer<typeof commentResponseSchema>;
