---
phase: 07-paiement-simule
plan: "02"
subsystem: payment
tags: [payment, checkout, confirmation, ui, i18n, form-validation]
dependency_graph:
  requires:
    - 07-01 (processPaymentAction, checkoutFormSchema, PaymentMethod type)
    - 06-systeme-de-reservation (booking model with clientId, totalAmount, service relation)
    - src/features/booking/components/PaymentMethodSelector.tsx (reused)
  provides:
    - Checkout UI at /bookings/[bookingId]/checkout
    - Confirmation UI at /bookings/[bookingId]/confirmation
    - CardPaymentForm component (reusable simulated card input)
    - CheckoutPage client component with fee breakdown + 4 payment methods
    - PaymentConfirmation client component with reference number display
  affects:
    - Client booking flow: ACCEPTED booking -> checkout -> confirmation
tech_stack:
  added: []
  patterns:
    - Server page fetches + passes data to client component (SSR + client interactivity)
    - react-hook-form + zodResolver for card form validation (format-only, no real processing)
    - onValidate callback pattern for parent-child form state reporting
    - redirect() from @/i18n/routing for locale-aware server-side redirects
key_files:
  created:
    - src/app/[locale]/(client)/bookings/[bookingId]/checkout/page.tsx
    - src/features/payment/components/CheckoutPage.tsx
    - src/features/payment/components/CardPaymentForm.tsx
    - src/app/[locale]/(client)/bookings/[bookingId]/confirmation/page.tsx
    - src/features/payment/components/PaymentConfirmation.tsx
  modified: []
decisions:
  - "[07-02]: CheckoutPage uses onValidate callback from CardPaymentForm — parent owns pay button enabled state, avoids prop drilling form data"
  - "[07-02]: Card number stored as raw 16 digits, displayed with spaces (auto-format in onChange) — checkoutFormSchema validates raw digits"
  - "[07-02]: Confirmation page uses ?ref= query param for reference number — processPaymentAction returns referenceNumber, CheckoutPage pushes it in URL"
  - "[07-02]: Platform fee shown as amount * 0.05 (display only) — totalAmount already includes all fees, fee line is informational"
metrics:
  duration: 35
  completed_date: "2026-02-24"
  tasks_completed: 2
  files_created: 5
  files_modified: 0
---

# Phase 7 Plan 02: Checkout and Confirmation Pages Summary

**One-liner:** Simulated checkout UI with 4 Tunisian payment methods (card form with format validation, D17/Flouci one-click, CASH info text), fee breakdown in TND, and confirmation page with monospace reference number.

## What Was Built

### Task 1: Checkout Page with Payment Method Selection and Fee Breakdown (commit: 8bcf23e)

**`src/app/[locale]/(client)/bookings/[bookingId]/checkout/page.tsx`**
- Server component: fetches booking with `payment` + `service` relations via Prisma
- Verifies CLIENT session and `booking.clientId === session.user.id`
- If `payment.status !== "PENDING"`, redirects to `/bookings/[bookingId]` (already paid)
- Passes `{ bookingId, amount, serviceTitle, servicePrice }` to `CheckoutPage`

**`src/features/payment/components/CheckoutPage.tsx`**
- `"use client"` — state: `selectedMethod`, `isProcessing`, `isCardValid`
- Demo banner: amber bg with `t("checkout.demoBanner")` and AlertCircle icon
- Order summary card: service price + platform fee (5%) + total, all formatted as `X.XX TND`
- Reuses `PaymentMethodSelector` from `@/features/booking/components/PaymentMethodSelector`
- When CARD: renders `CardPaymentForm` inline, pay button disabled until card is valid
- When D17/FLOUCI: shows contextual info text (one-click simulated)
- When CASH: shows blue info banner about on-site payment
- On submit: calls `processPaymentAction({ bookingId, paymentMethod })`, on success navigates to `/bookings/[id]/confirmation?ref=[referenceNumber]`

**`src/features/payment/components/CardPaymentForm.tsx`**
- `"use client"` — `react-hook-form` + `zodResolver(checkoutFormSchema)` in `onChange` mode
- Props: `{ onValidate: (valid: boolean) => void; onDataChange?: (data | null) => void }`
- Card number: auto-formats display with spaces every 4 digits, stores raw 16 digits
- Expiry: auto-inserts `/` after MM, maxLength 5 (`MM/AA`)
- CVV: `type="password"`, inputMode numeric, maxLength 3
- `useEffect` subscribes to `form.watch()` to report validity upward on every change

### Task 2: Payment Confirmation Page with Reference Number (commit: 2ac78e3)

**`src/app/[locale]/(client)/bookings/[bookingId]/confirmation/page.tsx`**
- Server component: fetches booking with `payment` + `service` relations
- Verifies CLIENT session and ownership
- If no payment or `payment.status === "PENDING"`, redirects to checkout
- Uses `ref` from `searchParams` (reference number from `processPaymentAction`)
- Passes data to `PaymentConfirmation` client component

**`src/features/payment/components/PaymentConfirmation.tsx`**
- `"use client"` — displays payment success state
- Large `CheckCircle` (h-20 w-20 text-green-500) centered above title
- Title: `t("confirmation.title")` ("Paiement confirme")
- Demo banner: same amber style as checkout, with AlertCircle icon
- Reference number card: `font-mono tracking-wider` for reference display
- Payment summary: service title, amount in TND, payment method label
- Two navigation buttons: "Voir mes reservations" → `/bookings`, "Voir le detail" → `/bookings/[id]`

## Escrow + Checkout Flow

```
createBookingAction  → Payment: PENDING
                          ↓
/bookings/[id]/checkout → processPaymentAction → Payment: HELD
                          ↓
/bookings/[id]/confirmation?ref=TAWA-xxx (reference number displayed)
                          ↓
completeBookingAction → Payment: RELEASED (12% commission deducted)
```

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- src/app/[locale]/(client)/bookings/[bookingId]/checkout/page.tsx: EXISTS
- src/features/payment/components/CheckoutPage.tsx: EXISTS
- src/features/payment/components/CardPaymentForm.tsx: EXISTS
- src/app/[locale]/(client)/bookings/[bookingId]/confirmation/page.tsx: EXISTS
- src/features/payment/components/PaymentConfirmation.tsx: EXISTS
- Commit 8bcf23e: EXISTS (verified via git log)
- Commit 2ac78e3: EXISTS (verified via git log)
- TypeScript: 0 errors (EXIT:0)
