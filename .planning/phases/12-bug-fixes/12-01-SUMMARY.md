---
phase: 12-bug-fixes
plan: 01
subsystem: ui
tags: [i18n, lucide-react, icons, navbar, footer, next-intl, french]

# Dependency graph
requires: []
provides:
  - "French i18n fr.json with correct accented characters throughout"
  - "SearchAutocomplete with dynamic lucide icon rendering via getLucideIcon()"
  - "Navbar CLIENT dashboard link fixed to /dashboard"
  - "Footer links verified correct (faq, contact, terms, privacy, how-it-works)"
affects: [13-ux-pages, 14-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getLucideIcon(name): converts kebab-case DB string to PascalCase lucide component dynamically"
    - "import type { Prisma } from @prisma/client for type-only imports"

key-files:
  created: []
  modified:
    - "src/messages/fr.json"
    - "src/features/search/components/SearchAutocomplete.tsx"
    - "src/components/layout/Navbar.tsx"
    - "src/features/search/lib/search-query.ts"
    - "src/features/review/components/ReviewForm.tsx"

key-decisions:
  - "Used icons object from lucide-react with PascalCase conversion for dynamic icon rendering — avoids importing all icons statically"
  - "Fixed import type for Prisma and z (zod) in existing files blocking build verification"

patterns-established:
  - "getLucideIcon(kebab-string): split('-').map(capitalize).join('') — maps DB icon names to lucide components"

requirements-completed: [BUGF-01, BUGF-02, BUGF-03, BUGF-04]

# Metrics
duration: 45min
completed: 2026-02-27
---

# Phase 12 Plan 01: UI Bug Fixes Summary

**Fixed French accent encoding in 22+ i18n sections, dynamic lucide icon rendering in autocomplete via getLucideIcon() helper, and CLIENT navbar dashboard redirect from '/' to '/dashboard'**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-02-27T00:00:00Z
- **Completed:** 2026-02-27
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Fixed all unaccented French words across all 22 sections of fr.json (retry, previous, reservations, categories, settings, verification, etc.)
- Added `getLucideIcon()` helper in SearchAutocomplete that converts kebab-case DB strings (e.g., "paintbrush-vertical") to lucide PascalCase components rendered as JSX
- Fixed CLIENT user navbar dashboard link from "/" to "/dashboard" (BUGF-04)
- Verified Footer links are already correct: /faq, /contact, /terms, /privacy, /how-it-works (no change needed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix French accents in fr.json** - `3ddd26f` (fix)
2. **Task 2: Fix autocomplete icons, navbar dashboard link, and lint** - `36a489f` (fix)

## Files Created/Modified
- `src/messages/fr.json` - All French accent corrections across 22 namespaces
- `src/features/search/components/SearchAutocomplete.tsx` - Added `import { icons }` and `getLucideIcon()` helper; replaced raw string with component render
- `src/components/layout/Navbar.tsx` - CLIENT dashboard link fixed from "/" to "/dashboard"
- `src/features/search/lib/search-query.ts` - Fixed `import type { Prisma }` (lint fix, Rule 3)
- `src/features/review/components/ReviewForm.tsx` - Fixed `import type { z }` (lint fix, Rule 3)

## Decisions Made
- Used `import { icons } from "lucide-react"` — lucide exports `icons` as a keyed object, enabling dynamic lookup by PascalCase name without importing each icon individually
- Footer.tsx required no changes — links were already correct
- Fixed two pre-existing type import lint errors that were blocking build verification

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed import type in search-query.ts**
- **Found during:** Task 2 (build verification)
- **Issue:** `import { Prisma }` used type-only, causing ESLint error blocking build
- **Fix:** Changed to `import type { Prisma }`
- **Files modified:** `src/features/search/lib/search-query.ts`
- **Verification:** ESLint error resolved for this file
- **Committed in:** `36a489f` (Task 2 commit)

**2. [Rule 3 - Blocking] Fixed import type in ReviewForm.tsx**
- **Found during:** Task 2 (build verification)
- **Issue:** `import { z } from "zod"` used type-only, causing ESLint error blocking build
- **Fix:** Changed to `import type { z }`
- **Files modified:** `src/features/review/components/ReviewForm.tsx`
- **Verification:** ESLint error resolved for this file
- **Committed in:** `36a489f` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking lint errors in pre-existing modified files)
**Impact on plan:** Both fixes resolved pre-existing issues, not new scope. No scope creep.

## Issues Encountered

**Pre-existing ESLint errors blocking build:** The codebase has numerous pre-existing ESLint errors across many unrelated files (not-found.tsx uses `<a>` instead of `<Link>`, unused variables in admin components, etc.) that block `npx next build`. These are out of scope for this plan and documented as deferred items. The two inline errors in task-relevant files were fixed; the rest remain.

**Deferred items logged:** Pre-existing ESLint errors in not-found.tsx, error.tsx, loading.tsx files, admin components, and booking/notification components should be addressed in a dedicated lint cleanup task.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- French i18n is now correctly accented throughout the app
- SearchAutocomplete renders lucide icon components beside category names
- CLIENT dashboard navigation works correctly
- Footer links point to correct paths (target pages created in Phase 13)
- Pre-existing ESLint errors in unrelated files need cleanup before next build verification

---
*Phase: 12-bug-fixes*
*Completed: 2026-02-27*
