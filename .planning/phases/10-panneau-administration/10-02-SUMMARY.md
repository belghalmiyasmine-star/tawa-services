---
phase: 10-panneau-administration
plan: "02"
subsystem: admin-dashboard-users
tags: [admin, dashboard, stats, kpi, users, data-table, shadcn, server-actions, i18n]
dependency_graph:
  requires:
    - 10-01 (admin server actions: getAdminStatsAction, getAdminUsersAction, banUserAction, etc.)
  provides:
    - Admin dashboard with real stats and KPI cards with trend arrows
    - DashboardStatsCards component with current vs previous month comparison
    - DashboardCharts placeholder component linking to /admin/analytics
    - UsersDataTable with search, role/status filters, pagination via URL params
    - UserActionsDropdown with ban/unban/activate/deactivate/delete + AlertDialog confirmations
    - UserDetailActions for full-width buttons on user detail page
    - /admin/users page with paginated server-side data
    - /admin/users/[id] user detail page
  affects:
    - src/app/[locale]/(admin)/admin/page.tsx
    - src/app/[locale]/(admin)/admin/users/page.tsx
    - src/app/[locale]/(admin)/admin/users/[id]/page.tsx
    - src/features/admin/actions/admin-queries.ts
    - src/features/admin/components/
tech_stack:
  added: []
  patterns:
    - Server component fetches data, passes to client component via props
    - URL searchParams as filter/pagination state — server re-renders on navigation
    - useCallback + URLSearchParams for URL param updates in client table
    - 300ms setTimeout debounce via useRef for search input
    - AlertDialog confirmation before destructive actions
    - router.refresh() after server actions to reload server data
key_files:
  created:
    - src/features/admin/components/DashboardStatsCards.tsx (stats cards with trend arrows)
    - src/features/admin/components/DashboardCharts.tsx (chart placeholder linking to analytics)
    - src/features/admin/components/UsersDataTable.tsx (data table with search/filter/pagination)
    - src/features/admin/components/UserActionsDropdown.tsx (dropdown with all user actions)
    - src/features/admin/components/UserDetailActions.tsx (full-width action buttons)
    - src/app/[locale]/(admin)/admin/users/[id]/page.tsx (user detail page)
  modified:
    - src/app/[locale]/(admin)/admin/page.tsx (rewritten with real stats)
    - src/app/[locale]/(admin)/admin/users/page.tsx (rewritten with data table)
    - src/features/admin/actions/admin-queries.ts (added previousMonth/currentMonth fields)
decisions:
  - "AdminStats type extended with currentMonthUsers/currentMonthBookings/currentMonthRevenue and previous month equivalents — trend arrows require month-over-month comparison"
  - "TrendPercent is a proper React component (PascalCase) that uses useTranslations — avoids passing translation string as prop"
  - "DashboardCharts is a placeholder only — recharts wired in Plan 10-06 per plan spec"
  - "URL searchParams as filter state — server page re-renders on navigation, no client-side filter state needed (consistent with existing patterns from Phase 05)"
  - "UserDetailActions extracted as separate client component — server detail page cannot use useState/onClick"
  - "Native Intl.DateTimeFormat for date formatting — date-fns not in package.json (consistent with Phase 07-04 decision)"
  - "AdminStats previousMonth data computed via 6 extra Prisma queries in Promise.all — acceptable for admin dashboard (non-critical latency)"
metrics:
  duration: 45
  completed_date: "2026-02-26"
  tasks: 2
  files: 9
requirements:
  - ADMN-01
---

# Phase 10 Plan 02: Admin Dashboard & User Management Summary

**One-liner:** Admin dashboard with real DB stats, KPI trend arrows comparing current vs previous month, plus complete user management table with search/filter/pagination and ban/unban/delete actions.

## What Was Built

### Task 1: Admin Dashboard Homepage with Real Stats and KPI Cards

**Updated admin-queries.ts:**
- Extended `AdminStats` type with `currentMonthUsers`, `previousMonthUsers`, `currentMonthBookings`, `previousMonthBookings`, `currentMonthRevenue`, `previousMonthRevenue`
- Added 6 parallel Prisma queries in `getAdminStatsAction()` to compute month-over-month comparison data

**DashboardStatsCards.tsx:**
- 4 main KPI cards in 2-col (mobile) / 4-col (desktop) grid: Total Users, Total Providers, Total Bookings, Revenue
- Trend arrows: ArrowUpRight (green) if current > previous, ArrowDownRight (red) if current < previous, Minus (muted) if equal
- `TrendPercent` sub-component shows ±N% text with color coding
- Revenue formatted with `Intl.NumberFormat("fr-TN", { currency: "TND" })`
- 3 secondary cards: KYC Pending (amber dot indicator), Active Services, Open Reports (red dot if >5)
- All labels from `useTranslations("admin.dashboard")`

**DashboardCharts.tsx:**
- Placeholder component with 4 chart cards in 2x2 grid
- Each card links to `/admin/analytics`
- No recharts installed — deferred to Plan 10-06 per plan spec

**admin/page.tsx rewrite:**
- Server component calling `getAdminStatsAction()` + `getAdminReportsAction({ page: 1, pageSize: 5 })` in parallel
- Passes stats to `DashboardStatsCards` as props
- Renders `DashboardCharts` below stats
- Recent reports section: last 5 reports with priority badge, reason, reporter name, date
- Quick access link grid: Users, KYC, Reports, Analytics as card links
- Metadata: `Tableau de bord | Admin`

### Task 2: User Management Data Table with Actions and Detail Page

**UserActionsDropdown.tsx:**
- DropdownMenu with MoreHorizontal trigger
- "Voir le profil" → Link to `/admin/users/[id]`
- Ban → AlertDialog with reason Textarea (min 5 chars) → `banUserAction`
- Unban → direct call → `unbanUserAction`
- Deactivate/Activate → direct call → `deactivateUserAction`/`activateUserAction`
- Delete → AlertDialog confirmation → `deleteUserAction`
- ADMIN users: action options hidden (role check guards)
- Success/error via `useToast` from `@/hooks/use-toast`
- `router.refresh()` after each action

**UsersDataTable.tsx:**
- Search input with 300ms debounce via `useRef<setTimeout>` — updates `?search=` URL param
- Role Select filter (CLIENT/PROVIDER/ADMIN/all) — updates `?role=` URL param
- Status Select filter (active/banned/inactive/all) — updates `?status=` URL param
- shadcn Table with columns: Avatar+Name, Email (hidden < md), Role Badge, Status Badge, Join Date (hidden < md), Actions
- Role badges: default (CLIENT), secondary (PROVIDER), outline (ADMIN)
- Status badges: green (Actif), destructive (Banni), secondary (Inactif)
- Pagination: Previous/Next buttons with "Page X sur Y" and "Affichage de X à Y sur Z"
- All URL params managed via `pushParams()` helper using `URLSearchParams` API

**admin/users/page.tsx rewrite:**
- Server component reading `searchParams` (search, role, status, page)
- Calls `getAdminUsersAction(filters)` with parsed searchParams
- Header with Users icon + title + total count badge
- Passes data to `UsersDataTable` as props

**admin/users/[id]/page.tsx:**
- Server component calling `getUserDetailAction(params.id)`
- Redirects to `/admin/users` if user not found
- Left column: large avatar, name, email, role+status badges, member since date
- Ban info shown when user is banned (bannedAt date, bannedReason)
- Provider section (if applicable): displayName, KYC status badge
- Stats grid: bookings count, reviews count, reports count with icons
- Right column: `UserDetailActions` (client component with full-width buttons)
- Metadata: `{userName} | Admin`

## Verification

- `npx tsc --noEmit` passes for all Plan 10-02 files (errors only in pre-existing out-of-scope chart files)
- Admin dashboard shows real stats from DB with trend arrows
- User management table has search, role filter, status filter, pagination
- Ban/unban/activate/deactivate/delete actions work with confirmation dialogs
- User detail page shows profile, KYC info (for providers), and stats grid

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] date-fns not available in project**
- **Found during:** Task 1 implementation
- **Issue:** `date-fns` not in `package.json` — plan referenced `formatDistanceToNow` for recent reports date display
- **Fix:** Used native `Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" })` instead — consistent with Phase 07-04 decision
- **Files modified:** `src/app/[locale]/(admin)/admin/page.tsx`
- **Commit:** 4b4ccbe

**2. [Rule 2 - Missing functionality] UserDetailActions extracted as separate client component**
- **Found during:** Task 2 implementation
- **Issue:** Plan spec described action buttons on user detail page but the detail page is a server component — buttons with onClick handlers require client component
- **Fix:** Created `UserDetailActions.tsx` as dedicated client component housing ban/unban/activate/deactivate/delete buttons with AlertDialog confirmation and `router.push` after delete
- **Files modified:** `src/features/admin/components/UserDetailActions.tsx`
- **Commit:** f0c16f1

## Self-Check: PASSED

- FOUND: src/app/[locale]/(admin)/admin/page.tsx
- FOUND: src/features/admin/components/DashboardStatsCards.tsx
- FOUND: src/features/admin/components/DashboardCharts.tsx
- FOUND: src/app/[locale]/(admin)/admin/users/page.tsx
- FOUND: src/features/admin/components/UsersDataTable.tsx
- FOUND: src/features/admin/components/UserActionsDropdown.tsx
- FOUND: src/app/[locale]/(admin)/admin/users/[id]/page.tsx
- FOUND: src/features/admin/components/UserDetailActions.tsx
- FOUND commit: 4b4ccbe (feat(10-02): Admin dashboard homepage with real stats and KPI cards)
- FOUND commit: f0c16f1 (feat(10-02): User management data table, actions dropdown, and user detail page)
