---
phase: 08-avis-evaluations
plan: 02
subsystem: ui
tags: [review, react-hook-form, star-rating, photo-upload, client-page, i18n]

# Dependency graph
requires:
  - phase: 08-avis-evaluations
    plan: 01
    provides: submitReviewAction, getReviewWindowAction, getBookingDetailAction, reviewSubmitSchema, /api/review/photos
provides:
  - StarRating interactive component (hover preview, size variants, accessible)
  - CriteriaRatingGroup component (4 criteria rows with i18n labels)
  - ReviewPhotoUploader component (upload + thumbnail grid + remove)
  - ReviewForm client component (react-hook-form, zodResolver, all criteria, char counter, toast feedback)
  - /bookings/[bookingId]/review page (CLIENT auth guard, eligibility check, form or status message)
  - "Laisser un avis" CTA on client booking detail for COMPLETED bookings
affects:
  - Client booking detail page now shows review CTA
  - 08-avis-evaluations plans 03+ (provider review page uses same ReviewForm)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - react-hook-form + zodResolver for star rating form (setValue per criteria, no register)
    - Character counter with color coding (gray < 20, green 20-450, amber 450-500)
    - useTransition for async server action in client form
    - Server component review page with getReviewWindowAction for eligibility gate

key-files:
  created:
    - src/features/review/components/StarRating.tsx
    - src/features/review/components/CriteriaRatingGroup.tsx
    - src/features/review/components/ReviewPhotoUploader.tsx
    - src/features/review/components/ReviewForm.tsx
    - src/app/[locale]/(client)/bookings/[bookingId]/review/page.tsx
  modified:
    - src/app/[locale]/(client)/bookings/[bookingId]/page.tsx

key-decisions:
  - "ReviewForm uses setValue (not register) for StarRating fields — star clicks bypass native HTML input events"
  - "Client review page mirrors provider review page structure — same eligibility states (canReview/hasReviewed/windowExpired)"
  - "Laisser un avis CTA on booking detail only visible when reviewWindow != null (COMPLETED + within 10 days)"
  - "ReviewForm authorRole prop controls photo section visibility (CLIENT and PROVIDER both see it per CDC)"

patterns-established:
  - "Star rating with hover preview: hoverValue state replaces isFilled when hoverValue > 0"
  - "Review eligibility gate: server page calls getReviewWindowAction and branches on canReview/hasReviewed"

requirements-completed: [REVW-01, REVW-03, REVW-04]

# Metrics
duration: 10min
completed: 2026-02-25
---

# Phase 8 Plan 02: Client Review Form UI Summary

**Interactive star rating form with criteria ratings, text counter, photo upload, and client review submission page wired to completed booking detail**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-25T12:03:43Z
- **Completed:** 2026-02-25T12:13:15Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- StarRating component with interactive hover preview, 5 stars, 3 size variants (sm/md/lg), accessible radiogroup role
- CriteriaRatingGroup renders all 4 required criteria (quality, punctuality, communication, cleanliness) with i18n labels
- ReviewPhotoUploader handles upload to /api/review/photos, shows thumbnails with X-remove, disables when max 3 reached
- ReviewForm integrates all components with react-hook-form + zodResolver, real-time character counter, useTransition for submit
- Client review page at `/bookings/[bookingId]/review` with auth guard, COMPLETED verification, eligibility states
- "Laisser un avis" button added to client booking detail page, visible only for COMPLETED bookings within 10-day window

## Task Commits

Each task was committed atomically:

1. **Task 1: Star rating, criteria group, and photo uploader components** - `073cfe5` (feat)
2. **Task 2: ReviewForm component, client review page, review CTA on booking detail** - `37d8274` (feat)

## Files Created/Modified

- `src/features/review/components/StarRating.tsx` - Interactive 5-star component with hover preview, size variants, readonly mode, accessible
- `src/features/review/components/CriteriaRatingGroup.tsx` - 4-criterion rating group with i18n labels (quality/punctuality/communication/cleanliness)
- `src/features/review/components/ReviewPhotoUploader.tsx` - Photo upload with thumbnail display, X-remove, max 3 limit, loading spinner
- `src/features/review/components/ReviewForm.tsx` - Complete review form (react-hook-form, overall + 4 criteria stars, text + char counter, photo upload, submit toast)
- `src/app/[locale]/(client)/bookings/[bookingId]/review/page.tsx` - Client review submission page (auth guard, status gate, review window info, form or status messages)
- `src/app/[locale]/(client)/bookings/[bookingId]/page.tsx` - Added getReviewWindowAction call + "Laisser un avis" CTA section for COMPLETED bookings

## Decisions Made

- **ReviewForm uses setValue for StarRating fields**: star clicks don't fire native HTML events, so `setValue` with `shouldValidate: true` is used instead of `register`
- **Client review page mirrors provider review page structure**: same three states (canReview → form, hasReviewed → confirmation, expired → info)
- **"Laisser un avis" CTA gates on reviewWindow**: the section only renders when `reviewWindow` is non-null (meaning status=COMPLETED and window query succeeded), showing the button only when `canReview=true`
- **Both CLIENT and PROVIDER can upload photos**: ReviewPhotoUploader shown regardless of authorRole per CDC requirement

## Deviations from Plan

### Context Note

Prior agent sessions had already created some artifacts (ReviewForm.tsx was committed in `4fc0baf feat(08-03)` as a Rule 3 deviation to unblock plan 08-03, and the provider review page was also committed). The plan 08-02 execution committed:
- Task 1: The 3 base components (StarRating, CriteriaRatingGroup, ReviewPhotoUploader) that were on disk but untracked
- Task 2: The new client review page and client booking detail CTA (genuinely missing from any prior commit)

None of the plan's intended functionality was skipped — all required components and the client review page are now properly committed under 08-02 commit hashes.

## User Setup Required

None.

## Next Phase Readiness

- All client review UI is complete — clients can navigate from their booking detail to the review form
- ReviewForm is shared and reusable for the provider review page (already wired in 08-03)
- Review display components (provider profile reviews tab) can be built in 08-03/08-04 using the same StarRating component in readonly mode

---
*Phase: 08-avis-evaluations*
*Completed: 2026-02-25*

## Self-Check: PASSED

All files verified:
- FOUND: src/features/review/components/StarRating.tsx
- FOUND: src/features/review/components/CriteriaRatingGroup.tsx
- FOUND: src/features/review/components/ReviewPhotoUploader.tsx
- FOUND: src/features/review/components/ReviewForm.tsx
- FOUND: src/app/[locale]/(client)/bookings/[bookingId]/review/page.tsx
- FOUND: .planning/phases/08-avis-evaluations/08-02-SUMMARY.md

All commits verified:
- FOUND: 073cfe5 feat(08-02): Star rating, criteria group, and photo uploader components
- FOUND: 37d8274 feat(08-02): ReviewForm component, client review page, and review CTA on booking detail
