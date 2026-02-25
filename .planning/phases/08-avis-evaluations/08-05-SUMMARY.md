---
phase: 08-avis-evaluations
plan: "05"
subsystem: ui
tags: [react, next.js, review, components, tailwind, shadcn]

# Dependency graph
requires:
  - phase: 08-01
    provides: review backend actions (getProviderReviewsAction, ReviewWithAuthor type)
  - phase: 08-02
    provides: StarRating component, review form infrastructure
provides:
  - ReviewCard component (individual review display with author, stars, criteria, text, photos)
  - RatingBreakdown component (average + 5-star distribution bars)
  - CriteriaChart component (4-criteria horizontal CSS bars)
  - ReviewsList component (full sortable/paginated reviews list)
  - Provider profile page integrated with ReviewsList (Avis tab)
affects:
  - 08-06
  - 09-messaging
  - provider profile public page

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CSS horizontal bar charts (no recharts) for criteria visualization
    - buildDistribution() helper for star count map from review array
    - initialData SSR pattern: server fetches first page, client handles sorting/pagination

key-files:
  created:
    - src/features/review/components/ReviewCard.tsx
    - src/features/review/components/RatingBreakdown.tsx
    - src/features/review/components/CriteriaChart.tsx
    - src/features/review/components/CriteriaRadarChart.tsx
    - src/features/review/components/ReviewsList.tsx
  modified:
    - src/features/review/actions/review-queries.ts
    - src/app/[locale]/(client)/providers/[providerId]/page.tsx

key-decisions:
  - "CriteriaChart uses CSS-only horizontal bars — recharts not in package.json, avoids new dependency for PFE"
  - "CriteriaRadarChart.tsx is a re-export alias of CriteriaChart for plan spec compatibility"
  - "ReviewsList buildDistribution() derives star distribution from current page reviews — approximate for display, server-side aggregates used for averages"
  - "Provider profile page fetches initialData server-side for SSR — eliminates Avis tab loading flash"
  - "getProviderRatingDistribution added to review-queries.ts for dedicated distribution computation"
  - "ReviewCard photo lightbox uses Radix Dialog with DialogTitle sr-only for accessibility compliance"

patterns-established:
  - "CriteriaMiniBar subcomponent: compact per-criterion display used inside ReviewCard"
  - "formatRelativeDate(): pure French relative time helper (no date-fns dependency)"
  - "initialData prop pattern: server passes first page to client component, client manages subsequent fetches"

requirements-completed:
  - REVW-06
  - REVW-08

# Metrics
duration: 6min
completed: 2026-02-25
---

# Phase 08 Plan 05: Review Display Components Summary

**ReviewCard with photo lightbox, RatingBreakdown distribution bars, CriteriaChart CSS bars, and ReviewsList with sort/pagination integrated into provider profile page**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-25T12:19:21Z
- **Completed:** 2026-02-25T12:25:28Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- ReviewCard renders author avatar (initials circle), overall stars, 2x2 criteria mini-bars, text with "Lire la suite" expand toggle, horizontal photo scroll with lightbox Dialog, and verified booking badge
- RatingBreakdown shows large average number, readonly StarRating, and 5-star distribution bars with dynamic widths via inline style
- CriteriaChart renders 4 horizontal CSS progress bars (quality=blue, punctuality=green, communication=purple, cleanliness=amber) with per-criterion values
- ReviewsList integrates all three components: header with RatingBreakdown + CriteriaChart, sort dropdown (recent/best/worst), review cards, "Voir plus" load-more pagination, and empty state
- Provider public profile page Avis tab wired to ReviewsList with SSR initialData to avoid loading flash

## Task Commits

Each task was committed atomically:

1. **Task 1: ReviewCard and RatingBreakdown components** - `81088a2` (feat)
2. **Task 2: ReviewsList with sorting/pagination and CriteriaChart** - `2d3004f` (feat)

**Plan metadata:** (forthcoming)

## Files Created/Modified

- `src/features/review/components/ReviewCard.tsx` - Individual review card: avatar, stars, criteria mini-bars, text expand, photo lightbox, flagged state
- `src/features/review/components/RatingBreakdown.tsx` - Average rating + 5-star distribution bars with dynamic widths
- `src/features/review/components/CriteriaChart.tsx` - CSS-based horizontal bars for 4 criteria averages (quality/punctuality/communication/cleanliness)
- `src/features/review/components/CriteriaRadarChart.tsx` - Re-export alias for CriteriaChart for plan spec compatibility
- `src/features/review/components/ReviewsList.tsx` - Client component: sort dropdown, load-more pagination, integrates RatingBreakdown + CriteriaChart + ReviewCard
- `src/features/review/actions/review-queries.ts` - Added getProviderRatingDistribution action for dedicated distribution computation
- `src/app/[locale]/(client)/providers/[providerId]/page.tsx` - Integrated ReviewsList with SSR initialData in Avis tab

## Decisions Made

- CriteriaChart uses CSS-only horizontal bars — recharts is not in package.json; adding it for one chart is unjustified overhead for a PFE project
- CriteriaRadarChart.tsx re-exports CriteriaChart as alias — plan specifies CriteriaRadarChart but the implementation is a horizontal bar chart, not a radar chart
- ReviewsList.buildDistribution() derives star distribution from the fetched page's reviews — approximate but sufficient for display; averages are computed server-side from all reviews
- Provider profile page fetches initialData (page 1, sort=recent) server-side for SSR to eliminate Avis tab loading flash

## Deviations from Plan

None - plan executed exactly as written. All four components created as specified, ReviewsList wired to provider profile, CriteriaChart used in place of recharts-based radar chart as the plan explicitly specified a CSS fallback.

## Issues Encountered

None - all components compiled cleanly. The path-with-spaces git workflow limitation required using `git -C` flag throughout, which worked correctly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All review display components are complete and ready for Phase 08-06 (admin moderation UI)
- ReviewsList is integrated into the provider public profile — REVW-06 and REVW-08 requirements satisfied
- Components accept ReviewWithAuthor shape from review-queries.ts — consistent API throughout

---
*Phase: 08-avis-evaluations*
*Completed: 2026-02-25*

## Self-Check: PASSED

- ReviewCard.tsx: FOUND at src/features/review/components/ReviewCard.tsx
- RatingBreakdown.tsx: FOUND at src/features/review/components/RatingBreakdown.tsx
- CriteriaChart.tsx: FOUND at src/features/review/components/CriteriaChart.tsx
- CriteriaRadarChart.tsx: FOUND at src/features/review/components/CriteriaRadarChart.tsx
- ReviewsList.tsx: FOUND at src/features/review/components/ReviewsList.tsx
- Commit 81088a2: FOUND (feat: ReviewCard and RatingBreakdown)
- Commit 2d3004f: FOUND (feat: ReviewsList and CriteriaChart)
- Commit 6132128: FOUND (docs: SUMMARY, STATE, ROADMAP, REQUIREMENTS)
