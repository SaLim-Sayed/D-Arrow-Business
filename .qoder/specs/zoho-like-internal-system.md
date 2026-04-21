# D-Arrow Business - Task Management System

## Context
Build a Zoho-like internal business system starting with a **Task Management** module. The project is greenfield (empty directory). The app must support **Arabic (RTL) + English (LTR)** with i18n, use a **real API-ready** service layer with MSW mocking, and include **JWT-ready auth** with protected routes.

## Stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- React Router v6 (data router)
- Zustand (client state) + TanStack Query (server state)
- Axios, react-hook-form + zod, react-i18next
- MSW v2 for API mocking
- recharts for dashboard charts
- @hello-pangea/dnd for kanban drag-and-drop
- @tanstack/react-table for data tables

## Folder Structure
```
src/
  app/            App.tsx, providers.tsx, router.tsx
  components/
    ui/           shadcn/ui primitives
    layout/       app-layout, sidebar, header, language-switcher, theme-toggle, user-menu
    shared/       data-table, badges, date-picker, confirm-dialog, page-header, empty-state
  features/
    auth/
      api/        auth.api.ts
      components/ login-form, protected-route
      context/    auth-context.tsx (React Context, not Zustand)
      pages/      login-page
      types/      auth.types.ts
    tasks/
      api/        tasks.api.ts, comments.api.ts
      components/ task-form, task-card, task-row, task-filters, task-comments, task-activity,
                  task-stats-cards, task-chart, kanban-board, kanban-column
      hooks/      use-tasks, use-task-mutations, use-comments
      pages/      dashboard, list, board, detail, create
      store/      tasks-ui.store.ts (view mode, filters, sort)
      types/      task.types.ts
  lib/            api-client, query-client, i18n, utils, constants
  stores/         theme.store.ts, layout.store.ts
  types/          api.types.ts, global.d.ts
  mocks/
    handlers/     auth, tasks, comments handlers
    data/         users, tasks, comments seed data
    browser.ts    MSW setupWorker
  styles/         globals.css
  main.tsx
public/
  locales/
    en/           common.json, auth.json, tasks.json
    ar/           common.json, auth.json, tasks.json
```

## Routes
```
/login                 LoginPage (public)
/ (AppLayout)          Protected, sidebar + header shell
  /tasks/dashboard     Stats, charts, recent tasks
  /tasks/list          Filterable data table
  /tasks/board         Kanban with drag-and-drop
  /tasks/new           Create task form
  /tasks/:taskId       Task detail + comments
```

## Key Architectural Decisions

**State split**: Zustand for UI state (theme, sidebar, filters). TanStack Query for all server data (tasks, users, comments).

**Auth**: React Context (not Zustand) - `useAuth()` hook provides user/token/login/logout. Axios interceptor attaches Bearer token. 401 triggers refresh attempt then logout.

**API layer**: Typed functions over shared Axios instance. MSW handlers mirror the real API contract. Toggle via `VITE_ENABLE_MOCKS` env var.

**i18n/RTL**: `react-i18next` with namespace-per-feature JSON files. Language change sets `dir` and `lang` on `<html>`. Use Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`) throughout.

**Dark mode**: Tailwind `darkMode: 'class'`, shadcn/ui CSS variables, Zustand store persisted to localStorage.

## Task Types
```
TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
```

## Implementation Order

### Phase 1: Foundation
1. Scaffold Vite + React + TS project
2. Install all dependencies
3. Configure Tailwind + shadcn/ui + CSS variables
4. Set up i18n (react-i18next + translation files)
5. Create lib files (api-client, query-client, utils, constants)
6. Create theme + layout Zustand stores

### Phase 2: Auth
7. Define auth types + API types
8. Set up MSW (browser worker, auth handlers, user seed data)
9. Build auth API + auth context
10. Build login page + protected route
11. Wire up router + providers + App.tsx + main.tsx

### Phase 3: Layout Shell
12. Build sidebar (collapsible, RTL-aware, responsive)
13. Build header (breadcrumbs, search, language switcher, theme toggle, user menu)
14. Build app-layout wrapping sidebar + header + Outlet

### Phase 4: Tasks Data Layer
15. Define task types
16. Create task + comment seed data
17. Build MSW task/comment handlers (full CRUD with filtering/pagination)
18. Build task/comment API functions
19. Build TanStack Query hooks (queries + mutations with optimistic updates)
20. Build tasks UI Zustand store

### Phase 5: Tasks UI
21. Build shared components (badges, data-table, date-picker, etc.)
22. Build task filters component
23. Build dashboard page (stat cards + charts + recent tasks)
24. Build task list page (data table with sorting/filtering/pagination)
25. Build task form (react-hook-form + zod)
26. Build task create page
27. Build task detail page + comments
28. Build kanban board (columns + cards + drag-and-drop)

### Phase 6: Polish
29. RTL verification for all layouts
30. Loading skeletons + error states
31. Responsive design (mobile sidebar, stacked layouts)
32. Accessibility pass (keyboard nav, ARIA, focus)

## Verification
1. `npm run dev` - app starts without errors
2. Login with mock credentials - redirects to dashboard
3. Dashboard shows stats and charts with mock data
4. Task list displays with filtering, sorting, pagination
5. Create a new task - appears in list
6. Kanban board shows tasks in columns, drag-and-drop updates status
7. Task detail page shows full info + comments
8. Switch language to Arabic - entire UI flips to RTL
9. Toggle dark mode - all components adapt
10. Collapse sidebar - layout adjusts properly
11. Test on mobile viewport - responsive behavior works
