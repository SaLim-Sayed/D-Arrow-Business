import { http, HttpResponse, delay } from "msw";
import { mockComments } from "../data/comments.data";
import { mockUsers } from "../data/users.data";
import { mockTasks } from "../data/tasks.data";
import type { Comment } from "@/features/tasks/types/task.types";

function enrichComment(comment: Comment): Comment {
  const author = mockUsers.find((u) => u.id === comment.authorId);
  return {
    ...comment,
    author: author
      ? { id: author.id, email: author.email, name: author.name, nameAr: author.nameAr, avatar: author.avatar, role: author.role, companyId: author.companyId }
      : undefined,
  };
}

export const commentsHandlers = [
  // GET /api/tasks/:taskId/comments
  http.get("/api/tasks/:taskId/comments", async ({ params }) => {
    await delay(200);
    const comments = mockComments
      .filter((c) => c.taskId === params.taskId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    return HttpResponse.json({
      data: comments.map(enrichComment),
      message: "Success",
    });
  }),

  // POST /api/tasks/:taskId/comments
  http.post("/api/tasks/:taskId/comments", async ({ params, request }) => {
    await delay(200);
    const body = (await request.json()) as { content: string };
    const taskId = params.taskId as string;

    const task = mockTasks.find((t) => t.id === taskId);
    if (!task) {
      return HttpResponse.json(
        { message: "Task not found", statusCode: 404 },
        { status: 404 }
      );
    }

    const newComment: Comment = {
      id: `cmt-${String(mockComments.length + 1).padStart(3, "0")}`,
      taskId,
      authorId: "usr-001",
      content: body.content,
      createdAt: new Date().toISOString(),
    };

    mockComments.push(newComment);
    task.commentsCount += 1;

    return HttpResponse.json(
      { data: enrichComment(newComment), message: "Comment added" },
      { status: 201 }
    );
  }),
];
