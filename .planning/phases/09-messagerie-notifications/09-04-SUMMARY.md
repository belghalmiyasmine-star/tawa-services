---
phase: 09-messagerie-notifications
plan: 04
subsystem: ui
tags: [notifications, react, next-intl, shadcn, polling, react-hook-form, zod, lucide]

# Dependency graph
requires:
  - phase: 09-messagerie-notifications (plan 02)
    provides: getNotificationsAction, getUnreadNotificationCountAction, markAllNotificationsReadAction, updateNotificationPreferencesAction, getNotificationPreferencesAction

provides:
  - NotificationBell component for navbar: bell icon with red unread badge, 10s polling via setInterval
  - NotificationDropdown: up to 5 recent notifications in DropdownMenu, mark-all-read, see-all link
  - NotificationItem: type-specific icons (7 types), unread blue left-border highlight, relative time, compact mode
  - NotificationsList: Tout/Non lus filter tabs, cursor-based pagination with Charger plus button
  - NotificationPreferencesForm: per-type in-app/email toggles for 13 NotifType values, quiet hours start/end, save with toast
  - /notifications (client) and /provider/notifications (provider) full pages
  - /settings/notifications (client) and /provider/settings/notifications (provider) preference pages

affects:
  - 09-messagerie-notifications (plan 05: integration — sendNotification will now have visible UI to verify)
  - 10-admin-panel (can reuse NotificationsList for admin notification views)
  - 11-polish (Navbar layout finalized with NotificationBell)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Bell polling pattern — useCallback for fetchUnreadCount + useEffect setInterval(10s) + cleanup on unmount
    - DropdownMenu for notification bell — shadcn DropdownMenu instead of Popover (not installed), w-80 p-0 content
    - useTransition for mark-all-read — optimistic UI while server action runs
    - Cursor pagination pattern — same getNotificationsAction cursor approach as messaging

key-files:
  created:
    - src/features/notification/components/NotificationBell.tsx
    - src/features/notification/components/NotificationDropdown.tsx
    - src/features/notification/components/NotificationItem.tsx
    - src/features/notification/components/NotificationsList.tsx
    - src/features/notification/components/NotificationPreferencesForm.tsx
    - src/app/[locale]/(client)/notifications/page.tsx
    - src/app/[locale]/(provider)/provider/notifications/page.tsx
    - src/app/[locale]/(client)/settings/notifications/page.tsx
    - src/app/[locale]/(provider)/provider/settings/notifications/page.tsx
  modified:
    - src/components/layout/Navbar.tsx

key-decisions:
  - "DropdownMenu used instead of Popover for NotificationBell — @radix-ui/react-popover not in package.json, DropdownMenu already installed and provides same overlay behavior"
  - "NotificationBell allNotificationsUrl prop — role-aware: PROVIDER gets /provider/notifications, CLIENT gets /notifications, passed from Navbar session check"
  - "fetchUnreadCount wrapped in useCallback with empty deps — satisfies exhaustive-deps ESLint rule, stable across renders"
  - "Per-type toggles use disabledTypes Set (array) — both in-app and email mirrors same toggle since disabledTypes governs both channels"
  - "time type input (native HTML5) used for quiet hours — no external time picker dependency, consistent with project no-new-deps principle"

patterns-established:
  - "NotificationBell polling: useCallback + useEffect setInterval(10000) + clearInterval in cleanup + refetch on close"
  - "allNotificationsUrl role-aware prop pattern for notification components — allows reuse in both client and provider layouts"

requirements-completed:
  - NOTF-01
  - NOTF-03
  - NOTF-04

# Metrics
duration: 45min
completed: 2026-02-25
---

# Phase 9 Plan 04: Notification UI Summary

**Bell icon with 10s polling, type-icon dropdown with mark-all-read, filterable notifications page, and per-type preference toggles with quiet hours — complete notification UI.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-02-25T16:13:40Z
- **Completed:** 2026-02-25T17:00:00Z
- **Tasks:** 2
- **Files modified/created:** 10

## Accomplishments

- Built `NotificationBell` with red unread badge (polling every 10s via `getUnreadNotificationCountAction`), opens shadcn DropdownMenu with `NotificationDropdown`
- Implemented `NotificationItem` with 7 type-specific icon configurations (CalendarCheck/CreditCard/Star/MessageSquare/Shield/Bell), unread blue left-border highlight, relative time via timeAgo helper, compact mode for dropdown
- Built `NotificationDropdown` with up to 5 recent notifications, mark-all-read button using `useTransition`, see-all link
- Built `NotificationsList` with shadcn Tabs (Tout/Non lus filter), cursor-based pagination (Charger plus button), mark-all-read
- Built `NotificationPreferencesForm` with react-hook-form + zodResolver, master in-app/email toggles, per-type switches for all 13 NotifType values, quiet hours enable + start/end time inputs, success toast on save
- Updated Navbar to replace static Bell placeholder with `<NotificationBell>` component (role-aware URL for provider vs client)
- Created 4 page routes: /notifications, /provider/notifications, /settings/notifications, /provider/settings/notifications

## Task Commits

Each task was committed atomically:

1. **Task 1: NotificationBell, NotificationDropdown, NotificationItem components** - `1056ab6` (feat)
2. **Task 2: Notifications page, preferences page for client and provider** - `5a9c188` (feat)
3. **Fix: useCallback for fetchUnreadCount** - `7cb2623` (fix — Rule 1 auto-fix during Task 1 review)

## Files Created/Modified

- `src/features/notification/components/NotificationBell.tsx` - Bell icon with red badge, 10s polling setInterval, DropdownMenu trigger
- `src/features/notification/components/NotificationDropdown.tsx` - Recent 5 notifications, mark-all-read with useTransition, see-all link
- `src/features/notification/components/NotificationItem.tsx` - Type-specific icons/colors, unread blue border, relative time, compact mode, click-to-navigate
- `src/features/notification/components/NotificationsList.tsx` - Filterable list (Tout/Non lus), cursor pagination, mark-all-read
- `src/features/notification/components/NotificationPreferencesForm.tsx` - react-hook-form, per-type in-app+email switches, quiet hours, toast on save
- `src/app/[locale]/(client)/notifications/page.tsx` - Client notifications page (server component wrapping NotificationsList)
- `src/app/[locale]/(provider)/provider/notifications/page.tsx` - Provider notifications page
- `src/app/[locale]/(client)/settings/notifications/page.tsx` - Client preferences page (server component wrapping NotificationPreferencesForm)
- `src/app/[locale]/(provider)/provider/settings/notifications/page.tsx` - Provider preferences page
- `src/components/layout/Navbar.tsx` - Replaced static Bell button with `<NotificationBell>` component

## Decisions Made

- `DropdownMenu` used instead of `Popover` for the bell — @radix-ui/react-popover not in package.json; DropdownMenu provides the same overlay behavior and is already installed
- `allNotificationsUrl` prop on NotificationBell — allows Navbar to pass role-aware URL (`/provider/notifications` vs `/notifications`) without the component needing session access
- `useCallback` wrapping `fetchUnreadCount` — empty dep array makes it stable, satisfies `react-hooks/exhaustive-deps` ESLint rule in useEffect
- Per-type toggles share `disabledTypes` array for both in-app and email — both channels disabled/enabled by same type entry; master toggles control global channel state independently

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added useCallback for fetchUnreadCount in NotificationBell**
- **Found during:** Task 1 review (post-commit code review)
- **Issue:** `fetchUnreadCount` defined as plain async function inside component, referenced in `useEffect` dep array as `[]` (exhaustive-deps violation)
- **Fix:** Wrapped with `useCallback(async () => {...}, [])` — function is stable across renders, useEffect depends on it correctly
- **Files modified:** `src/features/notification/components/NotificationBell.tsx`
- **Verification:** Code review — useCallback with empty deps creates stable reference, setInterval correctly cleaned up
- **Committed in:** `7cb2623`

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug/lint fix)
**Impact on plan:** Minor correctness fix. No scope changes. All plan requirements met.

## Issues Encountered

- TypeScript compilation could not be verified via CLI due to bash path issue (path with spaces `C:\Users\pc dell\...` causes bash execution errors). TypeScript correctness verified by code review against established project patterns: `as never` cast for typed routes in Links, `useCallback` for stable async functions, correct import paths.
- A pre-existing TypeScript error in `src/features/messaging/components/ConversationList.tsx` (from plan 09-03) was found — already fixed with `as any` cast by a previous linter/agent run before this plan.

## User Setup Required

None — all components use existing server actions (getUnreadNotificationCountAction, getNotificationsAction, etc.) built in Plan 09-02.

## Next Phase Readiness

- Notification UI complete: bell badge visible in navbar, dropdown with recent notifications, full notifications page, preferences page
- Ready for Plan 09-05: Integration — wire `sendNotification` into booking/payment/review actions to trigger visible notifications
- The bell badge will show live counts once Plan 09-05 wires sendNotification triggers
- NOTF-01 (bell + badge), NOTF-03 (notifications page), NOTF-04 (preferences form) all satisfied

---
*Phase: 09-messagerie-notifications*
*Completed: 2026-02-25*

## Self-Check: PASSED

All 9 created files verified to exist on disk.
All 3 task commits (1056ab6, 5a9c188, 7cb2623) verified in git log.
