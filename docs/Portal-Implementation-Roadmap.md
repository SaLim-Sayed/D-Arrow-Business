# Portal Implementation Roadmap

## Phased delivery plan for Tasks | CRM | People portals

**Estimated total:** 4 phases · ~3–5 weeks (1 developer)  
**Prerequisite:** CRM module complete (✅), Tasks & People modules functional (✅)

---

## Phase 0 — Preparation (1–2 days)

### Goals

- Align team on portal boundaries
- No user-facing changes

### Tasks

| ID | Task | Output |
|----|------|--------|
| 0.1 | Review `Portal-Architecture-Plan.md` | Sign-off |
| 0.2 | Audit all routes in `router.tsx` | Route inventory table |
| 0.3 | Map sidebar items → portal | Nav matrix |
| 0.4 | Define `PORTAL_ACCESS` roles | `portal-permissions.ts` spec |
| 0.5 | Add i18n keys for portals (EN + AR) | `common.json` updates |

### Acceptance

- Documented route map
- No code changes required to ship Phase 0

---

## Phase 1 — Portal Shell (3–5 days)

### Goals

- Portal picker home page
- Portal switcher in header
- Role-based portal visibility

### Tasks

| ID | Task | Files |
|----|------|-------|
| 1.1 | Create `portal-permissions.ts` | `src/lib/portal-permissions.ts` |
| 1.2 | Create `PortalPickerPage` | `src/features/portals/pages/PortalPickerPage.tsx` |
| 1.3 | Create `PortalSwitcher` component | `src/components/layout/portal-switcher.tsx` |
| 1.4 | Add switcher to `Header` | `header.tsx` |
| 1.5 | Change `/` index from redirect → `PortalPickerPage` | `router.tsx` |
| 1.6 | Persist last portal in localStorage | `use-last-portal.ts` hook |
| 1.7 | Auto-redirect if user has 1 portal only | `PortalPickerPage` logic |
| 1.8 | i18n EN + AR for picker & switcher | `locales/*/common.json` |

### UI — Portal Picker

```
┌─────────────────────────────────────────────┐
│  Choose your workspace                      │
├─────────────┬─────────────┬─────────────────┤
│  📋 Tasks   │  🤝 CRM     │  👥 People      │
│  Delivery   │  Sales      │  HR             │
│  12 open    │  8 leads    │  3 approvals    │
└─────────────┴─────────────┴─────────────────┘
```

### Acceptance

- [ ] Login → portal picker (or single portal redirect)
- [ ] Switcher changes URL to `/tasks`, `/crm`, or `/people`
- [ ] Viewer role sees CRM only; HR admin sees all three
- [ ] Last portal restored on return to `/`

---

## Phase 2 — Tasks & People Layouts (4–6 days)

### Goals

- Mirror `CrmLayout` pattern for Tasks and People
- Remove global module sidebar; portal-scoped nav only

### Tasks — Tasks Portal

| ID | Task | Files |
|----|------|-------|
| 2.1 | `TasksLayout` + `TasksSubNav` | `features/tasks/components/` |
| 2.2 | `TasksGuard` | permissions check |
| 2.3 | Nest routes under `/tasks` layout | `router.tsx` |
| 2.4 | Redirect `/tasks/dashboard` → `/tasks` | router redirect |
| 2.5 | Enhance Tasks dashboard KPIs | `tasks-dashboard-page.tsx` |
| 2.6 | Update internal links to new paths | grep `/tasks/dashboard` |

### Tasks sub-nav

| Link | Route |
|------|-------|
| Dashboard | `/tasks` |
| List | `/tasks/list` |
| Board | `/tasks/board` |
| Sprints | `/tasks/sprints` |

### Tasks — People Portal

| ID | Task | Files |
|----|------|-------|
| 2.7 | `PeopleLayout` + `PeopleSubNav` | `features/people/components/` |
| 2.8 | `PeopleGuard` | permissions check |
| 2.9 | Nest routes under `/people` layout | `router.tsx` |
| 2.10 | Enhance People dashboard KPIs | `PeopleDashboardPage.tsx` |

### People sub-nav

| Link | Route |
|------|-------|
| Dashboard | `/people` |
| Leave | `/people/leave` |
| Approvals | `/people/approvals` |
| Timesheets | `/people/timesheets` |
| Performance | `/people/performance` |

### Sidebar refactor

| ID | Task |
|----|------|
| 2.11 | Replace global `navItems` with portal-aware sidebar OR remove sidebar from `AppLayout` and rely on each portal layout |
| 2.12 | Keep collapsed sidebar only inside portal layouts |
| 2.13 | Move `/profile`, `/seed` to header menu (admin) |

### Acceptance

- [ ] Each portal shows only its own sub-nav
- [ ] CRM unchanged functionally
- [ ] All old task/people URLs redirect or work
- [ ] Mobile: sub-nav scrolls horizontally (like CRM)

---

## Phase 3 — Permissions & QA (2–3 days)

### Goals

- Enforce portal access at layout level
- Regression test all three portals

### Tasks

| ID | Task |
|----|------|
| 3.1 | Wire `TasksGuard`, `PeopleGuard`, `CrmGuard` to `PORTAL_ACCESS` |
| 3.2 | Hide portal cards user cannot access |
| 3.3 | 403 / “Access denied” page per portal |
| 3.4 | QA matrix: roles × portals |
| 3.5 | Update `CRM-دليل-النظام.md` with portal navigation |
| 3.6 | Smoke test EN + AR RTL |

### QA matrix

| Role | Tasks | CRM | People |
|------|-------|-----|--------|
| super_admin | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ |
| manager | ✅ | ✅ | ✅ |
| employee | ✅ | ✅ (assigned) | ✅ |
| viewer | ❌ | ✅ read | ❌ |

### Acceptance

- [ ] No unauthorized portal entry via URL
- [ ] Employee CRM record scoping still works
- [ ] Build passes; no broken deep links

---

## Phase 4 — Polish & Optional (3–5 days)

### Goals

- Executive overview, code-splitting, docs

### Tasks (pick what matters)

| ID | Task | Priority |
|----|------|----------|
| 4.1 | Admin “Executive dashboard” at `/admin/overview` | Medium |
| 4.2 | Lazy-load portal route groups (`React.lazy`) | Low |
| 4.3 | Portal-specific global search | Medium |
| 4.4 | Breadcrumb component shared across portals | Low |
| 4.5 | Onboarding tooltips per portal | Low |
| 4.6 | `/projects` merged into Tasks portal or removed from sidebar | Medium |
| 4.7 | Remove `/analytics` from global nav; embed charts in dashboards | Low |

---

## Sprint Suggestion (2-week sprint)

### Sprint 1 — Shell + Tasks layout

- Phase 0 + Phase 1 + Tasks portion of Phase 2

### Sprint 2 — People layout + QA

- People portion of Phase 2 + Phase 3

### Sprint 3 — Polish

- Phase 4 items as backlog

---

## File Checklist (New Files)

```
src/lib/portal-permissions.ts
src/features/portals/pages/PortalPickerPage.tsx
src/features/portals/hooks/use-last-portal.ts
src/components/layout/portal-switcher.tsx
src/features/tasks/components/TasksLayout.tsx
src/features/tasks/components/TasksSubNav.tsx
src/features/tasks/components/TasksGuard.tsx
src/features/people/components/PeopleLayout.tsx
src/features/people/components/PeopleSubNav.tsx
src/features/people/components/PeopleGuard.tsx
```

## File Checklist (Modify)

```
src/app/router.tsx
src/components/layout/app-layout.tsx
src/components/layout/sidebar.tsx
src/components/layout/header.tsx
public/locales/en/common.json
public/locales/ar/common.json
```

---

## Definition of Done (Whole Initiative)

1. Three portals with dedicated dashboards and sub-navigation
2. Portal picker and header switcher live
3. Permissions enforced per portal
4. Backward-compatible redirects for 1 release cycle
5. Documentation updated (EN plan + AR user guide)
6. `npm run build` passes

---

*See also: `Portal-Architecture-Plan.md`*
