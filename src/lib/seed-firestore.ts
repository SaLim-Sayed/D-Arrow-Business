import { db } from "./firebase";
import { collection, doc, setDoc, addDoc, serverTimestamp } from "firebase/firestore/lite";
import { mockUsers } from "../mocks/data/users.data";
import { mockTasks } from "../mocks/data/tasks.data";
import { mockComments } from "../mocks/data/comments.data";
import { mockSprints } from "../mocks/data/sprints.data";

export async function seedFirestore() {
  console.log("Starting Firestore seeding...");

  try {
    // 1. Seed Users
    console.log("Seeding users...");
    for (const user of mockUsers) {
      const { password, ...safeUser } = user;
      await setDoc(doc(db, "users", user.id), {
        ...safeUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 2. Seed Company Document (Crucial for REST runQuery on sub-collections)
    const companyId = "d-arrow";
    console.log(`Seeding company document: ${companyId}...`);
    await setDoc(doc(db, "companies", companyId), {
      name: "D-Arrow Business",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 3. Seed Tasks
    console.log(`Seeding tasks for company: ${companyId}...`);
    for (const task of mockTasks) {
      const taskRef = doc(db, "companies", companyId, "tasks", task.id);
      await setDoc(taskRef, {
        ...task,
        companyId,
        createdAt: task.createdAt ? new Date(task.createdAt) : serverTimestamp(),
        updatedAt: task.updatedAt ? new Date(task.updatedAt) : serverTimestamp(),
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
      });

      // 3. Seed Comments for this task
      const taskComments = mockComments.filter(c => c.taskId === task.id);
      if (taskComments.length > 0) {
        console.log(`Seeding ${taskComments.length} comments for task ${task.id}...`);
        const commentsRef = collection(db, "companies", companyId, "tasks", task.id, "comments");
        for (const comment of taskComments) {
          await addDoc(commentsRef, {
            ...comment,
            createdAt: comment.createdAt ? new Date(comment.createdAt) : serverTimestamp(),
            updatedAt: (comment as any).updatedAt ? new Date((comment as any).updatedAt) : serverTimestamp(),
          });
        }
      }
    }

    // 4. Seed Sprints
    console.log(`Seeding sprints for company: ${companyId}...`);
    for (const sprint of mockSprints) {
      const sprintRef = doc(db, "companies", companyId, "sprints", sprint.id);
      await setDoc(sprintRef, {
        ...sprint,
        createdAt: sprint.createdAt ? new Date(sprint.createdAt) : serverTimestamp(),
        updatedAt: sprint.updatedAt ? new Date(sprint.updatedAt) : serverTimestamp(),
        startDate: new Date(sprint.startDate),
        endDate: new Date(sprint.endDate),
      });
    }

    console.log("Firestore seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding Firestore:", error);
  }
}
