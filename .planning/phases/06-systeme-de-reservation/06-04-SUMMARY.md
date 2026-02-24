---
phase: 06-systeme-de-reservation
plan: 04
subsystem: ui
tags: [react-hook-form, zod, server-actions, quote, shadcn, next-intl]

# Dependency graph
requires:
  - phase: 06-systeme-de-reservation
    plan: 01
    provides: createQuoteAction, acceptQuoteAction, declineQuoteAction, createQuoteSchema

provides:
  - QuoteRequestForm component with 50-char description validation, address, city, optional budget/date
  - /services/[serviceId]/quote page (SSR, auth guard, pricingType redirect)
  - QuoteResponseCard with 5 status states and live countdown timer
  - QuoteAcceptFlow two-step dialog (date + payment method)
  - PaymentMethodSelector with 4 Tunisian payment options and demo banner
  - ServiceDetailClient updated to link SUR_DEVIS "Demander un devis" to /quote page

affects: [06-05, 06-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "quote-form pattern: client-side Zod mirrors server schema, live character counter for min-length textarea"
    - "countdown-timer pattern: useEffect + setInterval(60s) for remaining time display, cleanup on unmount"
    - "multi-step dialog pattern: useState step (1|2) in Dialog for sequential form completion"
    - "conditional CTA pattern: SUR_DEVIS -> Link to /quote, FIXED -> coming-soon toast (Plan 03 handles FIXED)"

key-files:
  created:
    - src/features/booking/components/QuoteRequestForm.tsx (form with 50-char validation, live counter)
    - src/features/booking/components/QuoteResponseCard.tsx (5 status states with countdown)
    - src/features/booking/components/QuoteAcceptFlow.tsx (2-step date+payment dialog)
    - src/features/booking/components/PaymentMethodSelector.tsx (4 payment methods, demo banner)
    - src/app/[locale]/(client)/services/[serviceId]/quote/page.tsx (SSR page with auth guard)
  modified:
    - src/features/search/components/ServiceDetailClient.tsx (wire SUR_DEVIS to /quote page)

key-decisions:
  - "PaymentMethodSelector created in Plan 04 (not Plan 03) — Plan 03 not yet executed, Rule 3 deviation to unblock QuoteAcceptFlow"
  - "QuoteAcceptFlow uses Dialog (not Sheet) for both mobile and desktop — simplifies implementation while maintaining mobile-first UX"
  - "scheduledAt built as noon local time (12:00:00) from date-only input — avoids timezone ambiguity for date-only selection"
  - "ServiceDetailClient FIXED button stays as coming-soon toast — Plan 03 will wire it to /book, no premature coupling"
  - "router.push in QuoteAcceptFlow uses 'as never' cast for untyped route — typed routes don't include /bookings/[id] until Phase 6 later plans"

# Metrics
duration: 10min
completed: 2026-02-24
---

# Phase 6 Plan 04: Quote Request Flow — Client UI Summary

**Quote request form, response card with countdown, and accept flow dialog — complete client-side quote lifecycle from form submission to booking creation**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-24T16:38:22Z
- **Completed:** 2026-02-24T16:48:00Z
- **Tasks:** 2
- **Files modified:** 5 (created 4, modified 1)

## Accomplishments

- Created `QuoteRequestForm` with react-hook-form + zodResolver, live character counter (50-char min), address, city, optional budget and preferred date (min: tomorrow), calls `createQuoteAction` on submit
- Created `/services/[serviceId]/quote` server page with SSR auth guard, pricingType redirect (FIXED → /book), and generateMetadata
- Updated `ServiceDetailClient` to navigate SUR_DEVIS services to `/services/[id]/quote` via Link (FIXED still pending Plan 03)
- Created `QuoteResponseCard` with 5 status states: PENDING (countdown timer), RESPONDED (accept/decline with AlertDialog), ACCEPTED (price + booking link), DECLINED, EXPIRED (48h message)
- Created `QuoteAcceptFlow` as a two-step Dialog: step 1 date selection, step 2 payment method, calls `acceptQuoteAction` and navigates to new booking
- Created `PaymentMethodSelector` as shared component (2x2 grid, 4 Tunisian payment methods, demo mode banner, checkmark selection)

## Task Commits

Each task was committed atomically:

1. **Task 1: Quote request page + form component** - `355fbf0` (feat)
2. **Task 2: Quote response card + accept flow components** - `70c965a` (feat)

## Files Created/Modified

- `src/features/booking/components/QuoteRequestForm.tsx` — Form with description (50-char min), address, city, optional preferredDate, optional budget
- `src/app/[locale]/(client)/services/[serviceId]/quote/page.tsx` — Server page with auth guard, pricingType check, generateMetadata
- `src/features/search/components/ServiceDetailClient.tsx` — Updated to link SUR_DEVIS "Demander un devis" to quote page
- `src/features/booking/components/QuoteResponseCard.tsx` — 5 status states with countdown timer and AlertDialog confirmation
- `src/features/booking/components/QuoteAcceptFlow.tsx` — 2-step Dialog for date + payment selection
- `src/features/booking/components/PaymentMethodSelector.tsx` — Shared payment method selector with 4 options

## Decisions Made

- `PaymentMethodSelector` created in this plan instead of Plan 03 — Plan 03 (direct booking wizard) had not been executed yet; creating it here unblocks QuoteAcceptFlow (Rule 3 deviation)
- `QuoteAcceptFlow` uses Dialog for all screen sizes (not Sheet for mobile) — simplifies implementation, responsive sizing handled by `max-w-md`
- `scheduledAt` built as `${date}T12:00:00` to avoid timezone ambiguity when user selects only a date
- `ServiceDetailClient` FIXED button remains as coming-soon toast — Plan 03 will complete that wire without conflict

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created PaymentMethodSelector in Plan 04 instead of importing from Plan 03**
- **Found during:** Task 2 (QuoteAcceptFlow implementation)
- **Issue:** Plan 04 spec says to "reuse PaymentMethodSelector from Plan 03 — import it", but Plan 03 has not been executed yet (no SUMMARY.md, no component files)
- **Fix:** Created `PaymentMethodSelector.tsx` as a standalone shared component in `src/features/booking/components/`. When Plan 03 runs, it can import from here or create its own version (no conflict since the path is identical to what Plan 03 would create)
- **Files modified:** `src/features/booking/components/PaymentMethodSelector.tsx` (created)
- **Commit:** `70c965a`

## Issues Encountered

- None beyond the PaymentMethodSelector pre-creation (handled as deviation above)

## User Setup Required

None — all components are client-side React, no new DB migrations or environment variables.

## Next Phase Readiness

- `QuoteResponseCard` and `QuoteAcceptFlow` are ready to be consumed by Plan 06 (client bookings list page)
- `QuoteRequestForm` renders at `/services/[id]/quote` for SUR_DEVIS services
- `PaymentMethodSelector` is available for Plan 03 (BookingWizard Step 3) to import

## Self-Check: PASSED

- FOUND: src/features/booking/components/QuoteRequestForm.tsx
- FOUND: src/features/booking/components/QuoteResponseCard.tsx
- FOUND: src/features/booking/components/QuoteAcceptFlow.tsx
- FOUND: src/features/booking/components/PaymentMethodSelector.tsx
- FOUND: src/app/[locale]/(client)/services/[serviceId]/quote/page.tsx
- FOUND: commit 355fbf0 (Task 1)
- FOUND: commit 70c965a (Task 2)
- TypeScript: 0 errors (TSC_EXIT=0)

---
*Phase: 06-systeme-de-reservation*
*Completed: 2026-02-24*
