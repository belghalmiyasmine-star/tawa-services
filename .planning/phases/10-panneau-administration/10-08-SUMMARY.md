---
phase: 10-panneau-administration
plan: "08"
subsystem: ui
tags: [admin, commission, notifications, breadcrumbs, sidebar, next-intl, react-hook-form]

# Dependency graph
requires:
  - phase: 10-01
    provides: admin actions pattern with requireAdmin() helper, PaginatedResult type
  - phase: 10-02
    provides: AdminSidebar component base, admin layout structure
  - phase: 07-paiement-simule
    provides: Payment model with commission/providerEarning fields, WithdrawalRequest model

provides:
  - Commission oversight page at /admin/commission (12% rate display, totals, monthly breakdown)
  - Provider payouts table with earnings/commission/pending/withdrawal breakdown
  - System notification sending to user segments (all/clients/providers) via bulk createMany
  - System notification history table grouped by title+body+minute
  - AdminSidebar updated with 11 nav items including Commission link
  - AdminBreadcrumbs client component using usePathname for all admin pages
  - Admin layout updated with breadcrumbs in header

affects:
  - phase-11-polish
  - any future admin financial features

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prisma payment groupBy-in-memory: fetch all payments, accumulate into Map by provider userId"
    - "Bulk notification: prisma.notification.createMany with skipDuplicates: false for segment sends"
    - "Breadcrumbs via usePathname: split segments, map to i18n keys, build hierarchical trail"
    - "Server component + client form pattern: history pre-fetched server-side, form updates local state optimistically"

key-files:
  created:
    - src/features/admin/actions/commission-queries.ts
    - src/features/admin/components/CommissionOverview.tsx
    - src/features/admin/components/ProviderPayoutsTable.tsx
    - src/app/[locale]/(admin)/admin/commission/page.tsx
    - src/features/admin/actions/system-notification-actions.ts
    - src/features/admin/components/SystemNotificationForm.tsx
    - src/features/admin/components/AdminBreadcrumbs.tsx
  modified:
    - src/app/[locale]/(admin)/admin/notifications/page.tsx
    - src/app/[locale]/(admin)/layout.tsx
    - src/components/layout/AdminSidebar.tsx
    - src/messages/fr.json

key-decisions:
  - "Commission groupBy done in-memory: fetch all Payment records, accumulate per-provider in Map — avoids Prisma groupBy limitation with float precision"
  - "Provider payouts query fetches payments directly (not via provider.providerBookings) — avoids nested relation filter TypeScript incompatibility with strict mode"
  - "Notification history grouped by title+body+minute — approximate batch detection without tracking batch IDs"
  - "AdminBreadcrumbs uses try-catch for t() calls — unknown segments gracefully fall back to raw segment string"
  - "Navigation.commission key added to fr.json — AdminSidebar uses navigation namespace for all nav labels"

patterns-established:
  - "Admin financial queries: fetch all records, group in-memory (payment volumes bounded by platform size)"
  - "Breadcrumb component: client component with usePathname, segment->key map, hierarchical href building"

requirements-completed:
  - ADMN-07
  - ADMN-08

# Metrics
duration: 35min
completed: 2026-02-26
---

# Phase 10 Plan 08: Commission & Notifications Summary

**Commission oversight page (12% rate, provider payouts table), system notifications to user segments, AdminSidebar with 11 nav items, and AdminBreadcrumbs on all admin pages**

## Performance

- **Duration:** 35 min
- **Started:** 2026-02-26T15:32:49Z
- **Completed:** 2026-02-26T16:07:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Commission page at /admin/commission shows 4 stats cards (12% rate, total commission, total payouts, pending) plus withdrawal stats and paginated provider payouts table
- System notification form sends bulk notifications to all/clients/providers segments with confirmation toast, history table shows recent sends grouped by title+body+minute
- AdminSidebar updated to 11 nav items: home, users, kyc, reviews, services, categories, reports, analytics, commission, content, notifications
- AdminBreadcrumbs client component renders contextual breadcrumb trail on all admin pages via usePathname segment mapping

## Task Commits

Each task was committed atomically:

1. **Task 1: Commission oversight page with provider payouts table** - `fbf5a95` (feat)
2. **Task 2: System notifications + sidebar update + breadcrumbs** - `8cb9f41` (feat, committed in prior 10-06 session)

**Plan metadata:** `f2a904c` (docs: complete plan)

## Files Created/Modified

- `src/features/admin/actions/commission-queries.ts` - getCommissionOverviewAction (12% rate, totals, monthly breakdown) and getProviderPayoutsAction (paginated provider earnings)
- `src/features/admin/components/CommissionOverview.tsx` - 4 stats cards + withdrawal stats display
- `src/features/admin/components/ProviderPayoutsTable.tsx` - Provider earnings breakdown table with pagination
- `src/app/[locale]/(admin)/admin/commission/page.tsx` - Server page calling both commission actions in parallel
- `src/features/admin/actions/system-notification-actions.ts` - sendSystemNotificationAction (bulk createMany) + getSystemNotificationHistoryAction
- `src/features/admin/components/SystemNotificationForm.tsx` - react-hook-form segment select + title/body + history table
- `src/app/[locale]/(admin)/admin/notifications/page.tsx` - Rewritten as server component with SSR history
- `src/features/admin/components/AdminBreadcrumbs.tsx` - usePathname-based breadcrumb trail with i18n segment mapping
- `src/app/[locale]/(admin)/layout.tsx` - AdminBreadcrumbs added to header
- `src/components/layout/AdminSidebar.tsx` - Commission nav item added (Banknote icon, 11 total items)
- `src/messages/fr.json` - navigation.commission, breadcrumbs.kyc, breadcrumbs.reviews keys added

## Decisions Made

- Provider payout data fetched from Payment model directly (not via provider.providerBookings relation) to avoid TypeScript strict mode incompatibility with nested relation filters
- Commission data grouped in-memory from Payment records using Map accumulation — avoids Prisma groupBy limitation with floating point precision
- Notification history grouped by title+body+minute to detect batches without tracking a batchId field in schema
- AdminBreadcrumbs uses try-catch for t() calls on SEGMENT_KEYS lookup — graceful fallback for unknown URL segments

## Deviations from Plan

**1. [Rule 1 - Bug] Fixed Prisma provider payouts query approach**

- **Found during:** Task 1 (getProviderPayoutsAction)
- **Issue:** Initial query using `provider.providerBookings.where.payment.status` caused TypeScript error (TS2322: `{ in: string[] }` not assignable to `undefined`) — Prisma TypeScript types don't support filtering nested one-to-one relations via `where` in that pattern
- **Fix:** Rewrote to fetch all Payment records directly with booking.provider select, then group by userId in-memory using Map accumulator
- **Files modified:** src/features/admin/actions/commission-queries.ts
- **Verification:** TypeScript exits with code 0
- **Committed in:** fbf5a95 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed useToast import path in SystemNotificationForm**

- **Found during:** Task 2 (SystemNotificationForm creation)
- **Issue:** Used `@/components/ui/use-toast` but project standard is `@/hooks/use-toast`
- **Fix:** Updated import path to `@/hooks/use-toast`
- **Files modified:** src/features/admin/components/SystemNotificationForm.tsx
- **Verification:** TypeScript exits with code 0
- **Committed in:** 8cb9f41 (part of Task 2 commit in prior session)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

Task 2 files (AdminBreadcrumbs, SystemNotificationForm, notifications page, sidebar update) were discovered to already exist from prior plan 10-06/10-07 execution sessions. The new content I wrote was consistent with what was committed, so no conflicts arose. TypeScript passed cleanly for all files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 10 complete: all admin panels functional (dashboard, users, KYC, services, categories, reports, analytics, commission, notifications)
- AdminSidebar has all 11 nav items covering all admin sections
- Commission model ready for future real payment gateway integration
- System notifications ready for marketing/operational communications
- Ready for Phase 11 (polish and final deployment)

## Self-Check: PASSED

All created files confirmed present on disk:
- `src/features/admin/actions/commission-queries.ts` - FOUND
- `src/features/admin/components/CommissionOverview.tsx` - FOUND
- `src/features/admin/components/ProviderPayoutsTable.tsx` - FOUND
- `src/app/[locale]/(admin)/admin/commission/page.tsx` - FOUND
- `src/features/admin/actions/system-notification-actions.ts` - FOUND
- `src/features/admin/components/SystemNotificationForm.tsx` - FOUND
- `src/features/admin/components/AdminBreadcrumbs.tsx` - FOUND

All commits confirmed in git log:
- `fbf5a95` feat(10-08): commission oversight page - FOUND
- `8cb9f41` feat(10-06): system notifications and breadcrumbs - FOUND
- `f2a904c` docs(10-08): plan summary and state updates - FOUND

TypeScript check: EXIT_CODE 0 (no errors)

---
*Phase: 10-panneau-administration*
*Completed: 2026-02-26*
