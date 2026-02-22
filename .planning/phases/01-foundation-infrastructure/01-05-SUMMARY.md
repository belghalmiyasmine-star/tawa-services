---
phase: 01-foundation-infrastructure
plan: 05
subsystem: ui
tags: [next.js, react, tailwind, shadcn, next-intl, lucide-react, route-groups, layouts]

# Dependency graph
requires:
  - phase: 01-03
    provides: "next-intl i18n infrastructure with useTranslations/getTranslations and @/i18n/routing helpers"
  - phase: 01-04
    provides: "shadcn/ui design system with CSS variables, ThemeProvider, cn() helper"
  - phase: 01-01
    provides: "Next.js 15 App Router foundation with TypeScript strict, Tailwind v4"
provides:
  - "Navbar desktop component: sticky, logo, categories dropdown, search input, auth buttons, ThemeToggle, LocaleSwitcher"
  - "Footer multi-column component: 5 columns (Brand, Clients, Providers, Help, Legal), desktop-only"
  - "BottomNav mobile component: 5-tab fixed bottom nav adapting to CLIENT/PROVIDER role"
  - "AdminSidebar collapsible component: 8 admin nav items, w-64 open / w-16 collapsed toggle"
  - "3 route group layouts: (client), (provider), (admin) each with distinct navigation composition"
  - "Layout pattern: role-based navigation separation, mobile-first responsive breakpoints"
affects:
  - "All future feature phases (2-10) that render pages within (client), (provider), or (admin) route groups"
  - "Phase 2 (auth) — navigation buttons placeholder /auth/login and /auth/register"
  - "Phase 10 (admin panel) — AdminSidebar nav items and /admin/* route group structure"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route group layouts: (client)/, (provider)/, (admin)/ in src/app/[locale]/ — each layout independently controls Navbar/Footer/Sidebar visibility"
    - "Responsive layout: md:block/md:hidden breakpoint (768px) — Navbar+Footer desktop-only, BottomNav mobile-only"
    - "i18n navigation: all Link and usePathname from @/i18n/routing (createNavigation helpers) — no hardcoded /fr/ prefix"
    - "Zero hardcoded strings: all visible labels via useTranslations() namespace — categories, navigation, footer, layout, auth, common"
    - "AdminSidebar collapse: useState toggle between w-64 (labeled) and w-16 (icon-only) with CSS transition-all duration-300"

key-files:
  created:
    - src/components/layout/Navbar.tsx
    - src/components/layout/Footer.tsx
    - src/components/layout/BottomNav.tsx
    - src/components/layout/AdminSidebar.tsx
    - src/app/[locale]/(client)/layout.tsx
    - src/app/[locale]/(provider)/layout.tsx
    - src/app/[locale]/(admin)/layout.tsx
  modified:
    - src/messages/fr.json

key-decisions:
  - "Route groups (client)/, (provider)/, (admin)/ establish role-based layout separation — each route group wraps all pages for that role with appropriate navigation"
  - "Navbar and Footer use hidden md:block — invisible on mobile where BottomNav takes over; BottomNav uses md:hidden"
  - "AdminSidebar uses useState (client component) for collapse state — no server-side persistence needed for MVP"
  - "CATEGORIES in Navbar.tsx are static placeholders with emoji icons — will be replaced by DB data in Phase 5"
  - "BottomNav role prop defaults to CLIENT — provider layout passes role='PROVIDER' explicitly"
  - "Admin layout is a Server Component using getTranslations('layout') — no 'use client' directive"

patterns-established:
  - "Layout composition: feature layouts import and compose Navbar, Footer, BottomNav from @/components/layout/"
  - "Role-based navigation: CLIENT_ITEMS vs PROVIDER_ITEMS arrays, role prop on BottomNav"
  - "Active link detection: pathname === item.href || pathname.startsWith(item.href + '/') pattern for all nav components"
  - "i18n-aware hrefs: href='/services' not href='/fr/services' — locale prefix handled by @/i18n/routing Link"

requirements-completed: [UI-01, UI-02]

# Metrics
duration: ~25min (tasks) + checkpoint wait
completed: 2026-02-22
---

# Phase 1 Plan 05: Layout Components & Route Groups Summary

**Three role-based layouts with Navbar, Footer, BottomNav, and collapsible AdminSidebar — all i18n-ready, mobile-first, zero hardcoded strings**

## Performance

- **Duration:** ~25 min (implementation) + human checkpoint verification
- **Started:** 2026-02-22
- **Completed:** 2026-02-22
- **Tasks:** 2 auto tasks + 1 checkpoint (approved)
- **Files modified:** 8 (3 layout files, 4 components, 1 messages file)

## Accomplishments

- Navbar desktop component with logo, categories dropdown (6 categories using tCat()), search input, auth placeholder buttons, ThemeToggle, LocaleSwitcher — visible >= 768px only
- Footer multi-column (5 columns: Brand, Pour les clients, Pour les prestataires, Aide, Legal) — all strings via useTranslations("footer"), visible >= 768px only
- BottomNav mobile with 5 tabs adapting to CLIENT (Home/Search/Bookings/Messages/Profile) and PROVIDER (Dashboard/Services/Bookings/Messages/Profile) roles — fixed bottom, md:hidden
- AdminSidebar collapsible client component: 8 admin nav items, w-64 labeled / w-16 icon-only toggle, useTranslations("layout") for all labels
- 3 distinct route group layouts: (client), (provider), (admin) — admin layout excludes Footer and BottomNav
- Human checkpoint verification: approved by user

## Task Commits

Each task was committed atomically:

1. **Task 1: Creer la Navbar desktop, le Footer et la BottomNav mobile** - `a5a1328` (feat)
2. **Task 2: Creer les 3 layouts distincts et l'AdminSidebar collapsible** - `d53fdee` (feat)
3. **Task 3: Verification visuelle** - checkpoint approved (no commit — verification only)

## Files Created/Modified

- `src/components/layout/Navbar.tsx` - Desktop nav (hidden md:block), categories dropdown, search, auth, ThemeToggle, LocaleSwitcher
- `src/components/layout/Footer.tsx` - 5-column footer (hidden md:block), useTranslations("footer") throughout
- `src/components/layout/BottomNav.tsx` - Mobile bottom nav (md:hidden), CLIENT/PROVIDER role adaptation, active link detection
- `src/components/layout/AdminSidebar.tsx` - Collapsible sidebar, 8 nav items, useState w-64/w-16 toggle, useTranslations("layout")
- `src/app/[locale]/(client)/layout.tsx` - Navbar + main(pb-16 md:pb-0) + Footer + BottomNav(CLIENT)
- `src/app/[locale]/(provider)/layout.tsx` - Navbar + main(pb-16 md:pb-0) + Footer + BottomNav(PROVIDER)
- `src/app/[locale]/(admin)/layout.tsx` - Server Component, AdminSidebar + admin header + main, no Footer/BottomNav
- `src/messages/fr.json` - Added kyc, content, notifications keys to navigation namespace for AdminSidebar

## Decisions Made

- Route groups (client)/, (provider)/, (admin)/ selected over a single layout with conditional rendering — cleaner separation of concerns, easier to evolve independently
- AdminSidebar uses client-side useState for collapse — no server persistence for MVP phase, simpler implementation
- CATEGORIES array in Navbar uses static slugs with emoji placeholders — Phase 5 will replace with DB-driven categories
- Admin layout is Server Component (getTranslations) — no interactivity needed at layout level, only AdminSidebar needs client state

## Deviations from Plan

None - plan executed exactly as written. All components match the spec provided in the plan.

## Issues Encountered

**Known issue (user-reported, deferred):** In dark mode, the "Categories populaires" cards on the home page have white backgrounds, but the card text also turns white, making it unreadable. This is a pre-existing page-level issue not caused by this plan's components. The fix — either keep card text dark on white cards or apply dark background in dark mode — is deferred to a future polish task.

- **Scope:** Out of scope for this plan (home page card styles, not layout components)
- **Impact:** Minor visual bug, does not affect navigation functionality
- **Deferred to:** Future UI polish / Phase 11 (UI-03/UI-04)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 3 route group layouts are in place — Phase 2 (authentication) pages will be placed in (client)/ and receive Navbar + BottomNav automatically
- Auth placeholder links (/auth/login, /auth/register) in Navbar are ready to be wired to real routes in Phase 2
- AdminSidebar nav items for /admin/users, /admin/kyc, /admin/reports, /admin/analytics, /admin/content, /admin/notifications are placeholders — real admin pages implemented in Phase 10
- BottomNav role prop is currently static (hardcoded CLIENT/PROVIDER in layout) — Phase 2 auth will provide session context to determine role dynamically

---
*Phase: 01-foundation-infrastructure*
*Completed: 2026-02-22*
