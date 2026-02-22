---
phase: 02-authentification
plan: 02
subsystem: auth
tags: [react-hook-form, zod, bcryptjs, next-auth, wizard, multi-step, server-action, typescript]

# Dependency graph
requires:
  - phase: 02-01
    provides: "NextAuth.js v4 configured with CredentialsProvider + JWT strategy; bcryptjs installed; prisma user.create available"
  - phase: 01-foundation-infrastructure
    provides: "Prisma schema with User and Provider models; tunisianPhoneSchema in common validations; shadcn/ui Card/Button/Input/Label/Checkbox components; useToast hook and Toaster"
provides:
  - "3-step registration wizard at /fr/auth/register (role selection, personal info, password/CGU)"
  - "registerAction server action: validates Tunisian phone, unique email/phone, bcrypt(12), creates User + optional Provider"
  - "Updated registerSchema with firstName/lastName/acceptCGU replacing the flat name field"
  - "RegisterWizard with progress indicator, per-step validation, auto-login on success, role-based redirect"
  - "Toaster added to locale layout — toast notifications available app-wide"
  - "@hookform/resolvers installed — zodResolver available for all future forms"
affects:
  - 02-03 (login page — can now test full auth cycle)
  - 02-04 (email verification — banner shown post-registration)
  - all future forms (hookform/resolvers pattern established)

# Tech tracking
tech-stack:
  added:
    - "@hookform/resolvers ^5.2.2 (zodResolver integration for react-hook-form)"
  patterns:
    - "Multi-step wizard pattern: local state accumulator + useForm with zodResolver, per-step trigger() validation"
    - "Server action pattern: registerAction returns ActionResult<T> discriminated union"
    - "Auto-login post-registration: signIn('credentials') then role-based router.push"
    - "Password strength indicator: inline scoring (length + uppercase + digit + special char)"
    - "Phone input: visual +216 prefix with CSS left padding, validates via tunisianPhoneSchema"

key-files:
  created:
    - src/features/auth/actions/register.ts
    - src/features/auth/components/RegisterWizard.tsx
    - src/features/auth/components/RoleStep.tsx
    - src/features/auth/components/PersonalInfoStep.tsx
    - src/features/auth/components/PasswordStep.tsx
    - src/app/[locale]/(client)/auth/register/page.tsx
  modified:
    - src/lib/validations/auth.ts (firstName/lastName/acceptCGU replacing name)
    - src/messages/fr.json (auth namespace: wizard labels + error keys)
    - src/app/[locale]/layout.tsx (Toaster added)
    - package.json / package-lock.json (@hookform/resolvers)

key-decisions:
  - "registerSchema splits name into firstName + lastName (min 2, max 50) per CONTEXT.md wizard step 2 design"
  - "acceptCGU uses z.literal(true) — TypeScript enforces true not just boolean"
  - "CLIENT redirect goes to / (home) not /dashboard — dedicated client dashboard comes in Phase 4+"
  - "Step 2 → Step 3 navigation uses trigger(['firstName','lastName','email','phone']) for per-step validation before advancing"
  - "STEP_LABELS stored as Record<1|2|3, key> to satisfy noUncheckedIndexedAccess TypeScript strict mode"
  - "Toaster added to locale layout as Rule 2 deviation — toast infrastructure was installed but not wired up"

patterns-established:
  - "Pattern: features/auth/actions/ — server actions for auth domain"
  - "Pattern: features/auth/components/ — UI components for auth domain"
  - "Pattern: useForm({ resolver: zodResolver(schema), mode: 'onTouched' }) — standard form setup"
  - "Pattern: trigger(fields) before advancing wizard steps — validates partial schema"

requirements-completed: [AUTH-01, AUTH-08]

# Metrics
duration: 7min
completed: 2026-02-22
---

# Phase 2 Plan 02: Registration Wizard Summary

**3-step registration wizard (role → personal info → password/CGU) with bcrypt server action, Tunisian phone validation, unique email/phone checks, auto-login on success, and role-based redirect**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-22T14:42:59Z
- **Completed:** 2026-02-22T14:49:28Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Registration wizard renders at /fr/auth/register with 3-step progress indicator and step labels in French
- registerAction server action validates Tunisian phone format, checks email/phone uniqueness, hashes password with bcrypt (12 rounds), and creates User + Provider records
- RegisterWizard auto-logs in the user post-registration via signIn("credentials") and redirects to role-specific route
- PasswordStep includes show/hide toggle and visual strength indicator bar (weak/medium/strong)
- Toaster connected to locale layout — app-wide toast notifications now functional
- @hookform/resolvers installed and zodResolver pattern established for all future forms

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Zod schemas and create register server action** - `d685948` (feat)
2. **Task 2: Build multi-step registration wizard UI** - `4b99940` (feat)

**Plan metadata:** (docs commit — see state update below)

## Files Created/Modified
- `src/lib/validations/auth.ts` — Split name into firstName/lastName, added acceptCGU: z.literal(true)
- `src/features/auth/actions/register.ts` — Server action: safeParse → unique checks → bcrypt hash → user.create → optional provider.create
- `src/messages/fr.json` — Added wizard step labels, firstName/lastName, acceptCGU, error keys for auth namespace
- `src/features/auth/components/RoleStep.tsx` — Radio card selection for CLIENT/PROVIDER with Search/Briefcase icons
- `src/features/auth/components/PersonalInfoStep.tsx` — firstName, lastName, email, phone with +216 prefix
- `src/features/auth/components/PasswordStep.tsx` — Password with show/hide, strength bar, CGU checkbox
- `src/features/auth/components/RegisterWizard.tsx` — 3-step orchestrator with progress indicator, auto-login, role redirect
- `src/app/[locale]/(client)/auth/register/page.tsx` — Server page wrapping wizard with generateMetadata
- `src/app/[locale]/layout.tsx` — Added Toaster component for app-wide toast notifications
- `package.json` + `package-lock.json` — Added @hookform/resolvers ^5.2.2

## Decisions Made
- CLIENT post-registration redirect goes to `/` (home page) — dedicated client dashboard page comes in Phase 4+
- STEP_LABELS stored as `Record<1|2|3, key>` instead of array to satisfy `noUncheckedIndexedAccess` TypeScript strict mode
- `trigger(fields)` called at step boundaries to run partial validation before advancing
- Password strength uses 4-point score (length 8+, length 12+, uppercase+digit combo, special char)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @hookform/resolvers dependency**
- **Found during:** Task 2 (RegisterWizard implementation)
- **Issue:** `zodResolver` from `@hookform/resolvers/zod` was not installed — react-hook-form alone does not include Zod integration
- **Fix:** `npm install @hookform/resolvers`
- **Files modified:** package.json, package-lock.json
- **Verification:** typecheck passes, build succeeds
- **Committed in:** 4b99940 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added Toaster to locale layout**
- **Found during:** Task 2 (RegisterWizard — toast on error)
- **Issue:** The Toaster component was installed (shadcn phase 1) and useToast hook exists, but Toaster was never mounted in the app — toast calls would silently do nothing
- **Fix:** Added `<Toaster />` inside NextIntlClientProvider in locale layout
- **Files modified:** src/app/[locale]/layout.tsx
- **Verification:** Build passes; Toaster renders in page HTML
- **Committed in:** 4b99940 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking dependency, 1 missing critical infrastructure)
**Impact on plan:** Both fixes required for correct functionality. No scope creep.

## Issues Encountered
- `noUncheckedIndexedAccess` TypeScript strict mode prevents array index access from returning `T` — required using `Record<1|2|3, key>` for STEP_LABELS to avoid `string | undefined` type error
- Worktree branch was behind main (missing 02-01 commits) — merged main into worktree branch before starting execution

## User Setup Required

None — no new external service configuration required. Existing DATABASE_URL and NEXTAUTH_SECRET from Plan 02-01 setup are sufficient.

## Next Phase Readiness
- Registration wizard functional — new users can create CLIENT or PROVIDER accounts
- Plan 02-03 (login page) can be built immediately using the same authOptions
- Plan 02-04 (email verification) can show the unverified email banner after registration (i18n keys already added: `unverifiedEmailBanner`, `resendVerification`)
- No blockers — typecheck passes, build succeeds

## Self-Check: PASSED

All created files verified present. All task commits verified in git log.

---
*Phase: 02-authentification*
*Completed: 2026-02-22*
