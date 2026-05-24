import { db } from "./firebase";
import { collection, doc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { mockUsers } from "../mocks/data/users.data";
import { mockTasks } from "../mocks/data/tasks.data";
import { mockComments } from "../mocks/data/comments.data";
import { mockSprints } from "../mocks/data/sprints.data";
import { mockEmployees, mockLeaveRequests } from "../mocks/data/people.data";

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

    // 5. Seed Employees
    console.log(`Seeding employees for company: ${companyId}...`);
    for (const employee of mockEmployees) {
      const empRef = doc(db, "companies", companyId, "employees", employee.id);
      await setDoc(empRef, {
        ...employee,
        joiningDate: employee.joiningDate instanceof Date ? employee.joiningDate : new Date(employee.joiningDate as any),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 6. Seed Leave Requests
    console.log(`Seeding leave requests for company: ${companyId}...`);
    const allLeaveRequests = [
      ...mockLeaveRequests,
      {
        id: "leave-seed-1",
        employeeId: "emp-3",
        employeeName: "Ahmed Hassan",
        type: "vacation",
        startDate: new Date("2024-07-01"),
        endDate: new Date("2024-07-10"),
        reason: "Summer vacation",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "leave-seed-2",
        employeeId: "emp-4",
        employeeName: "Sarah Al-Farsi",
        type: "personal",
        startDate: new Date("2024-06-05"),
        endDate: new Date("2024-06-06"),
        reason: "Family emergency",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    for (const leave of allLeaveRequests) {
      const leaveRef = doc(db, "companies", companyId, "leave_requests", leave.id);
      await setDoc(leaveRef, {
        ...leave,
        startDate: leave.startDate instanceof Date ? leave.startDate : new Date(leave.startDate as any),
        endDate: leave.endDate instanceof Date ? leave.endDate : new Date(leave.endDate as any),
        createdAt: leave.createdAt instanceof Date ? leave.createdAt : new Date(leave.createdAt as any),
        updatedAt: leave.updatedAt instanceof Date ? leave.updatedAt : new Date(leave.updatedAt as any),
      });
    }

    console.log("Firestore seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding Firestore:", error);
  }
}
