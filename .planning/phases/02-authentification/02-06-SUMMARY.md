---
phase: 02-authentification
plan: "06"
subsystem: auth
tags: [next-auth, jwt, rbac, middleware, next-intl, role-guard, route-protection]

# Dependency graph
requires:
  - phase: 02-01
    provides: NextAuth JWT strategy, authOptions, session typing, Role type
  - phase: 02-03
    provides: Login page, OAuth flow, session established for authenticated users

provides:
  - Middleware combining next-intl locale routing with NextAuth JWT auth checks
  - RBAC route protection: public routes, provider routes, admin routes, authenticated routes
  - RoleGuard client component for conditional UI rendering by role
  - 403 Forbidden page with French error messages and navigation links
  - Provider layout with server-side getServerSession auth check
  - Admin layout with server-side getServerSession auth check (ADMIN only)
affects: [all subsequent phases — every feature route is now protected by RBAC]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Defense-in-depth RBAC: middleware redirect + layout server check + client RoleGuard"
    - "Middleware strips locale prefix before route matching (/fr/admin → /admin)"
    - "getToken() in middleware reads JWT from cookie without DB call"
    - "getServerSession(authOptions) in layouts for server-side auth verification"
    - "useSession() in RoleGuard client component for conditional rendering"

key-files:
  created:
    - src/features/auth/components/RoleGuard.tsx
    - src/app/[locale]/(client)/auth/403/page.tsx
  modified:
    - src/middleware.ts
    - src/app/[locale]/(provider)/layout.tsx
    - src/app/[locale]/(admin)/layout.tsx
    - src/messages/fr.json

key-decisions:
  - "Defense-in-depth RBAC: three layers — middleware (JWT, no DB), layout (getServerSession), client (useSession)"
  - "Middleware uses getToken() not getServerSession() — reads JWT from cookie, no DB round-trip, Edge-compatible"
  - "Locale stripping via regex (/^\/([a-z]{2})(?:\/(.*))?$/) to extract pathname without locale prefix"
  - "403 page placed in (client) route group — accessible to all users regardless of role"
  - "Provider layout allows both PROVIDER and ADMIN roles — admin may need to inspect provider views"

patterns-established:
  - "Route group layouts include getServerSession check for server-side protection beyond middleware"
  - "RoleGuard fallback=null default — silent hide vs. explicit fallback content"
  - "fr.json auth namespace extended with accessDenied, backToDashboard, backToLogin keys"

requirements-completed: [AUTH-06]

# Metrics
duration: 5min
completed: 2026-02-22
---

# Phase 02 Plan 06: RBAC Middleware and Route Protection Summary

**NextAuth JWT middleware with locale-aware RBAC, defense-in-depth via middleware + server layout checks + client RoleGuard, and 403 Forbidden page**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-22T14:58:43Z
- **Completed:** 2026-02-22T15:03:04Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Rewrote middleware to combine next-intl locale handling with NextAuth JWT auth — single middleware handles both concerns without DB calls
- Created RoleGuard client component that conditionally renders UI by role using useSession()
- Secured provider and admin route group layouts with getServerSession (defense-in-depth second layer)
- Created 403 Forbidden page with ShieldAlert icon, French error messages, and dashboard/login navigation links

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance middleware with authentication and role-based route protection** - `d2d95b2` (feat)
2. **Task 2: Create RoleGuard component, 403 page, and protect route group layouts** - `6a4f270` (feat)

## Files Created/Modified

- `src/middleware.ts` - Combined next-intl + NextAuth middleware with public/provider/admin/authenticated route rules
- `src/features/auth/components/RoleGuard.tsx` - Client component with useSession for role-conditional rendering
- `src/app/[locale]/(client)/auth/403/page.tsx` - Forbidden page with ShieldAlert icon and French messages
- `src/app/[locale]/(provider)/layout.tsx` - Now includes getServerSession check (PROVIDER or ADMIN required)
- `src/app/[locale]/(admin)/layout.tsx` - Now includes getServerSession check (ADMIN only)
- `src/messages/fr.json` - Added accessDenied, accessDeniedMessage, backToDashboard, backToLogin keys

## Decisions Made

- **Defense-in-depth RBAC:** Three layers — middleware (JWT token, no DB, Edge runtime), route group layouts (getServerSession, server-side), RoleGuard (useSession, client-side). Any bypass of one layer hits the next.
- **Middleware uses getToken() not getServerSession():** getToken() reads JWT from cookie without DB call — appropriate for Edge middleware. getServerSession() requires a Node.js runtime.
- **Locale stripping in middleware:** Regex `/^\/([a-z]{2})(?:\/(.*))?$/` strips locale prefix before route matching so `/fr/admin/dashboard` correctly matches the `/admin` rule.
- **403 page in (client) route group:** Accessible to all users since the (client) layout doesn't require auth. The middleware explicitly lists `/auth/403` as a public path.
- **Provider layout allows ADMIN too:** Admin users may need to inspect provider-role views. Pattern is PROVIDER || ADMIN for provider routes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- RBAC is fully enforced. All subsequent feature phases can build protected routes knowing:
  - Unauthenticated users are redirected to `/auth/login`
  - Wrong-role users are redirected to `/auth/403`
  - RoleGuard is available for client-side conditional rendering
- Plans 02-04 (email verification) and 02-05 (OTP) can now proceed as RBAC is in place
- Plan 02-07 (2FA / suspicious login) can use the same middleware pattern

---
*Phase: 02-authentification*
*Completed: 2026-02-22*

## Self-Check: PASSED

All files verified present. All task commits confirmed in git log.
