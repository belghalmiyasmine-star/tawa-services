---
phase: 05-recherche-decouverte
plan: 04
subsystem: search
tags: [next-api-routes, prisma, react, debounce, autocomplete, i18n, keyboard-nav]

# Dependency graph
requires:
  - phase: 05-01
    provides: GET /api/search/services and categories API, search i18n namespace
  - phase: 04-profil-prestataire-services
    provides: Service, Provider, Category, Delegation models

provides:
  - GET /api/search/autocomplete — real-time autocomplete API (categories + services)
  - SearchAutocomplete component — debounced input with dropdown, keyboard nav, click-outside
  - Navbar integration — autocomplete replaces static search bar

affects:
  - src/components/layout/Navbar.tsx (search bar replaced)
  - src/features/search/components/SearchFilters.tsx (bug fix applied)
  - src/app/[locale]/(client)/services/[categorySlug]/page.tsx (bug fix applied)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useRef + setTimeout pattern for 300ms debounce (no external library)
    - document.addEventListener("mousedown") for click-outside detection
    - Promise.all for parallel Prisma queries (categories + services)
    - Flat items array for keyboard navigation index management
    - Cache-Control: no-store header on live-data API routes

key-files:
  created:
    - src/app/api/search/autocomplete/route.ts
    - src/features/search/components/SearchAutocomplete.tsx
  modified:
    - src/components/layout/Navbar.tsx
    - src/messages/fr.json
    - src/features/search/components/SearchFilters.tsx
    - src/app/[locale]/(client)/services/[categorySlug]/page.tsx

key-decisions:
  - "Promise.all for parallel category + service queries — single round-trip latency instead of sequential"
  - "useRef + setTimeout debounce pattern — no external library, 300ms threshold per SRCH-03 requirement"
  - "Flat items array for keyboard navigation — categories first, then services, selectedIndex is a single integer"
  - "Cache-Control: no-store on autocomplete route — results depend on live DB state, must not be cached"
  - "BottomNav already has Search icon at /services — no change needed, plan spec confirmed existing behavior"

requirements-completed: [SRCH-03]

# Metrics
duration: 18min
completed: 2026-02-24
---

# Phase 5 Plan 04: Autocomplete Search API and Component Summary

**Autocomplete API at /api/search/autocomplete with parallel Prisma queries returning up to 3 categories + 5 services, and SearchAutocomplete component with 300ms debounce, grouped dropdown, and full keyboard navigation integrated into Navbar**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-02-24
- **Completed:** 2026-02-24
- **Tasks:** 2
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- Built GET /api/search/autocomplete — public, no auth, accepts `q` param (min 2, max 100 chars). Returns `{ categories: [...], services: [...] }` via Promise.all parallel queries. Lightweight selects, Cache-Control: no-store.
- Created SearchAutocomplete — "use client" component with 300ms debounce (useRef + setTimeout), grouped dropdown (categories + services), keyboard navigation (ArrowUp/ArrowDown/Enter/Escape), click-outside close, loading Skeleton state, and "see all results" footer.
- Updated Navbar — replaced static `<Input>` + Search icon with `<SearchAutocomplete />`. Removed unused `tCommon` hook and Search lucide import.
- Added 5 autocomplete i18n keys to fr.json `search` namespace: `autocompleteCategories`, `autocompleteServices`, `autocompleteSeeAll`, `autocompletePlaceholder`, `autocompleteNoResults`.
- BottomNav already had Search icon linking to /services — no change required (plan confirmed existing behavior).

## Task Commits

Each task was committed atomically:

1. **Task 1: Create autocomplete API endpoint** — `f79d7f0` (feat)
2. **Task 2: Create SearchAutocomplete component and integrate into Navbar** — `f201245` (feat)

## Files Created/Modified

- `src/app/api/search/autocomplete/route.ts` — GET handler with parallel Prisma queries, empty result for q<2, 400 for q>100, 500 on DB error, Cache-Control: no-store
- `src/features/search/components/SearchAutocomplete.tsx` — Client component with debounced fetch, dropdown with categories/services sections, keyboard nav, click-outside
- `src/components/layout/Navbar.tsx` — Static Input replaced with SearchAutocomplete, unused imports removed
- `src/messages/fr.json` — 5 autocomplete keys added to search namespace
- `src/features/search/components/SearchFilters.tsx` — Bug fix: debounceRef converted from bare object to useRef pattern
- `src/app/[locale]/(client)/services/[categorySlug]/page.tsx` — Bug fix: href cast from `href="/services" as never` (JSX attribute) to `href={"/services" as never}` (value cast)

## Decisions Made

- Used `Promise.all` for parallel category + service queries — single database round-trip latency rather than sequential waits
- Implemented debounce with `useRef` + `setTimeout` pattern — no external library (no-external-deps decision), 300ms per SRCH-03 requirement
- Flat items array for keyboard navigation — both categories and services mapped to a single `flatItems[]` array; `selectedIndex` is a single integer. Categories occupy indices 0..n-1, services n..n+m-1
- `Cache-Control: no-store` on the autocomplete route — autocomplete shows live DB data that changes frequently and must never be stale
- BottomNav already has `{ href: "/services", icon: Search, labelKey: "search" }` in CLIENT_ITEMS — plan requirement already satisfied, no change needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed debounceRef type error in SearchFilters.tsx**
- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** `debounceRef` was a plain object `{ min: 0 as ReturnType<typeof setTimeout>, max: 0 as ReturnType<typeof setTimeout> }`. TypeScript strict mode rejects casting number literal `0` to `ReturnType<typeof setTimeout>` (which is `NodeJS.Timeout` not `number` in Node env). Also, the ref object was not persistent across renders.
- **Fix:** Converted to `useRef<{ min: ReturnType<typeof setTimeout> | null; max: ReturnType<typeof setTimeout> | null }>({ min: null, max: null })` and updated usages to `debounceRef.current.min / .max`. Added `useRef` to imports.
- **Files modified:** `src/features/search/components/SearchFilters.tsx`
- **Commit:** `f201245`

**2. [Rule 1 - Bug] Fixed incorrect TypeScript cast syntax in categorySlug/page.tsx**
- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** `href="/services" as never` used `as never` as a JSX attribute value, which TypeScript interprets as trying to cast the `href` JSX attribute to `never` type — invalid. The correct pattern is to cast the href value: `href={"/services" as never}`.
- **Fix:** Changed `href="/services" as never` to `href={"/services" as never}` — casts the string value, not the attribute.
- **Files modified:** `src/app/[locale]/(client)/services/[categorySlug]/page.tsx`
- **Commit:** `f201245`

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs in pre-existing files)
**Impact on plan:** Both fixes required for TypeScript compilation to pass. No scope creep.

## Self-Check: PASSED

All created files verified:
- `src/app/api/search/autocomplete/route.ts` — FOUND
- `src/features/search/components/SearchAutocomplete.tsx` — FOUND
- `.planning/phases/05-recherche-decouverte/05-04-SUMMARY.md` — FOUND

All commits verified:
- `f79d7f0` (Task 1) — FOUND in git log
- `f201245` (Task 2) — FOUND in git log

TypeScript: PASSED (0 errors via `npx tsc --noEmit`)

Key behaviors verified:
- SearchAutocomplete in Navbar: VERIFIED
- 300ms debounce pattern: VERIFIED
- Promise.all parallel queries in API: VERIFIED
- Cache-Control: no-store header: VERIFIED
- autocompleteCategories i18n key: VERIFIED
- autocompleteServices i18n key: VERIFIED

---
*Phase: 05-recherche-decouverte*
*Completed: 2026-02-24*
