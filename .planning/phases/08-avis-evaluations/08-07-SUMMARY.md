---
phase: 08-avis-evaluations
plan: "07"
subsystem: ui
tags: [review, navigation, booking-list, admin-sidebar, i18n, status-indicators]

# Dependency graph
requires:
  - phase: 08-06
    provides: Admin review moderation page (/admin/reviews), moderateReviewAction, provider profile Avis tab

provides:
  - Admin sidebar navigation link to /admin/reviews (Star icon, 'Moderation avis' label)
  - BookingReviewStatus type (can_review | pending_publication | published | window_closed | null)
  - Review status indicators on client and provider booking list cards
  - Extended getClientBookingsAction and getProviderBookingsAction with reviewStatus per booking
  - Fully wired end-to-end review system: completed booking -> CTA -> form -> submission -> simultaneous publication -> profile display -> search sort -> admin moderation

affects:
  - Phase 09 (messaging): booking list components may be extended
  - Phase 11 (polish): review UI polish, i18n completeness

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BookingReviewStatus computed server-side in list queries (include reviews in Prisma query, derive status from completedAt + window + existing reviews)"
    - "Review status indicator is a 3-state chip below booking card bottom row (can_review=amber link, pending=gray, published=green)"

key-files:
  created: []
  modified:
    - src/components/layout/AdminSidebar.tsx
    - src/features/booking/actions/booking-queries.ts
    - src/features/booking/components/ClientBookingCard.tsx
    - src/features/booking/components/ClientBookingsList.tsx
    - src/features/booking/components/ProviderBookingCard.tsx
    - src/features/booking/components/ProviderBookingsList.tsx
    - src/messages/fr.json

key-decisions:
  - "BookingReviewStatus derived server-side in getClientBookingsAction/getProviderBookingsAction — reviews included in Prisma query with select: {authorId, authorRole, published}; no extra server action call per booking"
  - "Review status chip rendered inline in ClientBookingCard (border-t row) and ProviderBookingCard (below clientNote) — no additional client component needed"
  - "Task 2 (E2E flow verification) required no code changes — all review flow components were already correctly implemented in Plans 08-01 through 08-06"
  - "Admin sidebar 'adminReviews' key positioned after KYC ('kyc') entry per plan spec"
  - "window_closed status renders no indicator in the UI — clean UX when review period expired"

patterns-established:
  - "Pattern: extend BookingListItem with computed status fields rather than client-side derive — reduces client bundle and avoids extra fetches"
  - "Pattern: pass reviewStatus through toCardBooking adapters in list components"

requirements-completed: [REVW-01, REVW-08]

# Metrics
duration: 30min
completed: 2026-02-25
---

# Phase 08 Plan 07: Navigation Wiring & E2E Verification Summary

**Admin sidebar 'Moderation avis' link wired to /admin/reviews; booking lists show 3-state review status indicators for completed bookings; full review E2E flow verified correct**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-02-25T09:47:36Z
- **Completed:** 2026-02-25T10:17:00Z
- **Tasks:** 2 (1 with code changes, 1 verification-only)
- **Files modified:** 7

## Accomplishments

- Added `Star` icon and "Moderation avis" nav item to `AdminSidebar.tsx` — navigates to `/admin/reviews`
- Extended `BookingListItem` type with `BookingReviewStatus` union type and `reviewStatus` field
- Extended both `getClientBookingsAction` and `getProviderBookingsAction` to include reviews in Prisma query and compute `reviewStatus` per COMPLETED booking server-side
- Updated `ClientBookingCard` and `ProviderBookingCard` to render 3-state review indicators: amber "Laisser un avis" link, gray "Avis soumis, en attente" chip, or green "Avis publie" badge
- Added 5 i18n keys: `navigation.adminReviews`, `review.statusPending`, `review.statusPublished`, `review.leaveReview`, `review.windowClosed`
- Verified complete E2E flow end-to-end: all components from Plans 08-01 to 08-06 confirmed correctly connected

## Task Commits

1. **Task 1: Admin sidebar link and booking list review indicators** - `c7fe9f6` (feat)
2. **Task 2: E2E flow verification** - No code commit needed — all flow verified correct as-is

**Plan metadata:** (to be committed with SUMMARY.md)

## Files Created/Modified

- `src/components/layout/AdminSidebar.tsx` - Added Star import + adminReviews nav item after kyc entry
- `src/features/booking/actions/booking-queries.ts` - Added BookingReviewStatus type, reviewStatus field to BookingListItem, reviews include in both list queries with window computation
- `src/features/booking/components/ClientBookingCard.tsx` - Added Star/Clock/CheckCircle imports + BookingReviewStatus import + reviewStatus prop + 3-state indicator row after bottom row
- `src/features/booking/components/ClientBookingsList.tsx` - Updated toCardBooking return type + added reviewStatus to mapped object
- `src/features/booking/components/ProviderBookingCard.tsx` - Same Star/Clock/CheckCircle additions + reviewStatus prop + 3-state indicator below clientNote
- `src/features/booking/components/ProviderBookingsList.tsx` - Added reviewStatus to toCardBooking output
- `src/messages/fr.json` - Added navigation.adminReviews, review.statusPending/statusPublished/leaveReview/windowClosed

## Decisions Made

- `BookingReviewStatus` computed server-side in list queries by including reviews (`select: {authorId, authorRole, published}`) in the existing Prisma query — avoids extra DB round-trips per booking card
- Review status chip rendered directly in card components — no additional client component required
- `window_closed` state renders no UI indicator — clean UX when evaluation period has expired
- Task 2 E2E verification confirmed: `submitReviewAction` validates all 4 criteria + overall + text, runs moderation, triggers `publishBothReviews`; `publishBothReviews` atomically publishes both reviews and calls `updateProviderRating`; search `buildSearchQuery` correctly uses `provider.rating` for "Meilleure note" sort

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript compilation passes cleanly after all changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 8 (Avis & Evaluations) is now complete — all 7 plans executed
- Review system fully wired: submission, moderation, publication, profile display, search ranking, admin moderation
- Ready for Phase 9 (Messagerie & Notifications)

---
*Phase: 08-avis-evaluations*
*Completed: 2026-02-25*

## Self-Check: PASSED

- FOUND: `.planning/phases/08-avis-evaluations/08-07-SUMMARY.md`
- FOUND: `src/components/layout/AdminSidebar.tsx`
- FOUND: `src/features/booking/actions/booking-queries.ts`
- FOUND: `src/features/booking/components/ClientBookingCard.tsx`
- FOUND: `src/features/booking/components/ClientBookingsList.tsx`
- FOUND: `src/features/booking/components/ProviderBookingCard.tsx`
- FOUND: `src/features/booking/components/ProviderBookingsList.tsx`
- FOUND: `src/messages/fr.json`
- COMMIT c7fe9f6: feat(08-07) confirmed in git log
- TypeScript compilation: PASS
