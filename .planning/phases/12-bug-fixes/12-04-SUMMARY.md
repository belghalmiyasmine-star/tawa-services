---
phase: 12-bug-fixes
plan: "04"
subsystem: ui
tags: [dark-mode, css-variables, moderation, regex, tailwind]

# Dependency graph
requires:
  - phase: 12-01
    provides: Base dark mode structure and shadcn/ui token setup

provides:
  - Dark mode proper contrast via CSS variable overrides and .dark .bg-white global rule
  - Improved auto-moderation regex catching Tunisian phones, spaced digits, obfuscated emails
  - Messaging moderation parity with review moderation patterns

affects: [ui-dark-mode, messaging, review-moderation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS @layer base override: .dark .bg-white applies card token globally"
    - "Anti-evasion regex: SPACED_DIGITS_REGEX catches spaced-out phone digits"
    - "Obfuscation regex: EMAIL_OBFUSCATED_REGEX catches 'user at gmail dot com'"

key-files:
  created: []
  modified:
    - src/app/globals.css
    - src/features/review/lib/moderation.ts
    - src/features/messaging/lib/message-moderation.ts

key-decisions:
  - "Added .dark .bg-white CSS override in @layer base rather than modifying each component — single fix covers all 17 bg-white files"
  - "Used parentheses and slash in PHONE_TN_REGEX character class — covers +216 (20) 123/456 formats"
  - "Duplicated new patterns in both moderation.ts and message-moderation.ts — modules intentionally diverge per existing comment"

patterns-established:
  - "Moderation pattern: always update both review/lib/moderation.ts and messaging/lib/message-moderation.ts in parallel"

requirements-completed: [BUGF-11, BUGF-12]

# Metrics
duration: 18min
completed: 2026-02-27
---

# Phase 12 Plan 04: Dark Mode & Auto-Moderation Fixes Summary

**Dark mode contrast fixed via CSS variable tokens and global .bg-white override; auto-moderation regex extended with Tunisian phone variants, spaced-digit evasion, and obfuscated email patterns in both review and messaging modules**

## Performance

- **Duration:** 18 min
- **Started:** 2026-02-27T16:33:59Z
- **Completed:** 2026-02-27T16:52:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Dark mode CSS variables properly set: --card distinguishable from --background, correct primary-foreground in dark mode, success/warning tokens added
- Global CSS rule `.dark .bg-white` applies card token — covers all 17 components using bg-white without per-component changes
- Extended PHONE_TN_REGEX to match parentheses and slash separators e.g. `(+216) 20/123/456`
- Added SPACED_DIGITS_REGEX catching evasion like `2 0 1 2 3 4 5 6` (8 digits with separators)
- Added EMAIL_OBFUSCATED_REGEX catching `user at gmail dot com` and French variant `user chez gmail point com`
- Both review moderation and message moderation modules updated with identical patterns

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix dark mode contrast across the application** - `e3db14e` (fix)
2. **Task 2: Improve auto-moderation regex for phone and email detection** - `e556afd` (fix)

**Plan metadata:** _(committed with docs commit)_

## Files Created/Modified
- `src/app/globals.css` - Dark card/popover variables, primary-foreground fix, success/warning dark tokens, .dark .bg-white global override
- `src/features/review/lib/moderation.ts` - Extended PHONE_TN_REGEX, added SPACED_DIGITS_REGEX and EMAIL_OBFUSCATED_REGEX, updated detectContactInfo
- `src/features/messaging/lib/message-moderation.ts` - Same regex improvements in detectMessageContactInfo

## Decisions Made
- Used a single global CSS override `.dark .bg-white { background-color: hsl(var(--card)) }` rather than adding `dark:bg-*` to each of the 17 affected components — lower risk, single point of truth
- Kept both moderation modules in sync (intentional duplication per existing code comment) — messaging and review may diverge over time so each owns its patterns
- Did not modify ChatView.tsx — the plan's task 2 confirmed message-actions.ts already calls `moderateMessageContent` which applies the moderation patterns

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — build passed on both tasks without errors.

## Next Phase Readiness
- Dark mode is now consistent across all card-based layouts
- Auto-moderation catches standard phones, Tunisian format, spaced evasion, obfuscated emails
- Ready for Phase 12-05 (final bug fixes in this phase)

---
*Phase: 12-bug-fixes*
*Completed: 2026-02-27*
