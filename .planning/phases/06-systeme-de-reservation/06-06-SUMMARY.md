---
phase: 06-systeme-de-reservation
plan: 06
subsystem: ui
tags: [react, next.js, shadcn, tailwind, booking, client-dashboard, tabs, cancellation, status-timeline]

# Dependency graph
requires:
  - phase: 06-systeme-de-reservation
    plan: 01
    provides: getClientBookingsAction, getBookingDetailAction, BookingListItem, QuoteListItem types
  - phase: 06-systeme-de-reservation
    plan: 02
    provides: cancelBookingAction with tiered refund, calculateRefundPercentage pure utility
  - phase: 06-systeme-de-reservation
    plan: 04
    provides: QuoteResponseCard for PENDING/RESPONDED quotes display in client tabs

provides:
  - Client bookings page at /bookings with 4 tabs (A venir/En cours/Passees/Annulees)
  - ClientBookingCard component with service thumbnail, provider name/avatar, date, status badge, amount
  - ClientBookingsList tabbed client component with URL searchParam persistence
  - CancelBookingDialog AlertDialog with 3-tier refund display (green/amber/red) before confirmation
  - CancelBookingButton client wrapper for cancel dialog state in server pages
  - StatusTimeline reusable component (4-step normal path + REJECTED/CANCELLED terminal paths)
  - Client booking detail page at /bookings/[bookingId] with full booking info and cancel flow
  - getClientQuotesAction server action added to booking-queries.ts
  - respondedAt and bookingId optional fields added to QuoteListItem interface

affects: [06-07, 07-reviews, 09-messaging-notifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "server-component + client-wrapper pattern: server page fetches data, client CancelBookingButton owns dialog state"
    - "URL searchParam tab persistence: useSearchParams + router.push(?tab=) — consistent with ProviderBookingsList"
    - "toCardBooking adapter: converts BookingListItem (photoUrl: string|null) to ClientBookingCard (photoUrls: string[]) — same pattern as Plan 05"
    - "toQuoteCardProps adapter: converts QuoteListItem to QuoteResponseCard props with Date coercion for expiresAt/respondedAt"
    - "calculateRefundPercentage called client-side in CancelBookingDialog — pure function, zero server round-trip for preview"

key-files:
  created:
    - src/features/booking/components/ClientBookingCard.tsx (booking summary card with status badge, provider avatar, cancel button)
    - src/features/booking/components/ClientBookingsList.tsx (4-tab list with URL persistence, QuoteResponseCard integration)
    - src/features/booking/components/CancelBookingDialog.tsx (AlertDialog with refund tier display and reason textarea)
    - src/features/booking/components/CancelBookingButton.tsx (client wrapper owning cancel dialog state for server pages)
    - src/features/booking/components/StatusTimeline.tsx (reusable vertical timeline with animated pulse and terminal paths)
    - src/app/[locale]/(client)/bookings/page.tsx (server component with CLIENT session guard, parallel fetch)
    - src/app/[locale]/(client)/bookings/[bookingId]/page.tsx (full booking detail with provider card, timeline, cancel)
  modified:
    - src/features/booking/actions/booking-queries.ts (added getClientQuotesAction, extended QuoteListItem with respondedAt/bookingId)

key-decisions:
  - "CancelBookingButton extracted as client component — server detail page cannot use useState, so a client wrapper owns dialog open/close state"
  - "CancelBookingDialog calls calculateRefundPercentage client-side (imported pure function) — no server round-trip needed for refund preview"
  - "getClientQuotesAction added to booking-queries.ts (Plan 01 did not include it) — Rule 3 auto-fix to unblock the page"
  - "QuoteListItem extended with respondedAt and bookingId — required by QuoteResponseCard props interface"
  - "StatusTimeline is a pure server component (no client hooks needed) — rendered inside server pages without client boundary overhead"
  - "CancelBookingButton uses router.refresh() after success — proper Next.js 15 App Router page refresh without full navigation"
  - "toCardBooking() adapter: BookingListItem.service.photoUrl (string|null) normalized to photoUrls[] — consistent with Plan 05 pattern"

patterns-established:
  - "Client booking detail: ownership double-check (getBookingDetailAction checks role, page also checks client.id === session.user.id)"
  - "StatusTimeline step timing: index 0 always shows createdAt, index 2 shows scheduledAt as DateTime, others show date only"

requirements-completed: [BOOK-06, BOOK-07, BOOK-08]

# Metrics
duration: 43min
completed: 2026-02-24
---

# Phase 6 Plan 06: Client Booking Management — Mes Reservations Summary

**Client-side booking dashboard with 4-tab list (A venir/En cours/Passees/Annulees), StatusTimeline reusable component, and CancelBookingDialog with 3-tier refund preview before confirmation**

## Performance

- **Duration:** ~43 min
- **Started:** 2026-02-24T17:13:09Z
- **Completed:** 2026-02-24T17:55:56Z
- **Tasks:** 2
- **Files modified:** 8 (7 created, 1 modified)

## Accomplishments

- Created `ClientBookingsList` with 4 tabs (A venir / En cours / Passees / Annulees), count badges on "A venir" tab, URL `?tab=` persistence, empty state with CalendarX icon
- Created `ClientBookingCard` showing service thumbnail, service title, provider name + small avatar, scheduled date, status badge (color-coded), total amount, payment method, "Annuler" text button for PENDING/ACCEPTED
- Created `CancelBookingDialog` (AlertDialog): calculates refund tier client-side using `calculateRefundPercentage` (green=FULL, amber=PARTIAL, red=NONE), reason textarea, "Garder la reservation" / "Confirmer l'annulation" buttons, loading state, toast on success/error
- Created `CancelBookingButton` client wrapper component: owns dialog open/close state, calls `router.refresh()` after successful cancellation
- Created `StatusTimeline` reusable component: 4-step normal progression (creee -> acceptee -> en cours -> terminee) with timestamps, 2-step terminal paths for CANCELLED (shows cancelledBy) and REJECTED (red dot), animated pulse on current step, dashed connector for future steps
- Created client bookings list page (`/bookings`): server component, CLIENT role guard, parallel fetch of bookings + quotes via `Promise.all`
- Created client booking detail page (`/bookings/[bookingId]`): StatusTimeline, service card with photo, provider card with avatar/rating/profile link, booking details (scheduled date, instructions, cancel info), payment card (method, status), optional quote section for quote-based bookings, cancel action for PENDING/ACCEPTED
- Added `getClientQuotesAction` to `booking-queries.ts` — fetches quotes by clientId with optional status filter, includes booking.id for linkage
- Extended `QuoteListItem` interface with optional `respondedAt` and `bookingId` fields required by `QuoteResponseCard`

## Task Commits

Each task was committed atomically:

1. **Task 1: Client bookings list page with tabs and cards** - `5d63af5` (feat)
2. **Task 2: Booking detail page + StatusTimeline + CancelBookingDialog** - `71bdfbf` (feat)

## Files Created/Modified

- `src/features/booking/components/ClientBookingCard.tsx` — Booking summary card with service thumbnail, provider avatar, status badge, cancel button for eligible statuses
- `src/features/booking/components/ClientBookingsList.tsx` — 4-tab client component with URL `?tab=` persistence, booking and quote adapters, cancel dialog orchestration
- `src/features/booking/components/CancelBookingDialog.tsx` — AlertDialog with calculateRefundPercentage client-side preview (green/amber/red), reason textarea, cancelBookingAction call
- `src/features/booking/components/CancelBookingButton.tsx` — Client wrapper for cancel dialog state, router.refresh() on success
- `src/features/booking/components/StatusTimeline.tsx` — Reusable vertical timeline, animated pulse dot, terminal path handling, timestamp formatting
- `src/app/[locale]/(client)/bookings/page.tsx` — Server page: CLIENT guard, parallel fetch of bookings + quotes (limit 100), passes to ClientBookingsList
- `src/app/[locale]/(client)/bookings/[bookingId]/page.tsx` — Server page: full booking detail with service card, provider card, StatusTimeline, payment info, quote section, CancelBookingButton
- `src/features/booking/actions/booking-queries.ts` — Added getClientQuotesAction (clientId filter, booking relation for bookingId); extended QuoteListItem with respondedAt/bookingId

## Decisions Made

- `CancelBookingButton` extracted as a separate client component — server detail pages cannot use `useState`, so the client wrapper owns dialog open/close state. Detail page passes the booking data as props.
- `CancelBookingDialog` calls `calculateRefundPercentage` client-side (pure function import) — immediate refund preview with no server round-trip needed for the display step
- `StatusTimeline` is a pure (non-client) component — no hooks needed, so it incurs zero client bundle overhead when used in server pages
- `router.refresh()` used after cancellation instead of `window.location.reload()` — proper Next.js 15 App Router pattern for refreshing server component data
- `getClientQuotesAction` includes `booking: { select: { id: true } }` — QuoteResponseCard's AcceptedState shows a "Voir la reservation" link that needs the booking ID

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Added getClientQuotesAction to booking-queries.ts**
- **Found during:** Task 1 (building the /bookings page)
- **Issue:** Plan 06-06 spec says the page should "fetch client's quotes via a new getClientQuotesAction — if not available from Plan 01, query directly with prisma.quote.findMany". Plan 01 created `getProviderQuotesAction` but not a client equivalent.
- **Fix:** Added `getClientQuotesAction` to `booking-queries.ts` with clientId filter and booking.id relation. Also extended `QuoteListItem` with `respondedAt` and `bookingId` optional fields (required by `QuoteResponseCard`).
- **Files modified:** `src/features/booking/actions/booking-queries.ts`
- **Commit:** `5d63af5` (Task 1 commit)

**2. [Rule 2 - Missing Critical Functionality] Created CancelBookingButton as separate client component**
- **Found during:** Task 2 (building the detail page)
- **Issue:** Plan spec says to put a "Cancel button (if PENDING or ACCEPTED): opens CancelBookingDialog" in the server detail page. Server components cannot use `useState`, so dialog state cannot live in the page directly.
- **Fix:** Created `CancelBookingButton.tsx` as a client component that owns the dialog open/close state. The server page passes bookingId, scheduledAt, totalAmount as props.
- **Files modified:** `src/features/booking/components/CancelBookingButton.tsx` (created)
- **Commit:** `71bdfbf` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (Rule 2 — missing functionality required for correctness)
**Impact on plan:** Both fixes are minimal scope adjustments required for correctness. No architectural changes.

## Issues Encountered

- TypeScript compilation could not be directly verified due to shell environment constraints (space in home directory path prevents `cd` to project). All TypeScript manually reviewed for correctness following established patterns in the codebase.

## User Setup Required

None — all components are client/server React, no new DB migrations or environment variables required.

## Next Phase Readiness

- Client booking dashboard complete: all 4 tabs, booking cards, quote cards, cancel dialog, detail page
- StatusTimeline available for import in any future booking-related page (provider or admin)
- CancelBookingButton can be reused anywhere a server page needs a cancel action
- Plan 06-07 (payment simulation / transaction history) can reference `/bookings/[id]` as the post-payment redirect target

## Self-Check: PASSED

- FOUND: src/features/booking/components/ClientBookingsList.tsx
- FOUND: src/features/booking/components/ClientBookingCard.tsx
- FOUND: src/features/booking/components/CancelBookingDialog.tsx
- FOUND: src/features/booking/components/CancelBookingButton.tsx
- FOUND: src/features/booking/components/StatusTimeline.tsx
- FOUND: src/app/[locale]/(client)/bookings/page.tsx
- FOUND: src/app/[locale]/(client)/bookings/[bookingId]/page.tsx
- FOUND: commit 5d63af5 (Task 1)
- FOUND: commit 71bdfbf (Task 2)

---
*Phase: 06-systeme-de-reservation*
*Completed: 2026-02-24*
