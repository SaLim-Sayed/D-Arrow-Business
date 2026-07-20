export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const ENABLE_MOCKS = import.meta.env.VITE_ENABLE_MOCKS === "true";

export const STORAGE_KEYS = {
  THEME: "d-arrow-theme",
  LAYOUT: "d-arrow-layout",
  LANGUAGE: "d-arrow-lang",
  REFRESH_TOKEN: "d-arrow-refresh-token",
  AUTH_STORE: "d-arrow-auth-store",
  TASKS_STORE: "d-arrow-tasks-store",
  LAST_PORTAL: "d-arrow-last-portal",
  // Caches the last-applied company brand CSS variables so a page refresh can
  // reapply them instantly (see index.html's inline script), before the
  // Firestore company-profile fetch resolves. This exact string is also
  // hardcoded in index.html's inline script (which can't import this module,
  // since it must run before any bundled JS) — keep both in sync if changed.
  BRAND_THEME_VARS: "d-arrow-brand-theme-vars",
} as const;

export const QUERY_KEYS = {
  tasks: {
    all: ["tasks"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["tasks", "list", filters] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
    comments: (taskId: string) => ["tasks", taskId, "comments"] as const,
  },
  users: {
    all: ["users"] as const,
  },
  crm: {
    all: ["crm"] as const,
    leads: (companyId: string) => ["crm", companyId, "leads"] as const,
    lead: (id: string) => ["crm", "lead", id] as const,
    contacts: (companyId: string) => ["crm", companyId, "contacts"] as const,
    deals: (companyId: string) => ["crm", companyId, "deals"] as const,
    crmTasks: (companyId: string) => ["crm", companyId, "crm_tasks"] as const,
    activities: (companyId: string) => ["crm", companyId, "activities"] as const,
    notes: (companyId: string) => ["crm", companyId, "notes"] as const,
    quotations: (companyId: string) => ["crm", companyId, "quotations"] as const,
    quotation: (id: string) => ["crm", "quotation", id] as const,
  },
  people: {
    all: ["people"] as const,
    employees: (companyId: string) => ["people", companyId, "employees"] as const,
    leaveRequests: (companyId: string) => ["people", companyId, "leave-requests"] as const,
    performanceReviews: (employeeId: string) => ["people", "reviews", employeeId] as const,
    assets: (companyId: string) => ["people", companyId, "assets"] as const,
    announcements: (companyId: string) => ["people", companyId, "announcements"] as const,
  },
  company: {
    profile: (companyId: string) => ["company", companyId, "profile"] as const,
    prices: (companyId: string) => ["company", companyId, "prices"] as const,
  },
} as const;

export const TASK_STATUSES = ["todo", "in_progress", "in_review", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
