---
phase: 06-systeme-de-reservation
plan: 02
subsystem: api
tags: [cancellation, refund, cron, prisma, zod, vercel]

# Dependency graph
requires:
  - phase: 06-systeme-de-reservation/06-01
    provides: cancelBookingSchema from @/lib/validations/booking, Prisma Booking/Quote/Payment models
provides:
  - calculateRefundPercentage pure function with 3-tier refund policy (>48h=100%, 24-48h=50%, <24h=0%)
  - cancelBookingAction (CLIENT) with tiered refund in atomic transaction
  - cancelBookingProviderAction (PROVIDER) with always 100% refund
  - checkAndExpireQuote lazy expiration guard for quote operations
  - expireQuotesAction batch sweep for cron
  - GET /api/cron/expire-quotes with CRON_SECRET auth
  - vercel.json with 6-hour cron schedule
affects:
  - 06-03: quote flows should call checkAndExpireQuote before any quote operation
  - 06-04: booking detail UI shows refund tier on cancellation
  - 06-05: provider booking page can call cancelBookingProviderAction

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure utility function with optional now parameter for testability"
    - "Atomic $transaction for multi-table updates (booking + payment)"
    - "Lazy expiration check pattern — run checkAndExpireQuote before any quote operation"
    - "Vercel Cron with CRON_SECRET auth — dev mode allows unauthenticated access with warning"

key-files:
  created:
    - src/lib/utils/cancellation.ts
    - src/features/booking/actions/cancel-booking.ts
    - src/features/booking/actions/expire-quotes.ts
    - src/app/api/cron/expire-quotes/route.ts
    - vercel.json
  modified:
    - src/env.ts

key-decisions:
  - "calculateRefundPercentage accepts optional now Date for testability — pure function, zero side effects"
  - "Provider cancellation always gives 100% refund regardless of timing — provider-initiated = full responsibility"
  - "CRON_SECRET not required in dev mode — allows unauthenticated cron calls locally with console.warn"
  - "vercel.json cron runs every 6 hours (0 */6 * * *) as secondary sweep; lazy check is primary mechanism"
  - "cancelBookingSchema imported from @/lib/validations/booking (Plan 06-01) — no duplication"
  - "Partial refund (50%) updates only refundAmount + refundedAt on payment, not status — payment stays PENDING until settlement"

patterns-established:
  - "Lazy expiration: checkAndExpireQuote returns boolean — call before any quote read/mutation, return error if true"
  - "Cancellation result: { tier, refundPercentage, refundAmount } — all info for UI display in one response"

requirements-completed: [BOOK-04, BOOK-07]

# Metrics
duration: 25min
completed: 2026-02-24
---

# Phase 6 Plan 02: Cancellation Policy and Quote Expiration Summary

**Tiered refund calculation as pure utility (>48h=100%, 24-48h=50%, <24h=0%), cancel booking actions with atomic payment updates, and dual-mechanism quote expiration (lazy + 6h cron)**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-24T00:00:00Z
- **Completed:** 2026-02-24T00:25:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Pure `calculateRefundPercentage(scheduledAt, now?)` function implementing the 3-tier policy from 06-CONTEXT.md, fully testable via optional `now` parameter
- `cancelBookingAction` (CLIENT) applies refund in atomic `$transaction` — booking status + payment refundAmount updated together
- `cancelBookingProviderAction` (PROVIDER) always gives full 100% refund — provider cancellation = full client reimbursement
- `checkAndExpireQuote(quoteId)` lazy expiration guard for inline use before any quote operation
- `expireQuotesAction()` batch sweep using `prisma.quote.updateMany` for efficiency
- `GET /api/cron/expire-quotes` with Bearer CRON_SECRET validation; dev fallback logs warning and allows
- `vercel.json` created with 6-hour schedule `0 */6 * * *`

## Task Commits

Each task was committed atomically:

1. **Task 1: Cancellation policy utility + cancel booking action** - `bdff7a6` (feat)
2. **Task 2: Quote auto-expiration logic and cron endpoint** - `a9f104e` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/lib/utils/cancellation.ts` - Pure `calculateRefundPercentage` function + `CancellationTier` + `CancellationResult` types
- `src/features/booking/actions/cancel-booking.ts` - `cancelBookingAction` (CLIENT tiered refund) + `cancelBookingProviderAction` (PROVIDER full refund)
- `src/features/booking/actions/expire-quotes.ts` - `checkAndExpireQuote` (lazy) + `expireQuotesAction` (batch)
- `src/app/api/cron/expire-quotes/route.ts` - GET handler with CRON_SECRET auth, returns `{expired, timestamp}`
- `vercel.json` - Cron schedule every 6 hours
- `src/env.ts` - Added optional `CRON_SECRET` env var

## Decisions Made

- `calculateRefundPercentage` accepts optional `now` Date parameter for testability — pure function, zero side effects
- Provider cancellation always gives 100% refund regardless of timing — provider-initiated = full client responsibility
- `CRON_SECRET` not required in dev mode — allows unauthenticated cron calls locally with `console.warn`
- vercel.json cron runs every 6 hours as secondary sweep; lazy `checkAndExpireQuote` is the primary mechanism
- `cancelBookingSchema` imported from `@/lib/validations/booking` (already created by Plan 06-01)
- Partial refund (50%) updates only `refundAmount + refundedAt` on payment, not `status` — payment stays PENDING until settlement

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma client regenerated after schema already had Quote fields**
- **Found during:** Task 2 (TypeScript verification)
- **Issue:** `manage-quotes.ts` (from Plan 06-01, already on disk but not yet committed) used `address`, `city`, `preferredDate`, `budget` on Quote create, but Prisma client was outdated. TypeScript error: "Object literal may only specify known properties, and 'address' does not exist in type..."
- **Fix:** Ran `npx prisma generate` to sync Prisma client with schema (schema had already been updated). `npx prisma db push` confirmed DB was already in sync.
- **Files modified:** node_modules/@prisma/client (generated)
- **Verification:** TypeScript exit code 0 after regeneration
- **Committed in:** a9f104e (Task 2 commit, along with other Task 2 files)

**2. [Rule 1 - Bug] Removed inline schema duplication in cancel-booking.ts**
- **Found during:** Task 2 (import update)
- **Issue:** Task 1 was created with an inline `cancelBookingSchema` (Plan 06-01 hadn't been executed yet at that point) but by the time Task 2 ran, `@/lib/validations/booking` already existed with the same schema
- **Fix:** Updated cancel-booking.ts imports to use `cancelBookingSchema` from `@/lib/validations/booking`
- **Files modified:** src/features/booking/actions/cancel-booking.ts
- **Verification:** TypeScript exit code 0
- **Committed in:** a9f104e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking — Prisma client sync, 1 bug — import deduplication)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

- Plan 06-01 files were already on disk (not yet committed to git) when Plan 06-02 began — this is normal incremental execution. The TypeScript compilation check caught the Prisma client staleness and `npx prisma generate` resolved it instantly.

## User Setup Required

None - no external service configuration required. `CRON_SECRET` is optional; set it in production Vercel environment variables for security.

## Next Phase Readiness

- Cancellation actions ready for use in booking UI (Plan 06-04)
- `checkAndExpireQuote` ready to be called in quote response/accept operations (Plan 06-03)
- `expireQuotesAction` wired to cron — no further setup needed beyond deploying to Vercel
- TypeScript compiles with zero errors across all Phase 6 files implemented so far

---
*Phase: 06-systeme-de-reservation*
*Completed: 2026-02-24*
