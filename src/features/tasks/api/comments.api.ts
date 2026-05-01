import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  getDoc
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { ApiResponse } from "@/types/api.types";
import type { Comment } from "../types/task.types";
import type { User } from "@/features/auth/types/auth.types";

export async function getComments(
  companyId: string,
  taskId: string
): Promise<ApiResponse<Comment[]>> {
  const commentsRef = collection(db, "companies", companyId, "tasks", taskId, "comments");
  const q = query(commentsRef, orderBy("createdAt", "asc"));
  
  const querySnapshot = await getDocs(q);
  const comments: Comment[] = [];

  for (const commentDoc of querySnapshot.docs) {
    const data = commentDoc.data();
    const comment: Comment = {
      id: commentDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    } as Comment;

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
}

export async function addComment(
  companyId: string,
  taskId: string,
  content: string
): Promise<ApiResponse<Comment>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthorized");

  const commentsRef = collection(db, "companies", companyId, "tasks", taskId, "comments");
  
  const docRef = await addDoc(commentsRef, {
    content,
    authorId: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const newDoc = await getDoc(docRef);
  const data = newDoc.data()!;

  return {
    data: { 
      id: newDoc.id, 
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    } as Comment,
    message: "Comment added successfully",
  };
}
