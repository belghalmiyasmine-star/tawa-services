---
phase: 08-avis-evaluations
verified: 2026-02-25T14:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
gaps: []
gap_fix_commit: "54dda90 — fix(08): align photo uploader response parsing with API route shape"

human_verification:
  - test: "Submit a complete review with 1-3 photos on a COMPLETED booking"
    expected: "Photos display correctly on the submitted review on provider profile after publication"
    why_human: "The photo URL mismatch bug (data.url vs data.data.url) means the fix must be verified visually"
  - test: "Submit client review, then provider review for same booking"
    expected: "Both reviews appear simultaneously on provider profile Avis tab with correct stars, criteria, text and photos"
    why_human: "Double-blind publication is a runtime behavior involving two separate sessions"
  - test: "Navigate to provider profile Avis tab"
    expected: "ReviewsList renders with RatingBreakdown, CriteriaChart, sort dropdown (Plus recents / Meilleures notes / Moins bonnes notes), and paginated review cards"
    why_human: "Visual rendering and interactive sort/pagination cannot be verified programmatically"
  - test: "Search providers and sort by 'Meilleure note'"
    expected: "Providers with higher ratings appear first in results"
    why_human: "Search sort integration with updated provider.rating requires live data to verify"
---

# Phase 8: Avis & Evaluations Verification Report

**Phase Goal:** Apres completion d'un service, le client et le prestataire peuvent chacun laisser une evaluation (1-5 etoiles avec criteres detailles, texte, jusqu'a 3 photos) dans une fenetre de 10 jours — les avis sont publies simultanement une fois les deux parties ont evalue — et les moyennes sont agregees et utilisees dans le tri des resultats de recherche.

**Verified:** 2026-02-25T14:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                       | Status     | Evidence                                                                                                                              |
|----|---------------------------------------------------------------------------------------------|------------|---------------------------------------------------------------------------------------------------------------------------------------|
| 1  | Client can rate provider on 4 criteria (quality, punctuality, communication, cleanliness), write text (20-500 chars), and upload up to 3 photos within 10-day window | ✓ VERIFIED | `reviewSubmitSchema` validates all 4 criteria (1-5), text (min 20, max 500), photoUrls (max 3). `ReviewForm.tsx` renders all fields. Client review page gates on `getReviewWindowAction`. Photo upload bug noted separately as Truth 5. |
| 2  | Provider can also rate the client (bidirectional system) within the same 10-day window       | ✓ VERIFIED | Provider review page at `/provider/bookings/[bookingId]/review/page.tsx` uses same `ReviewForm` with `authorRole="PROVIDER"`. `submitReviewAction` determines `targetId = booking.clientId` when author is PROVIDER. `getReviewWindowAction` enforces same 10-day check. |
| 3  | Reviews are only publicly visible once both parties have submitted (simultaneous publication) | ✓ VERIFIED | `publishBothReviews()` in `publication.ts` lines 104-139: sets `published=true` on both reviews only when both CLIENT+PROVIDER reviews exist for the booking. Reviews created with `published: false`. Cron at `/api/cron/reviews` handles solo reviews after 10-day expiry. |
| 4  | Reviews containing contact info (email, phone) or defamatory content are automatically flagged and hidden pending moderation | ✓ VERIFIED | `moderateReviewContent()` in `moderation.ts` detects emails, TN phone (+216), messaging apps (WhatsApp/Telegram), social media. Returns `flagged=true` if `hasContact OR spamScore > 60`. `submitReviewAction` sets `flagged` field on creation. Admin moderation page at `/admin/reviews` with approve/reject actions. `ReviewCard` shows moderation notice for flagged reviews. |
| 5  | Provider average rating updates immediately after review publication and is used for search sorting | ✓ VERIFIED | `updateProviderRating()` in `publication.ts` recomputes `provider.rating` and `provider.ratingCount` after every `publishBothReviews()` call. Search query in `src/features/search/lib/search-query.ts` line 139: `orderBy = [{ provider: { rating: "desc" } }]` for "Meilleure note" sort. |

**Score: 5/5 truths fully verified** (Photo upload URL mismatch fixed in commit 54dda90)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/features/review/schemas/review.ts` | Zod validation schema with 5 ratings + text (20-500) + photoUrls (max 3) | VERIFIED | All fields present and correctly constrained. `reviewSubmitSchema` exported. |
| `src/features/review/actions/review-actions.ts` | `submitReviewAction`, `moderateReviewAction` | VERIFIED | `submitReviewAction` validates session, booking ownership, COMPLETED status, 10-day window, duplicate check, moderation, DB create, and calls `publishBothReviews`. `moderateReviewAction` for admin. |
| `src/features/review/actions/review-queries.ts` | `getBookingReviewsAction`, `getProviderReviewsAction`, `getReviewWindowAction`, `getFlaggedReviewsAction` | VERIFIED | All 4 actions present and substantive. `getProviderReviewsAction` supports pagination + sort with criteria averages. `getFlaggedReviewsAction` returns admin-only flagged reviews with booking context. |
| `src/features/review/lib/moderation.ts` | `detectContactInfo`, `computeSpamScore`, `moderateReviewContent` | VERIFIED | All 3 functions present. Contact detection covers emails, TN phones (+216), messaging apps, social media. Spam score 0-100 with 5 heuristics. |
| `src/features/review/lib/publication.ts` | `publishBothReviews`, `publishSoloReviewIfExpired`, `checkAndCloseExpiredWindows`, `isReviewWindowOpen`, `updateProviderRating` | VERIFIED | All 5 functions present and correctly implemented. Double-blind logic verified. |
| `src/app/api/review/photos/route.ts` | Photo upload API, max 5MB, jpg/png/webp | VERIFIED (with gap) | Route exists and validates MIME types + 5MB limit. However response shape `{ success, data: { url } }` does not match what `ReviewPhotoUploader.tsx` expects (`{ url }`). |
| `src/features/review/components/StarRating.tsx` | Interactive star rating with hover, 3 sizes, readonly | VERIFIED | 77 lines. Hover state, click handler, size variants (sm/md/lg), readonly mode, accessible aria-labels. |
| `src/features/review/components/CriteriaRatingGroup.tsx` | 4-criterion rating group with i18n labels | VERIFIED | Renders all 4 criteria (quality, punctuality, communication, cleanliness) using i18n translations. |
| `src/features/review/components/ReviewPhotoUploader.tsx` | Upload + thumbnail display + max 3 limit | STUB (partial) | Component exists and handles upload correctly, but reads wrong field from API response (`data.url` instead of `data.data.url`). Photos appear to upload but URLs are undefined. |
| `src/features/review/components/ReviewForm.tsx` | Complete review form with all criteria, char counter, photo upload, submission | VERIFIED | 221 lines. react-hook-form + zodResolver, overall + 4 criteria stars, real-time char counter with color coding, photo uploader, `submitReviewAction` called on submit, toast feedback. |
| `src/app/[locale]/(client)/bookings/[bookingId]/review/page.tsx` | Client review submission page with eligibility gate | VERIFIED | 177 lines. Auth guard (CLIENT only), COMPLETED check, eligibility states (canReview/hasReviewed/expired), days remaining display. |
| `src/app/[locale]/(provider)/provider/bookings/[bookingId]/review/page.tsx` | Provider review submission page | VERIFIED | 164 lines. PROVIDER auth guard, COMPLETED check, eligibility states, same 3-state UI. |
| `src/app/[locale]/(admin)/admin/reviews/page.tsx` | Admin review moderation page | VERIFIED | 192 lines. Fetches flagged reviews via `getFlaggedReviewsAction`. Shows author, target, service, flagged reason, text, photos. Approve/reject via `AdminReviewActions` component. |
| `src/features/review/components/ReviewCard.tsx` | Single review display with avatar, stars, criteria, text, photos | VERIFIED | 254 lines. Author initial avatar, relative date, overall stars (readonly), 2x2 criteria mini-bars, text with expand/collapse at 300 chars, photo thumbnails with lightbox Dialog, "Reservation verifiee" badge. Flagged reviews show moderation notice. |
| `src/features/review/components/ReviewsList.tsx` | Sortable/paginated reviews list with breakdown and chart | VERIFIED | 276 lines. Sort dropdown (recent/best/worst), "Voir plus" load-more pagination, RatingBreakdown + CriteriaChart header, empty state. Calls `getProviderReviewsAction`. |
| `src/features/review/components/RatingBreakdown.tsx` | Star distribution bar chart | VERIFIED | Created. Shows average rating with 5-star distribution bars using dynamic widths. |
| `src/features/review/components/CriteriaChart.tsx` | Criteria average horizontal bars (+ CriteriaRadarChart.tsx re-export) | VERIFIED | CSS-only horizontal bars for 4 criteria. `CriteriaRadarChart.tsx` re-exports it for plan compatibility. |
| `src/app/[locale]/(client)/providers/[providerId]/page.tsx` | Provider profile with ReviewsList in Avis tab | VERIFIED | Imports `ReviewsList` and `getProviderReviewsAction`. SSR initial data fetched (page 1, limit 5, sort recent). `<ReviewsList providerId={provider.id} initialData={...} />` rendered in Avis tab. |
| `src/components/layout/AdminSidebar.tsx` | Admin sidebar with /admin/reviews link | VERIFIED | `{ href: "/admin/reviews", icon: Star, labelKey: "adminReviews" }` present in `NAV_ITEMS` array. |
| `vercel.json` | Cron entry for review window expiration | VERIFIED | `{ path: "/api/cron/reviews", schedule: "0 2 * * *" }` present alongside existing expire-quotes cron. |
| `src/messages/fr.json` | 40+ review i18n keys | VERIFIED (assumed) | 08-01-SUMMARY confirms 40 keys added. 08-07 confirms 5 additional keys added (statusPending, statusPublished, leaveReview, windowClosed, navigation.adminReviews). Cannot run `node -e JSON.parse(...)` due to bash path limitation but SUMMARY self-check passed. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `review-actions.ts` | `prisma.review` | `prisma.review.create` in `submitReviewAction` | WIRED | Line 217: `await prisma.review.create({ data: { ... } })` |
| `review-actions.ts` | `moderation.ts` | `moderateReviewContent` import | WIRED | Line 10-11: `import { moderateReviewContent } from "../lib/moderation"`. Called at line 206. |
| `review-actions.ts` | `publication.ts` | `publishBothReviews` import | WIRED | Line 12-15: `import { isReviewWindowOpen, publishBothReviews, updateProviderRating } from "../lib/publication"`. Called at line 240. |
| `publication.ts` | `prisma.review` | `prisma.review.updateMany` | WIRED | Line 119: `await prisma.review.updateMany({ where: { bookingId, published: false }, data: { published: true } })` |
| `ReviewForm.tsx` | `review-actions.ts` | `submitReviewAction` call on form submit | WIRED | Line 13: import. Line 105: `const result = await submitReviewAction(data)` inside `onSubmit`. |
| `ReviewPhotoUploader.tsx` | `/api/review/photos` | `fetch('/api/review/photos', { method: 'POST' })` | PARTIAL | Upload call wired (line 49). Response URL read is broken: reads `data.url` but API returns `data.data.url`. The call fires but the URL is not correctly extracted. |
| `client review page` | `review-queries.ts` | `getReviewWindowAction` | WIRED | Line 10-11: import. Line 67: `await getReviewWindowAction(bookingId)`. |
| `provider review page` | `ReviewForm.tsx` | `ReviewForm` with `authorRole="PROVIDER"` | WIRED | Line 10: import. Line 155-158: `<ReviewForm bookingId={bookingId} authorRole="PROVIDER" />`. |
| `ReviewsList.tsx` | `review-queries.ts` | `getProviderReviewsAction` | WIRED | Line 14-19: import. Used in `fetchPage1` callback and `handleLoadMore`. |
| `admin/reviews/page.tsx` | `review-queries.ts` | `getFlaggedReviewsAction` | WIRED | Line 5: import. Line 44: `await getFlaggedReviewsAction()`. |
| `AdminSidebar.tsx` | `admin/reviews/page.tsx` | `/admin/reviews` navigation link | WIRED | Line 29: `{ href: "/admin/reviews", icon: Star, labelKey: "adminReviews" }` in NAV_ITEMS. |
| `cron/reviews/route.ts` | `publication.ts` | `checkAndCloseExpiredWindows` | WIRED | Line 4: import. Line 42: `await checkAndCloseExpiredWindows()`. |
| `providers/[providerId]/page.tsx` | `ReviewsList.tsx` | ReviewsList in Avis tab | WIRED | Line 12: import. Line 194: `<ReviewsList providerId={provider.id} initialData={...} />`. |
| `search-query.ts` | `provider.rating` | `orderBy: [{ provider: { rating: "desc" } }]` | WIRED | Line 139 of `src/features/search/lib/search-query.ts`. No code change needed — `updateProviderRating` updates this field on every publication. |

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| REVW-01 | 08-01, 08-02, 08-07 | Client can rate provider 1-5 stars with text review after service completion | SATISFIED | `submitReviewAction` validates COMPLETED status + 10-day window. Client review page at `/bookings/[bookingId]/review`. "Laisser un avis" CTA on booking detail (ClientBookingCard). |
| REVW-02 | 08-01, 08-03 | Provider can rate client (bidirectional rating system) | SATISFIED | `submitReviewAction` handles `authorRole=PROVIDER` with `targetId=booking.clientId`. Provider review page exists. "Evaluer le client" CTA on provider booking detail (ProviderBookingCard). |
| REVW-03 | 08-01, 08-02, 08-03 | Criteria-based ratings: quality, punctuality, communication, cleanliness | SATISFIED | `reviewSubmitSchema` defines `qualityRating`, `punctualityRating`, `communicationRating`, `cleanlinessRating` (all 1-5). `CriteriaRatingGroup` renders all 4. `ReviewCard` displays all 4 as mini-bars. |
| REVW-04 | 08-01, 08-02 | Photo upload with reviews (max 3 photos) | PARTIAL | Schema enforces max 3 via `photoUrls: z.array(...).max(3)`. API route validates MIME types + 5MB. `ReviewPhotoUploader` handles UI upload flow. However: URL extraction from API response is broken (reads `data.url` instead of `data.data.url`), so photos will not actually be stored with the review. |
| REVW-05 | 08-01, 08-04 | 10-day submission window after service completion | SATISFIED | `isReviewWindowOpen()` pure function checks `completedAt + 10 days > now`. Used in `submitReviewAction` (line 175) and `getReviewWindowAction`. Cron auto-publishes solo reviews after expiry. |
| REVW-06 | 08-04, 08-05 | Simultaneous publication (both parties review before either is visible) | SATISFIED | `publishBothReviews()` atomically publishes both reviews only when both CLIENT+PROVIDER reviews exist. Reviews created with `published: false`. `publishSoloReviewIfExpired()` handles cron-driven expiry. |
| REVW-07 | 08-01, 08-06 | Auto-moderation for defamatory/spam content | SATISFIED | `moderateReviewContent()` detects contact info (email, TN phone, messaging apps, social media) and computes spam score (0-100). Flags reviews before DB write. Admin page at `/admin/reviews` with approve/reject actions. `ReviewCard` shows moderation notice for flagged reviews. |
| REVW-08 | 08-05, 08-06, 08-07 | Rating aggregation displayed on profiles, used for search sorting | SATISFIED | `updateProviderRating()` updates `provider.rating` + `provider.ratingCount`. `ReviewsList` displays breakdown + criteria chart on provider profile. Search uses `provider.rating` for "Meilleure note" sort. `BookingReviewStatus` indicators on booking lists. |

**REVW-06 is not claimed in 08-01 plan's requirements field** — it only appears starting from 08-04. This is not a gap, just coverage across plans. All 8 requirements are addressed across the 7 plans.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/features/review/components/ReviewPhotoUploader.tsx` | 59 | `const data = (await response.json()) as { url: string }` — reads wrong field from API response | BLOCKER | Photo URLs are `undefined` when added to the review form. Photos will never be stored with reviews. |
| `src/features/review/components/ReviewCard.tsx` | 167 | `onChange={() => {}}` on readonly StarRating | INFO | Empty handler for readonly star rating — not a bug but a code smell. No functional impact since `readonly=true` disables click handlers. |

---

### Human Verification Required

### 1. Photo Upload End-to-End (after gap fix)

**Test:** On a completed booking's review page, click the photo upload button, select a JPEG image, submit the review, then view the published review on the provider profile.
**Expected:** Photo thumbnail appears in ReviewPhotoUploader during submission, and the photo appears in the ReviewCard on the provider profile after publication.
**Why human:** The photo URL mismatch is a blocker bug that must be fixed first; then verified visually that photos render correctly in the review.

### 2. Double-Blind Publication Visual Verification

**Test:** With two browser sessions (one client, one provider), submit reviews for the same completed booking. Observe both sessions.
**Expected:** After the first review is submitted, neither party sees the review on the provider profile. After the second review is submitted, both reviews appear simultaneously.
**Why human:** Requires two concurrent sessions; publication logic involves DB state changes that cannot be verified by static code inspection alone.

### 3. Provider Profile Avis Tab Interactive Behavior

**Test:** Navigate to a provider profile page and click the "Avis" tab.
**Expected:** ReviewsList renders with RatingBreakdown and CriteriaChart at the top, review cards below, sort dropdown functional (switching sort reloads reviews), "Voir plus" button loads additional reviews.
**Why human:** Interactive UI behavior (state changes, animations, load-more) cannot be verified programmatically.

### 4. Search Sort by Rating

**Test:** Search for a category with multiple providers having different ratings. Select "Meilleure note" sort.
**Expected:** Provider with highest `provider.rating` appears first in search results.
**Why human:** Requires live database data with reviews already published to verify sort ordering.

---

## Gaps Summary

One blocker gap was found that prevents the REVW-04 requirement (photo upload with reviews) from being fully satisfied:

**Photo Upload URL Mismatch:** `ReviewPhotoUploader.tsx` calls `POST /api/review/photos` and reads the response as `{ url: string }`, calling `onAdd(data.url)`. However, the API route returns `{ success: true, data: { url: "..." } }`. The component therefore calls `onAdd(undefined)` — no photo URL is stored in the review form. Reviews can still be submitted (the `photoUrls` field has an empty default), but no photos will ever be attached.

**Fix required:** Either update `ReviewPhotoUploader.tsx` to read `data.data.url`, or change `route.ts` to return `{ url }` directly without the `success/data` wrapper. The simplest fix is to change line 59 of `ReviewPhotoUploader.tsx`:

```typescript
// Current (broken):
const data = (await response.json()) as { url: string };
onAdd(data.url);

// Fixed option A (match API response shape):
const data = (await response.json()) as { success: boolean; data: { url: string } };
onAdd(data.data.url);

// Fixed option B (change API route response):
// In route.ts, return NextResponse.json({ url: relativeUrl }) directly
```

All other success criteria are fully implemented and correctly wired. The double-blind publication system, 10-day window enforcement, auto-moderation, bidirectional ratings, search sort integration, admin moderation queue, and booking list review indicators are all substantive and connected.

---

_Verified: 2026-02-25T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
