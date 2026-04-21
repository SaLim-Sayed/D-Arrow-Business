import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/pages/login-page";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { TasksDashboardPage } from "@/features/tasks/pages/tasks-dashboard-page";
import { TasksListPage } from "@/features/tasks/pages/tasks-list-page";
import { TasksBoardPage } from "@/features/tasks/pages/tasks-board-page";
import { TaskCreatePage } from "@/features/tasks/pages/task-create-page";
import { TaskDetailPage } from "@/features/tasks/pages/task-detail-page";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/tasks/dashboard" replace />,
      },
      {
        path: "tasks/dashboard",
        element: <TasksDashboardPage />,
      },
      {
        path: "tasks/list",
        element: <TasksListPage />,
      },
      {
        path: "tasks/board",
        element: <TasksBoardPage />,
      },
      {
        path: "tasks/new",
        element: <TaskCreatePage />,
      },
      {
        path: "tasks/:taskId",
        element: <TaskDetailPage />,
      },
    ],
  },
]);
