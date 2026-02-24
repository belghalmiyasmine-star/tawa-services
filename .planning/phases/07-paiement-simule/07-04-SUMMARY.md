---
phase: 07-paiement-simule
plan: "04"
subsystem: payment
tags: [payment, invoice, statement, print, i18n, provider, client]
dependency_graph:
  requires:
    - 07-01 (IPaymentService + SimulatedPaymentService + Payment model HELD/RELEASED statuses)
    - 07-03 (EarningsDashboard, MonthlyBreakdownTable, TransactionHistoryList, earnings-queries)
    - prisma/schema.prisma (Payment with releasedAt, Booking with client/provider/service relations)
  provides:
    - getInvoiceDataAction (TAWA-INV-YYYYMMDD-XXXXXX invoice number generation)
    - getMonthlyStatementAction (monthly RELEASED payments aggregation for provider)
    - InvoiceTemplate (printable invoice with @media print CSS for both client and provider views)
    - MonthlyStatementPage (printable monthly statement with summary cards and transaction table)
    - Client invoice route at /bookings/[bookingId]/invoice
    - Provider invoice route at /provider/earnings/invoice/[paymentId]
    - Monthly statement route at /provider/earnings/statement/[month]
    - Navigation links from MonthlyBreakdownTable and TransactionHistoryList
    - PAY-07: 5-year retention notice in EarningsDashboard footer and invoice footers
  affects:
    - 07-05 (navigation wiring — invoice links now available)
    - Phase 08+ (invoice links available from booking detail pages)
tech_stack:
  added: []
  patterns:
    - Server page fetches data + passes as props to client component (no client-side fetch for invoices)
    - InvoiceData interface exported from invoice-actions.ts for type-safe prop passing
    - window.print() + @media print CSS for print-without-dependencies approach (no PDF library)
    - TAWA-INV-{yyyyMMdd}-{last6OfPaymentId} deterministic invoice number format
key_files:
  created:
    - src/features/payment/actions/invoice-actions.ts
    - src/features/payment/components/InvoiceTemplate.tsx
    - src/app/[locale]/(client)/bookings/[bookingId]/invoice/page.tsx
    - src/app/[locale]/(provider)/provider/earnings/invoice/[paymentId]/page.tsx
    - src/features/payment/components/MonthlyStatementPage.tsx
    - src/app/[locale]/(provider)/provider/earnings/statement/[month]/page.tsx
  modified:
    - src/features/payment/components/MonthlyBreakdownTable.tsx
    - src/features/payment/components/TransactionHistoryList.tsx
    - src/features/payment/components/EarningsDashboard.tsx
    - src/messages/fr.json
    - src/features/booking/actions/booking-queries.ts
key_decisions:
  - "[07-04]: Native Intl.DateTimeFormat used instead of date-fns — date-fns not in package.json, avoids installing new dependency for simple formatting"
  - "[07-04]: formatDateCompact() helper in invoice-actions.ts for TAWA-INV date portion — pure Date arithmetic, no library"
  - "[07-04]: @media print targets #invoice-printable and #statement-printable divs — allows printing any page cleanly without nav/footer"
  - "[07-04]: Provider invoice page fetches payment first to extract bookingId, then calls getInvoiceDataAction — single source of truth for authorization"
  - "[07-04]: getMonthlyStatementAction uses date range (startOfMonth to startOfNextMonth) for precise month filtering"
patterns-established:
  - "Invoice data server actions: fetch all relations in one Prisma query, map to typed interface, return ActionResult"
  - "Print pages: inject <style> with @media print inline, use no-print CSS class for action bar, id on printable div"
requirements-completed: [PAY-04, PAY-05, PAY-07]
duration: 25min
completed: "2026-02-24"
---

# Phase 7 Plan 04: Invoice Generation and Monthly Statements Summary

**HTML-rendered printable invoices with TAWA-INV number generation, provider monthly statements with transaction breakdown, and 5-year retention notice (PAY-04, PAY-05, PAY-07).**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-24T22:07:50Z
- **Completed:** 2026-02-24T22:33:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Invoice generation with unique TAWA-INV-YYYYMMDD-XXXXXX numbers accessible by both client and provider
- Printable InvoiceTemplate with @media print CSS — client view (total only) and provider view (gross + commission + net)
- Monthly earnings statement page at /provider/earnings/statement/[month] with summary cards and transaction table
- Navigation links wired from MonthlyBreakdownTable (Voir -> statement) and TransactionHistoryList (Facture -> invoice)
- PAY-07 retention notice: "Les documents financiers sont conserves pendant 5 ans" in dashboard footer and all document footers

## Task Commits

Each task was committed atomically:

1. **Task 1: Invoice data actions and printable invoice template** - `a71dc26` (feat)
2. **Task 2: Monthly statement page and navigation wiring** - `def94a1` (feat)

**Plan metadata:** (created in this step)

## Files Created/Modified

- `src/features/payment/actions/invoice-actions.ts` - getInvoiceDataAction + getMonthlyStatementAction + InvoiceData/MonthlyStatementData types (303 lines)
- `src/features/payment/components/InvoiceTemplate.tsx` - Printable invoice with print CSS, client/provider views (324 lines)
- `src/app/[locale]/(client)/bookings/[bookingId]/invoice/page.tsx` - Client invoice server page (63 lines)
- `src/app/[locale]/(provider)/provider/earnings/invoice/[paymentId]/page.tsx` - Provider invoice server page (93 lines)
- `src/features/payment/components/MonthlyStatementPage.tsx` - Monthly statement with summary cards and table (281 lines)
- `src/app/[locale]/(provider)/provider/earnings/statement/[month]/page.tsx` - Statement route page (69 lines)
- `src/features/payment/components/MonthlyBreakdownTable.tsx` - Added Voir link per row to statement page
- `src/features/payment/components/TransactionHistoryList.tsx` - Added Facture link for RELEASED payments
- `src/features/payment/components/EarningsDashboard.tsx` - Added retention notice footer
- `src/messages/fr.json` - Added earnings.retentionNotice key
- `src/features/booking/actions/booking-queries.ts` - Bug fix: added payment select in getProviderBookingsAction

## Decisions Made

- Used `Intl.DateTimeFormat` instead of `date-fns` — `date-fns` is not in package.json and the formatting needed is achievable with the Web API
- Pure `formatDateCompact()` helper for invoice number date portion — `${y}${m}${d}` string construction, zero dependencies
- Client invoice page uses `getInvoiceDataAction(bookingId)` directly — action handles its own authorization (both client and provider access)
- Provider invoice page fetches payment by paymentId first to retrieve bookingId, then delegates to `getInvoiceDataAction`
- `@media print` CSS injected inline in component via `<style>` tag — avoids global CSS coupling, self-contained components

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed missing payment field in getProviderBookingsAction**
- **Found during:** Task 1 (TypeScript verification)
- **Issue:** `booking-queries.ts` had uncommitted changes where `BookingListItem.payment` was declared in the interface but not selected in the Prisma query or mapped in the return, causing a TypeScript type error
- **Fix:** Added `payment: { select: { method, status } }` to the Prisma include and mapped `b.payment` to the return object
- **Files modified:** `src/features/booking/actions/booking-queries.ts`
- **Verification:** TypeScript: PASSED (0 errors)
- **Committed in:** `a71dc26` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Necessary correctness fix, no scope creep.

## Issues Encountered

None — all tasks executed cleanly after the pre-existing TypeScript error was fixed.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- PAY-04 (auto-generated invoices), PAY-05 (monthly statements), PAY-07 (5-year retention) requirements complete
- Invoice links available from transaction history and monthly breakdown table
- Client invoice route at /bookings/[bookingId]/invoice ready for linking from booking detail pages
- Provider invoice route at /provider/earnings/invoice/[paymentId] ready
- Ready for Plan 07-05 (final payment integration wiring)

---
*Phase: 07-paiement-simule*
*Completed: 2026-02-24*
