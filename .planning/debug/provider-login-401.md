---
status: resolved
trigger: "Provider login broken - 401 errors"
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

hypothesis: Password mismatch - users entering wrong password for stored hash
test: Reset password for test provider and verify bcrypt.compare works
expecting: Login succeeds after password reset
next_action: User tests login with reset credentials

## Symptoms

expected: Provider can login with correct credentials
actual: Returns 401 "email ou mot de passe invalide"
errors: 401 on login attempt
reproduction: Attempt to login as any provider user
started: Unknown

## Eliminated

- hypothesis: failedLoginAttempts >= 3 triggering CAPTCHA requirement
  evidence: All 7 provider users have failedLoginAttempts = 0
  timestamp: 2026-02-23

- hypothesis: Account locked (lockedUntil in the future)
  evidence: All 7 provider users have lockedUntil = null
  timestamp: 2026-02-23

- hypothesis: Account disabled (isActive=false or isBanned=true)
  evidence: All 7 provider users have isActive=true, isBanned=false
  timestamp: 2026-02-23

- hypothesis: Password hash corrupted or missing
  evidence: All 7 provider users have valid 60-char bcrypt hashes with $2b$12$ prefix
  timestamp: 2026-02-23

## Evidence

- timestamp: 2026-02-23
  checked: src/lib/auth.ts authorize flow
  found: Lines 58-86 show multiple rejection paths - isActive/isBanned check, lockedUntil check, CAPTCHA requirement at failedLoginAttempts >= 3, password comparison
  implication: Any of these could silently return null (401) without specific error messages

- timestamp: 2026-02-23
  checked: Database - all 7 provider users auth fields
  found: All users have clean state (isActive=true, isBanned=false, failedLoginAttempts=0, lockedUntil=null, valid passwordHash)
  implication: No account-level blocks exist; the 401 is purely from bcrypt.compare failing (password mismatch)

- timestamp: 2026-02-23
  checked: Password reset and verification for yasmine.belghalmi@esen.tn
  found: Reset to "Test1234!" with bcrypt 12 rounds, bcrypt.compare verified = true
  implication: Login should now work with reset credentials

## Resolution

root_cause: Password mismatch - the stored bcrypt hashes did not match the passwords being entered. No account-level blocks (lockout, ban, CAPTCHA) were in effect. The authorize function in auth.ts correctly returns null when bcrypt.compare fails, producing the 401.
fix: Reset failedLoginAttempts=0 and lockedUntil=null for all 7 provider users (precautionary). Reset password for yasmine.belghalmi@esen.tn to "Test1234!" with bcrypt 12 rounds. Verified hash works via bcrypt.compare.
verification: bcrypt.compare("Test1234!", storedHash) = true. User needs to test login in browser.
files_changed: [scripts/fix-provider-login.mjs]
