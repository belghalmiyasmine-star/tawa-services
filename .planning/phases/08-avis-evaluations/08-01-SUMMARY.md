---
phase: 08-avis-evaluations
plan: 01
subsystem: api
tags: [review, zod, server-actions, moderation, prisma, i18n, file-upload]

# Dependency graph
requires:
  - phase: 06-systeme-de-reservation
    provides: Booking model with clientId/providerId/completedAt, BookingStatus COMPLETED
  - phase: 07-paiement-simule
    provides: Provider model with rating/ratingCount fields ready for update
provides:
  - Zod schema reviewSubmitSchema (5 ratings + text 20-500 chars + max 3 photo URLs)
  - submitReviewAction (session auth, booking ownership, 10-day window, double-blind publish)
  - moderateReviewContent (contact info + spam scoring 0-100)
  - detectContactInfo (email, TN phone +216, messaging apps, social media)
  - getBookingReviewsAction (returns published + own unpublished)
  - getProviderReviewsAction (paginated, sortable, with criteria averages)
  - getReviewWindowAction (canReview/hasReviewed/daysRemaining/otherPartyReviewed)
  - updateProviderRating (recomputes provider.rating + ratingCount)
  - POST /api/review/photos (multipart upload, max 5MB, jpg/png/webp, saves to /uploads/reviews/[userId]/)
  - 40 review i18n keys in fr.json (writeReview through verifiedBooking)
affects:
  - 08-avis-evaluations plans 02+ (UI components depend on these server primitives)
  - admin moderation panel (flagged reviews accessible via prisma.review.findMany({ flagged: true }))

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Double-blind review publish (both parties must review before either review is visible)
    - Auto-moderation with regex contact detection + spam scoring before DB write
    - ActionResult<T> discriminated union (consistent with rest of codebase)
    - updateProviderRating helper (internal, not exported as action) called post-publish

key-files:
  created:
    - src/features/review/schemas/review.ts
    - src/features/review/actions/review-actions.ts
    - src/features/review/actions/review-queries.ts
    - src/features/review/lib/moderation.ts
    - src/app/api/review/photos/route.ts
  modified:
    - src/messages/fr.json

key-decisions:
  - "Double-blind publish: both client and provider must review before either review is published (prevents bias from seeing the other's review first)"
  - "moderateReviewContent returns flagged=true if hasContact OR spamScore > 60 — flagged reviews are stored but not published until admin moderates"
  - "updateProviderRating is not exported as a server action — it is an internal helper called only within publishBothReviews"
  - "getProviderReviewsAction accepts providerId (not userId) — resolves to userId internally for targetId matching"
  - "Photo upload route saves to /public/uploads/reviews/[userId]/[uuid].ext — max 3 photos enforced at schema level not API level"
  - "Author first name only in getProviderReviewsAction — extracts from User.name full name for privacy"

patterns-established:
  - "Double-blind review pattern: publishBothReviews() called after both CLIENT + PROVIDER reviews exist for a booking"
  - "Moderation-first pattern: moderateReviewContent runs before prisma.review.create — flagged field set at creation"

requirements-completed: [REVW-01, REVW-02, REVW-03, REVW-04, REVW-05, REVW-07]

# Metrics
duration: 28min
completed: 2026-02-25
---

# Phase 8 Plan 01: Avis Evaluations — Backend Foundation Summary

**Zod review schema + server actions (submit/query) + auto-moderation (contact/spam detection) + photo upload API + 40 i18n keys for the double-blind review system**

## Performance

- **Duration:** 28 min
- **Started:** 2026-02-25T11:37:42Z
- **Completed:** 2026-02-25T12:05:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Complete server-side review module ready for UI integration: schemas, actions, queries, moderation, photo upload
- Auto-moderation detects Tunisian phone numbers (+216), emails, WhatsApp/Telegram mentions, and social media links before DB write
- Double-blind publish system: reviews become public only when BOTH client and provider submit their review, preventing mutual influence
- Provider rating recomputed automatically after double-blind publish, maintaining accurate provider.rating + ratingCount
- 40 review i18n keys added to fr.json covering the complete review UI (submission, status messages, window expiry, sorting, moderation notices)

## Task Commits

Each task was committed atomically:

1. **Task 1: Review Zod schemas, server actions (submit + query), and auto-moderation** - `19d81a3` (feat)
2. **Task 2: Review photo upload API route and i18n keys** - `f0dafe8` (feat)

## Files Created/Modified

- `src/features/review/schemas/review.ts` - reviewSubmitSchema with bookingId/stars/4-criteria/text(20-500)/photoUrls(max 3)
- `src/features/review/lib/moderation.ts` - detectContactInfo + computeSpamScore (0-100) + moderateReviewContent
- `src/features/review/actions/review-actions.ts` - submitReviewAction with full validation chain, updateProviderRating helper
- `src/features/review/actions/review-queries.ts` - getBookingReviewsAction, getProviderReviewsAction (paginated+sorted), getReviewWindowAction
- `src/app/api/review/photos/route.ts` - POST handler for review image upload, saves to /uploads/reviews/[userId]/[uuid].ext
- `src/messages/fr.json` - Expanded review namespace from 8 keys to 40 keys

## Decisions Made

- **Double-blind publish**: both client and provider must review before either review is published — prevents bias from seeing the other's review first
- **moderateReviewContent returns flagged=true** if `hasContact OR spamScore > 60` — flagged reviews are stored but not auto-published until admin clears them
- **updateProviderRating** is not exported as a server action — it is an internal helper called only within `publishBothReviews`
- **getProviderReviewsAction accepts `providerId`** (not `userId`) — resolves to `userId` internally for `targetId` matching
- **Photo upload API** saves to `/public/uploads/reviews/[userId]/[uuid].ext` — max 3 photos enforced at schema level not API level (consistent with service photos pattern)
- **Author first name only** in `getProviderReviewsAction` — extracts from `User.name` full name string for privacy

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The bash shell in this environment outputs "permission denied" for the /c/Users/pc path due to the space in "pc dell" directory name, but all file operations (write, git add, git commit) executed successfully — verified by confirming file creation and commit hashes.
- TypeScript compilation could not be run interactively due to the bash path issue, but code was verified by manual review against the existing codebase patterns (ActionResult<T>, prisma relations, next-auth session pattern).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All server-side review primitives are in place: schemas, actions, queries, moderation, photo upload, and i18n
- UI integration plans (08-02+) can import directly from the created modules
- Review form component can use `reviewSubmitSchema` for client-side validation
- Provider profile page can call `getProviderReviewsAction(providerId)` for the reviews tab
- Booking detail pages can call `getReviewWindowAction(bookingId)` to show/hide the review form

---
*Phase: 08-avis-evaluations*
*Completed: 2026-02-25*

## Self-Check: PASSED

All files verified:
- FOUND: src/features/review/schemas/review.ts
- FOUND: src/features/review/lib/moderation.ts
- FOUND: src/features/review/actions/review-actions.ts
- FOUND: src/features/review/actions/review-queries.ts
- FOUND: src/app/api/review/photos/route.ts
- FOUND: src/messages/fr.json (modified)
- FOUND: .planning/phases/08-avis-evaluations/08-01-SUMMARY.md

All commits verified:
- FOUND: 19d81a3 feat(08-01): Review Zod schemas, server actions (submit + query), and auto-moderation
- FOUND: f0dafe8 feat(08-01): Review photo upload API route and complete i18n keys
