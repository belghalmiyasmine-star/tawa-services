---
phase: 03-verification-kyc
plan: 05
subsystem: ui
tags: [next-intl, server-components, kyc, trust-badges, prisma]

# Dependency graph
requires:
  - phase: 03-02
    provides: KYC wizard UI and submission flow at /provider/kyc
  - phase: 03-04
    provides: TrustBadges component and badge computation logic

provides:
  - KycBanner server component (amber/blue contextual banner per kycStatus)
  - Updated provider dashboard with KycBanner + TrustBadges display
  - Updated admin dashboard with real-time kycPendingCount + clickable KYC card
  - KYC guard documentation in provider layout for Phase 4 implementation

affects: [phase-4-services, phase-10-admin]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server component dashboard pages: use getTranslations + getServerSession instead of useTranslations"
    - "Contextual banner pattern: async server component returning null for satisfied state"
    - "Admin KPI card with real DB count + amber dot indicator for non-zero values"
    - "Clickable stat card using Link wrapper with hover:bg-accent transition"

key-files:
  created:
    - src/components/shared/KycBanner.tsx
  modified:
    - src/app/[locale]/(provider)/provider/dashboard/page.tsx
    - src/app/[locale]/(admin)/admin/page.tsx
    - src/app/[locale]/(provider)/layout.tsx

key-decisions:
  - "KycBanner is a pure server component (no 'use client') using getTranslations — avoids client bundle overhead"
  - "TrustBadges is a 'use client' component already — provider dashboard conditionally renders it only when provider record exists"
  - "Admin KYC card wrapped in Link to /admin/kyc with hover transition — consistent with planned admin navigation"
  - "Amber dot indicator (h-2.5 w-2.5 rounded-full bg-amber-500) for kycPendingCount > 0 — visual urgency without modal"
  - "KYC guard is page-level comment in provider layout, not middleware — per CONTEXT.md design: provider CAN access dashboard/messaging before approval"
  - "Provider dashboard falls back to NOT_SUBMITTED when no provider record exists — safe default for new PROVIDER role users"

patterns-established:
  - "Provider dashboard pattern: server component queries prisma.provider with trustBadges include, renders KycBanner + TrustBadges"
  - "Admin KPI widget pattern: real DB count with optional alert indicator + Link wrapping"

requirements-completed: [KYC-05]

# Metrics
duration: 2min
completed: 2026-02-23
---

# Phase 3 Plan 05: KYC Banner, Provider Dashboard & Admin Widget Summary

**KycBanner server component (amber/blue contextual banners) + provider dashboard with TrustBadges display + admin KYC pending count widget wired to real DB query**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-23T13:33:25Z
- **Completed:** 2026-02-23T13:35:30Z
- **Tasks:** 1/1 auto tasks complete (Task 2 is human-verify checkpoint)
- **Files modified:** 4

## Accomplishments

- Created `KycBanner` async server component with 3 contextual states: amber (NOT_SUBMITTED/REJECTED), blue (PENDING), null (APPROVED)
- Converted provider dashboard to server component — now fetches `prisma.provider` with `trustBadges` include, renders KycBanner + TrustBadges
- Updated admin dashboard to real-time KYC count via `prisma.provider.count({ where: { kycStatus: "PENDING" } })` with amber dot indicator and Link to `/admin/kyc`
- Added KYC guard documentation comment in provider layout for Phase 4 implementation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create KYC banner and update provider/admin dashboards** - `1701519` (feat)

## Files Created/Modified

- `src/components/shared/KycBanner.tsx` - Async server component rendering contextual KYC status banners (amber for action needed, blue for pending, null for approved)
- `src/app/[locale]/(provider)/provider/dashboard/page.tsx` - Server component with getServerSession, prisma.provider query, KycBanner + TrustBadges rendering
- `src/app/[locale]/(admin)/admin/page.tsx` - Server component with real kycPendingCount, clickable KYC card linking to /admin/kyc with amber dot indicator
- `src/app/[locale]/(provider)/layout.tsx` - Added KYC guard comment documenting Phase 4 page-level guard requirement

## Decisions Made

- `KycBanner` is a pure server component using `getTranslations` (not `useTranslations`) — no client bundle added, SSR-friendly
- Admin KYC card wrapped in `Link` from `@/i18n/routing` for locale-aware navigation to `/admin/kyc`
- Provider dashboard falls back to `NOT_SUBMITTED` when no provider record exists — safe default for PROVIDER role users who haven't started KYC
- KYC guard is page-level (not middleware) per CONTEXT.md design decision: providers CAN access dashboard and messaging before KYC approval

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript compiled cleanly with no errors.

## Next Phase Readiness

- KYC workflow complete end-to-end: upload wizard (03-02) → admin review + approve/reject (03-03) → badges awarded (03-04) → banner on dashboard (03-05)
- Task 2 (human verification checkpoint) is pending: requires a human tester to walk through the 14-step E2E workflow
- Phase 4 (Services) can begin — KYC guard is documented in provider layout for service creation pages

---
*Phase: 03-verification-kyc*
*Completed: 2026-02-23*
