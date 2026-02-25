---
phase: 08-avis-evaluations
plan: 04
subsystem: api
tags: [review, publication, cron, prisma, double-blind, window-management]

# Dependency graph
requires:
  - phase: 08-avis-evaluations
    plan: 01
    provides: submitReviewAction, updateProviderRating, Booking model with completedAt
provides:
  - src/features/review/lib/publication.ts with publishBothReviews, publishSoloReviewIfExpired, checkAndCloseExpiredWindows, isReviewWindowOpen, updateProviderRating
  - GET /api/cron/reviews — daily cron for auto-publishing solo reviews after 10-day window
affects:
  - 08-avis-evaluations plans 05+ (UI window status via isReviewWindowOpen)
  - vercel.json cron configuration

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Simultaneous double-blind publish: publishBothReviews atomically sets both reviews published=true when CLIENT+PROVIDER both exist
    - Solo publication after window expiry: cron calls checkAndCloseExpiredWindows which processes bookings in 10-11 day window
    - Pure window check: isReviewWindowOpen(booking) — reusable across server actions and UI
    - Cron endpoint pattern: CRON_SECRET Bearer auth, dev fallback with console.warn (consistent with expire-quotes)

key-files:
  created:
    - src/features/review/lib/publication.ts
    - src/app/api/cron/reviews/route.ts
  modified:
    - src/features/review/actions/review-actions.ts
    - vercel.json

key-decisions:
  - "updateProviderRating moved from review-actions.ts to publication.ts — no circular dependency, re-exported from review-actions.ts for backward compatibility"
  - "publishBothReviews(bookingId) signature simplified: no longer takes providerId — fetches from booking internally"
  - "checkAndCloseExpiredWindows uses completedAt [11, 10] day window — daily cron processes each booking exactly once"
  - "cron/reviews schedule: 0 2 * * * (daily 2 AM) — review windows are day-granularity not hour-critical"
  - "publishSoloReviewIfExpired returns boolean — cron can count actual publications vs processed count"

patterns-established:
  - "Publication logic fully encapsulated in lib/publication.ts — actions import from it, never duplicate publish logic"
  - "isReviewWindowOpen pure function pattern — no DB call, pure date math, reusable in any server or client context"

requirements-completed: [REVW-05, REVW-06]

# Metrics
duration: 25min
completed: 2026-02-25
---

# Phase 8 Plan 04: Avis Evaluations — Publication Logic and Cron Summary

**Double-blind simultaneous publish via publication.ts + daily cron at /api/cron/reviews auto-publishes solo reviews after 10-day window expiry**

## Performance

- **Duration:** 25 min
- **Started:** 2026-02-25T12:02:07Z
- **Completed:** 2026-02-25T12:27:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `publication.ts` centralizes all review publication logic: double-blind publish (both parties), solo publish (cron/expired), batch expiration sweep, and window check pure function
- `checkAndCloseExpiredWindows` uses a [10, 11] day completedAt window so daily cron processes each expired booking exactly once without re-processing old records
- Cron endpoint follows the exact pattern of `expire-quotes` (CRON_SECRET auth, dev fallback, try/catch 500)
- `isReviewWindowOpen` is a pure function (no DB call) reusable in server actions, UI components, and future API routes
- `updateProviderRating` relocated from `review-actions.ts` to `publication.ts` (no circular import); re-exported from review-actions.ts for backward compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Simultaneous publication logic and review window management** - `fda4f27` (feat)
2. **Task 2: Cron job for review window expiration** - `d27198e` (feat)

## Files Created/Modified

- `src/features/review/lib/publication.ts` — updateProviderRating + isReviewWindowOpen + publishBothReviews + publishSoloReviewIfExpired + checkAndCloseExpiredWindows
- `src/app/api/cron/reviews/route.ts` — GET cron endpoint with CRON_SECRET auth, calls checkAndCloseExpiredWindows, returns { ok, processed, published }
- `src/features/review/actions/review-actions.ts` — Imports publishBothReviews and isReviewWindowOpen from publication.ts; re-exports updateProviderRating; window check now uses isReviewWindowOpen
- `vercel.json` — Added cron entry `{ path: "/api/cron/reviews", schedule: "0 2 * * *" }`

## Decisions Made

- **updateProviderRating relocated to publication.ts** — it belongs with the publication domain; re-exported from review-actions.ts ensures zero breaking changes for other importers
- **publishBothReviews simplified signature** — takes only `bookingId` (fetches `providerId` from booking internally), consistent with how cron functions call it
- **Daily 2 AM cron schedule** — review windows are measured in days so daily resolution is sufficient; 2 AM avoids peak traffic hours
- **[10, 11] day batch window** — ensures each booking is processed once; cron running daily means a booking completed exactly 10 days ago will be caught on the next run
- **publishSoloReviewIfExpired returns boolean** — cron can report actual publications vs. bookings processed

## Deviations from Plan

### Structural Change (Rule 1 — Preventing Circular Dependency)

**1. [Rule 1 - Bug] Moved updateProviderRating from review-actions.ts to publication.ts**
- **Found during:** Task 1 (publication.ts creation)
- **Issue:** Plan specified publication.ts would call `updateProviderRating` from `review-actions.ts`. But `review-actions.ts` would import `publishBothReviews` from `publication.ts`, creating a circular dependency.
- **Fix:** Defined `updateProviderRating` in `publication.ts` and re-exported it from `review-actions.ts` (backward-compatible shim)
- **Files modified:** `src/features/review/lib/publication.ts`, `src/features/review/actions/review-actions.ts`
- **Verification:** No circular imports, TypeScript compiles the two files cleanly
- **Committed in:** `fda4f27` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — circular dependency prevention)
**Impact on plan:** Essential correctness fix. No scope creep. Backward-compatible re-export preserves all existing consumers.

## Issues Encountered

- **Pre-existing TypeScript error in ReviewForm.tsx** (from Plan 08-02/03): `photoUrls` type mismatch between `reviewSubmitSchema` inferred input type (`string[] | undefined`) and react-hook-form's expected type (`string[]`). This is NOT caused by Plan 08-04 changes. Logged to `deferred-items.md`.
- **Bash path limitation**: The bash shell rejects paths containing spaces (`/c/Users/pc dell/...`). All git operations performed using `pushd` workaround — files verified by direct existence checks. Known issue documented in prior SUMMARY files.

## User Setup Required

None — no new environment variables required. `CRON_SECRET` is already in env for the existing expire-quotes cron.

## Next Phase Readiness

- All publication primitives are in place for UI integration (Plans 08-02/03 UI components)
- `isReviewWindowOpen` is ready for use in booking detail pages and review form gating
- `getReviewWindowAction` (from Plan 08-01) now backed by consistent `isReviewWindowOpen` logic
- Cron infrastructure for review expiration is deployed via vercel.json

---
*Phase: 08-avis-evaluations*
*Completed: 2026-02-25*

## Self-Check: PASSED

All files verified:
- FOUND: src/features/review/lib/publication.ts
- FOUND: src/app/api/cron/reviews/route.ts
- FOUND: src/features/review/actions/review-actions.ts (modified)
- FOUND: vercel.json (modified)
- FOUND: .planning/phases/08-avis-evaluations/08-04-SUMMARY.md

All commits verified:
- FOUND: fda4f27 feat(08-04): Simultaneous publication logic and review window management
- FOUND: d27198e feat(08-04): Cron job for review window expiration
