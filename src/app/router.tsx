import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";
import { ProfilePage } from "@/features/auth/pages/profile-page";
import { ForgotPasswordPage } from "@/features/auth/pages/forgot-password-page";
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { TasksDashboardPage } from "@/features/tasks/pages/tasks-dashboard-page";
import { TasksListPage } from "@/features/tasks/pages/tasks-list-page";
import { TasksBoardPage } from "@/features/tasks/pages/tasks-board-page";
import { TaskCreatePage } from "@/features/tasks/pages/task-create-page";
import { TaskDetailPage } from "@/features/tasks/pages/task-detail-page";
import { SprintsPage } from "@/features/tasks/pages/sprints-page";
import { CrmLayout } from "@/features/crm/components/CrmLayout";
import { CrmDashboardPage } from "@/features/crm/pages/CrmDashboardPage";
import { LeadsListPage } from "@/features/crm/pages/LeadsListPage";
import { LeadDetailPage } from "@/features/crm/pages/LeadDetailPage";
import { ContactsListPage } from "@/features/crm/pages/ContactsListPage";
import { ContactDetailPage } from "@/features/crm/pages/ContactDetailPage";
import { DealsPipelinePage } from "@/features/crm/pages/DealsPipelinePage";
import { DealDetailPage } from "@/features/crm/pages/DealDetailPage";
import { CrmTasksPage } from "@/features/crm/pages/CrmTasksPage";
import { CrmReportsPage } from "@/features/crm/pages/CrmReportsPage";
import { SeedPage } from "@/features/admin/pages/SeedPage";
import PeopleDashboardPage from "@/features/people/pages/PeopleDashboardPage";
import LeaveTrackerPage from "@/features/people/pages/LeaveTrackerPage";
import EmployeeProfilePage from "@/features/people/pages/EmployeeProfilePage";
import { ApprovalsPage } from "@/features/people/pages/ApprovalsPage";
import PerformancePage from "@/features/people/pages/PerformancePage";
import TimesheetsPage from "@/features/people/pages/TimesheetsPage";
import { NotFoundPage } from "@/components/shared/not-found-page";
import { ErrorPage } from "@/components/shared/error-page";

export const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorPage />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "reset-password",
        element: <ResetPasswordPage />,
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
            path: "crm",
            element: <CrmLayout />,
            children: [
              { index: true, element: <CrmDashboardPage /> },
              { path: "leads", element: <LeadsListPage /> },
              { path: "leads/:leadId", element: <LeadDetailPage /> },
              { path: "contacts", element: <ContactsListPage /> },
              { path: "contacts/:contactId", element: <ContactDetailPage /> },
              { path: "deals", element: <DealsPipelinePage /> },
              { path: "deals/:dealId", element: <DealDetailPage /> },
              { path: "tasks", element: <CrmTasksPage /> },
              { path: "reports", element: <CrmReportsPage /> },
            ],
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
            path: "tasks/sprints",
            element: <SprintsPage />,
          },
          {
            path: "tasks/:taskId",
            element: <TaskDetailPage />,
          },
          {
            path: "people",
            element: <PeopleDashboardPage />,
          },
          {
            path: "people/leave",
            element: <LeaveTrackerPage />,
          },
          {
            path: "people/approvals",
            element: <ApprovalsPage />,
          },
          {
            path: "people/performance",
            element: <PerformancePage />,
          },
          {
            path: "people/timesheets",
            element: <TimesheetsPage />,
          },
          {
            path: "people/:id",
            element: <EmployeeProfilePage />,
          },
          {
            path: "seed",
            element: <SeedPage />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "*",
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
