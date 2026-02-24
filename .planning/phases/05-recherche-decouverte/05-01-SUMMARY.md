---
phase: 05-recherche-decouverte
plan: 01
subsystem: api
tags: [prisma, zod, next-api-routes, search, filtering, pagination, i18n]

# Dependency graph
requires:
  - phase: 04-profil-prestataire-services
    provides: Service and Provider models with category, delegation, KYC status, rating fields

provides:
  - GET /api/search/services — filtered, sorted, paginated service search endpoint
  - GET /api/search/categories — active categories with service counts
  - searchParamsSchema Zod schema for all search/filter/sort/pagination params
  - Complete "search" i18n namespace in fr.json (61 keys covering all Phase 5 UI needs)

affects:
  - 05-recherche-decouverte (plans 02, 03, 04 depend on these endpoints for page data)
  - Any future plan needing service or category search

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Prisma.ServiceWhereInput / Prisma.ProviderWhereInput for type-safe dynamic where clauses
    - Dynamic filter accumulation pattern with providerFilter object spread
    - searchParamsSchema with z.coerce for URL string to number/boolean coercion
    - Parent-category resolution (find category, check children, build categoryIds list)

key-files:
  created:
    - src/lib/validations/search.ts
    - src/app/api/search/services/route.ts
    - src/app/api/search/categories/route.ts
  modified:
    - src/messages/fr.json
    - src/features/search/components/ProviderMiniCard.tsx

key-decisions:
  - "Prisma.ServiceWhereInput and Prisma.ProviderWhereInput used instead of Parameters<typeof prisma.service.findMany>[0] — more readable and type-safe for dynamic filter building"
  - "Parent category resolves to children IDs via preliminary DB query — avoids complex nested Prisma query"
  - "z.coerce used for numeric/boolean URL params — URL searchParams are always strings"
  - "providerFilter accumulated as ProviderWhereInput object before assigning to where.provider — avoids partial spread issues with AND/OR logic"

patterns-established:
  - "Dynamic Prisma where: accumulate filters into typed WhereInput object, assign provider sub-filter as single ProviderWhereInput"
  - "Public search endpoints use Prisma.XWhereInput types directly for dynamic where clauses"

requirements-completed: [SRCH-01, SRCH-02, SRCH-04]

# Metrics
duration: 15min
completed: 2026-02-24
---

# Phase 5 Plan 01: Recherche & Decouverte — Search API Summary

**Public search and categories API with dynamic Prisma filtering (category slug, city, price, verified, rating), multi-field sort, and pagination; plus complete "search" i18n namespace for all Phase 5 UI**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-24T13:33:25Z
- **Completed:** 2026-02-24T13:48:00Z
- **Tasks:** 2
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- Built GET /api/search/services with 8 filter dimensions (q, category, city, delegation, minPrice, maxPrice, pricingType, verified, minRating), 5 sort options, and pagination
- Built GET /api/search/categories returning all active categories with per-category ACTIVE service counts and parent relation
- Created searchParamsSchema (Zod) covering all filter/sort/pagination query params with URL string coercion
- Merged and completed "search" i18n namespace in fr.json with 61 keys (all Phase 5 UI labels, previously had partial keys from pre-existing code)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create search validation schemas and categories API** - `5d22241` (feat)
2. **Task 2: Create service search API endpoint with filters, sort, and pagination** - `cf8cc05` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/lib/validations/search.ts` — Zod searchParamsSchema with all filter, sort, pagination params and z.coerce for URL string types
- `src/app/api/search/categories/route.ts` — Public GET endpoint returning active categories with ACTIVE service counts and parent relation
- `src/app/api/search/services/route.ts` — Public GET endpoint with dynamic Prisma where clause, multiple sort strategies, parallel count+data queries, paginated JSON response
- `src/messages/fr.json` — Merged "search" namespace (two pre-existing partial entries consolidated into one complete namespace with all 61 required keys)
- `src/features/search/components/ProviderMiniCard.tsx` — Bug fix: replaced invalid `title` prop with `aria-label` on Lucide CheckCircle2 icon

## Decisions Made

- Used `Prisma.ServiceWhereInput` and `Prisma.ProviderWhereInput` typed objects instead of `Parameters<typeof prisma.service.findMany>[0]["where"]` — avoids TypeScript inference issues and is more readable
- Parent category resolves to children via a preliminary `findUnique` query — simpler than a nested OR with parentId filter
- `z.coerce` on numeric/boolean schema fields — all URL params arrive as strings, coercion is the correct approach
- Provider-level filters accumulated into a single `providerFilter: Prisma.ProviderWhereInput` object before assignment — avoids overwriting `where.provider` across multiple filter conditions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed invalid `title` prop on Lucide icon in ProviderMiniCard**
- **Found during:** Task 1 (TypeScript compilation check)
- **Issue:** `ProviderMiniCard.tsx` passed `title` prop to `<CheckCircle2>` (Lucide icon), which only accepts `LucideProps` (no `title`). This caused TS error TS2322.
- **Fix:** Replaced `title={t("verifiedBadge")}` with `aria-label={t("verifiedBadge")}` — semantically correct for accessibility
- **Files modified:** `src/features/search/components/ProviderMiniCard.tsx`
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** `5d22241` (Task 1 commit)

**2. [Rule 1 - Bug] Merged duplicate "search" key in fr.json**
- **Found during:** Task 1 (i18n key insertion)
- **Issue:** fr.json already had a partial "search" namespace (added by a pre-existing session) with different keys; inserting the plan's required keys created a second duplicate "search" key which is invalid JSON semantically
- **Fix:** Merged both sets of search keys into a single consolidated "search" namespace with all 61 keys
- **Files modified:** `src/messages/fr.json`
- **Verification:** `node -e "JSON.parse(fs.readFileSync(...))"` succeeds; 17 top-level keys, 61 search sub-keys
- **Committed in:** `5d22241` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both auto-fixes necessary for TypeScript correctness. No scope creep.

## Issues Encountered

- Bash shell throws "Permission denied" on every command due to the path containing spaces (`C:/Users/pc dell/...`). This is a shell environment limitation — commands still execute correctly via Node.js child_process. All verification done via `node -e` wrapper.

## Next Phase Readiness

- GET /api/search/services ready for consumption by Phase 5 plan 03 (search results page)
- GET /api/search/categories ready for consumption by Phase 5 plan 02/04 (categories browse page)
- searchParamsSchema can be reused in UI components for form state validation
- All i18n keys pre-populated in fr.json — Phase 5 UI components can use `useTranslations("search")` immediately

## Self-Check: PASSED

All created files verified:
- `src/lib/validations/search.ts` — FOUND
- `src/app/api/search/services/route.ts` — FOUND
- `src/app/api/search/categories/route.ts` — FOUND
- `.planning/phases/05-recherche-decouverte/05-01-SUMMARY.md` — FOUND

All commits verified:
- `5d22241` (Task 1) — FOUND in git log
- `cf8cc05` (Task 2) — FOUND in git log

TypeScript: PASSED (0 errors via `npx tsc --noEmit`)

---
*Phase: 05-recherche-decouverte*
*Completed: 2026-02-24*
