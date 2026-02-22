---
phase: 02-authentification
plan: 03
subsystem: auth
tags: [next-auth, react-hook-form, zod, shadcn, captcha, lockout, oauth, google, facebook, server-actions, prisma]

# Dependency graph
requires:
  - phase: 02-authentification
    plan: 01
    provides: "NextAuth.js v4 configured with JWT strategy, CredentialsProvider, Google/Facebook OAuth, authOptions exported from src/lib/auth.ts"
provides:
  - "Login page at /[locale]/(client)/auth/login with email/password form and Google/Facebook OAuth buttons"
  - "Progressive lockout: 3 failed login attempts triggers math CAPTCHA, 8 total failures locks account for 15 minutes"
  - "Same-email OAuth auto-linking in signIn callback (preserved from Plan 01, extended with first-time user flag)"
  - "OAuth role selection page at /[locale]/(client)/auth/oauth-role for first-time OAuth users"
  - "setOAuthRoleAction server action: updates user role, creates Provider record if PROVIDER chosen"
  - "User model extended with failedLoginAttempts and lockedUntil fields"
  - "Role-based post-login redirect: CLIENT -> /dashboard, PROVIDER -> /provider/dashboard, ADMIN -> /admin"
affects:
  - 02-02 (registration page — can reuse OAuthButtons and form patterns)
  - 02-04 (email verification — login page shows warning banner, link to verify)
  - 02-07 (RBAC middleware — login page is the signIn entry point configured in authOptions.pages)
  - all future phases (login is the entry point for all authenticated flows)

# Tech tracking
tech-stack:
  added:
    - "@hookform/resolvers (zodResolver for react-hook-form + zod integration)"
  patterns:
    - "Math CAPTCHA pattern: client-side question generation (no external service), answer verified server-side via credentials fields"
    - "Progressive lockout: DB-backed attempt counter, lock clears automatically after expiry"
    - "OAuth first-time user detection via isNewOAuthUser flag propagated through jwt callback"
    - "Role-based redirect post-login: fetch /api/auth/session after signIn, read role, push to correct dashboard"
    - "Server action pattern for OAuth role selection: getServerSession + prisma.user.update + prisma.provider.create"

key-files:
  created:
    - src/features/auth/components/LoginForm.tsx
    - src/features/auth/components/OAuthButtons.tsx
    - src/features/auth/components/OAuthRoleSelection.tsx
    - src/features/auth/actions/set-oauth-role.ts
    - src/app/[locale]/(client)/auth/login/page.tsx
    - src/app/[locale]/(client)/auth/oauth-role/page.tsx
  modified:
    - src/lib/auth.ts (lockout logic in CredentialsProvider, first-time OAuth flag in jwt callback)
    - src/types/next-auth.d.ts (added isNewOAuthUser to User, needsRoleSelection to JWT)
    - prisma/schema.prisma (added failedLoginAttempts Int @default(0), lockedUntil DateTime? to User model)
    - src/messages/fr.json (added loginTitle, loginSubtitle, rememberMe, orSeparator, continueGoogle, continueFacebook, invalidCredentials, accountLocked, captcha keys, oauthRole keys, loggingIn, loading)
    - package.json / package-lock.json (@hookform/resolvers added)

key-decisions:
  - "Math CAPTCHA chosen over hCaptcha/reCAPTCHA — no external service dependency, sufficient for PFE project scope"
  - "CAPTCHA threshold: 3 failed attempts (matches CDC spec); lockout threshold: 8 total (3 + 5 with CAPTCHA per plan spec)"
  - "Lockout error signaled as LOCKED:N via NextAuth error string — parsed client-side for localized message with minutes remaining"
  - "OAuth role selection page guards: PROVIDER/ADMIN redirect to dashboard; CLIENT/new users see selection — trade-off: existing CLIENTs see page too, but they can simply re-confirm CLIENT role"
  - "@hookform/resolvers auto-installed (Rule 3 — blocking dep missing from package.json)"
  - ".env.local copied to worktree — required for build to succeed (DATABASE_URL + NEXTAUTH_SECRET)"

patterns-established:
  - "Pattern: LoginForm tracks failedAttempts in state + shows inline CAPTCHA after threshold — no server round-trip for CAPTCHA display"
  - "Pattern: OAuthButtons always passes callbackUrl=/auth/oauth-role — role page handles returning vs new user redirect"
  - "Pattern: Server actions return ActionResult<T> discriminated union — consistent with 01-06 established pattern"
  - "Pattern: Google/Facebook inline SVG icons — no icon library dependency for brand logos"

requirements-completed: [AUTH-04, AUTH-05]

# Metrics
duration: 6min
completed: 2026-02-22
---

# Phase 2 Plan 03: Login Page & OAuth Role Selection Summary

**Login page with email/password form + math CAPTCHA progressive lockout (3 fails CAPTCHA, 8 total = 15min lock), Google/Facebook OAuth buttons, and first-time OAuth role selection at /auth/oauth-role**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-22T14:42:17Z
- **Completed:** 2026-02-22T14:48:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Login page at /fr/auth/login renders with centered card layout, email/password form (show/hide toggle), Google/Facebook OAuth buttons, "Se souvenir de moi" checkbox, and "Mot de passe oublie?" link
- Progressive lockout implemented server-side: attempt counter and lock timestamp stored in DB; after 3 fails client shows math CAPTCHA; after 8 total the account locks for 15 minutes with minutes-remaining error message
- OAuth role selection page at /fr/auth/oauth-role: CLIENT/PROVIDER radio cards with icons; setOAuthRoleAction server action updates DB role and creates Provider record; session update triggers re-JWT on next request
- User model extended with failedLoginAttempts and lockedUntil fields — schema validated and Prisma client regenerated

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement login form, OAuth buttons, and lockout logic** - `ebac61d` (feat)
2. **Task 2: Build OAuth role selection page for first-time OAuth users** - `692946a` (feat)

**Plan metadata:** (docs commit — see state update below)

## Files Created/Modified
- `src/features/auth/components/LoginForm.tsx` — Client component: react-hook-form + zod loginSchema, email/password fields, show/hide toggle, remember me checkbox, math CAPTCHA after 3 failed attempts, role-based redirect on success
- `src/features/auth/components/OAuthButtons.tsx` — Client component: Google and Facebook signIn buttons with inline SVG icons, "ou" separator, loading states
- `src/features/auth/components/OAuthRoleSelection.tsx` — Client component: CLIENT/PROVIDER radio cards with icons, calls setOAuthRoleAction, session update, redirect
- `src/features/auth/actions/set-oauth-role.ts` — Server action: getServerSession + prisma.user.update + prisma.provider.create (conditional), returns ActionResult<{role, redirectTo}>
- `src/app/[locale]/(client)/auth/login/page.tsx` — Server component page: generateMetadata, centered card layout with OAuthButtons above LoginForm
- `src/app/[locale]/(client)/auth/oauth-role/page.tsx` — Server component page: session guard (unauthenticated -> login redirect; PROVIDER/ADMIN -> dashboard redirect), renders OAuthRoleSelection
- `src/lib/auth.ts` — Extended CredentialsProvider with lockout logic (check lockedUntil, increment failedLoginAttempts, lock after threshold, reset on success); added captchaAnswer/captchaExpected credentials; extended signIn callback to flag new OAuth users
- `src/types/next-auth.d.ts` — Added isNewOAuthUser to User interface, needsRoleSelection to JWT interface
- `prisma/schema.prisma` — Added failedLoginAttempts Int @default(0) and lockedUntil DateTime? to User model
- `src/messages/fr.json` — Added 20+ translation keys for login page and OAuth role selection

## Decisions Made
- Math CAPTCHA chosen over hCaptcha/reCAPTCHA — avoids external service, QR code-level security sufficient for PFE
- CAPTCHA answer passed as extra credential field in signIn() call — server validates before password check
- Lockout error encoded as "LOCKED:N" string in NextAuth error — parsed client-side to show "Reessayez dans N minutes"
- OAuthButtons always redirects to /auth/oauth-role — that page handles whether user is new or returning

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @hookform/resolvers dependency**
- **Found during:** Task 1 (LoginForm.tsx import)
- **Issue:** react-hook-form is installed but @hookform/resolvers (required for zodResolver) was missing from package.json
- **Fix:** Ran `npm install @hookform/resolvers`
- **Files modified:** package.json, package-lock.json
- **Verification:** `npm run typecheck` passes after install
- **Committed in:** ebac61d (Task 1 commit)

**2. [Rule 3 - Blocking] Copied .env.local to worktree for build**
- **Found during:** Task 1 (build verification)
- **Issue:** Worktree lacked .env.local — build failed with "Invalid server environment variables: DATABASE_URL Required, NEXTAUTH_SECRET Required"
- **Fix:** Copied .env.local from main project directory to worktree
- **Files modified:** .env.local (worktree only — not committed, gitignored)
- **Verification:** `npm run build` succeeds after copy
- **Committed in:** N/A — .env.local is gitignored

---

**Total deviations:** 2 auto-fixed (2 blocking — Rule 3)
**Impact on plan:** Both auto-fixes essential for build success. No scope creep.

## Issues Encountered
- ESLint plugin conflict warning during build: `Plugin "@next/next" was conflicted` — pre-existing issue from worktree being nested inside parent tawa-services project, out of scope for this plan. Build still succeeds.

## User Setup Required
None for login functionality — login works without OAuth credentials (buttons conditionally rendered based on env vars set in Plan 01).

For full OAuth testing:
- Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET in .env.local (see Plan 01 summary for setup instructions)

## Next Phase Readiness
- Login page fully functional — email/password and OAuth login paths are complete
- OAuth role selection handles first-time users — no duplicate account issues
- Plan 02-02 (registration) can be implemented independently — login is the complementary flow
- Plan 02-04 (email verification) can add verification banner to dashboard (login already redirects to /dashboard for CLIENT)
- Plan 02-07 (RBAC middleware) will protect routes — authOptions.pages.signIn="/auth/login" is already configured

## Self-Check: PASSED

All created files exist on disk. All task commits (ebac61d, 692946a) verified in git log. Build passes with `npm run build`. Typecheck passes with `npm run typecheck`. Prisma schema valid.

---
*Phase: 02-authentification*
*Completed: 2026-02-22*
