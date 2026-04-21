import { authHandlers } from "./auth.handlers";
import { tasksHandlers } from "./tasks.handlers";
import { commentsHandlers } from "./comments.handlers";

export const handlers = [
  ...authHandlers,
  ...tasksHandlers,
  ...commentsHandlers,
];
