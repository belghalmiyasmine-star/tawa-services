---
phase: 12-bug-fixes
plan: 02
subsystem: ui, database, payments
tags: [prisma, favorites, dashboard, next-auth, server-actions, react]

# Dependency graph
requires:
  - phase: 12-01-bug-fixes
    provides: "Prior bug fixes in Phase 12 wave 1"

provides:
  - "Favorite model in Prisma schema with userId/serviceId unique constraint"
  - "toggleFavoriteAction server action for save/unsave services"
  - "FavoriteButton client component with optimistic UI"
  - "PublicServiceCard updated with interactive heart toggle for auth users"
  - "Client dashboard with real stats (total bookings, total spent, reviews given)"
  - "Provider withdrawal math verified: providerEarning = amount * 0.88 (12% commission)"

affects:
  - "Phase 13 UX polish — favorites list UI can now be built on Favorite model"
  - "Phase 14 integration — dashboard stats are real data"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Optimistic UI pattern for toggles: update local state immediately, revert on server failure"
    - "Optional prop pattern for auth-conditional UI (isFavorited undefined = guest, boolean = authenticated)"
    - "Parallel Promise.all for dashboard aggregate queries alongside list queries"

key-files:
  created:
    - src/features/favorite/actions/toggle-favorite.ts
    - src/features/favorite/components/FavoriteButton.tsx
  modified:
    - prisma/schema.prisma
    - src/features/provider/components/PublicServiceCard.tsx
    - src/app/[locale]/(client)/dashboard/page.tsx
    - src/messages/fr.json

key-decisions:
  - "isFavorited prop is optional (undefined) to allow same PublicServiceCard component for both authenticated and guest users — no breaking changes to existing callers"
  - "FavoriteButton uses useTransition for non-blocking server action call with optimistic UI revert on failure"
  - "Withdrawal math verified correct: both SimulatedPaymentService and manage-bookings.ts use amount * 0.12 commission, no fix needed"

patterns-established:
  - "Favorite toggle: server action + optimistic client component pattern"
  - "Dashboard stats: parallel aggregate queries added to existing Promise.all"

requirements-completed: [BUGF-05, BUGF-06, BUGF-07]

# Metrics
duration: 20min
completed: 2026-02-27
---

# Phase 12 Plan 02: Favorites, Client Dashboard Stats & Withdrawal Math Summary

**Prisma Favorite model with toggleFavoriteAction, optimistic FavoriteButton component, and client dashboard real stats (bookings/spent/reviews) via parallel aggregate queries**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-02-27T15:40:00Z
- **Completed:** 2026-02-27T16:00:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Favorites feature fully implemented: Prisma model, server action, optimistic client component, and PublicServiceCard wired up
- Client dashboard now shows real stats: total bookings count, total amount spent (TND), and reviews given
- Provider withdrawal math verified as correct — `providerEarning = amount * 0.88` in both release paths

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement favorites toggle on service cards** - `c3dbac1` (feat)
2. **Task 2: Add real stats to client dashboard and verify withdrawal math** - `7c72cc7` (feat)

## Files Created/Modified

- `prisma/schema.prisma` - Added Favorite model with @@unique([userId, serviceId]), added favorites relation to User and Service models
- `src/features/favorite/actions/toggle-favorite.ts` - Server action: toggleFavoriteAction (find+delete or create, revalidatePath)
- `src/features/favorite/components/FavoriteButton.tsx` - Client component: optimistic heart toggle with useTransition, e.preventDefault/stopPropagation
- `src/features/provider/components/PublicServiceCard.tsx` - Added optional isFavorited prop, renders FavoriteButton for auth users or static heart for guests
- `src/app/[locale]/(client)/dashboard/page.tsx` - Added 3 aggregate queries to Promise.all, rendered stats bar (totalBookings, totalSpent, reviewsGiven)
- `src/messages/fr.json` - Added clientDashboard keys: totalBookings, totalSpent, reviewsGiven

## Decisions Made

- isFavorited prop is optional (`boolean | undefined`) — undefined signals guest user, no prop changes needed for existing callers (SearchResultsGrid, provider profile page, service detail page)
- FavoriteButton uses `useTransition` for non-blocking optimistic updates and reverts state on server error
- Withdrawal math requires no fix: `SimulatedPaymentService.releasePayment` correctly sets `commission = amount * 0.12` and `providerEarning = amount - commission`, same logic in `manage-bookings.ts` for CASH payment path

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The prisma db push and generate succeeded. Both code paths for providerEarning calculation were verified correct, no changes required.

## Next Phase Readiness

- Favorite model in DB, server action and client component ready — Phase 13 can build favorites list UI on top
- Client dashboard stats display real data — ready for PFE demo
- Withdrawal math verified — provider earnings feature is financially correct

## Self-Check: PASSED

- FOUND: `src/features/favorite/actions/toggle-favorite.ts`
- FOUND: `src/features/favorite/components/FavoriteButton.tsx`
- FOUND: commit `c3dbac1` (Task 1 — favorites feature)
- FOUND: commit `7c72cc7` (Task 2 — dashboard stats + withdrawal math)

---
*Phase: 12-bug-fixes*
*Completed: 2026-02-27*
