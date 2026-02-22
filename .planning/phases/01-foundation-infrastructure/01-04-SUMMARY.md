---
phase: 01-foundation-infrastructure
plan: 04
subsystem: ui
tags: [shadcn-ui, tailwindcss, next-themes, lucide-react, design-system, dark-mode, radix-ui]

dependency_graph:
  requires:
    - phase: 01-01
      provides: Next.js 15 App Router scaffold, TypeScript config, Tailwind base setup
    - phase: 01-03
      provides: next-intl locale routing, [locale]/layout.tsx structure
  provides:
    - shadcn/ui design system initialised with new-york style
    - 19 base UI components in src/components/ui/
    - Tawa Services design tokens (blue primary #2563EB, orange secondary #F59E0B, radius 0.75rem)
    - ThemeProvider with next-themes (light/dark mode)
    - ThemeToggle component with Sun/Moon icons from lucide-react
    - tailwind.config.ts with HSL color tokens, Inter font, src/features/** content path
    - cn() utility function via clsx + tailwind-merge
  affects:
    - all-subsequent-phases
    - 01-05-layout
    - 01-07-auth-ui

tech-stack:
  added:
    - shadcn@3.8.5 (CLI for component installation)
    - tailwindcss-animate@1.0.7 (animations for shadcn components)
    - next-themes@0.4.6 (dark mode toggle)
    - lucide-react@0.575.0 (Sun/Moon icons for ThemeToggle)
    - clsx (className merger, installed by shadcn)
    - tailwind-merge (Tailwind class merger, installed by shadcn)
    - @radix-ui/react-checkbox, @radix-ui/react-scroll-area, @radix-ui/react-tabs, @radix-ui/react-toast
    - react-hook-form (required by shadcn form component)
  patterns:
    - Design tokens as HSL CSS variables (--primary: 217 91% 60%) referenced by Tailwind hsl(var(--primary))
    - cn() function pattern for conditional className merging in all components
    - ThemeProvider wraps entire app in [locale]/layout.tsx for dark mode class injection
    - shadcn new-york style with CSS variables and rsc:true

key-files:
  created:
    - components.json
    - src/lib/utils.ts
    - src/components/ui/button.tsx
    - src/components/ui/card.tsx
    - src/components/ui/input.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/avatar.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/sheet.tsx
    - src/components/ui/dropdown-menu.tsx
    - src/components/ui/select.tsx
    - src/components/ui/skeleton.tsx
    - src/components/ui/separator.tsx
    - src/components/ui/label.tsx
    - src/components/ui/form.tsx
    - src/components/ui/textarea.tsx
    - src/components/ui/checkbox.tsx
    - src/components/ui/scroll-area.tsx
    - src/components/ui/tabs.tsx
    - src/components/ui/toast.tsx
    - src/components/ui/toaster.tsx
    - src/hooks/use-toast.ts
    - src/components/shared/ThemeProvider.tsx
    - src/components/shared/ThemeToggle.tsx
  modified:
    - src/app/globals.css
    - tailwind.config.ts
    - src/app/[locale]/layout.tsx
    - src/app/layout.tsx
    - package.json

key-decisions:
  - "shadcn new-york style chosen (more modern than default) with CSS variables enabled"
  - "ThemeProvider in [locale]/layout.tsx (not root layout) since next-intl uses locale-based routing"
  - "tailwind.config.ts includes src/features/** content path for future feature folders"
  - "Inter font replaces Geist — better readability for French text, matches Airbnb-inspired design"
  - "success and warning as custom CSS tokens beyond standard shadcn palette for domain-specific UI"
  - "border-color and body set directly in globals.css (not via @apply) to avoid Next.js 15 entryCSSFiles bug"

patterns-established:
  - "All UI components import cn() from @/lib/utils for className merging"
  - "Dark mode controlled via next-themes attribute='class' pattern (not system/media query)"
  - "shadcn components live in src/components/ui/, shared app components in src/components/shared/"
  - "Design tokens follow HSL CSS variable pattern: --token: H S% L% referenced as hsl(var(--token))"

requirements-completed: [UI-01, UI-02]

duration: ~86min
completed: 2026-02-22
---

# Phase 1 Plan 4: shadcn/ui Design System + Dark Mode Summary

**shadcn/ui new-york style with blue primary (#2563EB) / orange secondary (#F59E0B) tokens, 19 base components, Inter font, and next-themes dark mode toggle — Tawa Services full design system foundation.**

## Performance

- **Duration:** ~86 min (including pre-existing build error investigation)
- **Started:** 2026-02-22T09:04:56Z
- **Completed:** 2026-02-22T10:30:33Z
- **Tasks:** 2
- **Files modified:** 28

## Accomplishments

- Configured complete Tawa Services design system: blue primary #2563EB (HSL 217 91% 60%), orange secondary/CTA #F59E0B (HSL 38 92% 50%), radius 0.75rem for Airbnb-inspired rounded design
- Installed 19 shadcn/ui components (button, card, input, badge, avatar, dialog, sheet, dropdown-menu, select, skeleton, separator, label, form, textarea, checkbox, scroll-area, tabs, toast, toaster) — all ready for immediate use across all future phases
- Configured next-themes with ThemeProvider + ThemeToggle (Sun/Moon icons) with defaultTheme="light" integrated in the locale layout
- Fixed pre-existing Next.js 15 build failure (entryCSSFiles error) by clearing stale .next cache and adding suppressHydrationWarning

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialise shadcn/ui and configure Tawa Services design tokens** - `d806de3` (feat)
2. **Task 2: Install shadcn/ui base components and configure next-themes** - `1fe9408` (feat)

**Plan metadata:** `[pending]` (docs: complete plan)

## Files Created/Modified

- `components.json` - shadcn/ui configuration (new-york style, rsc:true, CSS variables)
- `src/lib/utils.ts` - cn() utility function using clsx + tailwind-merge
- `src/app/globals.css` - Tawa Services design tokens (primary blue, secondary orange, radius 0.75rem, dark mode variables)
- `tailwind.config.ts` - Extended colors with HSL tokens, Inter font family, soft/card shadows, src/features/** content path
- `src/app/[locale]/layout.tsx` - ThemeProvider integration, suppressHydrationWarning added
- `src/app/layout.tsx` - Simplified to minimal pass-through (html/body in locale layout)
- `src/components/shared/ThemeProvider.tsx` - Wrapper around NextThemesProvider
- `src/components/shared/ThemeToggle.tsx` - Button with Sun/Moon icons from lucide-react
- `src/components/ui/*.tsx` - 19 shadcn/ui components
- `src/hooks/use-toast.ts` - Toast hook from shadcn

## Decisions Made

1. **shadcn new-york style** — More modern appearance vs default style, chosen for professional services marketplace feel
2. **ThemeProvider in locale layout** — Correct placement given next-intl's locale-based layout structure; the locale layout is the effective root layout
3. **Inter font over Geist** — Geist was the Next.js create-app default; Inter is more appropriate for French text readability and matches the Airbnb-inspired design direction
4. **success/warning tokens added** — Domain-specific colors needed beyond standard shadcn palette for booking status indicators, KYC states, payment statuses
5. **CSS variable approach without @apply in globals.css** — Avoids Next.js 15.1.8 entryCSSFiles bug when using @apply in @layer base

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing Next.js 15 build failure (entryCSSFiles)**
- **Found during:** Task 1 (build verification)
- **Issue:** `TypeError: Cannot read properties of undefined (reading 'entryCSSFiles')` — pre-existing error from plans 01-03/01-06, caused by stale `.next` cache after schema changes
- **Fix:** Added `suppressHydrationWarning` to `<html>` tag in locale layout; cleared `.next` cache before build
- **Files modified:** `src/app/[locale]/layout.tsx`
- **Verification:** `npm run build` completes successfully generating 6 static pages
- **Committed in:** `d806de3` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed pre-existing ESLint error in client page**
- **Found during:** Task 1 (build linting phase)
- **Issue:** `<a>` elements navigating to `/services/` and `/become-provider/` — should use `<Link>` from next/link
- **Fix:** Linter auto-replaced with `<Link>` from `@/i18n/routing` + added `useTranslations` hooks
- **Files modified:** `src/app/[locale]/(client)/page.tsx`
- **Verification:** ESLint passes, build succeeds
- **Committed in:** `d806de3` (Task 1 commit)

**3. [Rule 3 - Blocking] Installed missing Radix UI dependencies**
- **Found during:** Task 2 (typecheck after installing shadcn components)
- **Issue:** shadcn@latest add did not install all peer dependencies — @radix-ui/react-checkbox, @radix-ui/react-scroll-area, @radix-ui/react-tabs, @radix-ui/react-toast, react-hook-form were missing
- **Fix:** `npm install @radix-ui/react-checkbox @radix-ui/react-scroll-area @radix-ui/react-tabs @radix-ui/react-toast react-hook-form`
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** `npm run typecheck` passes without errors
- **Committed in:** `1fe9408` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 pre-existing bugs, 1 blocking dependency)
**Impact on plan:** All auto-fixes necessary for build correctness. No scope creep.

## Issues Encountered

- Next.js 15.1.8 has a known bug with CSS during static page generation (`entryCSSFiles`). The fix is to not use `@apply` in `@layer base` for border-color and instead set values directly. This was resolved by using `border-color: hsl(var(--border))` and `background-color` directly in globals.css.

## User Setup Required

None - no external service configuration required. All design system changes are local.

## Next Phase Readiness

- Complete design system ready: 19 shadcn/ui components, Tawa Services color tokens, dark mode toggle
- All future phases can import from `@/components/ui/*` immediately
- `src/features/**` is in Tailwind content path — new feature folders will have their Tailwind classes scanned automatically
- ThemeToggle can be added to navbar (Plan 01-05: Global Layout)

---
*Phase: 01-foundation-infrastructure*
*Completed: 2026-02-22*

## Self-Check: PASSED

- FOUND: `components.json`
- FOUND: `src/lib/utils.ts`
- FOUND: `src/components/shared/ThemeProvider.tsx`
- FOUND: `src/components/shared/ThemeToggle.tsx`
- FOUND: `src/components/ui/button.tsx` (and 18 other components)
- FOUND: commit `d806de3` (Task 1)
- FOUND: commit `1fe9408` (Task 2)
