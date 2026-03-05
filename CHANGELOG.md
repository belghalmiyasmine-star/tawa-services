# Changelog

All notable changes to Tawa Services are documented in this file.

---

## [v1.2.0] - 2026-03-04 (Uncommitted)

### AI-Powered Features (Phase 19)

#### Chatbot Assistant
- **AI chatbot widget**: Floating bottom-right chat bubble on all pages via `ChatbotLoader` in root layout. Uses Groq API (`llama-3.3-70b-versatile`), bilingual system prompt (FR/AR/Tunisian dialect), max 300 tokens, temperature 0.7
- **Chat API**: `POST /api/chat` endpoint with rate limiting (20 msg/min per session ID), history sanitization (max 20 messages), IP fallback tracking, French error messages
- **Chat UI**: 350x500px panel on desktop, fullscreen on mobile, typing indicator animation, auto-scroll, ARIA accessibility (dialog role, live region), session ID generation
- **New files**: `src/lib/ai/chatbot.ts`, `src/app/api/chat/route.ts`, `src/components/ChatbotWidget.tsx`, `src/components/ChatbotLoader.tsx`

#### Review Sentiment Analysis
- **Keyword-based analyzer** (no API calls): Classifies reviews as POSITIVE/NEUTRAL/NEGATIVE using 60% star weight + 40% keyword analysis. Detects threats (FR+AR) → CRITICAL, insults (41 FR + 22 AR keywords) → IMPORTANT, contact info (phone/email/social patterns) → MINOR
- **Auto-moderation**: `submitReviewAction` now calls `analyzeReview()` — sets `sentiment` field on review and auto-creates admin report for flagged content
- **New files**: `src/lib/ai/review-analyzer.ts`

#### AI Review Summaries
- **Groq-powered summaries**: Generates 2-3 sentence provider review summaries using last 20 published reviews (min 3 required). Cached on `Provider.reviewSummary` field. Regenerated on each new review publication
- **Provider profile integration**: "Resume des avis — Genere par IA" block displayed on provider profile Avis tab
- **New files**: `src/lib/ai/review-summary.ts`

#### Smart Provider Recommendations
- **Scoring algorithm** (no API calls): Same category as past bookings +30, same city +25, KYC verified +20, rating ≥4.5 +15, 10+ missions +10, text reviews +5, already-booked penalty -5. Returns top 6 providers
- **New files**: `src/lib/ai/recommendation.ts`

#### Sentiment Analytics (Admin)
- **Sentiment stats card**: Positive review percentage with trend indicator (TrendingUp/Down), color-coded breakdown bar (green/yellow/red), legend with counts
- **Analytics integration**: `getSentimentStatsAction()` fetches positive/neutral/negative counts with period-over-period comparison. Integrated into admin analytics dashboard
- **New files**: `src/features/admin/components/SentimentStatsCard.tsx`

#### Positive Reviews Badge
- **Server component**: Shows "XX% avis positifs" on provider profiles. Color-coded: green (≥80%), yellow (≥60%), red (<60%)
- **New files**: `src/features/review/components/PositiveReviewsBadge.tsx`

#### Prisma Schema (AI)
- `Review.sentiment` — nullable String ("POSITIVE" | "NEUTRAL" | "NEGATIVE")
- `Provider.reviewSummary` — nullable Text field for cached AI summary

#### Environment
- `GROQ_API_KEY` added to `src/env.ts` (optional) and `.env.example`

#### i18n
- `chatbot.*` keys: `title`, `welcome`, `placeholder`, `send`, `close`, `error`

---

### Contact & Content Enhancements (Phase 20)

#### Contact Form System
- **Functional contact form**: 4-field form (name, email, subject, message textarea) with field-level validation (email format, message min 10 chars), submit loading state, success/error feedback, auto-reset on success
- **Server action**: Validates all fields, persists to `ContactMessage` Prisma model, returns French success/error messages with 24h response promise
- **Page redesign**: 2-column layout with form on left + sidebar cards (email, phone, address, hours with icons) on right
- **New files**: `src/app/[locale]/(client)/contact/contact-action.ts`, `src/app/[locale]/(client)/contact/contact-form.tsx`
- **Modified**: `src/app/[locale]/(client)/contact/page.tsx`

#### Searchable FAQ
- **Search functionality**: Real-time filtering across all questions and answers, result count display, "Contact us" fallback when no results found
- **Content**: 3 sections (General/Clients/Prestataires) with 18+ FAQ items covering platform overview, booking process, payment methods, cancellation policy, KYC, commission, payment timeline
- **New files**: `src/app/[locale]/(client)/faq/faq-client.tsx`
- **Modified**: `src/app/[locale]/(client)/faq/page.tsx`

#### CGU/Terms of Service
- **Full legal document**: 10 detailed sections — platform overview, user obligations, booking conditions, 12% commission structure, cancellation policy (24h cutoff for refunds), KYC verification requirements, data protection (Tunisian law), 10-day review window, account suspension rules, dispute resolution
- **Modified**: `src/app/[locale]/(client)/legal/cgu/page.tsx`

#### Prisma Schema (Contact)
- `ContactMessage` model — id, name, email, subject, message (Text), isRead, createdAt

---

### Auth Hardening & Admin Improvements (Phase 21)

#### Auth Verification
- **Email verification**: Atomic transaction (marks email verified + token used), specific error codes (ALREADY_VERIFIED, TOKEN_EXPIRED, TOKEN_INVALID), sets `emailVerifiedAt` timestamp
- **OTP verification**: 5-attempt limit with counter increment, expiration check, sets `phoneVerifiedAt` timestamp on success
- **OAuth buttons**: Google login button with icon, loading state, "Or" separator, redirect to `/auth/oauth-role`
- **Login page**: OAuth buttons integrated above email/password form with visual separator
- **Verify email page**: Multi-state handling (no token, valid, already verified, expired) with visual icons (CheckCircle2, XCircle)
- **Modified**: `src/features/auth/actions/verify-email.ts`, `src/features/auth/actions/verify-otp.ts`, `src/features/auth/components/OAuthButtons.tsx`, login page, verify-email page

#### Admin Management
- **User actions**: Ban with required reason (min 5 chars), unban, activate/deactivate, delete — admin user protection. Both dropdown and card-based variants
- **Service actions**: Approve (PENDING_APPROVAL → ACTIVE), suspend with reason, unsuspend, toggle featured status, view link
- **Report detail**: AI-flagged review badges showing flagging reasons, status timeline (Open → Investigating → Resolved/Dismissed), SLA deadline tracking, admin notes
- **Modified**: `UserActionsDropdown.tsx`, `UserDetailActions.tsx`, `ServiceActionsDropdown.tsx`, `ReportDetailSheet.tsx`

#### Booking & Payment Hardening
- **Booking actions**: Enhanced availability checks (day/time/blocked dates/conflict detection), real-time notifications on accept/reject/start/complete, atomic payment release with 12% commission
- **Payment actions**: Hold-and-release pattern, commission calculation, provider notification on payment received
- **Modified**: `manage-bookings.ts`, `payment-actions.ts`

#### Prisma Schema (Auth)
- `User.emailVerifiedAt` — nullable DateTime
- `User.phoneVerifiedAt` — nullable DateTime

---

### Messaging Enhancements (Phase 17)
- **Image sending in chat**: Paperclip button opens file picker (jpg/png/webp, max 5MB). Images upload to `/uploads/messages/` via `POST /api/messages/upload`. Clickable thumbnails (max 200px) in chat bubbles open full-size modal
- **Conversation list display order**: Service name (bold) first, client/provider name below
- **Accessibility**: `VisuallyHidden` `DialogTitle` on image viewer modal for Radix compliance
- **Prisma**: `Message.imageUrl` nullable field
- **i18n**: `attachImage`, `removeImage`, `imageTooLarge`, `errors.uploadFailed`
- **New files**: `src/app/api/messages/upload/route.ts`
- **Modified**: `MessageBubble.tsx`, `MessageInput.tsx`, `ChatPageLayout.tsx`, `ChatView.tsx`, `ConversationList.tsx`, `conversation-queries.ts`, `message-actions.ts`, both chat page headers

### UX Safety (Phase 18)
- **Logout confirmation**: All 3 logout buttons (Navbar, AdminSidebar, ProviderSidebar) show `ConfirmDialog` — "Voulez-vous vraiment vous deconnecter ?" with Annuler/Confirmer, destructive variant
- **New component**: `src/components/ui/confirm-dialog.tsx` — reusable AlertDialog with title, description, variant support (destructive/warning/default), loading state

### Performance Optimization (Phase 16)
- **Homepage streaming**: Single blocking `Promise.all` → 3 independent async server components with `<Suspense>` + skeleton fallbacks. Hero and "How it works" render instantly
- **Lazy imports**: `TestimonialsCarousel` and `TopProvidersGrid` `await import()`-ed inside Suspense sections
- **API limit**: `/api/search/categories` — added `take: 50` (was unlimited)

---

### All Files Changed (Uncommitted — 42 files, +1456/-504 lines)

**New files (13)**:
- `src/lib/ai/chatbot.ts` — Groq chatbot integration
- `src/lib/ai/review-analyzer.ts` — Sentiment analysis engine
- `src/lib/ai/review-summary.ts` — AI review summary generator
- `src/lib/ai/recommendation.ts` — Provider recommendation algorithm
- `src/app/api/chat/route.ts` — Chat API endpoint
- `src/app/api/messages/upload/route.ts` — Image upload API
- `src/components/ChatbotWidget.tsx` — Floating chat UI
- `src/components/ChatbotLoader.tsx` — Dynamic chatbot loader
- `src/components/ui/confirm-dialog.tsx` — Reusable confirm dialog
- `src/app/[locale]/(client)/contact/contact-action.ts` — Contact form server action
- `src/app/[locale]/(client)/contact/contact-form.tsx` — Contact form component
- `src/app/[locale]/(client)/faq/faq-client.tsx` — Searchable FAQ client
- `src/features/review/components/PositiveReviewsBadge.tsx` — Positive reviews badge
- `src/features/admin/components/SentimentStatsCard.tsx` — Sentiment analytics card

**Modified files (29)**:
- `prisma/schema.prisma` — 5 new fields + 1 new model (ContactMessage)
- `.env.example` — GROQ_API_KEY added
- `src/env.ts` — GROQ_API_KEY in server schema
- `src/lib/auth.ts` — Auth config cleanup
- `src/app/[locale]/layout.tsx` — ChatbotLoader added
- `src/app/[locale]/(client)/page.tsx` — Homepage Suspense refactor
- `src/app/[locale]/(client)/contact/page.tsx` — Contact form + sidebar redesign
- `src/app/[locale]/(client)/faq/page.tsx` — Delegates to FaqClient
- `src/app/[locale]/(client)/legal/cgu/page.tsx` — Full 10-section legal document
- `src/app/[locale]/(client)/auth/login/page.tsx` — OAuth integration
- `src/app/[locale]/(client)/auth/verify-email/page.tsx` — Multi-state handling
- `src/app/[locale]/(client)/providers/[providerId]/page.tsx` — AI summary + PositiveReviewsBadge
- `src/app/[locale]/(client)/messages/[conversationId]/page.tsx` — Header display swap
- `src/app/[locale]/(provider)/provider/messages/[conversationId]/page.tsx` — Header display swap
- `src/app/[locale]/(admin)/admin/analytics/page.tsx` — Sentiment stats fetch
- `src/app/api/search/categories/route.ts` — take:50 limit
- `src/components/layout/Navbar.tsx` — Logout confirmation
- `src/components/layout/AdminSidebar.tsx` — Logout confirmation
- `src/components/layout/ProviderSidebar.tsx` — Logout confirmation
- `src/features/auth/actions/verify-email.ts` — Enhanced verification
- `src/features/auth/actions/verify-otp.ts` — Enhanced OTP
- `src/features/auth/components/OAuthButtons.tsx` — Enhanced OAuth
- `src/features/booking/actions/manage-bookings.ts` — Availability checks + notifications
- `src/features/payment/actions/payment-actions.ts` — Hold-and-release + commission
- `src/features/review/actions/review-actions.ts` — Sentiment analysis integration
- `src/features/review/lib/publication.ts` — Summary regeneration
- `src/features/admin/actions/analytics-queries.ts` — Sentiment stats query
- `src/features/admin/components/AnalyticsPageClient.tsx` — Sentiment card
- `src/features/admin/components/ReportDetailSheet.tsx` — AI flag badges
- `src/features/admin/components/ServiceActionsDropdown.tsx` — Enhanced actions
- `src/features/admin/components/UserActionsDropdown.tsx` — Enhanced actions
- `src/features/admin/components/UserDetailActions.tsx` — Enhanced actions
- `src/features/messaging/components/*` — Image support + display order
- `src/features/messaging/actions/*` — imageUrl support
- `src/messages/fr.json` — Chatbot + messaging keys
- `package-lock.json` — Dependency updates

**New directories**:
- `src/lib/ai/` — AI module directory
- `src/app/api/chat/` — Chatbot API route
- `src/app/api/messages/` — Message upload API
- `public/uploads/messages/` — Message attachment storage

---

## [v1.1.1] - 2026-03-03

### Performance (`3fe8b2f`)
- Polling intervals unified to 15s across all components (was 5s/10s in some)
- ~28 `console.log` statements removed across 12 files (kept `console.error`/`console.warn`)
- Recharts components lazy-loaded with `next/dynamic` + loading skeletons in admin analytics
- Prisma logging set to error-only in all environments
- Debug `useEffect` and `onClick` handlers removed from `ReviewForm`

---

## [v1.1.0] - 2026-02-28

### Konnect Payment Gateway (`11d0c99`)
- Full Konnect payment integration: `konnect-payment.service.ts` (263 lines)
- Webhook handler: `POST /api/webhooks/konnect` for payment status callbacks
- Payment failed page: `/bookings/[bookingId]/payment-failed`
- SMS service refactored into modular architecture (`lib/sms/index.ts`, `simulated.ts`, `twilio.ts`, `types.ts`)
- Phone validation updated for international format support
- Environment variables added for Konnect API keys

### Documentation (`63fc713`)
- `README.md` — 143-line project overview, tech stack, features, getting started
- `DEPLOYMENT.md` — Full deployment guide with environment setup, database config, demo accounts

### UX Polish & Missing Pages (`77c46d1`)
**90 files changed, 3865 insertions**

#### New Pages
- `/faq` — FAQ page with Accordion component
- `/contact` — Contact information page
- `/legal/cgu` — Terms of service page
- `/legal/privacy` — Privacy policy page
- `/how-it-works` — How it works explanation page
- `/admin/messages` — Admin messages stub page
- `/bookings/[bookingId]/payment-failed` — Payment failure page

#### New Components
- `TestimonialsCarousel.tsx` — Auto-scrolling 5-star review carousel (3 cards desktop, 1 mobile, dot navigation)
- `TopProvidersGrid.tsx` — Top 6 providers grid with avatar, rating stars, city, missions, verified badge
- `CategoryGrid.tsx` — DB-driven category cards with Lucide icons and service counts
- `LanguageSwitcher.tsx` — Globe dropdown for locale switching in Navbar
- `EmptyState.tsx` — Reusable empty state with icon, title, description
- `AdminBottomNav.tsx` — Mobile bottom navigation for admin panel
- `AdminMobileHeader.tsx` — Mobile header for admin panel
- `MobileHeader.tsx` — Enhanced mobile header with notification bell
- `ContactProviderButton.tsx` — Opens/creates messaging conversation from service/provider page
- `GuestHeartButton.tsx` — Favorite heart button that redirects guests to login
- `accordion.tsx` — shadcn Accordion UI component
- `DashboardCharts.tsx` — Enhanced admin dashboard charts (277+ lines added)

#### Homepage Overhaul
- Rewritten as async server component with 3 parallel Prisma queries
- Categories (take:10), Reviews (take:8), Top Providers (take:6)
- Hero section with SearchAutocomplete, CTA buttons
- "How it works" 3-step section

#### Loading Skeletons (16 new files)
- `(client)/loading.tsx`, `(client)/bookings/loading.tsx`, `(client)/messages/loading.tsx`
- `(client)/notifications/loading.tsx`, `(client)/services/loading.tsx`
- `(provider)/provider/bookings/loading.tsx`, `(provider)/provider/dashboard/loading.tsx`
- `(provider)/provider/earnings/loading.tsx`, `(provider)/provider/services/loading.tsx`
- `(admin)/admin/loading.tsx`, `(admin)/admin/analytics/loading.tsx`
- `(admin)/admin/commission/loading.tsx`, `(admin)/admin/kyc/loading.tsx`
- `(admin)/admin/reviews/loading.tsx`, `(admin)/admin/services/loading.tsx`
- `(admin)/admin/users/loading.tsx`

#### Error Handling
- `error.tsx` — Global error boundary with retry button

#### Client Dashboard Enhancement
- Real stats cards: total bookings, total spent (TND), reviews given, active bookings

#### Seed Data
- `prisma/seed.ts` — 920+ lines of realistic Tunisian demo data
- Gouvernorats, delegations, categories, providers, services, bookings, reviews, payments
- Provider avatar and service photos included in `public/uploads/`

#### Other Improvements
- Footer links updated to point to all public pages
- Tailwind config overhauled (153 lines changed)
- Admin layout updated with mobile support
- Provider/client layouts updated
- Search results grid enhanced
- Service detail client enhanced with contact/favorite buttons
- Notification item component improved
- Booking manage actions expanded (82 lines added)
- Earnings queries and withdrawal actions improved

### Dependencies (`d4119f4`)
- Bumped 18 dependencies in the dependencies group

---

## [v1.0.0] - 2026-02-27

### Phase 12: Bug Fixes (5 plans)
- French accent characters fixed across all i18n strings
- Search autocomplete icons rendering correctly (Lucide component resolution)
- Footer links wired to FAQ, CGU, Contact, How it works pages
- Navbar dashboard link fixed for CLIENT role
- Favorites toggle (save/unsave) working on service cards
- Client dashboard real stats (total bookings, spent, reviews)
- Provider withdrawal math corrected
- Admin analytics recharts rendering with real data
- Service unsuspend toggle working
- Category filter on admin services page working
- Dark mode contrast improved (card variables, bg-white override)
- Auto-moderation regex improved for phone/email detection
- Email verification URL locale prefix fixed (no double-slash)
- Zone selector CUID validation fixed (Prisma uses CUID v1)

---

## [v1.0.0-rc] - 2026-02-26

Initial MVP release — Phases 1-11 complete:
- Foundation & Infrastructure (Next.js 15, Prisma, PostgreSQL, i18n, shadcn/ui)
- Authentication (NextAuth.js, OAuth, email verification, SMS OTP, 2FA, RBAC)
- KYC Verification (document upload, admin review, trust badges)
- Provider Profiles & Services (CRUD, availability, certifications, public profiles)
- Search & Discovery (category browsing, filters, autocomplete, pagination)
- Booking System (direct booking, quote requests, status progression, cancellation policy)
- Simulated Payment (4 methods, escrow, commission, invoices, IPaymentService abstraction)
- Reviews & Ratings (bidirectional, 4 criteria, simultaneous publication, auto-moderation)
- Messaging & Notifications (in-app chat, contact info blocking, notification bell, preferences)
- Admin Panel (user/service/report management, analytics, export, content management, commission tracking)
