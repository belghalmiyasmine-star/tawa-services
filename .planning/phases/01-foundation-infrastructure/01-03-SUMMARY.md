---
phase: 01-foundation-infrastructure
plan: 03
subsystem: i18n
tags: [next-intl, i18n, routing, middleware, translations, locale, fr.json]

requires:
  - phase: 01-01
    provides: Next.js 15 App Router scaffold, TypeScript config, path aliases @/*

provides:
  - next-intl routing with defineRouting (fr locale, defaultLocale: fr)
  - createNavigation helpers (Link, useRouter, redirect, usePathname) from @/i18n/routing
  - src/messages/fr.json with 188 keys covering all business domains
  - src/middleware.ts intercepting all non-static routes, redirecting / to /fr
  - NextIntlClientProvider in [locale]/layout.tsx
  - LocaleSwitcher component ready for AR/EN expansion

affects:
  - all-subsequent-plans
  - any-plan-adding-new-UI-strings
  - phase-11-ar-en-localization

tech-stack:
  added:
    - next-intl@^3.x (43 packages)
    - tailwindcss-animate@^1.0.7 (was in package.json, installed in node_modules)
    - class-variance-authority@^0.7.1 (was in package.json, installed in node_modules)
    - lucide-react@^0.575.0 (was in package.json, installed in node_modules)
  patterns:
    - All navigation uses @/i18n/routing helpers (Link, useRouter, redirect, usePathname) — NEVER next/navigation
    - All UI strings use useTranslations(namespace) or getTranslations({ locale, namespace }) — NEVER hardcoded
    - middleware.ts must be in src/ directory (Next.js 15 with src/ dir requirement)
    - LocaleSwitcher returns null when routing.locales.length <= 1

key-files:
  created:
    - src/i18n/routing.ts
    - src/i18n/request.ts
    - src/messages/fr.json
    - src/middleware.ts
    - src/components/shared/LocaleSwitcher.tsx
  modified:
    - next.config.ts (wrapped with createNextIntlPlugin)
    - src/app/layout.tsx (minimal pass-through)
    - src/app/[locale]/layout.tsx (added NextIntlClientProvider)

key-decisions:
  - "middleware.ts must be in src/ not root — Next.js 15 with src/ directory requires middleware inside src/"
  - "Single locale fr for now — locales array ready for ar/en expansion in Phase 11"
  - "All navigation helpers exported from @/i18n/routing via createNavigation(routing) — type-safe locale-aware routing"
  - "fr.json organized by domain namespace: common, navigation, home, auth, provider, service, booking, payment, review, errors, locale, categories, layout, footer"

patterns-established:
  - "i18n Pattern: import { Link, useRouter, redirect, usePathname } from '@/i18n/routing' — everywhere"
  - "Translation Pattern: const t = useTranslations('namespace') in client components"
  - "Server Translation Pattern: const t = await getTranslations({ locale, namespace }) in Server Components"
  - "New locale addition: 1) add to routing.locales array 2) create src/messages/{locale}.json 3) update request.ts type guard"

requirements-completed:
  - UI-03

duration: ~45min
completed: 2026-02-22
---

# Phase 1 Plan 3: next-intl i18n Infrastructure Summary

**next-intl with locale routing (fr), 188-key fr.json dictionary, NextIntlClientProvider in root layout, and src/middleware.ts redirecting / to /fr with 307**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-02-22T09:00:00Z
- **Completed:** 2026-02-22T10:35:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- next-intl fully configured: middleware redirects / to /fr (307), /fr returns 200 with translations
- fr.json created with 188 keys across 14 namespaces (common, navigation, home, auth, provider, service, booking, payment, review, errors, locale, categories, layout, footer)
- createNavigation helpers exported from @/i18n/routing — type-safe locale-aware routing for all future components
- LocaleSwitcher component created, hides automatically with single locale, ready for AR/EN expansion
- npm run build produces valid build with "Middleware 64.7 kB" in output — middleware properly compiled

## next-intl Version Installed

| Package | Version |
|---------|---------|
| next-intl | ^3.x (latest as of 2026-02-22) |

## fr.json Dictionary Structure

| Namespace | Key Count | Purpose |
|-----------|-----------|---------|
| common | 28 | Shared UI: loading, error, save, cancel, search, filter, etc. |
| navigation | 14 | Nav items: home, bookings, messages, profile, dashboard, etc. |
| home | 14 | Hero section, categories, how-it-works, CTA |
| auth | 19 | Login, register, password, email verification |
| provider | 14 | Profile, KYC status, trust badges, metrics |
| service | 9 | Booking, pricing, inclusions, conditions |
| booking | 10 | Status enum (PENDING/ACCEPTED/etc.), booking actions |
| payment | 12 | Method enum (CARD/D17/FLOUCI/CASH), status, checkout |
| review | 8 | Stars, quality criteria, write review |
| errors | 11 | Field validation, auth errors, server errors |
| locale | 3 | Language names (fr, ar, en) |
| categories | 9 | Service category labels |
| layout | 4 | Admin sidebar labels |
| footer | 19 | Multi-column footer content |
| **Total** | **174 leaf keys** | |

## Translation Patterns

### Client Components
```tsx
import { useTranslations } from "next-intl";
const t = useTranslations("home");
// Usage: {t("heroTitle")}
```

### Server Components (layouts, generateMetadata)
```tsx
import { getTranslations } from "next-intl/server";
const t = await getTranslations({ locale, namespace: "home" });
```

### Navigation (NEVER use next/navigation directly)
```tsx
import { Link, useRouter, redirect, usePathname } from "@/i18n/routing";
// Link and router handle locale prefix automatically
```

## How to Add a New Locale (AR or EN) Later

1. Add to `src/i18n/routing.ts`:
   ```ts
   locales: ["fr", "ar", "en"],  // uncomment and expand
   ```

2. Update type guard in `src/i18n/request.ts`:
   ```ts
   if (!locale || !routing.locales.includes(locale as "fr" | "ar" | "en")) {
   ```

3. Create `src/messages/ar.json` and `src/messages/en.json` with same keys as `fr.json`

4. The LocaleSwitcher will automatically show (routing.locales.length > 1)

5. The middleware will redirect to the appropriate locale based on Accept-Language header

## Task Commits

Each task was committed atomically:

1. **Task 1: Install next-intl and configure locale routing** - `fee2e9c` (feat)
2. **Task 2: Update App Router layout with NextIntlClientProvider** - `262b0f4` (feat)

**Plan metadata:** to be committed with SUMMARY

## Files Created/Modified

- `src/i18n/routing.ts` - defineRouting config + createNavigation helpers exported
- `src/i18n/request.ts` - getRequestConfig loading messages from src/messages/${locale}.json
- `src/messages/fr.json` - 188-key French dictionary across 14 namespaces
- `next.config.ts` - wrapped with createNextIntlPlugin("./src/i18n/request.ts")
- `src/middleware.ts` - createMiddleware(routing), matcher excludes static/api routes, moved from root to src/
- `src/components/shared/LocaleSwitcher.tsx` - locale select with useRouter.replace, hides when single locale
- `src/app/layout.tsx` - minimal pass-through (html/body in locale layout)

## Decisions Made

1. **middleware.ts in src/ not root** — Next.js 15 with src/ directory requires middleware to be inside src/. Root middleware.ts is ignored. Moving to src/middleware.ts made the middleware compile (Middleware 64.7 kB in build output) and the / → /fr redirect work.

2. **Single locale fr only** — locales array is ["fr"] with AR/EN commented out. Adding a locale requires only 4 steps (see above). LocaleSwitcher is hidden until multiple locales are configured.

3. **@/i18n/routing as the single navigation import** — createNavigation(routing) exports type-safe Link, useRouter, redirect, usePathname that automatically handle the locale prefix. All future components must use these instead of next/navigation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] middleware.ts location moved from root to src/**
- **Found during:** Task 2 (verify step — middleware redirect wasn't working)
- **Issue:** Plan specified `middleware.ts` at project root. With Next.js 15 using src/ directory, middleware must be inside src/. Root middleware.ts compiled to build but wasn't included in middleware manifest (empty `"middleware": {}`).
- **Fix:** Created `src/middleware.ts` with `@/i18n/routing` import, deleted root `middleware.ts`. Build now shows "Middleware 64.7 kB".
- **Files modified:** src/middleware.ts (created), middleware.ts (deleted)
- **Verification:** `curl -I http://localhost:3030/` returns `HTTP/1.1 307 Temporary Redirect` with `location: /fr`
- **Committed in:** 262b0f4 (Task 2 commit)

**2. [Rule 3 - Blocking] tailwindcss-animate not in node_modules**
- **Found during:** Task 2 (dev server startup — CSS compilation failed)
- **Issue:** `tailwind.config.ts` required `tailwindcss-animate` but it wasn't installed in node_modules (was in package.json from plan 01-04 but not installed)
- **Fix:** Ran `npm install tailwindcss-animate`
- **Files modified:** package-lock.json
- **Verification:** npm run dev started without CSS errors
- **Committed in:** fee2e9c (included in Task 1 commit as package-lock.json update)

**3. [Rule 3 - Blocking] class-variance-authority and lucide-react not in node_modules**
- **Found during:** Task 2 (typecheck failure on src/components/ui/ files)
- **Issue:** shadcn/ui components from plan 01-04 required cva and lucide-react but weren't installed
- **Fix:** Ran `npm install class-variance-authority lucide-react`
- **Files modified:** package-lock.json
- **Verification:** npm run typecheck passes without errors
- **Committed in:** Stale node_modules fixed — package.json already had these, no package.json change needed

---

**Total deviations:** 3 auto-fixed (all Rule 3 - Blocking)
**Impact on plan:** All fixes necessary for middleware to work and build to pass. The middleware location fix is the key insight for Next.js 15 with src/ directory.

## Issues Encountered

- **Stale .next cache**: Multiple dev server instances running on different ports left stale .next cache with missing chunk references (./403.js, ./627.js). Fixed by `rm -rf .next` and fresh builds.
- **Git history had plans 01-04 and 01-06 committed before 01-03**: Other plans ran ahead of schedule. Their files (src/app/[locale]/* route groups, shadcn components) were already committed and working. Our Task 2 work (locale layout) was already done by plan 01-04 which ran AFTER our Task 1 commit but before our Task 2 commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- i18n infrastructure complete — all future components MUST use `useTranslations('namespace')` and `@/i18n/routing` navigation helpers
- Ready for Phase 1 Plan 4+ UI work (design system, layouts, etc.)
- When adding AR/EN in Phase 11: see "How to Add a New Locale" section above

---
*Phase: 01-foundation-infrastructure*
*Completed: 2026-02-22*

## Self-Check: PASSED

All key files verified:
- src/i18n/routing.ts: FOUND
- src/i18n/request.ts: FOUND
- src/messages/fr.json: FOUND
- src/middleware.ts: FOUND
- src/app/[locale]/layout.tsx: FOUND
- src/components/shared/LocaleSwitcher.tsx: FOUND

Commits verified:
- fee2e9c: feat(01-03): install next-intl and configure locale routing
- 262b0f4: feat(01-03): configure App Router locale layout, LocaleSwitcher, and middleware
