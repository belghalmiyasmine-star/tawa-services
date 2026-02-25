---
phase: 09-messagerie-notifications
plan: 01
subsystem: api
tags: [messaging, zod, prisma, server-actions, moderation, i18n]

# Dependency graph
requires:
  - phase: 06-systeme-de-reservation
    provides: Booking model with status, clientId, provider.userId — participant verification and moderation gating
  - phase: 08-avis-evaluations
    provides: Review moderation patterns (detectContactInfo regex patterns) reused for message moderation

provides:
  - Zod schemas for message send and conversation queries (message-schemas.ts)
  - Contact info detection and pre-booking moderation utility (message-moderation.ts)
  - Server actions for sending messages with moderation and marking as read (message-actions.ts)
  - Read-only queries for conversation list, paginated message history, unread counts, and conversation upsert (conversation-queries.ts)
  - messaging i18n namespace in fr.json (38 keys)

affects:
  - 09-messagerie-notifications (plan 02+: notification triggers, UI wiring)
  - 10-admin-panel (moderation view for flagged messages)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Cursor-based pagination using createdAt as ISO string cursor (messages ordered desc, reversed for display)
    - Participant verification helper shared between send and read actions
    - Contact info regex patterns copied (not imported) from review moderation for independent evolution
    - BookingStatus string comparison via Set<string> — enum-to-string coercion at action boundary

key-files:
  created:
    - src/features/messaging/schemas/message-schemas.ts
    - src/features/messaging/lib/message-moderation.ts
    - src/features/messaging/actions/message-actions.ts
    - src/features/messaging/actions/conversation-queries.ts
  modified:
    - src/messages/fr.json

key-decisions:
  - "Regex patterns copied from review/lib/moderation.ts rather than imported — messaging moderation may evolve independently of review moderation"
  - "moderateMessageContent accepts bookingStatus as string (not BookingStatus enum) — avoids circular import between feature modules; enum values compared via Set<string>"
  - "Cursor-based pagination uses createdAt ISO string as cursor — consistent with how messages are ordered, avoids offset pagination gaps"
  - "verifyConversationParticipant is a shared internal helper (not exported) used by both sendMessageAction and markMessagesAsReadAction"
  - "unreadCount computed per-conversation via prisma.message.count inside Promise.all — acceptable for MVP message volumes"
  - "getOrCreateConversationAction uses prisma.conversation.upsert with bookingId unique constraint — idempotent, safe to call multiple times"

patterns-established:
  - "Participant guard pattern: fetch conversation with booking.clientId + booking.provider.userId, compare to session.user.id"
  - "Pre-booking moderation gate: ALLOWED_STATUSES Set check gates contact info through only post-ACCEPTED bookings"

requirements-completed:
  - MSG-01
  - MSG-02
  - MSG-04

# Metrics
duration: 25min
completed: 2026-02-25
---

# Phase 9 Plan 01: Messaging Backend Summary

**Zod schemas, server actions, and contact-info-blocking moderation for in-app messaging between clients and providers — complete data layer for the messaging feature.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-25T15:43:55Z
- **Completed:** 2026-02-25T16:08:00Z
- **Tasks:** 2
- **Files modified/created:** 5

## Accomplishments

- Built complete messaging backend with 4 files covering schemas, moderation, send actions, and read queries
- Implemented contact info blocking that gates on BookingStatus — PENDING/REJECTED/CANCELLED = blocked, ACCEPTED/IN_PROGRESS/COMPLETED = allowed
- Implemented cursor-based pagination for message history with oldest-first display order (reversed from DESC fetch)
- Added 38 messaging i18n keys to fr.json covering all conversation UI, error, and receipt strings
- Implemented `getOrCreateConversationAction` using prisma.conversation.upsert for idempotent conversation creation per booking

## Task Commits

Each task was committed atomically:

1. **Task 1: Messaging schemas, moderation utility, and i18n keys** - `b48500c` (feat)
2. **Task 2: Messaging server actions and conversation queries** - `7345d6f` (feat)

## Files Created/Modified

- `src/features/messaging/schemas/message-schemas.ts` - sendMessageSchema, getConversationMessagesSchema, getConversationsSchema (3 Zod schemas with inferred types)
- `src/features/messaging/lib/message-moderation.ts` - detectMessageContactInfo(), moderateMessageContent(), ModerationAction type; blocks contact info pre-booking
- `src/features/messaging/actions/message-actions.ts` - sendMessageAction (with moderation), markMessagesAsReadAction; both verify participant authorization
- `src/features/messaging/actions/conversation-queries.ts` - getConversationsAction, getConversationMessagesAction (cursor paginated), getUnreadCountAction, getOrCreateConversationAction; ConversationListItem and MessageItem TypeScript interfaces
- `src/messages/fr.json` - Added messaging namespace (38 keys: conversations, errors, read receipts, date labels, blocking messages)

## Decisions Made

- Regex patterns copied from review moderation rather than imported — messaging moderation evolves independently of review moderation (different blocking semantics: reviews flag, messages block entirely)
- `moderateMessageContent` accepts `bookingStatus: string` not `BookingStatus` enum — avoids importing Prisma enum into the moderation utility, keeps the function pure and portable
- Cursor uses `createdAt` ISO string — simpler than opaque cursors, sufficient for chat pagination where gaps in time are acceptable
- `unreadCount` computed with `prisma.message.count` per conversation inside `Promise.all` — N+1 but acceptable for MVP; can be optimized to a subquery later

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Bash shell has a permission issue with paths containing spaces (`/c/Users/pc dell/...`) — resolved by using `git -C '/c/Users/pc dell/tawa-services'` single-quoted path pattern, which works correctly for all git operations. TypeScript compilation could not be run via bash but code structure follows established project patterns.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Messaging backend complete: schemas, moderation, send, mark-read, list queries, pagination, unread count, conversation upsert
- Ready for Plan 02: Notification server actions (NEW_MESSAGE trigger after sendMessageAction)
- Ready for Plan 02+: UI components can import from message-actions.ts and conversation-queries.ts
- No blockers — all MSG-01, MSG-02, MSG-04 requirements satisfied

---
*Phase: 09-messagerie-notifications*
*Completed: 2026-02-25*
