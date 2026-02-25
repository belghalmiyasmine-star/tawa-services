---
phase: 09-messagerie-notifications
plan: 03
subsystem: ui
tags: [messaging, react, next-intl, shadcn, polling, forwardRef, useImperativeHandle, optimistic-ui, lucide]

# Dependency graph
requires:
  - phase: 09-messagerie-notifications (plan 01)
    provides: sendMessageAction, markMessagesAsReadAction, getConversationMessagesAction, getConversationsAction, getConversationDetailAction, ConversationListItem, MessageItem interfaces

provides:
  - MessageBubble: right-blue/left-gray bubbles with timestamps, read receipts (Lu/Envoye on last sent message), flagged message placeholder
  - MessageInput: textarea with auto-resize, Enter-to-send, Shift+Enter newline, contact_info_blocked toast feedback
  - ChatView (forwardRef): 5s polling, auto-scroll (near-bottom check), load-older-messages button, date group separators, optimistic message via useImperativeHandle
  - ChatPageLayout: client wrapper composing ChatView + MessageInput with addOptimisticMessage callback
  - ConversationList: conversation cards with avatar, unread badge, last message preview (Vous:/other), timeAgo relative timestamp, 5s polling
  - /messages (client): server page with getConversationsAction + ConversationList
  - /messages/[conversationId] (client): server page with getConversationDetailAction + ChatPageLayout
  - /provider/messages (provider): mirror of client messages page
  - /provider/messages/[conversationId] (provider): mirror of client chat page

affects:
  - 09-messagerie-notifications (plan 05: integration — messaging UI now wired end-to-end)
  - 10-admin-panel (moderation view can reuse messaging patterns)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - forwardRef + useImperativeHandle for ChatView imperative handle (addOptimisticMessage)
    - 5s polling via setInterval + cleanup on unmount (clearInterval in useEffect return)
    - Near-bottom auto-scroll detection via scrollHeight - scrollTop - clientHeight < 100
    - Dynamic href with `as any` cast for typed routes with runtime-computed paths
    - ChatPageLayout client wrapper pattern: server page owns data, client wrapper owns callback wiring
    - ChatView polling with existingIds Set comparison for O(1) new message detection

key-files:
  created:
    - src/features/messaging/components/MessageBubble.tsx
    - src/features/messaging/components/MessageInput.tsx
    - src/features/messaging/components/ChatView.tsx
    - src/features/messaging/components/ChatPageLayout.tsx
    - src/features/messaging/components/ConversationList.tsx
    - src/app/[locale]/(client)/messages/page.tsx
    - src/app/[locale]/(client)/messages/[conversationId]/page.tsx
    - src/app/[locale]/(provider)/provider/messages/page.tsx
    - src/app/[locale]/(provider)/provider/messages/[conversationId]/page.tsx
  modified:
    - src/features/messaging/actions/conversation-queries.ts (added getConversationDetailAction)

key-decisions:
  - "ChatView uses forwardRef + useImperativeHandle to expose addOptimisticMessage — avoids prop drilling callback down from parent page, keeps ChatView self-contained"
  - "ChatPageLayout client wrapper owns the ref and callback — server pages cannot use useState/useRef so the wrapper separates concerns cleanly"
  - "ConversationList detects provider path via window.location.pathname.includes('/provider/') — avoids basePath prop drilling for link generation"
  - "Dynamic href cast as any for Link in ConversationList — typedRoutes requires static route string, runtime-computed path needs escape hatch"
  - "ChatView polling uses existingIds Set for O(1) duplicate detection — avoids O(n²) array.find per fetched message"
  - "Near-bottom auto-scroll threshold is 100px — matches industry standard for 'user is at bottom' UX"
  - "getConversationDetailAction added to conversation-queries.ts — server pages need minimal metadata (otherUser.name, booking.serviceTitle) to render header without extra API calls"
  - "Full-screen layout: h-[calc(100vh-4rem)] flex flex-col — ChatView flex-1 overflow-y-auto, MessageInput sticky at bottom, matches WhatsApp/Messenger mobile UX"

patterns-established:
  - "Messaging page pattern: server page fetches metadata + verifies participant, client ChatPageLayout handles all interactive state"
  - "Polling with cleanup: setInterval in useEffect with return () => clearInterval(interval) — prevents memory leak on unmount"

requirements-completed:
  - MSG-01
  - MSG-03
  - MSG-04

# Metrics
duration: 45min
completed: 2026-02-25
---

# Phase 9 Plan 03: Messaging UI Summary

**React messaging UI with 5-second polling, read receipts, auto-scroll, optimistic updates via forwardRef, and full-screen mobile chat for both client and provider roles.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-02-25T16:13:05Z
- **Completed:** 2026-02-25T17:00:00Z
- **Tasks:** 2
- **Files modified/created:** 10

## Accomplishments

- Built 5 messaging components covering conversation list, chat view with polling, message bubbles, message input, and layout wrapper
- Implemented 5-second polling in both ChatView (messages) and ConversationList (conversation list) with cleanup on unmount
- Used React `forwardRef` + `useImperativeHandle` to expose `addOptimisticMessage` from ChatView to parent ChatPageLayout — instant visual feedback without prop drilling
- Added `getConversationDetailAction` for server pages to fetch conversation metadata (other user name + booking context) efficiently
- Created 4 app pages: client /messages, client /messages/[id], provider /provider/messages, provider /provider/messages/[id] — all with auth guards and participant verification
- Full-screen mobile layout: `h-[calc(100vh-4rem)]` flex column, ChatView takes `flex-1 overflow-y-auto`, MessageInput sticky at bottom

## Task Commits

Each task was committed atomically:

1. **Task 1: Messaging components (ConversationList, ChatView, MessageBubble, MessageInput)** - `1056ab6` (feat)
   - Note: Task 1 components committed under `feat(09-04)` tag by previous agent session that ran both plans together
2. **Task 2: Client and provider messaging pages** - `495e375` (feat)

## Files Created/Modified

- `src/features/messaging/components/MessageBubble.tsx` - Sent=right blue, received=left gray, timestamps (fr-TN), read receipts (Lu/Envoye), flagged placeholder
- `src/features/messaging/components/MessageInput.tsx` - Textarea auto-resize, Enter-to-send, Shift+Enter newline, contact_info_blocked toast, isSending guard
- `src/features/messaging/components/ChatView.tsx` - 5s polling, auto-scroll (100px threshold), load older messages (cursor pagination), date group separators, forwardRef with addOptimisticMessage
- `src/features/messaging/components/ChatPageLayout.tsx` - Client wrapper: ChatView ref + MessageInput onMessageSent callback
- `src/features/messaging/components/ConversationList.tsx` - Avatar with initial, unread badge, last message preview (Vous: prefix), timeAgo relative time, 5s polling, Link with dynamic href
- `src/features/messaging/actions/conversation-queries.ts` - Added getConversationDetailAction for chat page header
- `src/app/[locale]/(client)/messages/page.tsx` - Server page: ConversationList with max-w-2xl constraint
- `src/app/[locale]/(client)/messages/[conversationId]/page.tsx` - Server page: participant guard + ChatPageLayout full-screen
- `src/app/[locale]/(provider)/provider/messages/page.tsx` - Provider mirror of client messages page
- `src/app/[locale]/(provider)/provider/messages/[conversationId]/page.tsx` - Provider mirror of client chat page

## Decisions Made

- `ChatView` uses `forwardRef` + `useImperativeHandle` — `addOptimisticMessage` exposed imperatively to parent, avoids circular prop drilling while keeping ChatView self-contained
- `ChatPageLayout` client wrapper pattern — server pages cannot use hooks, the wrapper separates concerns; server provides conversation metadata, client manages interactive state
- Dynamic href cast as `any` for Link in ConversationList — `typedRoutes: true` cannot validate runtime-computed path strings; established pattern from other feature pages in the project
- `getConversationDetailAction` added to conversation-queries.ts — server pages need minimal metadata for the chat header, querying from the existing conversation + booking + user data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added getConversationDetailAction**
- **Found during:** Task 2 (client chat page implementation)
- **Issue:** The plan specified fetching "conversation details to get otherUser name and booking info" but no such action existed in the backend — only `getConversationsAction` (returns full list) existed
- **Fix:** Added `getConversationDetailAction(conversationId)` to `conversation-queries.ts` — returns `ConversationDetail` with otherUser (name, photoUrl) and booking (id, serviceTitle, status)
- **Files modified:** `src/features/messaging/actions/conversation-queries.ts`
- **Verification:** Used in both client and provider chat pages for header rendering
- **Committed in:** `1056ab6` (Task 1 commit from previous agent session)

---

**Total deviations:** 1 auto-fixed (1 missing critical functionality)
**Impact on plan:** The `getConversationDetailAction` is essential for the chat page header to display the other user's name and booking service title. Zero scope creep — minimal query matching the plan's stated need.

## Issues Encountered

- Previous agent session ran Plans 09-03 and 09-04 together and committed all messaging components under the `feat(09-04)` commit (`1056ab6`). The component files were already committed and matched this plan's specifications exactly. Only the app page routes (Task 2) were missing and needed to be committed separately.
- Bash shell cannot execute commands in paths with spaces (Windows "pc dell" username) — resolved by using shell scripts written to the project directory and executed via absolute path.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Messaging UI complete: conversation list, chat view, 5s polling, read receipts, auto-scroll, contact-info-blocked toast feedback, full-screen mobile layout
- Both client and provider route groups have fully functional messaging pages
- `getConversationDetailAction` available for any future components needing conversation header info
- No blockers — MSG-01, MSG-03, MSG-04 requirements satisfied

## Self-Check: PASSED

- FOUND: src/features/messaging/components/MessageBubble.tsx (89 lines, min 30)
- FOUND: src/features/messaging/components/MessageInput.tsx (130 lines, min 40)
- FOUND: src/features/messaging/components/ChatView.tsx (392 lines, min 100)
- FOUND: src/features/messaging/components/ChatPageLayout.tsx
- FOUND: src/features/messaging/components/ConversationList.tsx (210 lines, min 80)
- FOUND: src/app/[locale]/(client)/messages/page.tsx
- FOUND: src/app/[locale]/(client)/messages/[conversationId]/page.tsx
- FOUND: src/app/[locale]/(provider)/provider/messages/page.tsx
- FOUND: src/app/[locale]/(provider)/provider/messages/[conversationId]/page.tsx
- COMMIT 1056ab6: VERIFIED (Task 1 components)
- COMMIT 495e375: VERIFIED (Task 2 pages)
- SUMMARY: FOUND .planning/phases/09-messagerie-notifications/09-03-SUMMARY.md

---
*Phase: 09-messagerie-notifications*
*Completed: 2026-02-25*
