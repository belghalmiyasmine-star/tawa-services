---
phase: 05-recherche-decouverte
plan: "05"
subsystem: ui
tags: [nextjs, prisma, react, categories, search, navigation, i18n]

# Dependency graph
requires:
  - phase: 05-01
    provides: searchServices() query builder and Prisma search infrastructure
  - phase: 05-02
    provides: Service detail page (/services/[serviceId])
  - phase: 05-03
    provides: CategoryGrid, SearchFilters, SearchResultsGrid, /services and /services/[categorySlug] pages
  - phase: 05-04
    provides: SearchAutocomplete component and /api/search/categories route
provides:
  - Homepage converted to async server component with DB-driven CategoryGrid and SearchAutocomplete in hero
  - Navbar CATEGORIES dropdown replaced with API-fetched live DB categories
  - /categories/[categorySlug] route (moved from /services/[categorySlug] to resolve route conflict)
  - Complete Phase 5 search & discovery flow verified end-to-end by user
affects: [06-reservations-paiements, 07-tableau-de-bord-client, phase-ui-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Async server component pattern for homepage — getTranslations replaces useTranslations
    - Client component API fetch pattern — useEffect + fetch('/api/search/categories') for Navbar
    - Route conflict resolution — dynamic segments at same nesting level require distinct prefixes
    - Service count aggregation — root categories aggregate children's services via Prisma _count

key-files:
  created: []
  modified:
    - src/app/[locale]/(client)/page.tsx
    - src/components/layout/Navbar.tsx
    - src/app/[locale]/(client)/categories/[categorySlug]/page.tsx
    - src/messages/fr.json

key-decisions:
  - "Homepage converted to async server component — getTranslations replaces useTranslations for SSR"
  - "Navbar fetches categories via useEffect + fetch('/api/search/categories') — client component cannot call Prisma directly"
  - "Category browse route moved from /services/[categorySlug] to /categories/[categorySlug] — prevents dynamic route conflict with /services/[serviceId]"
  - "Root category service counts aggregate children categories' services via two-level Prisma query"
  - "navigation.allCategories i18n key added to fr.json — zero hardcoded French strings"

patterns-established:
  - "Async server component + getTranslations: use for any page that needs both i18n and DB data"
  - "Client component DB access via fetch API: never import Prisma in 'use client' components"
  - "Route grouping: /services/[id] for service detail, /categories/[slug] for category browse — no collision"

requirements-completed: [SRCH-01, SRCH-05]

# Metrics
duration: ~60min (including bug fixes during verification)
completed: 2026-02-24
---

# Phase 5 Plan 05: Integration & End-to-End Verification Summary

**Homepage wired with DB-driven CategoryGrid + SearchAutocomplete hero, Navbar dynamically fetches categories from API, route conflict resolved by moving category browse to /categories/[slug], full Phase 5 search-to-detail flow verified end-to-end.**

## Performance

- **Duration:** ~60 min (including 4 post-task bug fixes during human verification)
- **Started:** 2026-02-24
- **Completed:** 2026-02-24
- **Tasks:** 2 (Task 1 auto, Task 2 checkpoint:human-verify — approved)
- **Files modified:** ~6

## Accomplishments

- Homepage (`page.tsx`) converted from client component to async server component; hardcoded `CATEGORY_ITEMS` removed; real DB categories rendered via `CategoryGrid` with live service counts; `SearchAutocomplete` added to hero section
- Navbar `CATEGORIES` static array replaced with `useEffect` fetch from `/api/search/categories`; skeleton loading state added; "Voir toutes les categories" footer link added
- Route conflict between `/services/[categorySlug]` and `/services/[serviceId]` resolved by moving category browse to `/categories/[categorySlug]`
- Complete Phase 5 flow verified: homepage → category → results → filter → service detail → provider profile

## Task Commits

Each task was committed atomically:

1. **Task 1: Update homepage and Navbar with DB-driven categories** - `e32cfb0` (feat)
2. **Task 2: Verify complete search & discovery flow** - checkpoint approved by user (no code commit)

### Bug Fix Commits (applied during Task 2 verification)

- `88b5392` fix(05-05): resolve dynamic route conflict — move categories to /categories/[slug]
- `d250129` fix(05-05): add missing navigation.allCategories i18n key
- `8c5ced3` fix(05-05): fix 3 category bugs — icons rendering, list mismatch, navigation
- `34c6402` fix(05-05): count services in child categories for root category totals

## Files Created/Modified

- `src/app/[locale]/(client)/page.tsx` — Converted to async server component; DB-driven CategoryGrid + SearchAutocomplete hero
- `src/components/layout/Navbar.tsx` — Categories dropdown now fetches from `/api/search/categories` on mount
- `src/app/[locale]/(client)/categories/[categorySlug]/page.tsx` — Category browse page moved from /services/[slug] to /categories/[slug]
- `src/messages/fr.json` — Added `navigation.allCategories` i18n key

## Decisions Made

- Homepage async server component pattern chosen so page can directly query Prisma without an intermediate API route
- Navbar uses `useEffect` + `fetch` instead of props from layout — keeps layout simpler, Navbar self-contained
- `/categories/[categorySlug]` chosen as new route instead of `/services/[categorySlug]` — Next.js dynamic segments at the same level cannot coexist with different param names without a prefix distinction
- Root category service counts include children categories' services — user-visible count reflects all nested services, not just direct ones

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dynamic route conflict between /services/[categorySlug] and /services/[serviceId]**
- **Found during:** Task 2 verification (human-verify checkpoint)
- **Issue:** Two dynamic segments at the same `/services/[param]` nesting level caused Next.js routing ambiguity; category browse URL collided with service detail URL
- **Fix:** Moved category browse page from `services/[categorySlug]/page.tsx` to `categories/[categorySlug]/page.tsx`; updated all links accordingly
- **Files modified:** `src/app/[locale]/(client)/categories/[categorySlug]/page.tsx`, navigation links
- **Committed in:** `88b5392`

**2. [Rule 1 - Bug] Missing `navigation.allCategories` i18n key**
- **Found during:** Task 2 verification
- **Issue:** Navbar "Voir toutes les categories" link used a translation key that did not exist in `fr.json`, causing a missing-key error in the UI
- **Fix:** Added `navigation.allCategories` key to `src/messages/fr.json`
- **Files modified:** `src/messages/fr.json`
- **Committed in:** `d250129`

**3. [Rule 1 - Bug] Three category rendering bugs — icon display, list mismatch, navigation**
- **Found during:** Task 2 verification
- **Issue:** Category icons not rendering correctly; category list displayed mismatched entries; navigation links broken after route move
- **Fix:** Fixed icon rendering logic, corrected list data mapping, updated navigation hrefs to use new `/categories/[slug]` route
- **Files modified:** Category-related components and page
- **Committed in:** `8c5ced3`

**4. [Rule 1 - Bug] Root category service counts did not include children categories' services**
- **Found during:** Task 2 verification
- **Issue:** Root category displayed only its own direct services count; child category services were excluded, giving misleading low counts to users
- **Fix:** Updated Prisma query to aggregate service counts from child categories and sum them into the root category total
- **Files modified:** `src/app/[locale]/(client)/page.tsx` (or category query utility)
- **Committed in:** `34c6402`

---

**Total deviations:** 4 auto-fixed (all Rule 1 bugs discovered during human verification)
**Impact on plan:** All four fixes were necessary for correct UI behavior. No scope creep — all fixes directly related to the category browsing feature built in Task 1.

## Issues Encountered

Route conflict was the most significant issue — Next.js cannot distinguish `/services/[categorySlug]` from `/services/[serviceId]` at the same directory level. The fix (moving to `/categories/[slug]`) was clean and aligns better with REST resource naming conventions.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 5 complete: full search & discovery flow is working end-to-end with DB-driven data
- `/categories/[categorySlug]` and `/services/[serviceId]` routes are distinct and functioning
- All SRCH requirements (SRCH-01 through SRCH-05) are verifiable in the running app
- Phase 6 (Reservations & Paiements) can begin — action buttons on service detail page show "Disponible prochainement" toast as placeholder

---
*Phase: 05-recherche-decouverte*
*Completed: 2026-02-24*
