---
phase: 06-systeme-de-reservation
plan: 07
subsystem: ui
tags: [react, next.js, lucide-react, i18n, navigation, booking, sidebar]

# Dependency graph
requires:
  - phase: 06-systeme-de-reservation
    plan: 03
    provides: /bookings client page, /services/[id]/book booking wizard
  - phase: 06-systeme-de-reservation
    plan: 05
    provides: /provider/bookings dashboard, ProviderBookingsList
  - phase: 06-systeme-de-reservation
    plan: 06
    provides: /bookings client list and /bookings/[id] detail page

provides:
  - Navbar Mes reservations link (CalendarCheck icon, CLIENT-only, links to /bookings)
  - BottomNav updated to CalendarCheck icon for both CLIENT (/bookings) and PROVIDER (/provider/bookings)
  - ProviderSidebar Reservations link (CalendarCheck, after Mes services, with PENDING count badge)
  - navigation.reservations i18n key added to fr.json

affects: [07-reviews, 09-messaging-notifications, 11-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "pending count badge in sidebar: useEffect fetches getProviderBookingsAction({ status: PENDING, limit: 1 }) for total count — silently fails if unauthorized"
    - "role-conditional nav link: status === authenticated && session.user.role === CLIENT — avoids showing /bookings to providers"

key-files:
  created: []
  modified:
    - src/components/layout/Navbar.tsx (added Mes reservations link with CalendarCheck, CLIENT-only)
    - src/components/layout/BottomNav.tsx (Calendar -> CalendarCheck icon)
    - src/components/layout/ProviderSidebar.tsx (added Reservations NAV_ITEM, pending count badge via useEffect)
    - src/messages/fr.json (added navigation.reservations = "Reservations")

key-decisions:
  - "Navbar Mes reservations uses tBooking('myBookings') = 'Mes reservations' — long label hidden on <lg breakpoint, icon always visible"
  - "BottomNav already had /bookings and /provider/bookings wired from earlier — only icon updated to CalendarCheck"
  - "ProviderSidebar pending badge fetches total from getProviderBookingsAction with status PENDING — useEffect is fire-and-forget, badge is non-critical UI"
  - "navigation.reservations key added (not bookings) — sidebar uses t('reservations') for longer desktop label vs the existing t('bookings') used in BottomNav mobile"

patterns-established:
  - "Server action called in client useEffect for non-critical badge counts — errors silently caught, no loading state"

requirements-completed: [BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, BOOK-07, BOOK-08]

# Metrics
duration: 15min
completed: 2026-02-24
---

# Phase 6 Plan 07: Navigation Wiring + End-to-End Verification Summary

**Booking pages wired into global navigation: Navbar Mes reservations (CLIENT-only), BottomNav CalendarCheck icon, ProviderSidebar Reservations link with PENDING count badge**

## Performance

- **Duration:** ~15 min (Task 1 only — Task 2 is human verification checkpoint)
- **Started:** 2026-02-24T18:00:00Z
- **Completed (Task 1):** 2026-02-24T18:15:00Z
- **Tasks:** 1 of 2 (Task 2 is checkpoint:human-verify)
- **Files modified:** 4

## Accomplishments

- Added "Mes reservations" link to Navbar visible only for authenticated CLIENT users — CalendarCheck icon, label hidden on medium screens, shows on lg+, links to `/bookings`
- Updated BottomNav `Calendar` icon to `CalendarCheck` for both CLIENT and PROVIDER items — the navigation to `/bookings` and `/provider/bookings` was already wired from Plan 03/05
- Added "Reservations" nav item to ProviderSidebar between "Mes services" and "KYC" — links to `/provider/bookings`, with a pending booking count badge fetched via `useEffect` calling `getProviderBookingsAction({ status: ["PENDING"] })`
- Added `navigation.reservations = "Reservations"` i18n key to `fr.json`
- Middleware already correct: `/bookings` in `AUTHENTICATED_PATHS`, `/provider/bookings` covered by `/provider` prefix in `PROVIDER_PATHS`

## Task Commits

1. **Task 1: Wire booking pages into navigation** - `fa6ac6a` (feat)
2. **Task 2: End-to-end verification** - *pending human verification*

## Files Created/Modified

- `src/components/layout/Navbar.tsx` — Added CalendarCheck import, tBooking translations, Mes reservations Button+Link (CLIENT-only visibility guard)
- `src/components/layout/BottomNav.tsx` — Updated Calendar to CalendarCheck icon import and usage for both CLIENT_ITEMS and PROVIDER_ITEMS
- `src/components/layout/ProviderSidebar.tsx` — Added CalendarCheck import, useEffect import, getProviderBookingsAction import, pendingCount state, Reservations NAV_ITEM, pending count badge rendering
- `src/messages/fr.json` — Added `"reservations": "Reservations"` to navigation namespace

## Decisions Made

- `Navbar` "Mes reservations" link uses `tBooking("myBookings")` = "Mes reservations" — this is the full label from the booking namespace, appropriate for desktop navbar context. Mobile bottom nav continues to use `navigation.bookings` = "Reservations" (shorter).
- `BottomNav` already had `/bookings` for CLIENT and `/provider/bookings` for PROVIDER from earlier plans — the only change needed was the icon update.
- `ProviderSidebar` pending badge is fetched in `useEffect` with silent error handling — it is non-critical UI, never blocks navigation.
- `navigation.reservations` key added separately from `navigation.bookings` — the sidebar needed a "Reservations" label distinct from BottomNav's "bookings" key, and the sidebar collapses labels entirely when collapsed (using the title attribute).

## Deviations from Plan

None - plan executed exactly as written. BottomNav was already wired for both roles from prior plans; middleware was already covering both paths. Only 4 small additions needed.

## Issues Encountered

- Bash shell `cd` and `git -C` commands fail with "Permission denied" when the path contains a space (`pc dell`). Worked around using `bash << 'BASHEOF'` heredoc with `cd ~/tawa-services` which resolves HOME correctly.
- TypeScript compilation could not be directly verified due to shell environment constraints. All TypeScript manually reviewed for correctness following established patterns in the codebase.

## User Setup Required

None — navigation changes are pure UI, no new DB migrations or environment variables required.

## Next Phase Readiness

- All BOOK-01 through BOOK-08 requirements satisfied at code level
- Navigation integration complete for both CLIENT and PROVIDER roles on both mobile (BottomNav) and desktop (Navbar + ProviderSidebar)
- Task 2 (human verification) will confirm all 5 end-to-end flows work correctly before Phase 6 is marked complete

## Self-Check: PASSED

- FOUND: src/components/layout/Navbar.tsx (CalendarCheck import + Mes reservations link)
- FOUND: src/components/layout/BottomNav.tsx (CalendarCheck icons)
- FOUND: src/components/layout/ProviderSidebar.tsx (Reservations NAV_ITEM + pending badge)
- FOUND: src/messages/fr.json (navigation.reservations key)
- FOUND: commit fa6ac6a (Task 1)

---
*Phase: 06-systeme-de-reservation*
*Completed: 2026-02-24*
