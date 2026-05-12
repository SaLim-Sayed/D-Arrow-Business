import type { Sprint } from "@/features/tasks/types/task.types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

export let mockSprints: Sprint[] = [
  {
    id: "spr-001",
    name: "Sprint 1: Dashboard Foundation",
    startDate: daysAgo(14),
    endDate: daysAgo(1),
    status: "completed",
    goal: "Set up the core dashboard architecture and layout.",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(1),
  },
  {
    id: "spr-002",
    name: "Sprint 2: Task Management Core",
    startDate: daysAgo(0),
    endDate: daysFromNow(14),
    status: "active",
    goal: "Implement task CRUD, drag and drop board, and basic filters.",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(0),
  },
  {
    id: "spr-003",
    name: "Sprint 3: Advanced Task Features",
    startDate: daysFromNow(15),
    endDate: daysFromNow(29),
    status: "planned",
    goal: "Subtasks, dependencies, and advanced reporting.",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
];
