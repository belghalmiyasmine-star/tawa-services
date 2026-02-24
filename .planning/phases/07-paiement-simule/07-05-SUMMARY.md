---
phase: 07-paiement-simule
plan: 05
subsystem: payments
tags: [nextjs, prisma, typescript, i18n, booking-flow, navigation, escrow, invoice]

# Dependency graph
requires:
  - phase: 07-02
    provides: "Checkout page with 4 Tunisian payment methods and confirmation page"
  - phase: 07-03
    provides: "Provider earnings dashboard with withdrawal, commission breakdown, transaction history"
  - phase: 07-04
    provides: "Invoice generation (TAWA-INV numbers), monthly statement page, printable HTML templates"
  - phase: 06-01
    provides: "createBookingAction, acceptQuoteAction, payment model with status transitions"
provides:
  - "BookingWizard redirects to /bookings/[id]/checkout after successful booking creation"
  - "QuoteAcceptFlow redirects to /bookings/[id]/checkout after quote acceptance"
  - "Client booking detail shows payment status badges (Pending/Held/Released/Refunded) with Payer and Voir la facture actions"
  - "ClientBookingCard shows Pay badge and Invoice link based on payment status"
  - "ProviderSidebar has Mes revenus entry with DollarSign icon linking to /provider/earnings"
  - "Provider booking detail has Voir la facture / Imprimer buttons for completed bookings"
  - "Full payment lifecycle wired: booking -> checkout -> confirmation -> completion -> earnings -> invoice"
affects:
  - phase-08-notifications
  - phase-09-messagerie
  - phase-11-polish

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Payment status badge pattern: conditional UI driven by payment.status enum (PENDING/HELD/RELEASED/REFUNDED)"
    - "Navigation wiring: post-action router.push to checkout after booking/quote creation"
    - "i18n consolidation: duplicate namespace merge into single top-level payment block in fr.json"

key-files:
  created: []
  modified:
    - "src/features/booking/components/BookingWizard.tsx"
    - "src/features/booking/components/QuoteAcceptFlow.tsx"
    - "src/features/booking/components/ClientBookingCard.tsx"
    - "src/app/[locale]/(client)/bookings/[bookingId]/page.tsx"
    - "src/components/layout/ProviderSidebar.tsx"
    - "src/messages/fr.json"

key-decisions:
  - "[07-05]: Duplicate 'payment' namespace in fr.json merged — method/status keys consolidated into single top-level payment block"
  - "[07-05]: Provider invoice access added to provider booking detail page (not just earnings dashboard)"
  - "[07-05]: PAYMENT_METHOD_LABELS updated across 4 files: D17 -> 'D17 (Poste tunisienne)', CASH -> 'Especes (paiement a la prestation)'"

patterns-established:
  - "Payment status gate pattern: booking detail reads payment.status and renders appropriate CTA (Pay button / Held badge / Invoice link / Refunded badge)"
  - "Post-booking redirect to checkout: all booking creation paths (direct wizard + quote acceptance) now route through checkout before confirmation"

requirements-completed:
  - PAY-01
  - PAY-03

# Metrics
duration: ~45min
completed: 2026-02-25
---

# Phase 7 Plan 05: Payment Navigation Wiring Summary

**Full payment lifecycle wired into booking flows: BookingWizard and QuoteAcceptFlow redirect to checkout, booking detail shows payment status badges with Pay/Invoice CTAs, and provider sidebar gains Mes revenus earnings navigation.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-02-24
- **Completed:** 2026-02-25
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify)
- **Files modified:** 6

## Accomplishments

- BookingWizard now redirects to `/bookings/[id]/checkout` after successful booking creation instead of staying at the success step — all 4 payment methods flow through checkout
- QuoteAcceptFlow redirects to `/bookings/[id]/checkout` after quote acceptance, completing the sur-devis payment path
- Client booking detail page shows conditional UI by payment status: "Payer" button (PENDING), "Paiement retenu" badge (HELD), "Paiement libere" badge + "Voir la facture" link (RELEASED), "Rembourse" badge (REFUNDED)
- ClientBookingCard shows Pay badge and Facture link based on live payment status
- ProviderSidebar updated with "Mes revenus" entry (DollarSign icon) linking to `/provider/earnings`
- Provider booking detail page wired with "Voir la facture" and "Imprimer" buttons for completed bookings
- Duplicate `payment` namespace in fr.json merged — all method/status i18n keys consolidated into a single top-level payment block
- End-to-end payment lifecycle verified manually: booking → checkout → confirmation → earnings → invoice flows all functional

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire checkout into booking flow and add earnings to provider sidebar** - `1b9d9e1` (feat)
2. **Bug fix: Add missing payment i18n keys and provider invoice access** - `2a9d2b3` (fix)
3. **Task 2: End-to-end payment flow verification** - checkpoint (human-approved)

## Files Created/Modified

- `src/features/booking/components/BookingWizard.tsx` - Added `router.push` to `/bookings/[id]/checkout` after `createBookingAction` success
- `src/features/booking/components/QuoteAcceptFlow.tsx` - Added `router.push` to `/bookings/[id]/checkout` after `acceptQuoteAction` success
- `src/features/booking/components/ClientBookingCard.tsx` - Added conditional Pay badge and Invoice link based on payment.status
- `src/app/[locale]/(client)/bookings/[bookingId]/page.tsx` - Added payment status section with PENDING/HELD/RELEASED/REFUNDED conditional UI and action buttons
- `src/components/layout/ProviderSidebar.tsx` - Added "Mes revenus" nav entry with DollarSign icon linking to /provider/earnings
- `src/messages/fr.json` - Merged duplicate payment namespace, added navigation.earnings, booking.payNow, booking.viewInvoice, booking.paymentPending/Held/Released/Refunded keys

## Decisions Made

- **Duplicate fr.json namespace merge:** The fr.json had a duplicate `payment` key at top level. The duplicate was merged — all method/status keys consolidated into one block. Fixes runtime translation resolution.
- **Provider invoice access:** Added "Voir la facture" and "Imprimer" buttons directly on the provider booking detail page (not only via the earnings dashboard). Providers can access invoices from whichever flow they use.
- **PAYMENT_METHOD_LABELS descriptive labels:** D17 updated to "D17 (Poste tunisienne)" and CASH to "Especes (paiement a la prestation)" across 4 files — more user-friendly at checkout and in earnings tables.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added missing payment i18n keys and provider invoice access**
- **Found during:** Task 1 post-verification (TypeScript compile check)
- **Issue:** fr.json had a duplicate `payment` namespace causing key resolution failures; provider booking detail lacked invoice/print access even after payment RELEASED
- **Fix:** Merged duplicate payment namespace into single top-level block; added Voir la facture/Imprimer buttons to provider booking detail page; updated PAYMENT_METHOD_LABELS with descriptive labels across 4 files
- **Files modified:** `src/messages/fr.json`, `src/app/[locale]/(provider)/provider/bookings/[bookingId]/page.tsx`, and 3 payment method files
- **Verification:** TypeScript compile clean, i18n keys resolve correctly
- **Committed in:** `2a9d2b3` (fix(07-05): add missing payment i18n keys and provider invoice access)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical i18n and provider access)
**Impact on plan:** Fix was necessary for correct i18n resolution and provider UX completeness. No scope creep.

## Issues Encountered

- fr.json had a duplicate top-level `payment` key — Next.js/next-intl silently takes the last occurrence, causing some keys (method labels) to be undefined. Merged into one block during Task 1 fix commit.

## User Setup Required

None - no external service configuration required. All payment flows use the simulated IPaymentService.

## Next Phase Readiness

- Full simulated payment lifecycle is complete and verified: PAY-01 through PAY-08 requirements all satisfied across Plans 07-01 to 07-05
- Phase 7 (Paiement Simule) is now COMPLETE — all 5 plans executed and verified
- Phase 8 (Notifications) can begin — it depends on booking status transitions (now fully wired) and payment events (HELD/RELEASED/REFUNDED) as notification triggers
- No blockers or concerns

---
*Phase: 07-paiement-simule*
*Completed: 2026-02-25*
