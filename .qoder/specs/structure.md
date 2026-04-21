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