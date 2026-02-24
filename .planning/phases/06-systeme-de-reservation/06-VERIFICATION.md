---
phase: 06-systeme-de-reservation
verified: 2026-02-24T19:30:00Z
status: human_needed
score: 5/5 must-haves verified
re_verification: false
human_verification:
  - test: "Client navigates to FIXED service and completes 3-step booking wizard end-to-end"
    expected: "After confirming on Step 3, redirect to /bookings/[id] with PENDING status shown"
    why_human: "Visual wizard flow, calendar interaction, time slot selection, and form submission require browser testing"
  - test: "Client submits a SUR_DEVIS quote request with 50+ char description"
    expected: "Success toast appears and redirect to /bookings occurs; provider sees new quote in Nouvelles demandes tab"
    why_human: "Form validation UX, toast display, and cross-role visibility require browser testing"
  - test: "Provider accepts a PENDING booking and client sees status update"
    expected: "Accept button disappears, booking moves from Nouvelles demandes to Acceptees tab, client sees ACCEPTED badge"
    why_human: "Server-action-triggered UI refresh (router.refresh()) and tab filter behavior require browser testing"
  - test: "Provider marks a booking IN_PROGRESS then COMPLETED; verify StatusTimeline on both client and provider detail pages"
    expected: "Status timeline shows animated progression with timestamps at each step for both roles"
    why_human: "Visual timeline animation, timestamp display, and cross-role consistency require browser testing"
  - test: "Client cancels PENDING booking and verifies correct refund tier displayed in dialog"
    expected: "Dialog shows green (>48h), amber (24-48h), or red (<24h) refund card matching the scheduled time"
    why_human: "Refund tier color coding, dialog display, and router.refresh() post-cancel require browser testing"
---

# Phase 6: Systeme de Reservation — Verification Report

**Phase Goal:** Un client peut reserver un service a prix fixe en 3 ecrans maximum (service -> details -> paiement), envoyer une demande de devis pour un service "sur devis", le prestataire peut accepter/rejeter les reservations et devis, et les statuts de reservation progressent correctement avec la politique d'annulation appliquee.

**Verified:** 2026-02-24T19:30:00Z
**Status:** human_needed — all automated checks pass, 5 items need browser verification
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Client peut reserver un service fixe en 3 ecrans maximum | VERIFIED | `BookingWizard.tsx` implements 3-step state machine (step 1/2/3); `StepIndicator` with 3 numbered circles; `createBookingAction` called on Step 3 confirm; book page at `/services/[serviceId]/book` fetches service and guards for FIXED only |
| 2 | Client peut envoyer devis (48h expiry), prestataire a 48h pour repondre | VERIFIED | `createQuoteAction` creates Quote with `expiresAt = now + 48h`; `respondQuoteAction` checks expiry before responding; `expireQuotesAction` batch-expires via cron; `checkAndExpireQuote` lazy check available for inline use |
| 3 | Prestataire voit reservations groupees par statut dans son dashboard | VERIFIED | `ProviderBookingsList` renders 4 tabs: "Nouvelles demandes" (PENDING bookings + PENDING quotes), "Acceptees" (ACCEPTED), "En cours" (IN_PROGRESS), "Historique" (COMPLETED/REJECTED/CANCELLED); URL `?tab=` persistence; count badges on tabs |
| 4 | Progression PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED correctement appliquee | VERIFIED | `acceptBookingAction`, `rejectBookingAction`, `startBookingAction`, `completeBookingAction` each validate current status before transition; `BookingActions` renders correct buttons per status; `StatusTimeline` component visualizes progression |
| 5 | Politique d'annulation: 100% >48h, partiel 24-48h, 0% <24h | VERIFIED | `calculateRefundPercentage` pure function in `cancellation.ts` implements 3 tiers exactly; `cancelBookingAction` applies result atomically (booking + payment update in `$transaction`); `CancelBookingDialog` imports `calculateRefundPercentage` client-side for preview before confirm |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `prisma/schema.prisma` | VERIFIED | Quote model has: `clientId`, `client User @relation("ClientQuotes")`, `address`, `city`, `preferredDate`, `budget`, `expiresAt`, `respondedAt`, `acceptedAt`, `proposedPrice`, `proposedDelay`. Booking model has `quoteId` FK linking to Quote. |
| `src/lib/validations/booking.ts` | VERIFIED | Exports all 6 schemas: `createBookingSchema`, `createQuoteSchema`, `respondQuoteSchema`, `acceptQuoteSchema`, `rejectBookingSchema`, `cancelBookingSchema` — each with exported TypeScript type via `z.infer` |
| `src/features/booking/actions/manage-bookings.ts` | VERIFIED | Exports 5 actions: `createBookingAction` (availability check + conflict detection + atomic create), `acceptBookingAction` (PENDING->ACCEPTED guard), `rejectBookingAction` (PENDING->REJECTED + reason), `startBookingAction` (ACCEPTED->IN_PROGRESS), `completeBookingAction` (IN_PROGRESS->COMPLETED + Payment HELD + completedMissions++) |
| `src/features/booking/actions/manage-quotes.ts` | VERIFIED | Exports 4 actions: `createQuoteAction` (SUR_DEVIS guard + 48h expiresAt), `respondQuoteAction` (ownership + expiry check + PENDING->RESPONDED), `acceptQuoteAction` (atomic: quote ACCEPTED + Booking + Payment created), `declineQuoteAction` (RESPONDED->DECLINED) |
| `src/features/booking/actions/booking-queries.ts` | VERIFIED | Exports 5 queries: `getClientBookingsAction`, `getProviderBookingsAction`, `getBookingDetailAction`, `getClientQuotesAction` (added in Plan 06-06), `getProviderQuotesAction` — all paginated with role-based ownership |
| `src/lib/utils/cancellation.ts` | VERIFIED | Exports `calculateRefundPercentage(scheduledAt, now?)` returning `{ tier, refundPercentage, hoursUntilScheduled }`. Logic: <24h -> NONE/0%, 24-48h -> PARTIAL/50%, >48h -> FULL/100%. Optional `now` parameter for testability. |
| `src/features/booking/actions/cancel-booking.ts` | VERIFIED | Exports `cancelBookingAction` (CLIENT, tiered refund in `$transaction`) and `cancelBookingProviderAction` (PROVIDER, always 100% refund). Imports `calculateRefundPercentage` and `cancelBookingSchema`. |
| `src/features/booking/actions/expire-quotes.ts` | VERIFIED | Exports `checkAndExpireQuote(quoteId)` (lazy check, returns boolean) and `expireQuotesAction()` (batch via `prisma.quote.updateMany`). |
| `src/app/api/cron/expire-quotes/route.ts` | VERIFIED | GET handler with `CRON_SECRET` Bearer auth (dev allows unauthenticated with warning); calls `expireQuotesAction()`; returns `{ expired, timestamp }`. |
| `src/features/booking/components/BookingWizard.tsx` | VERIFIED | "use client"; 3-step state machine; imports `AvailabilityCalendar`, `TimeSlotPicker`, `BookingConfirmation`, `PaymentMethodSelector`, `createBookingAction`; calls `createBookingAction` on Step 3 confirm; redirects to `/bookings/[bookingId]` on success |
| `src/features/booking/components/AvailabilityCalendar.tsx` | VERIFIED | Fetches from `/api/provider/availability?providerId=X&month=YYYY-MM`; month grid with disabled past/blocked/inactive dates |
| `src/features/booking/components/PaymentMethodSelector.tsx` | VERIFIED | 4 payment method cards (Carte/D17/Flouci/Especes); demo mode banner in BookingWizard Step 3 |
| `src/app/api/provider/availability/route.ts` | VERIFIED | Public GET endpoint; queries `prisma.availability`, `prisma.blockedDate`, `prisma.booking`; returns `{ weeklySchedule, blockedDates, existingBookings }` |
| `src/app/[locale]/(client)/services/[serviceId]/book/page.tsx` | VERIFIED | SSR; session guard with redirect to login; service fetch with availability; ACTIVE + FIXED guard (SUR_DEVIS redirects to /quote); renders `BookingWizard` |
| `src/features/booking/components/QuoteRequestForm.tsx` | VERIFIED | react-hook-form + zodResolver; 50-char min description with live character validation; `createQuoteAction` called on submit; success redirects to /bookings |
| `src/app/[locale]/(client)/services/[serviceId]/quote/page.tsx` | VERIFIED | SSR; session guard; pricingType check (FIXED redirects to /book); renders `QuoteRequestForm` |
| `src/features/booking/components/QuoteResponseCard.tsx` | VERIFIED | 5 status states (PENDING countdown, RESPONDED accept/decline, ACCEPTED, DECLINED, EXPIRED); countdown timer via useEffect |
| `src/features/booking/components/QuoteAcceptFlow.tsx` | VERIFIED | 2-step Dialog; `acceptQuoteAction` called on confirm |
| `src/app/[locale]/(provider)/provider/bookings/page.tsx` | VERIFIED | PROVIDER session guard; parallel fetch of bookings + PENDING/RESPONDED quotes; renders `ProviderBookingsList` |
| `src/features/booking/components/ProviderBookingsList.tsx` | VERIFIED | 4 tabs (new/accepted/in_progress/history) with count badges; URL `?tab=` persistence; `ProviderBookingCard` + `ProviderQuoteCard` rendered |
| `src/features/booking/components/ProviderQuoteCard.tsx` | VERIFIED | Inline respond form for PENDING quotes; calls `respondQuoteAction`; RESPONDED state badge |
| `src/features/booking/components/BookingActions.tsx` | VERIFIED | Renders per status: PENDING (accept/reject), ACCEPTED (start/cancel), IN_PROGRESS (complete); all call correct actions; `useTransition` loading states; `router.refresh()` after success |
| `src/app/[locale]/(provider)/provider/bookings/[bookingId]/page.tsx` | VERIFIED | Full booking detail; `getBookingDetailAction`; includes `BookingActions` and `StatusTimeline` |
| `src/app/[locale]/(client)/bookings/page.tsx` | VERIFIED | CLIENT session guard; parallel fetch of bookings + quotes; renders `ClientBookingsList` |
| `src/app/[locale]/(client)/bookings/[bookingId]/page.tsx` | VERIFIED | Full booking detail with service card, provider card, StatusTimeline, payment info, quote section, `CancelBookingButton` |
| `src/features/booking/components/ClientBookingsList.tsx` | VERIFIED | 4 tabs (A venir/En cours/Passees/Annulees); URL persistence; `QuoteResponseCard` integration for quote-based items |
| `src/features/booking/components/StatusTimeline.tsx` | VERIFIED | 4-step normal path (PENDING->ACCEPTED->IN_PROGRESS->COMPLETED) with timestamps; terminal paths (REJECTED, CANCELLED showing cancelledBy); reusable server component |
| `src/features/booking/components/CancelBookingDialog.tsx` | VERIFIED | Imports `calculateRefundPercentage` client-side; green/amber/red refund cards per tier; `cancelBookingAction` called on confirm |
| `src/components/layout/Navbar.tsx` | VERIFIED | "Mes reservations" link with CalendarCheck icon, CLIENT-only visibility guard, links to `/bookings` |
| `src/components/layout/ProviderSidebar.tsx` | VERIFIED | `/provider/bookings` in NAV_ITEMS with CalendarCheck icon; pending count badge via `useEffect` calling `getProviderBookingsAction` |
| `src/features/search/components/ServiceDetailClient.tsx` | VERIFIED | FIXED "Reserver" -> Link to `/services/[id]/book`; SUR_DEVIS "Demander un devis" -> Link to `/services/[id]/quote` |

---

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `BookingWizard.tsx` | `manage-bookings.ts` | `createBookingAction` | WIRED | Import on line 17; called on line 223 inside `startTransition` |
| `AvailabilityCalendar.tsx` | `/api/provider/availability` | fetch | WIRED | `fetch(/api/provider/availability?providerId=...&month=...)` line 97 |
| `ServiceDetailClient.tsx` | `/services/[id]/book` | Link href | WIRED | `Link href=/services/${serviceId}/book` for FIXED services |
| `ServiceDetailClient.tsx` | `/services/[id]/quote` | Link href | WIRED | `Link href=/services/${serviceId}/quote` for SUR_DEVIS services |
| `QuoteRequestForm.tsx` | `manage-quotes.ts` | `createQuoteAction` | WIRED | Import line 24; called line 113 |
| `QuoteAcceptFlow.tsx` | `manage-quotes.ts` | `acceptQuoteAction` | WIRED | Import line 17; called line 101 |
| `ProviderQuoteCard.tsx` | `manage-quotes.ts` | `respondQuoteAction` | WIRED | Import line 12; called line 102 |
| `BookingActions.tsx` | `manage-bookings.ts` | accept/reject/start/complete | WIRED | Imports lines 21-24; all 4 actions called in handlers |
| `BookingActions.tsx` | `cancel-booking.ts` | `cancelBookingProviderAction` | WIRED | Import line 25; called in `handleCancel` |
| `CancelBookingDialog.tsx` | `cancellation.ts` | `calculateRefundPercentage` | WIRED | Import line 18; called line 56 (client-side preview) |
| `CancelBookingDialog.tsx` | `cancel-booking.ts` | `cancelBookingAction` | WIRED | Import line 17; called line 83 on confirm |
| `cron/expire-quotes/route.ts` | `expire-quotes.ts` | `expireQuotesAction` | WIRED | Import line 3; called line 41 |
| `cancel-booking.ts` | `cancellation.ts` | `calculateRefundPercentage` | WIRED | Import line 9; called line 94-96 |
| `ProviderSidebar.tsx` | `booking-queries.ts` | `getProviderBookingsAction` | WIRED | Import line 20; called in useEffect line 42 |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| BOOK-01 | 06-01, 06-03, 06-07 | Client can directly book fixed-price services by selecting a time slot | SATISFIED | `createBookingAction` with availability check; `BookingWizard` 3-step flow; `/services/[id]/book` page; ServiceDetailClient "Reserver" link |
| BOOK-02 | 06-01, 06-04, 06-07 | Client can send quote request for "sur devis" services | SATISFIED | `createQuoteAction` + `respondQuoteAction` + `acceptQuoteAction`; `QuoteRequestForm` at `/services/[id]/quote`; `QuoteResponseCard` + `QuoteAcceptFlow` |
| BOOK-03 | 06-01, 06-05, 06-07 | Provider can accept or reject direct bookings and quote requests | SATISFIED | `acceptBookingAction` + `rejectBookingAction` (bookings); `respondQuoteAction` (quotes); `BookingActions` component; `ProviderQuoteCard` inline form |
| BOOK-04 | 06-01, 06-02, 06-07 | Provider has 48h to respond to quote requests before auto-expiry | SATISFIED | `createQuoteAction` sets `expiresAt = now + 48h`; `respondQuoteAction` checks `new Date() > quote.expiresAt`; `expireQuotesAction` batch + `checkAndExpireQuote` lazy + cron every 6h |
| BOOK-05 | 06-01, 06-07 | Booking status flow: PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED | SATISFIED | All 4 transition actions with status guards; `StatusTimeline` visualizes progression; `BookingActions` renders correct buttons per current status |
| BOOK-06 | 06-05, 06-06, 06-07 | Provider dashboard shows bookings by status; client has "Mes reservations" | SATISFIED | `ProviderBookingsList` 4 tabs; `ClientBookingsList` 4 tabs; both accessible from navigation |
| BOOK-07 | 06-02, 06-06, 06-07 | Cancellation policy enforced: >48h full refund, 24-48h partial, <24h no refund | SATISFIED | `calculateRefundPercentage` pure function; `cancelBookingAction` applies in `$transaction`; `CancelBookingDialog` shows refund preview before confirm |
| BOOK-08 | 06-03, 06-06, 06-07 | 3-screen maximum booking flow | SATISFIED | `BookingWizard` 3 steps (date/time -> address -> confirm+pay); `StepIndicator` with 3 circles; `QuoteAcceptFlow` 2-step dialog for quote acceptance |

All 8 requirements (BOOK-01 through BOOK-08) are SATISFIED.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `BookingWizard.tsx` | 176-181 | `getBookingsForDate` returns empty array (comment: "server-side createBookingAction prevents double-booking") | INFO | By design — server-side guard is authoritative. Calendar shows occupied slots via API. No functional gap. |

No blockers or warnings found. The empty array in `getBookingsForDate` is a documented design decision: the server-side conflict check in `createBookingAction` is the authoritative guard, and the calendar API already shows occupied slots via `existingBookings`. This is not a stub — it is intentional.

---

### Human Verification Required

#### 1. Direct Booking 3-Step Wizard End-to-End

**Test:** Log in as CLIENT. Navigate to a FIXED-price service detail page. Click "Reserver". Complete all 3 wizard steps (select date/time on calendar, enter address, select payment method, click confirm).
**Expected:** Redirect to `/bookings/[bookingId]` showing booking detail with PENDING status badge and StatusTimeline at step 1.
**Why human:** Calendar grid rendering, time slot availability display, form UX, and post-submit redirect require browser testing.

#### 2. Quote Request Flow End-to-End

**Test:** Log in as CLIENT. Navigate to a SUR_DEVIS service. Click "Demander un devis". Fill description (50+ chars), address, city. Submit. Then log in as PROVIDER and navigate to `/provider/bookings`. Check "Nouvelles demandes" tab.
**Expected:** Quote appears in PENDING state with inline respond form (price input + delay input). After responding, client sees RESPONDED state with accept/decline buttons.
**Why human:** Cross-role visibility, tab filtering, inline form display, and countdown timer require browser testing.

#### 3. Provider Booking Status Transitions

**Test:** As PROVIDER, find a PENDING booking. Click "Accepter". Verify it moves to "Acceptees" tab. Click "Demarrer le service". Verify it moves to "En cours". Click "Marquer comme termine". Verify it moves to "Historique".
**Expected:** Each action removes the booking from current tab and it appears in the correct next tab after `router.refresh()`.
**Why human:** `router.refresh()` behavior, tab filter logic after mutation, and toast display require browser testing.

#### 4. StatusTimeline Visual Progression

**Test:** After completing a booking through PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED, navigate to the booking detail page as both CLIENT (`/bookings/[id]`) and PROVIDER (`/provider/bookings/[id]`).
**Expected:** StatusTimeline shows 4 steps with: animated pulse dot on current step, solid dots on completed steps, timestamps where available, correct label for each step ("Reservation creee", "Acceptee", "En cours", "Terminee").
**Why human:** Visual timeline rendering, animated pulse CSS, and timestamp formatting require browser testing.

#### 5. Cancellation Dialog Refund Tier Display

**Test:** Find a PENDING booking. For a booking scheduled >48h away: click "Annuler" — dialog should show green "Remboursement integral: X TND". For a booking scheduled 24-48h away: amber "Remboursement partiel: X TND (50%)". For <24h: red "Aucun remboursement".
**Expected:** Color-coded refund card matches the calculated tier; confirming cancellation transitions booking to CANCELLED and shows confirmation toast.
**Why human:** Refund color display, dialog appearance, and post-cancel status update require browser testing.

---

## Gaps Summary

No automated gaps found. All 5 observable truths are supported by substantive, wired artifacts in the codebase.

The phase is architecturally complete with:
- Full backend state machine (PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED with REJECTED/CANCELLED alternatives)
- Complete quote lifecycle (PENDING -> RESPONDED -> ACCEPTED/DECLINED + auto-EXPIRED)
- 3-step booking wizard wired to server actions
- Provider dashboard with 4 status tabs and action buttons
- Client bookings dashboard with 4 tabs, cancel dialog, and refund preview
- Navigation integration for both CLIENT (Navbar + BottomNav) and PROVIDER (Sidebar + BottomNav) roles
- Cancellation policy pure function with atomic payment update

Human verification is required to confirm the visual/interactive flows work correctly in the browser (calendar interaction, tab filtering after mutations, toast display, timeline animation, and refund color coding).

---

_Verified: 2026-02-24T19:30:00Z_
_Verifier: Claude (gsd-verifier)_
