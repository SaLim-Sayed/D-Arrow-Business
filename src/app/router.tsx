import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";
import { ProfilePage } from "@/features/auth/pages/profile-page";
import { ForgotPasswordPage } from "@/features/auth/pages/forgot-password-page";
import { ResetPasswordPage } from "@/features/auth/pages/reset-password-page";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { PortalPickerPage } from "@/features/portals/pages/PortalPickerPage";
import { TasksLayout } from "@/features/tasks/components/TasksLayout";
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
import { QuotationPage } from "@/features/crm/pages/QuotationPage";
import { PeopleLayout } from "@/features/people/components/PeopleLayout";
import { SeedPage } from "@/features/admin/pages/SeedPage";
import PeopleDashboardPage from "@/features/people/pages/PeopleDashboardPage";
import LeaveTrackerPage from "@/features/people/pages/LeaveTrackerPage";
import EmployeeProfilePage from "@/features/people/pages/EmployeeProfilePage";
import { ApprovalsPage } from "@/features/people/pages/ApprovalsPage";
import PerformancePage from "@/features/people/pages/PerformancePage";
import TimesheetsPage from "@/features/people/pages/TimesheetsPage";
import { SettingsLayout } from "@/features/companies/components/SettingsLayout";
import { CompanySettingsPage } from "@/features/companies/pages/CompanySettingsPage";
import { PricingPage } from "@/features/companies/pages/PricingPage";
import { RolesPermissionsPage } from "@/features/companies/pages/RolesPermissionsPage";
import { TeamMembersPage } from "@/features/companies/pages/TeamMembersPage";
import { NotFoundPage } from "@/components/shared/not-found-page";
import { ErrorPage } from "@/components/shared/error-page";

// Billing Imports
import { BillingLayout } from "@/features/billing/components/BillingLayout";
import BillingDashboardPage from "@/features/billing/pages/BillingDashboardPage";
import SettingsPage from "@/features/billing/pages/SettingsPage";
import ProductsPage from "@/features/billing/pages/ProductsPage";
import ChartOfAccountsPage from "@/features/billing/pages/ChartOfAccountsPage";
import ManualJournalsPage from "@/features/billing/pages/ManualJournalsPage";
import InvoicesPage from "@/features/billing/pages/InvoicesPage";
import CreateInvoicePage from "@/features/billing/pages/CreateInvoicePage";
import InvoiceDetailPage from "@/features/billing/pages/InvoiceDetailPage";
import BillsPage from "@/features/billing/pages/BillsPage";
import ReportsPage from "@/features/billing/pages/ReportsPage";

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
            element: <PortalPickerPage />,
          },
          {
            path: "tasks",
            element: <TasksLayout />,
            children: [
              { index: true, element: <TasksDashboardPage /> },
              { path: "list", element: <TasksListPage /> },
              { path: "board", element: <TasksBoardPage /> },
              { path: "sprints", element: <SprintsPage /> },
              { path: "new", element: <TaskCreatePage /> },
              { path: ":taskId", element: <TaskDetailPage /> },
            ],
          },
          {
            path: "tasks/dashboard",
            element: <Navigate to="/tasks" replace />,
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
              { path: "quotations", element: <QuotationPage /> },
              { path: "reports", element: <CrmReportsPage /> },
            ],
          },
          {
            path: "people",
            element: <PeopleLayout />,
            children: [
              { index: true, element: <PeopleDashboardPage /> },
              { path: "leave", element: <LeaveTrackerPage /> },
              { path: "approvals", element: <ApprovalsPage /> },
              { path: "performance", element: <PerformancePage /> },
              { path: "timesheets", element: <TimesheetsPage /> },
              { path: ":id", element: <EmployeeProfilePage /> },
            ],
          },
          {
            path: "settings",
            element: <SettingsLayout />,
            children: [
              { index: true, element: <Navigate to="/settings/company" replace /> },
              { path: "company", element: <CompanySettingsPage /> },
              { path: "pricing", element: <PricingPage /> },
              { path: "team", element: <TeamMembersPage /> },
              { path: "roles", element: <RolesPermissionsPage /> },
            ],
          },
          {
            path: "billing",
            element: <BillingLayout />,
            children: [
              { index: true, element: <BillingDashboardPage /> },
              { path: "reports", element: <ReportsPage /> },
              { path: "invoices", element: <InvoicesPage /> },
              { path: "invoices/new", element: <CreateInvoicePage /> },
              { path: "invoices/:id/edit", element: <CreateInvoicePage /> },
              { path: "invoices/:id", element: <InvoiceDetailPage /> },
              { path: "bills", element: <BillsPage /> },
              { path: "accounts", element: <ChartOfAccountsPage /> },
              { path: "journals", element: <ManualJournalsPage /> },
              { path: "products", element: <ProductsPage /> },
              { path: "settings", element: <SettingsPage /> },
            ],
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
