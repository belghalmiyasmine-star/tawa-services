---
phase: 07-paiement-simule
plan: "03"
subsystem: payment
tags: [payment, earnings, withdrawal, dashboard, provider, i18n]
dependency_graph:
  requires:
    - 07-01 (IPaymentService + SimulatedPaymentService + Payment model with RELEASED/HELD statuses)
    - prisma/schema.prisma (Payment, WithdrawalRequest models)
    - src/components/ui (Card, Table, Tabs, Dialog, Badge, Button, Input already installed)
  provides:
    - Provider earnings page at /[locale]/provider/earnings
    - getProviderEarningsAction (available/pending/totalEarned/totalCommission)
    - getMonthlyBreakdownAction (YYYY-MM grouping of RELEASED payments)
    - getTransactionHistoryAction (HELD/RELEASED/REFUNDED per provider)
    - requestWithdrawalAction (50 TND minimum, FIFO payment selection)
    - getWithdrawalRequestsAction
  affects:
    - src/app/[locale]/(provider)/provider/earnings/page.tsx (new route)
    - src/features/payment/ (new actions + components)
tech_stack:
  added: []
  patterns:
    - Parallel Promise.all for aggregation queries
    - In-memory groupBy (year-month) from findMany results
    - FIFO withdrawal: oldest RELEASED payment without WithdrawalRequest
    - Optimistic UI refresh after withdrawal request success
    - Prisma aggregate with where.withdrawalRequest=null for available balance
key_files:
  created:
    - src/features/payment/actions/earnings-queries.ts
    - src/features/payment/actions/withdrawal-actions.ts
    - src/app/[locale]/(provider)/provider/earnings/page.tsx
    - src/features/payment/components/EarningsDashboard.tsx
    - src/features/payment/components/MonthlyBreakdownTable.tsx
    - src/features/payment/components/TransactionHistoryList.tsx
  modified: []
decisions:
  - "[07-03]: In-memory groupBy for monthly breakdown — payments per provider are bounded, avoids raw SQL dependency"
  - "[07-03]: FIFO withdrawal links to oldest available RELEASED payment — simple, deterministic, PFE-appropriate"
  - "[07-03]: Withdrawal dialog blocks if available < 50 TND at button level — UX enforcement before server validation"
  - "[07-03]: fetchEarnings extracted as named function — called on mount + after successful withdrawal to refresh balance"
metrics:
  duration: 34
  completed_date: "2026-02-24"
  tasks_completed: 2
  files_created: 6
  files_modified: 0
---

# Phase 7 Plan 03: Provider Earnings Dashboard Summary

**One-liner:** Provider earnings dashboard with balance overview (available/pending/total/commission), monthly breakdown by month, transaction history with status badges, and withdrawal request dialog enforcing 50 TND minimum.

## What Was Built

### Task 1: Earnings Query Actions and Withdrawal Action (commit: e9ae255)

**`src/features/payment/actions/earnings-queries.ts`**
- `EarningsSummary`, `MonthlyBreakdown`, `TransactionItem` TypeScript interfaces
- `getProviderEarningsAction()`: Three parallel Prisma aggregates — releasedAggregate (totalEarned + totalCommission), pendingAggregate (HELD amounts), availableAggregate (RELEASED without withdrawal request)
- `getMonthlyBreakdownAction()`: findMany RELEASED payments, in-memory groupBy YYYY-MM from releasedAt, returns sorted array (newest first)
- `getTransactionHistoryAction()`: findMany with status IN [HELD, RELEASED, REFUNDED], includes booking.service.title and booking.client.name, ordered by createdAt desc

**`src/features/payment/actions/withdrawal-actions.ts`**
- `requestWithdrawalAction(amount)`: Validates 50 TND minimum, aggregates available balance (RELEASED with no withdrawalRequest), selects oldest RELEASED payment (FIFO by releasedAt asc), creates WithdrawalRequest with PENDING status
- `getWithdrawalRequestsAction()`: Returns withdrawal request history ordered by requestedAt desc

### Task 2: Earnings Dashboard UI (commit: ed0efd1)

**`src/app/[locale]/(provider)/provider/earnings/page.tsx`**
- Server page with getServerSession PROVIDER guard
- Metadata title set
- Renders EarningsDashboard client component

**`src/features/payment/components/EarningsDashboard.tsx`** (320 lines)
- 4 balance cards in grid-cols-2 lg:grid-cols-4 with loading skeletons
- Lucide icons: DollarSign (green/available), Clock (amber/pending), TrendingUp (blue/total), Percent (gray/commissions)
- Parallel data fetch on mount: getProviderEarningsAction + getMonthlyBreakdownAction + getTransactionHistoryAction
- Withdrawal button disabled when available < 50 TND
- Dialog with amount input (min=50, max=available), confirmation with real-time balance display
- fetchEarnings extracted and called on mount + after successful withdrawal to keep balance card fresh
- Tabs for Recapitulatif mensuel | Historique des transactions

**`src/features/payment/components/MonthlyBreakdownTable.tsx`** (104 lines)
- shadcn Table with TableFooter totals row
- Intl.DateTimeFormat('fr-TN', { month: 'long', year: 'numeric' }) for French month names
- Commission column shown in red (destructive), net earnings in green
- Empty state when no data

**`src/features/payment/components/TransactionHistoryList.tsx`** (157 lines)
- Card-based list, each with service title, client name, amounts, status badge, method badge, date
- HELD=amber, RELEASED=green, REFUNDED=destructive (red) status badges
- Payment method labels: CARD=Carte, D17=D17, FLOUCI=Flouci, CASH=Especes
- Empty state with SVG illustration placeholder

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- src/features/payment/actions/earnings-queries.ts: FOUND
- src/features/payment/actions/withdrawal-actions.ts: FOUND
- src/app/[locale]/(provider)/provider/earnings/page.tsx: FOUND
- src/features/payment/components/EarningsDashboard.tsx: FOUND
- src/features/payment/components/MonthlyBreakdownTable.tsx: FOUND
- src/features/payment/components/TransactionHistoryList.tsx: FOUND
- Commit e9ae255: FOUND (feat(07-03): add earnings query actions and withdrawal action)
- Commit ed0efd1: FOUND (feat(07-03): build earnings dashboard UI...)
- TypeScript: 0 errors (PASSED via check-types.mjs)
- Line counts: page=37(>30), Dashboard=320(>60), MonthlyTable=104(>40), TxList=157(>40)
