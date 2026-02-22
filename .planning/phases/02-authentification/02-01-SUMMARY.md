---
phase: 02-authentification
plan: 01
subsystem: auth
tags: [next-auth, jwt, prisma, bcryptjs, oauth, google, facebook, session, typescript]

# Dependency graph
requires:
  - phase: 01-foundation-infrastructure
    provides: "Prisma schema with User, Account, Session models; env.ts Zod validation; Next.js 15 App Router structure"
provides:
  - "NextAuth.js v4 configured with JWT strategy (30-day maxAge)"
  - "CredentialsProvider with bcryptjs password verification"
  - "Conditional Google and Facebook OAuth providers"
  - "Session callbacks enriching JWT and session with id, role, emailVerified, phoneVerified"
  - "Same-email OAuth auto-linking in signIn callback"
  - "TypeScript module augmentation for next-auth Session and JWT"
  - "SessionProvider client wrapper available to all client components"
  - "Database schema confirmed in sync (prisma db push)"
  - "Prisma v7 adapter-pg integration (PrismaPg with pg driver)"
affects:
  - 02-02 (registration — depends on CredentialsProvider + prisma user creation)
  - 02-03 (login — depends on authOptions + session)
  - 02-04 (email verification — depends on session + RESEND_API_KEY)
  - 02-05 (password reset — depends on authOptions)
  - 02-06 (auth middleware — depends on getServerSession + authOptions)
  - all future phases (session.user.role drives RBAC in middleware and UI)

# Tech tracking
tech-stack:
  added:
    - next-auth@4 (session management, JWT strategy)
    - "@auth/prisma-adapter (NextAuth Prisma adapter)"
    - bcryptjs (password hashing and comparison)
    - "@types/bcryptjs"
    - "@prisma/adapter-pg (Prisma v7 client engine PostgreSQL adapter)"
    - pg (PostgreSQL driver for Prisma adapter)
    - "@types/pg"
  patterns:
    - "JWT session strategy: token enriched on sign-in, passed to session via callbacks"
    - "Conditional OAuth: providers added only if env vars are non-empty strings"
    - "Same-email linking: signIn callback checks existing user and creates Account record"
    - "Prisma v7 pattern: PrismaPg adapter required for client engine type"
    - "Thin SessionProvider wrapper: client component wrapper preserves server layout"
    - "Optional env vars: OAuth and email keys use z.string().optional() in Zod schema"

key-files:
  created:
    - src/lib/auth.ts
    - src/app/api/auth/[...nextauth]/route.ts
    - src/components/providers/SessionProvider.tsx
    - src/types/next-auth.d.ts
  modified:
    - src/env.ts (added GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, RESEND_API_KEY)
    - src/lib/prisma.ts (Prisma v7 PrismaPg adapter)
    - src/app/[locale]/layout.tsx (SessionProvider wrapper)
    - .env.example (new OAuth + Resend vars)
    - package.json (new dependencies)

key-decisions:
  - "next-auth@4 chosen over v5 beta — v4 is stable with Next.js 15 App Router and has mature Prisma adapter"
  - "JWT strategy with 30-day maxAge per 02-CONTEXT.md session duration decision"
  - "Google/Facebook providers conditional — app works in dev without OAuth credentials"
  - "Same-email OAuth linking in signIn callback — prevents duplicate accounts across auth methods"
  - "Prisma v7 breaking change auto-fixed: PrismaPg adapter required for client engine type"
  - "RESEND_API_KEY added to env.ts now to prepare for Plan 04 (email verification)"

patterns-established:
  - "Pattern: authOptions exported from src/lib/auth.ts — single source for all auth config"
  - "Pattern: session.user always has id, role, emailVerified, phoneVerified — all callbacks propagate these"
  - "Pattern: OAuth providers conditionally loaded — no runtime error if env vars missing"

requirements-completed: [AUTH-04, AUTH-05]

# Metrics
duration: 5min
completed: 2026-02-22
---

# Phase 2 Plan 01: NextAuth.js Foundation Summary

**NextAuth.js v4 with JWT sessions (30 days), CredentialsProvider + conditional Google/Facebook OAuth, Prisma v7 adapter-pg fix, and SessionProvider wrapping the entire app**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-22T14:32:02Z
- **Completed:** 2026-02-22T14:37:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- NextAuth.js v4 fully configured with JWT strategy, CredentialsProvider (bcrypt password verification), and conditional Google/Facebook OAuth providers
- Session enriched with id, role, emailVerified, phoneVerified via jwt/session callbacks; TypeScript augmentation ensures type safety on useSession()
- SessionProvider client wrapper added to locale layout — useSession() now available in all client components
- Database confirmed synchronized (prisma db push returns "already in sync")
- Prisma v7 breaking change auto-fixed: migrated prisma.ts to use PrismaPg adapter with pg driver

## Task Commits

Each task was committed atomically:

1. **Task 1: Install NextAuth.js and configure auth options** - `ae987f2` (feat)
2. **Task 2: Add SessionProvider wrapper and sync database** - `10c7af6` (feat)

**Plan metadata:** (docs commit — see state update below)

## Files Created/Modified
- `src/lib/auth.ts` — NextAuth authOptions: JWT strategy, CredentialsProvider with bcrypt, Google/Facebook OAuth (conditional), jwt/session/signIn callbacks with same-email auto-linking
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth GET/POST handler
- `src/components/providers/SessionProvider.tsx` — Client wrapper around next-auth SessionProvider
- `src/types/next-auth.d.ts` — Module augmentation: Session.user and JWT get id, role, emailVerified, phoneVerified
- `src/env.ts` — Added GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, RESEND_API_KEY (all optional)
- `src/lib/prisma.ts` — Migrated to PrismaPg adapter for Prisma v7 client engine compatibility
- `src/app/[locale]/layout.tsx` — Added SessionProvider wrapping children inside NextIntlClientProvider
- `.env.example` — Added OAuth and Resend placeholder vars with comments
- `package.json` + `package-lock.json` — New deps: next-auth@4, @auth/prisma-adapter, bcryptjs, @prisma/adapter-pg, pg

## Decisions Made
- next-auth@4 used (not v5 beta) — stable with Next.js 15 App Router and mature Prisma adapter support
- OAuth providers conditionally added only when env vars are non-empty — app works in dev without OAuth credentials
- Same-email auto-linking implemented in signIn callback to prevent duplicate accounts
- RESEND_API_KEY added preemptively to env.ts for Plan 04 (email verification)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Prisma v7 client engine incompatibility in src/lib/prisma.ts**
- **Found during:** Task 1 (build verification)
- **Issue:** Prisma v7 generates a "client" engine type (WASM-based) that requires either an `adapter` or `accelerateUrl`. The existing `new PrismaClient({ log: ... })` call threw `PrismaClientConstructorValidationError: Using engine type "client" requires either "adapter" or "accelerateUrl"` and caused build failure.
- **Fix:** Installed `@prisma/adapter-pg` and `pg`, updated `src/lib/prisma.ts` to use `PrismaPg` adapter with `connectionString: process.env["DATABASE_URL"]`
- **Files modified:** src/lib/prisma.ts, package.json, package-lock.json
- **Verification:** `npm run build` passes; `npx prisma db push` reports "already in sync"
- **Committed in:** ae987f2 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Auto-fix was essential — without it, the build fails entirely. Prisma v7 breaking change required driver adapter. No scope creep.

## Issues Encountered
- Prisma v7 "client" engine type requires database adapter — existing prisma.ts incompatible. Fixed inline per Rule 1.

## User Setup Required

External OAuth services require manual configuration when OAuth login is needed:

**Google OAuth:**
- Create OAuth 2.0 Client ID at Google Cloud Console → APIs & Services → Credentials
- Add `http://localhost:3000/api/auth/callback/google` to Authorized redirect URIs
- Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`

**Facebook OAuth:**
- Create a Facebook App (Consumer type) at Meta for Developers → My Apps
- Add Facebook Login product, set Valid OAuth Redirect URIs to `http://localhost:3000/api/auth/callback/facebook`
- Set `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET` in `.env.local`

**Note:** App works without these — OAuth providers are conditionally loaded only if env vars are set.

## Next Phase Readiness
- NextAuth foundation complete — all subsequent auth plans can use `authOptions`, `getServerSession`, and `useSession()`
- Plan 02 (registration) can wire CredentialsProvider with new user creation
- Plan 03 (login) can build login UI against the configured auth system
- Plan 04 (email verification) can use RESEND_API_KEY already in env schema
- No blockers — database is synchronized, types are clean, build passes

---
*Phase: 02-authentification*
*Completed: 2026-02-22*
