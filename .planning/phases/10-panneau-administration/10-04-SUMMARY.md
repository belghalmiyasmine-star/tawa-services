---
phase: 10-panneau-administration
plan: "04"
subsystem: ui
tags: [next-intl, shadcn, reports, sla, admin, table, sheet]

# Dependency graph
requires:
  - phase: 10-01
    provides: admin server actions (updateReportAction, getReportDetailAction, getAdminReportsAction), AdminReportDetail type, AdminReportListItem type
provides:
  - ReportActionsDropdown: inline status workflow (investigate/resolve/dismiss) from table
  - ReportsDataTable: prioritized report table with SLA badges, filters, pagination
  - SlaBadge: live SLA countdown with color coding (already committed in 10-03 session)
  - ReportDetailSheet: full report detail overlay with admin notes and status timeline (already committed in 10-03 session)
  - admin/reports page: server component with searchParams-driven filtering
affects:
  - 10-06 (categories/content management may reference report UI patterns)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server action passed as prop to client component for on-demand detail fetching
    - URL-state filters pattern (priority/status/type/search all in URL searchParams)
    - Priority ordering in-memory on paginated results (CRITICAL > IMPORTANT > MINOR)
    - SLA countdown via useEffect + setInterval(60s) in SlaBadge client component

key-files:
  created:
    - src/features/admin/components/SlaBadge.tsx
    - src/features/admin/components/ReportDetailSheet.tsx
    - src/features/admin/components/ReportActionsDropdown.tsx
    - src/features/admin/components/ReportsDataTable.tsx
  modified:
    - src/app/[locale]/(admin)/admin/reports/page.tsx

key-decisions:
  - "SlaBadge and ReportDetailSheet were committed in a prior session (10-03) as part of the service management work — they were already in HEAD when this plan executed"
  - "getReportDetail passed as server action prop from server page to ReportsDataTable client component — allows on-demand fetch without separate API route"
  - "useRouter from @/i18n/routing used throughout for locale-aware navigation (consistent with codebase convention)"
  - "SLA countdown uses setInterval(60000ms) not 1000ms — minute-granularity is sufficient and reduces re-renders"
  - "Reports page passes totalPages via total/pageSize calculation, no separate query needed"

patterns-established:
  - "Priority dot indicator pattern: colored circle + text label (red=CRITICAL, amber=IMPORTANT, gray=MINOR)"
  - "SLA badge pattern: green(>=2h), amber(<2h), red-pulsing(<30min), red+icon(expired), gray(closed)"
  - "Expired SLA row: border-l-2 border-l-destructive for visual left border highlight"
  - "CRITICAL open rows: bg-red-50 background tint for immediate visual priority"

requirements-completed:
  - ADMN-03

# Metrics
duration: 35min
completed: 2026-02-26
---

# Phase 10 Plan 04: Signalements Management Summary

**Reports management system with prioritized table (CRITICAL-first), live SLA countdown badges (green/amber/red), Sheet overlay detail view, and investigate/resolve/dismiss admin workflow**

## Performance

- **Duration:** 35 min
- **Started:** 2026-02-26T14:28:19Z
- **Completed:** 2026-02-26T15:03:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Reports page fully implemented as server component with searchParams-driven filtering (priority, status, type, search, page)
- ReportsDataTable shows CRITICAL reports first with red-50 background tint, expired SLA rows with red left border
- SlaBadge component provides live SLA countdown with color-coded urgency updating every minute
- Report detail Sheet overlay shows full report info: reporter/reported cards, status timeline, admin notes textarea, and action buttons
- Investigate/resolve/dismiss workflow properly updates report status via updateReportAction with toast feedback
- Mobile-responsive table hides Reporter and Type columns below md breakpoint

## Task Commits

1. **Task 1: SLA badge component and report detail Sheet** - `7d7c3f9` (feat) — committed in prior session as part of 10-03 work
2. **Task 2: Reports data table page with filters and priority ordering** - `3ffc493` (feat)

## Files Created/Modified

- `src/features/admin/components/SlaBadge.tsx` — Live SLA countdown badge with color-coded urgency (green/amber/red/gray)
- `src/features/admin/components/ReportDetailSheet.tsx` — Side panel with full report details, status timeline, admin notes, action buttons
- `src/features/admin/components/ReportActionsDropdown.tsx` — Quick actions dropdown for inline status changes (investigate/resolve/dismiss)
- `src/features/admin/components/ReportsDataTable.tsx` — Prioritized reports table with search, filters, pagination, and row click to open Sheet
- `src/app/[locale]/(admin)/admin/reports/page.tsx` — Server component page reading searchParams, fetching reports, rendering table

## Decisions Made

- **SlaBadge + ReportDetailSheet already committed:** A previous agent session (10-03 plan) had staged and committed `SlaBadge.tsx` and `ReportDetailSheet.tsx` as part of the services management work. These files were already in HEAD when this plan executed. The Write tool overwrote them with identical content.
- **Server action as prop:** `handleGetReportDetail` defined inline with `"use server"` in the server page and passed as a prop to `ReportsDataTable`. This allows the client table to fetch full report details on demand without a separate API route.
- **SLA timer interval:** Using `setInterval(60000)` (1 minute) instead of every second to reduce unnecessary re-renders while still showing live countdown.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Pattern consistency] Updated useRouter import to @/i18n/routing**
- **Found during:** Task 2 (ReportActionsDropdown and ReportsDataTable)
- **Issue:** Initial implementation used `next/navigation` for useRouter but codebase convention (established in Phase 01-03) requires `@/i18n/routing` for locale-aware routing
- **Fix:** Changed import to `useRouter from "@/i18n/routing"` in ReportActionsDropdown and ReportsDataTable
- **Files modified:** `src/features/admin/components/ReportActionsDropdown.tsx`, `src/features/admin/components/ReportsDataTable.tsx`
- **Committed in:** `3ffc493` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (pattern consistency)
**Impact on plan:** Minor routing import fix, no functional impact.

## Issues Encountered

The git index had pre-staged files from previous incomplete agent sessions. When committing Task 1, those pre-staged files (user management components) were committed instead. Task 1's `SlaBadge.tsx` and `ReportDetailSheet.tsx` were found to already be in HEAD from a prior commit (`7d7c3f9` feat(10-03)). Task 2 was committed cleanly at `3ffc493`.

## Next Phase Readiness

- Reports management interface is complete and functional
- ADMN-03 requirement satisfied
- Next: Plan 10-05 (analytics dashboard) may already be committed based on git log

## Self-Check: PASSED

**Files verified in HEAD:**
- FOUND: `src/features/admin/components/SlaBadge.tsx` (120 lines, min 25)
- FOUND: `src/features/admin/components/ReportDetailSheet.tsx` (434 lines, min 60)
- FOUND: `src/features/admin/components/ReportActionsDropdown.tsx`
- FOUND: `src/features/admin/components/ReportsDataTable.tsx` (363 lines, min 80)
- FOUND: `src/app/[locale]/(admin)/admin/reports/page.tsx` (modified from placeholder)

**Commits verified:**
- `7d7c3f9` - SlaBadge + ReportDetailSheet (committed in prior 10-03 session)
- `3ffc493` - ReportActionsDropdown + ReportsDataTable + reports page (this session)

**Key links verified:**
- `updateReportAction` imported and called in ReportActionsDropdown.tsx
- `slaDeadline` prop used in SlaBadge.tsx for time comparison

---
*Phase: 10-panneau-administration*
*Completed: 2026-02-26*
