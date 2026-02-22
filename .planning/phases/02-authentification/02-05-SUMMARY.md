---
phase: 02-authentification
plan: 05
subsystem: auth
tags: [otp, sms, phone-verification, prisma, next-auth, react, typescript]

# Dependency graph
requires:
  - phase: 02-02
    provides: RegisterWizard multi-step form, registerAction returning userId

provides:
  - ISmsService interface with SimulatedSmsService (console log in dev, pluggable for Twilio/Vonage)
  - sendOtpAction: generates 6-digit code, 5-min expiry, invalidates old OTPs, calls smsService.sendOtp
  - verifyOtpAction: validates code, enforces 5-attempt limit, marks user.phoneVerified = true
  - PhoneOtp Prisma model for OTP persistence
  - OtpVerificationStep.tsx: inline 6-digit input UI with countdown timer and resend
  - RegisterWizard extended to 4 steps — OTP step 4 after successful account creation

affects: [02-04-email-verification, 02-06-rbac, phase-04-client-dashboard, phase-05-search]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ISmsService abstraction pattern: interface + SimulatedSmsService in dev, pluggable real service in prod
    - OTP lifecycle: invalidate previous → generate → persist → send → verify → mark verified
    - Wizard step transition via state: otpUserId + otpPhone set after registerAction, triggers step 4
    - 6-digit individual input pattern with auto-focus, auto-advance, and paste support

key-files:
  created:
    - src/lib/sms.ts
    - src/features/auth/actions/send-otp.ts
    - src/features/auth/actions/verify-otp.ts
    - src/features/auth/components/OtpVerificationStep.tsx
  modified:
    - prisma/schema.prisma (added PhoneOtp model)
    - src/features/auth/components/RegisterWizard.tsx (extended to 4 steps)
    - src/messages/fr.json (added OTP translation keys)

key-decisions:
  - "ISmsService abstraction allows plugging Twilio/VonageSmsService without code changes — SimulatedSmsService logs to console in dev"
  - "PhoneOtp model persists OTP codes with 5-minute expiry, max 5 attempt limit, and usedAt invalidation pattern"
  - "OTP step is inline in the wizard (step 4) not a separate page — matches CONTEXT.md decision"
  - "sendOtpAction called on entering step 4 (after registerAction success) not on component mount — prevents double-send"
  - "verifyOtpAction uses $transaction to atomically mark OTP used and set phoneVerified=true"

patterns-established:
  - "ISmsService pattern: define interface → SimulatedSmsService in sms.ts → export singleton smsService"
  - "OTP actions use ActionResult<void> discriminated union consistent with existing server actions"
  - "Countdown timer via useEffect decrement pattern (resendCooldown state, setTimeout decrement)"

requirements-completed: [AUTH-07, AUTH-08]

# Metrics
duration: 5min
completed: 2026-02-22
---

# Phase 2 Plan 5: SMS OTP Phone Verification Summary

**ISmsService abstraction with SimulatedSmsService (console log) and inline 6-digit OTP step 4 in registration wizard — phoneVerified = true on success**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-22T14:58:16Z
- **Completed:** 2026-02-22T15:03:27Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- PhoneOtp Prisma model with 6-digit code, 5-minute expiry, 5-attempt limit, and invalidation support
- ISmsService interface + SimulatedSmsService console log implementation — pluggable for Twilio/Vonage
- sendOtpAction and verifyOtpAction server actions with full error handling and atomic DB updates
- OtpVerificationStep.tsx: 6 individual digit inputs, auto-focus/advance/paste, countdown timer (60s), French error messages
- RegisterWizard extended from 3 to 4 steps: registration → OTP verification → auto-sign-in → dashboard redirect

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ISmsService abstraction and OTP server actions** - `4cbfc75` (feat)
2. **Task 2: Add OTP verification as step 4 in registration wizard** - `a9069f1` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/lib/sms.ts` - ISmsService interface and SimulatedSmsService (dev console log implementation)
- `src/features/auth/actions/send-otp.ts` - Generates 6-digit OTP, invalidates old, creates PhoneOtp, calls smsService.sendOtp
- `src/features/auth/actions/verify-otp.ts` - Validates code, tracks attempts, sets phoneVerified=true atomically
- `prisma/schema.prisma` - Added PhoneOtp model (code, expiresAt, usedAt, attempts)
- `src/features/auth/components/OtpVerificationStep.tsx` - 228-line OTP UI with individual digit inputs and countdown timer
- `src/features/auth/components/RegisterWizard.tsx` - Extended to 4 steps, triggers sendOtp on step transition
- `src/messages/fr.json` - Added otpTitle, otpSubtitle, verifyCode, resendCode, resendIn, otpInvalid, otpIncorrect, otpTooManyAttempts, otpSent, step4Title

## Decisions Made
- ISmsService abstraction lets production swap in TwilioSmsService without touching action code
- OTP persisted in PhoneOtp table (not session) — supports server restart, multiple devices
- Max 5 attempts per OTP enforced server-side to prevent brute-force
- verifyOtpAction uses prisma.$transaction for atomic OTP mark-used + user.phoneVerified=true update
- Resend button starts 60-second countdown — matches UX pattern for SMS rate limiting

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @hookform/resolvers dependency**
- **Found during:** Task 1 (typecheck after creating OTP actions)
- **Issue:** @hookform/resolvers was in package.json but not installed in node_modules — typecheck failed with TS2307
- **Fix:** Ran `npm install @hookform/resolvers`
- **Files modified:** package.json, package-lock.json
- **Verification:** npm run typecheck passes after install
- **Committed in:** 4cbfc75 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking dependency)
**Impact on plan:** Missing dependency was blocking typecheck. Fix was essential, no scope creep.

## Issues Encountered
- fr.json and middleware.ts had pre-existing uncommitted changes from plan 02-06 (another agent/worktree). Carefully staged only plan 02-05 relevant files for each commit. OTP translation keys added to fr.json were included in Task 1 commit via the pre-existing fr.json modification (which had 02-06 changes already staged).

## User Setup Required
None - OTP uses SimulatedSmsService (console log). No external SMS service configuration required for development.

## Next Phase Readiness
- Phone verification complete. phoneVerified=true set on user after OTP success.
- ISmsService abstraction ready for Twilio/Vonage integration in later phases.
- Plan 02-06 (RBAC/middleware) appears to have been executed already in another worktree.

---
*Phase: 02-authentification*
*Completed: 2026-02-22*
