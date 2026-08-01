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
      ? { id: author.id, email: author.email, name: author.name, nameAr: author.nameAr, avatar: author.avatar, role: author.role, companyId: author.companyId, companyName: author.companyName }
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

    const now = new Date().toISOString();
    const newComment: Comment = {
      id: `cmt-${String(mockComments.length + 1).padStart(3, "0")}`,
      taskId,
      authorId: "usr-001",
      content: body.content,
      createdAt: now,
      updatedAt: now,
    };

    mockComments.push(newComment);
    task.commentsCount += 1;

    return HttpResponse.json(
      { data: enrichComment(newComment), message: "Comment added" },
      { status: 201 }
    );
  }),

  // PATCH /api/tasks/:taskId/comments/:commentId
  http.patch("/api/tasks/:taskId/comments/:commentId", async ({ params, request }) => {
    await delay(200);
    const body = (await request.json()) as { content: string };
    const comment = mockComments.find((c) => c.id === params.commentId);

    if (!comment || comment.taskId !== params.taskId) {
      return HttpResponse.json(
        { message: "Comment not found", statusCode: 404 },
        { status: 404 }
      );
    }

    comment.content = body.content;
    comment.updatedAt = new Date().toISOString();

    return HttpResponse.json({
      data: enrichComment(comment),
      message: "Comment updated",
    });
  }),

  // DELETE /api/tasks/:taskId/comments/:commentId
  http.delete("/api/tasks/:taskId/comments/:commentId", async ({ params }) => {
    await delay(200);
    const index = mockComments.findIndex((c) => c.id === params.commentId);

    if (index === -1 || mockComments[index].taskId !== params.taskId) {
      return HttpResponse.json(
        { message: "Comment not found", statusCode: 404 },
        { status: 404 }
      );
    }

    mockComments.splice(index, 1);
    const task = mockTasks.find((t) => t.id === params.taskId);
    if (task && task.commentsCount > 0) {
      task.commentsCount -= 1;
    }

    return HttpResponse.json({
      data: null,
      message: "Comment deleted",
    });
  }),
];
