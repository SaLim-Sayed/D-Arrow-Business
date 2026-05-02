import { http, HttpResponse, delay } from "msw";
import { mockTasks } from "../data/tasks.data";
import { mockUsers } from "../data/users.data";
import type { Task, TaskStatus, TaskPriority } from "@/features/tasks/types/task.types";

function enrichTask(task: Task): Task {
  const assignee = task.assigneeId
    ? mockUsers.find((u) => u.id === task.assigneeId)
    : null;
  const reporter = mockUsers.find((u) => u.id === task.reporterId);
  return {
    ...task,
    assignee: assignee ? { id: assignee.id, email: assignee.email, name: assignee.name, nameAr: assignee.nameAr, avatar: assignee.avatar, role: assignee.role, companyId: assignee.companyId, companyName: assignee.companyName } : null,
    reporter: reporter ? { id: reporter.id, email: reporter.email, name: reporter.name, nameAr: reporter.nameAr, avatar: reporter.avatar, role: reporter.role, companyId: reporter.companyId, companyName: reporter.companyName } : undefined,
  };
}

export const tasksHandlers = [
  // GET /api/tasks - list with filtering, sorting, pagination
  http.get("/api/tasks", async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);

    const statusParam = url.searchParams.get("status");
    const priorityParam = url.searchParams.get("priority");
    const assigneeId = url.searchParams.get("assigneeId");
    const search = url.searchParams.get("search")?.toLowerCase();
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    let filtered = [...mockTasks];

    // Filter by status (comma-separated)
    if (statusParam) {
      const statuses = statusParam.split(",") as TaskStatus[];
      filtered = filtered.filter((t) => statuses.includes(t.status));
    }

    // Filter by priority (comma-separated)
    if (priorityParam) {
      const priorities = priorityParam.split(",") as TaskPriority[];
      filtered = filtered.filter((t) => priorities.includes(t.priority));
    }

    // Filter by assignee
    if (assigneeId) {
      filtered = filtered.filter((t) => t.assigneeId === assigneeId);
    }

    // Search
    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof Task];
      const bVal = b[sortBy as keyof Task];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortOrder === "asc" ? cmp : -cmp;
    });

    // Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      data: paged.map(enrichTask),
      total,
      page,
      pageSize,
      totalPages,
    });
  }),

  // GET /api/tasks/:id
  http.get("/api/tasks/:id", async ({ params }) => {
    await delay(200);
    const task = mockTasks.find((t) => t.id === params.id);

    if (!task) {
      return HttpResponse.json(
        { message: "Task not found", statusCode: 404 },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      data: enrichTask(task),
      message: "Success",
    });
  }),

  // POST /api/tasks
  http.post("/api/tasks", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Partial<Task>;

    const newTask: Task = {
      id: `task-${String(mockTasks.length + 1).padStart(3, "0")}`,
      title: body.title || "Untitled",
      description: body.description || "",
      status: body.status || "todo",
      priority: body.priority || "medium",
      assigneeId: body.assigneeId || null,
      reporterId: "usr-001",
      tags: body.tags || [],
      dueDate: body.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      commentsCount: 0,
    };

    mockTasks.unshift(newTask);

    return HttpResponse.json(
      { data: enrichTask(newTask), message: "Task created" },
      { status: 201 }
    );
  }),

  // PUT /api/tasks/:id
  http.put("/api/tasks/:id", async ({ params, request }) => {
    await delay(200);
    const body = (await request.json()) as Partial<Task>;
    const index = mockTasks.findIndex((t) => t.id === params.id);

    if (index === -1) {
      return HttpResponse.json(
        { message: "Task not found", statusCode: 404 },
        { status: 404 }
      );
    }

    const updated: Task = {
      ...mockTasks[index],
      ...body,
      updatedAt: new Date().toISOString(),
      completedAt:
        body.status === "done" && mockTasks[index].status !== "done"
          ? new Date().toISOString()
          : body.status !== "done"
          ? null
          : mockTasks[index].completedAt,
    };

    mockTasks[index] = updated;

    return HttpResponse.json({
      data: enrichTask(updated),
      message: "Task updated",
    });
  }),

  // DELETE /api/tasks/:id
  http.delete("/api/tasks/:id", async ({ params }) => {
    await delay(200);
    const index = mockTasks.findIndex((t) => t.id === params.id);

    if (index === -1) {
      return HttpResponse.json(
        { message: "Task not found", statusCode: 404 },
        { status: 404 }
      );
    }

    mockTasks.splice(index, 1);

    return new HttpResponse(null, { status: 204 });
  }),
];
