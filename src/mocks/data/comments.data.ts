import type { Comment } from "@/features/tasks/types/task.types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export let mockComments: Comment[] = [
  { id: "cmt-001", taskId: "task-001", authorId: "usr-001", content: "Let's use a card-based layout for the dashboard. Make sure to include KPI widgets at the top.", createdAt: daysAgo(8) },
  { id: "cmt-002", taskId: "task-001", authorId: "usr-002", content: "I've started with the wireframes. Will share the Figma link by tomorrow.", createdAt: daysAgo(7) },
  { id: "cmt-003", taskId: "task-001", authorId: "usr-001", content: "Looks great! One suggestion — add a quick-actions section below the stats.", createdAt: daysAgo(5) },
  { id: "cmt-004", taskId: "task-002", authorId: "usr-003", content: "JWT implementation is done. Using RS256 for signing.", createdAt: daysAgo(10) },
  { id: "cmt-005", taskId: "task-002", authorId: "usr-001", content: "Great, please also add rate limiting on the login endpoint.", createdAt: daysAgo(9) },
  { id: "cmt-006", taskId: "task-002", authorId: "usr-003", content: "Rate limiting added. 5 attempts per minute per IP.", createdAt: daysAgo(7) },
  { id: "cmt-007", taskId: "task-002", authorId: "usr-005", content: "Reviewed the implementation. LGTM, ready for production.", createdAt: daysAgo(3) },
  { id: "cmt-008", taskId: "task-002", authorId: "usr-001", content: "Deployed to production. Everything working as expected.", createdAt: daysAgo(2) },
  { id: "cmt-009", taskId: "task-003", authorId: "usr-004", content: "I'll look into this. Seems like a z-index issue with the overlay.", createdAt: daysAgo(4) },
  { id: "cmt-010", taskId: "task-004", authorId: "usr-005", content: "Pipeline is set up with build, test, and deploy stages. Need someone to review.", createdAt: daysAgo(3) },
  { id: "cmt-011", taskId: "task-004", authorId: "usr-001", content: "Reviewing now. Let's add a staging deployment step.", createdAt: daysAgo(2) },
  { id: "cmt-012", taskId: "task-006", authorId: "usr-005", content: "Found 3 queries that can be optimized with composite indexes.", createdAt: daysAgo(5) },
  { id: "cmt-013", taskId: "task-006", authorId: "usr-001", content: "Can you share the query plan analysis?", createdAt: daysAgo(4) },
  { id: "cmt-014", taskId: "task-006", authorId: "usr-005", content: "Query plan shared in the #backend channel. Average improvement: 60% faster.", createdAt: daysAgo(3) },
  { id: "cmt-015", taskId: "task-006", authorId: "usr-003", content: "Nice work! Should we also add connection pooling?", createdAt: daysAgo(2) },
  { id: "cmt-016", taskId: "task-010", authorId: "usr-001", content: "Running OWASP ZAP scan on staging environment.", createdAt: daysAgo(10) },
  { id: "cmt-017", taskId: "task-010", authorId: "usr-005", content: "Found 2 medium-severity XSS vectors. Working on patches.", createdAt: daysAgo(7) },
  { id: "cmt-018", taskId: "task-010", authorId: "usr-001", content: "Patches applied. Re-running the scan.", createdAt: daysAgo(5) },
  { id: "cmt-019", taskId: "task-010", authorId: "usr-005", content: "Clean scan results. All issues resolved.", createdAt: daysAgo(3) },
  { id: "cmt-020", taskId: "task-010", authorId: "usr-001", content: "Generating the final audit report.", createdAt: daysAgo(2) },
  { id: "cmt-021", taskId: "task-010", authorId: "usr-002", content: "Report looks comprehensive. Let's schedule a review meeting.", createdAt: daysAgo(1) },
];
