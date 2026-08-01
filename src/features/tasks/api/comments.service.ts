import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  getDoc,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { ApiResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import type { Comment } from "../types/task.types";
import type { User } from "@/features/auth/types/auth.types";

const SERVICE_NAME = "CommentService";

function toIso(value: unknown, fallback = new Date().toISOString()): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return fallback;
}

/**
 * Comment Service (Lite)
 * Handles task comments using Firestore Lite to reduce network overhead.
 */
export const CommentService = {
  async getComments(
    companyId: string,
    taskId: string
  ): Promise<ApiResponse<Comment[]>> {
    return withLogging(SERVICE_NAME, "getComments", (async () => {
      const commentsRef = collection(db, "companies", companyId, "tasks", taskId, "comments");
      const q = query(commentsRef, orderBy("createdAt", "asc"), limit(200));

      const querySnapshot = await getDocs(q);
      const comments: Comment[] = [];

      for (const commentDoc of querySnapshot.docs) {
        const data = commentDoc.data();
        const comment: Comment = {
          id: commentDoc.id,
          taskId,
          authorId: data.authorId,
          content: data.content,
          createdAt: toIso(data.createdAt),
          updatedAt: data.updatedAt ? toIso(data.updatedAt) : undefined,
        };

        if (comment.authorId) {
          const userDoc = await getDoc(doc(db, "users", comment.authorId));
          if (userDoc.exists()) {
            comment.author = { id: userDoc.id, ...userDoc.data() } as User;
          }
        }
        comments.push(comment);
      }

      return {
        data: comments,
        message: "Success",
      };
    })());
  },

  async addComment(
    companyId: string,
    taskId: string,
    content: string
  ): Promise<ApiResponse<Comment>> {
    return withLogging(SERVICE_NAME, "addComment", (async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("Unauthorized");

      const commentsRef = collection(db, "companies", companyId, "tasks", taskId, "comments");

      const docRef = await addDoc(commentsRef, {
        taskId,
        content,
        authorId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "companies", companyId, "tasks", taskId), {
        commentsCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      const newDoc = await getDoc(docRef);
      const data = newDoc.data()!;

      return {
        data: {
          id: newDoc.id,
          taskId,
          authorId: data.authorId,
          content: data.content,
          createdAt: toIso(data.createdAt),
          updatedAt: data.updatedAt ? toIso(data.updatedAt) : undefined,
        } as Comment,
        message: "Comment added successfully",
      };
    })());
  },

  async updateComment(
    companyId: string,
    taskId: string,
    commentId: string,
    content: string
  ): Promise<ApiResponse<Comment>> {
    return withLogging(SERVICE_NAME, "updateComment", (async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("Unauthorized");

      const commentRef = doc(
        db,
        "companies",
        companyId,
        "tasks",
        taskId,
        "comments",
        commentId
      );
      const existing = await getDoc(commentRef);
      if (!existing.exists()) throw new Error("Comment not found");

      const data = existing.data();
      if (data.authorId !== user.uid) {
        throw new Error("You can only edit your own comments");
      }

      await updateDoc(commentRef, {
        content,
        updatedAt: serverTimestamp(),
      });

      const updated = await getDoc(commentRef);
      const updatedData = updated.data()!;

      return {
        data: {
          id: updated.id,
          taskId,
          authorId: updatedData.authorId,
          content: updatedData.content,
          createdAt: toIso(updatedData.createdAt),
          updatedAt: toIso(updatedData.updatedAt),
        } as Comment,
        message: "Comment updated successfully",
      };
    })());
  },

  async deleteComment(
    companyId: string,
    taskId: string,
    commentId: string
  ): Promise<ApiResponse<null>> {
    return withLogging(SERVICE_NAME, "deleteComment", (async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("Unauthorized");

      const commentRef = doc(
        db,
        "companies",
        companyId,
        "tasks",
        taskId,
        "comments",
        commentId
      );
      const existing = await getDoc(commentRef);
      if (!existing.exists()) throw new Error("Comment not found");

      const data = existing.data();
      if (data.authorId !== user.uid) {
        throw new Error("You can only delete your own comments");
      }

      await deleteDoc(commentRef);
      await updateDoc(doc(db, "companies", companyId, "tasks", taskId), {
        commentsCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      return {
        data: null,
        message: "Comment deleted successfully",
      };
    })());
  },
};
