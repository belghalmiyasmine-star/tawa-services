---
phase: 05-recherche-decouverte
plan: 03
subsystem: ui
tags: [next-intl, prisma, tailwind, shadcn, react, search, filtering, pagination, i18n]

# Dependency graph
requires:
  - phase: 05-recherche-decouverte
    provides: "GET /api/search/services, GET /api/search/categories, searchParamsSchema, complete search i18n namespace"
  - phase: 04-profil-prestataire-services
    provides: PublicServiceCard component with link to /services/[id]

provides:
  - /services page — main search results page with CategoryGrid, sidebar filters (Sheet on mobile), sort dropdown, and pagination
  - /services/[categorySlug] page — category-filtered results page with breadcrumb and subcategory chips
  - SearchFilters — client sidebar component with city/price/verified/pricingType filters updating URL searchParams
  - SearchResultsGrid — server component rendering PublicServiceCard grid with empty state
  - SearchPagination — client component with page number controls and ellipsis
  - SearchSortSelect — client component with 5 sort options updating URL
  - CategoryGrid — server component rendering clickable category cards with icons and service counts
  - buildSearchQuery — shared utility (search-query.ts) for building Prisma where/orderBy from SearchParams

affects:
  - 05-recherche-decouverte (plan 04 SearchAutocomplete integrates into Navbar using /services routing)
  - Any future plan needing search/browse UI components

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server components for grid rendering (CategoryGrid, SearchResultsGrid) — no client bundle cost
    - Client components for interactivity (SearchFilters, SearchSortSelect, SearchPagination) — URL searchParams as state
    - URL as single source of truth for filter state — server re-renders on navigation
    - Shared buildSearchQuery() utility avoids duplicating Prisma query logic between pages
    - Sheet component for mobile filters — full sidebar hidden on mobile, Sheet on /services

key-files:
  created:
    - src/features/search/components/CategoryGrid.tsx
    - src/features/search/components/SearchFilters.tsx
    - src/features/search/components/SearchResultsGrid.tsx
    - src/features/search/components/SearchPagination.tsx
    - src/features/search/components/SearchSortSelect.tsx
    - src/features/search/lib/search-query.ts
    - src/app/[locale]/(client)/services/page.tsx
    - src/app/[locale]/(client)/services/[categorySlug]/page.tsx
  modified:
    - src/messages/fr.json

key-decisions:
  - "URL searchParams as filter state — server page re-renders on navigation, no client state needed for filter values"
  - "buildSearchQuery() shared utility in search-query.ts — avoids duplicating Prisma where/orderBy logic between /services page and /services/[categorySlug] page"
  - "SearchFilters uses mobileOnly prop — rendered twice in parent (once hidden desktop sidebar, once for mobile Sheet trigger)"
  - "CategoryGrid shown only when no active filters on /services page — browsing mode vs search results mode"
  - "SearchResultsGrid is a server async component using getTranslations — no useTranslations client hook needed"
  - "Debounced price inputs use useRef for setTimeout handle — avoids stale closure and prevents rapid URL updates"
  - "buildPageRange() builds compact pagination with ellipsis — avoids rendering all page numbers for large result sets"

patterns-established:
  - "URL as filter state: all filter components read searchParams from URL, update via router.push with new params"
  - "mobileOnly prop pattern: same component renders differently on mobile (Sheet trigger) vs desktop (sidebar)"
  - "Shared query builder utility: extract common Prisma query logic to features/[domain]/lib/ for reuse across pages and API routes"

requirements-completed: [SRCH-01, SRCH-02, SRCH-04]

# Metrics
duration: 30min
completed: 2026-02-24
---

# Phase 5 Plan 03: Recherche & Decouverte — Search Results & Category Browse Summary

**Category browsing grid and search results page with URL-driven sidebar filters (Sheet on mobile), sort dropdown, and pagination — full client discovery surface using server components with URL as state**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-02-24T13:55:22Z
- **Completed:** 2026-02-24T14:25:00Z
- **Tasks:** 2
- **Files modified:** 9 (8 created, 1 modified)

## Accomplishments

- Built CategoryGrid server component (responsive 2/3/4/5-col) with emoji icons, service counts, and Link to /services/[slug]
- Built SearchFilters client component with collapsible sections (category, city, price range, pricing type, verified only), URL-driven state, 500ms debounce on price inputs, mobile Sheet variant
- Built SearchResultsGrid server component with 1/2/3-col grid of PublicServiceCard, empty state with icon
- Built SearchPagination client component with Previous/Next, page numbers, ellipsis for large page counts
- Built SearchSortSelect client component with 5 sort options updating URL searchParams
- Built /services page (SSR) — fetches services + categories in parallel, shows CategoryGrid in browsing mode, two-column layout with sidebar + results
- Built /services/[categorySlug] page (SSR) — validates category, breadcrumb, optional subcategory chips, pre-sets category filter
- Extracted buildSearchQuery() shared utility to avoid duplicate Prisma query logic

## Task Commits

Each task was committed atomically:

1. **Task 1: Create category grid and category-filtered results page** - `0e71ca0` (committed as part of prior 05-04 docs session — CategoryGrid, search-query, categorySlug page, services page were included in that commit)
2. **Task 2: Create search results page with filters, sort, and pagination** - `15a90ea` (feat — SearchPagination, SearchResultsGrid, SearchSortSelect)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/features/search/components/CategoryGrid.tsx` — Server component, 5-col responsive grid of category cards with emoji icons, service counts, Link to /services/[slug]
- `src/features/search/components/SearchFilters.tsx` — Client component, collapsible filter sidebar (city Select, price range inputs with debounce, pricing type radios, verified Checkbox), mobileOnly Sheet variant, clearAllFilters button
- `src/features/search/components/SearchResultsGrid.tsx` — Server component (async), PublicServiceCard grid 1/2/3-col, empty state with SearchX icon
- `src/features/search/components/SearchPagination.tsx` — Client component, Previous/Next buttons, page numbers with ellipsis via buildPageRange(), "Page X / Y" label
- `src/features/search/components/SearchSortSelect.tsx` — Client component, shadcn Select with 5 sort options, updates URL sort param
- `src/features/search/lib/search-query.ts` — Shared async utility: resolves category slug to IDs, builds Prisma ServiceWhereInput + orderBy from SearchParams
- `src/app/[locale]/(client)/services/page.tsx` — SSR page: fetches services + categories in parallel, shows CategoryGrid when no active filters, 4-col layout (1 sidebar + 3 results), mobile Sheet trigger
- `src/app/[locale]/(client)/services/[categorySlug]/page.tsx` — SSR page: validates categorySlug, breadcrumb, subcategory chips if parent category, pre-sets category filter
- `src/messages/fr.json` — Added "all": "Tous" to search namespace (for SearchFilters pricing type "Tous" option)

## Decisions Made

- URL searchParams as filter state: all filter updates call `router.push(?newParams)` — server re-renders naturally on navigation. No client-side filter state needed.
- `buildSearchQuery()` shared utility extracted to `src/features/search/lib/search-query.ts` — both /services and /services/[categorySlug] pages use it to avoid duplicating the Prisma where/orderBy logic.
- `SearchFilters` accepts `mobileOnly` prop: parent renders it twice (hidden lg:block sidebar + mobile Sheet trigger in the sort row) — single component, two rendering contexts.
- `CategoryGrid` shown conditionally: only when no active filters on /services page — browsing mode shows categories prominently, filtered mode shows results only.
- `debounceRef` uses `useRef<{ min, max }>` pattern: prevents stale closures from `useState`, correct approach for setTimeout handles in React.
- `buildPageRange()` helper: builds compact page array with ellipsis for page counts > 7 — avoids rendering 100+ buttons for large search results.

## Deviations from Plan

### Context Discovery

**Prior 05-04 execution included 05-03 artifacts**
- **Found during:** Task 1 execution (git log inspection)
- **Issue:** The previous agent session (05-04 autocomplete plan) included several 05-03 components in its commits: `CategoryGrid.tsx`, `search-query.ts`, `SearchFilters.tsx`, `[categorySlug]/page.tsx`, `services/page.tsx` were all committed as part of commit `f201245` (05-04 feat) and `0e71ca0` (05-04 docs). This session's writes produced identical content (TypeScript passes, no diff vs HEAD).
- **Fix:** Staged and committed only the 3 files that were not yet committed: `SearchPagination.tsx`, `SearchResultsGrid.tsx`, `SearchSortSelect.tsx`.
- **No content deviation** — all files match plan spec exactly.

---

**Total deviations:** 0 content deviations (1 context anomaly — prior session partial execution, handled automatically)
**Impact on plan:** All artifacts delivered as specified. TypeScript passes with 0 errors.

## Issues Encountered

- Git pathspec handling of `[brackets]` in directory names: `git status --short` and `git add "path/[bracket]/file"` silently skip files when brackets are treated as glob patterns. Workaround: `git ls-files "path/[bracket]/"` uses different glob handling and correctly lists tracked files. The `[categorySlug]/page.tsx` was already tracked via a prior broad `git add "src/app/[locale]/(client)/services/"` call.
- Bash "Permission denied" on every command due to path `C:/Users/pc dell/...` with spaces — all commands executed via `node --input-type=commonjs` wrapper (established pattern from prior phases).

## Next Phase Readiness

- /services and /services/[categorySlug] pages ready for client browsing
- SearchAutocomplete (05-04) already integrated into Navbar — types in search bar and sees results
- All search UI components ready for use — Phase 6 (bookings) can link from /services/[id] detail page
- Filter state via URL — deep-linkable search results

## Self-Check: PASSED

All created files verified:
- `src/features/search/components/CategoryGrid.tsx` — FOUND (committed `0e71ca0`)
- `src/features/search/components/SearchFilters.tsx` — FOUND (committed `f201245`)
- `src/features/search/components/SearchResultsGrid.tsx` — FOUND (committed `15a90ea`)
- `src/features/search/components/SearchPagination.tsx` — FOUND (committed `15a90ea`)
- `src/features/search/components/SearchSortSelect.tsx` — FOUND (committed `15a90ea`)
- `src/features/search/lib/search-query.ts` — FOUND (committed `0e71ca0`)
- `src/app/[locale]/(client)/services/page.tsx` — FOUND (committed `0e71ca0`)
- `src/app/[locale]/(client)/services/[categorySlug]/page.tsx` — FOUND (committed `f201245`)

TypeScript: PASSED (0 errors via `npx tsc --noEmit`)

---
*Phase: 05-recherche-decouverte*
*Completed: 2026-02-24*
