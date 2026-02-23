---
phase: 03-verification-kyc
plan: 04
subsystem: ui
tags: [trust-badges, lucide-react, next-intl, prisma, shadcn-badge]

# Dependency graph
requires:
  - phase: 03-03
    provides: "approveKycAction creates IDENTITY_VERIFIED TrustBadge on KYC approval; TrustBadge model in Prisma schema"

provides:
  - "TrustBadges reusable client component with blue/green/gold badges and gray Non-verifie fallback"
  - "computeAndAwardBadges server action for auto-awarding QUICK_RESPONSE and TOP_PROVIDER badges"
  - "getProviderBadges server helper for fetching active badges in server components"

affects: [provider-profile, provider-card, service-card, booking-confirmation, Phase 5, Phase 6, Phase 8]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TrustBadges receives raw badges array + kycStatus — parent server component fetches via getProviderBadges"
    - "Auto-badge upsert pattern: computeAndAwardBadges called after data-changing events (booking complete, rating update)"
    - "Native title attribute for tooltips — no external tooltip library needed"
    - "Size variants (sm/md) for reuse across cards and profile pages"

key-files:
  created:
    - src/components/shared/TrustBadges.tsx
    - src/features/kyc/actions/compute-badges.ts
  modified:
    - src/messages/fr.json

key-decisions:
  - "TrustBadges uses native HTML title attribute for tooltips — no shadcn Tooltip component needed (not installed)"
  - "computeAndAwardBadges handles only QUICK_RESPONSE and TOP_PROVIDER — IDENTITY_VERIFIED managed by approveKycAction"
  - "Added badgeTooltipQuickResponse, badgeTooltipTopProvider, badgeNonVerified to fr.json for per-badge tooltip text"
  - "When APPROVED but no active badges: component returns null (edge case — no gray badge when KYC is approved)"

patterns-established:
  - "Badge computation: upsert with isActive flag (true or false) — never delete, always update"
  - "Defensive provider lookup: return silently if not found — no error propagation"
  - "getProviderBadges: only returns isActive=true badges — parent components never need to filter"

requirements-completed: [KYC-06, KYC-04]

# Metrics
duration: 8min
completed: 2026-02-23
---

# Phase 3 Plan 04: Trust Badges Summary

**Reusable TrustBadges component (blue/green/gold badges) with computeAndAwardBadges server action using prisma.trustBadge.upsert for QUICK_RESPONSE (< 1h) and TOP_PROVIDER (> 4.5 rating + > 10 missions)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-23T13:28:00Z
- **Completed:** 2026-02-23T13:36:00Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments

- TrustBadges component renders blue "Identite Verifiee" (BadgeCheck), green "Reponse Rapide" (Zap), gold "Top Prestataire" (Award) badges with native title tooltips
- Non-verified providers (kycStatus !== "APPROVED") show gray "Non verifie" Shield badge
- computeAndAwardBadges auto-awards QUICK_RESPONSE (responseTimeHours < 1) and TOP_PROVIDER (rating > 4.5 AND completedMissions > 10)
- getProviderBadges helper fetches active badges for use in server components
- Per-badge tooltip translations added to fr.json

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TrustBadges component and badge computation logic** - `bd16e0d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/shared/TrustBadges.tsx` - Client component displaying trust badges; shows Non-verifie gray badge when not approved, color-coded badges when approved
- `src/features/kyc/actions/compute-badges.ts` - Server action with computeAndAwardBadges (auto-award QUICK_RESPONSE + TOP_PROVIDER via upsert) and getProviderBadges helper
- `src/messages/fr.json` - Added badgeTooltipQuickResponse, badgeTooltipTopProvider, badgeNonVerified translation keys

## Decisions Made

- Used native HTML `title` attribute for tooltips since shadcn Tooltip component is not installed in this project — avoids unnecessary dependency
- computeAndAwardBadges does not touch IDENTITY_VERIFIED — that badge is created by approveKycAction in Plan 03 to maintain single responsibility
- When KYC is APPROVED but no badges are active (edge case), component returns null rather than showing Non-verifie (which would be misleading for an approved provider)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added per-badge tooltip translation keys to fr.json**
- **Found during:** Task 1 (TrustBadges component)
- **Issue:** Plan required distinct tooltip text for each badge type, but fr.json only had a single `badgeTooltip` key covering IDENTITY_VERIFIED. QUICK_RESPONSE and TOP_PROVIDER had no tooltip translations.
- **Fix:** Added `badgeTooltipQuickResponse`, `badgeTooltipTopProvider`, and `badgeNonVerified` to fr.json with the exact text specified in the plan
- **Files modified:** src/messages/fr.json
- **Verification:** TypeScript compiles cleanly; component references valid translation keys
- **Committed in:** bd16e0d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical translation key)
**Impact on plan:** Required for correctness — missing translation keys would cause runtime errors in next-intl. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- TrustBadges component ready for integration into provider profile pages (Phase 5), ProviderCard, ServiceCard, and booking confirmation
- computeAndAwardBadges ready to be called from booking completion hook (Phase 6) and rating update (Phase 8)
- getProviderBadges ready for use in any server component rendering provider data

---
*Phase: 03-verification-kyc*
*Completed: 2026-02-23*
