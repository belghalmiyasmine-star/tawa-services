# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Clients can find, book, and pay a trusted local service provider in their city — and providers can get discovered and manage their business in one place.
**Current focus:** Phase 10 IN PROGRESS — Panneau d'Administration. Plan 10-07 complete: content management system with FaqEditor (categorized CRUD), LegalPageEditor (3 independent page editors), BannerManager (grid with active toggle and date scheduling), and 3-tab ContentPageClient with URL-persisted tab state. ADMN-06 satisfied.

## Current Position

Phase: 10 of 11 (Panneau d'Administration) — IN PROGRESS
Plan: 8 of N in current phase — Plan 10-07 COMPLETE.
Status: Plan 10-07 COMPLETE — Content management system: content-schemas.ts (Zod schemas), content-actions.ts (11 server actions: FAQ/LegalPage/Banner CRUD with ADMIN role), FaqEditor (categorized list with add/edit/delete), LegalPageEditor (3 independent page editors), BannerManager (grid with active toggle and date scheduling), ContentPageClient (3-tab URL-persisted), admin/content/page.tsx (server component parallel fetch). Commits: 100574b (schemas+actions+editors), e7b8459 (BannerManager+ContentPageClient+page). ADMN-06 satisfied.
Last activity: 2026-02-26 — Plan 10-07 complete. Content management interface with FAQ/Legal/Banner CRUD complete.

Progress: [##################] 93%

## Performance Metrics

**Velocity:**
- Total plans completed: 9 (all Phase 1 plans 01-01 through 01-07, plus 02-01 and 02-02)
- Average duration: ~36 minutes
- Total execution time: ~3.7h

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Infrastructure | 7/7 | ~3.5h | ~45min |
| 2. Authentification | 2/7 | ~12min | ~6min |

**Recent Trend:**
- Last 5 plans: 01-06 (75min), 01-07 (10min), 02-01 (5min), 02-02 (7min)
- Trend: Very fast execution in Phase 2 as auth patterns established

*Updated after each plan completion*
| Phase 03-verification-kyc P02 | 20 | 2 tasks | 5 files |
| Phase 02-authentification P02 | 7 | 2 tasks | 10 files |
| Phase 02-authentification P01 | 5 | 2 tasks | 9 files |
| Phase 01-foundation-infrastructure P07 | 10 | 2 tasks | 47 files |
| Phase 01-foundation-infrastructure P04 | 86 | 2 tasks | 28 files |
| Phase 01-foundation-infrastructure P03 | 45 | 2 tasks | 7 files |
| Phase 02-authentification P06 | 5 | 2 tasks | 6 files |
| Phase 02-authentification P05 | 5 | 2 tasks | 7 files |
| Phase 02-authentification P04 | 8 | 2 tasks | 15 files |
| Phase 02-authentification P07 | 8 | 2 tasks | 11 files |
| Phase 03-verification-kyc P04 | 8 | 1 task | 3 files |
| Phase 03-verification-kyc P03 | 4 | 2 tasks | 6 files |
| Phase 03-verification-kyc P01 | 3 | 2 tasks | 4 files |
| Phase Phase 03-verification-kyc P05 P03-05 | 2 | 1 tasks | 4 files |
| Phase 04-profil-prestataire-services P02 | 15 | 2 tasks | 4 files |
| Phase 04-profil-prestataire-services P03 | 8 | 2 tasks | 8 files |
| Phase 04-profil-prestataire-services P04 | 8 | 2 tasks | 9 files |
| Phase 04-profil-prestataire-services P05 | 6 | 2 tasks (checkpoint pending) | 8 files |
| Phase 05-recherche-decouverte P01 | 15 | 2 tasks | 5 files |
| Phase 05-recherche-decouverte P02 | 25 | 2 tasks | 4 files |
| Phase 05-recherche-decouverte P03 | 30 | 2 tasks | 9 files |
| Phase 05-recherche-decouverte P04 | 18 | 2 tasks | 6 files |
| Phase 05-recherche-decouverte P05 | 60 | 2 tasks | 6 files |
| Phase 06-systeme-de-reservation P01 | 5 | 2 tasks | 6 files |
| Phase 06-systeme-de-reservation P03 | 35 | 2 tasks | 7 files |
| Phase 06-systeme-de-reservation P04 | 10 | 2 tasks | 5 files |
| Phase 06-systeme-de-reservation P05 | 25 | 2 tasks | 6 files |
| Phase 06-systeme-de-reservation P06 | 43 | 2 tasks | 8 files |
| Phase 06-systeme-de-reservation P07 | 15 | 2 tasks (nav wiring + E2E verification) | 4 files |
| Phase 07-paiement-simule P01 | 25 | 2 tasks | 6 files |
| Phase 07-paiement-simule P02 | 35 | 2 tasks | 5 files |
| Phase 07-paiement-simule P03 | 34 | 2 tasks | 6 files |
| Phase 07-paiement-simule P04 | 25 | 2 tasks | 11 files |
| Phase 08-avis-evaluations P01 | 28 | 2 tasks | 6 files |
| Phase 08-avis-evaluations P02 | 10 | 2 tasks | 6 files |
| Phase 08-avis-evaluations P06 | 15 | 2 tasks | 4 files |
| Phase 08-avis-evaluations P07 | 30 | 2 tasks (nav wiring + E2E verification) | 7 files |
| Phase 09-messagerie-notifications P01 | 25 | 2 tasks | 5 files |
| Phase 09-messagerie-notifications P02 | 30 | 2 tasks | 6 files |
| Phase 09-messagerie-notifications P03 | 45 | 2 tasks | 10 files |
| Phase 09-messagerie-notifications P04 | 45 | 2 tasks | 10 files |
| Phase 10-panneau-administration P02 | 45 | 2 tasks | 9 files |
| Phase 10-panneau-administration P05 | 35 | 2 tasks | 9 files |
| Phase 10-panneau-administration P04 | 35 | 2 tasks | 5 files |
| Phase 10-panneau-administration P07 | 35 | 2 tasks | 7 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 11 sprints derives des 60 requirements v1 — depth comprehensive
- [Roadmap]: UI-01/02/03 couverts Phase 1 (infra) + Phase 11 (polish complet) — UI-04 (seed) uniquement Phase 11
- [Roadmap]: Phase 9 regroupe MSG + NOTF (dependance commune: bookings Phase 6)
- [Roadmap]: Chaque phase = 1 sprint Agile/Scrum — plans = user stories
- [01-01]: Next.js 15.1.8 App Router (pas Pages Router) — fondation de tous les sprints
- [01-01]: TypeScript strict + noUncheckedIndexedAccess: true pour securite maximale
- [01-01]: exactOptionalPropertyTypes: false pour compatibilite libraries tierces (next-auth, prisma)
- [01-01]: typedRoutes: true dans next.config.ts pour validation des routes au compile-time
- [01-01]: Zod directement dans src/env.ts (pattern T3 simplifie, sans wrapper externe)
- [01-01]: prettier-plugin-tailwindcss pour tri automatique classes Tailwind, evite conflits merge
- [01-06]: ActionResult<T> discriminated union est le type standard pour tous les Server Actions
- [01-06]: tunisianPhoneSchema centralise PHONE_REGEX_TUNISIA — une seule source de verite
- [01-06]: CATEGORY_ITEMS utilise slugs fr.json avec tCat(slug) — zero chaine hardcodee en francais
- [01-06]: Route groups (client)/, (provider)/, (admin)/ etablissent la structure de layouts par role
- [01-06]: clsx + tailwind-merge (cn() helper) — standard shadcn/ui pour composition de classes
- [Phase 01-04]: shadcn new-york style with CSS variables, ThemeProvider in locale layout, Inter font replaces Geist, success/warning custom tokens added
- [01-02]: Prisma v7 breaking change — datasource url moved from schema.prisma to prisma.config.ts via defineConfig()
- [01-02]: prisma.config.ts uses dotenv to bridge Next.js .env.local with Prisma's env loading system
- [01-02]: 26 models covering all v1 domains with universal soft delete (isDeleted + deletedAt)
- [Phase 01-03]: middleware.ts must be in src/ not root — Next.js 15 with src/ directory requires middleware inside src/ for proper compilation
- [Phase 01-03]: All navigation helpers from @/i18n/routing via createNavigation(routing) — type-safe locale-aware routing for all future components
- [Phase 01-03]: fr.json organized by 14 domain namespaces — zero hardcoded French strings, all via useTranslations/getTranslations
- [01-07]: CI does not run DB migrations — only prisma generate and prisma validate (no PostgreSQL in GitHub Actions)
- [01-07]: Node.js 20 LTS used in CI via actions/setup-node@v4 with cache: npm
- [01-07]: concurrency group cancels in-progress runs on same branch to avoid resource waste
- [01-07]: prisma/seed.ts is a placeholder — full seed data implementation deferred to Phase 11
- [01-07]: tsx added as devDependency to execute TypeScript seed script directly
- [01-07]: Unit tests deliberately excluded from CI Phase 1 — business logic begins Phase 2+
- [Phase 01-05]: Route groups (client)/, (provider)/, (admin)/ establish role-based layout separation — each route group wraps all pages for that role with appropriate navigation
- [Phase 01-05]: AdminSidebar uses client-side useState for collapse (w-64/w-16 toggle) — no server persistence needed for MVP
- [Phase 01-05]: CATEGORIES in Navbar are static placeholders with emoji icons — will be replaced by DB-driven data in Phase 5
- [02-01]: next-auth@4 chosen over v5 beta — v4 stable with Next.js 15 App Router and mature Prisma adapter
- [02-01]: JWT strategy 30-day maxAge — per 02-CONTEXT.md session duration decision
- [02-01]: Google/Facebook OAuth providers conditional — app works in dev without OAuth credentials
- [02-01]: Same-email OAuth auto-linking in signIn callback — prevents duplicate accounts
- [02-01]: Prisma v7 client engine requires database adapter — prisma.ts migrated to PrismaPg with pg driver
- [02-01]: RESEND_API_KEY added to env.ts now to prepare for Plan 04 (email verification)
- [02-01]: Database schema confirmed in sync (prisma db push: already synchronized)
- [02-02]: registerSchema splits name into firstName + lastName (min 2, max 50) per CONTEXT.md wizard step 2 design
- [02-02]: acceptCGU uses z.literal(true) — TypeScript enforces true not just boolean
- [02-02]: CLIENT redirect goes to / (home) not /dashboard — dedicated client dashboard comes in Phase 4+
- [02-02]: STEP_LABELS stored as Record<1|2|3, key> to satisfy noUncheckedIndexedAccess TypeScript strict mode
- [02-02]: Toaster added to locale layout — toast infrastructure now wired app-wide
- [02-02]: @hookform/resolvers installed — zodResolver pattern established for all future forms
- [02-03]: Math CAPTCHA chosen over hCaptcha/reCAPTCHA — no external dependency, sufficient for PFE
- [02-03]: Progressive lockout: 3 fails = CAPTCHA required, 8 total = 15-minute account lock (DB-backed)
- [02-03]: Lockout error encoded as "LOCKED:N" string in NextAuth error — parsed client-side for localized message
- [02-03]: OAuthButtons always redirects to /auth/oauth-role — that page handles new vs returning user redirect
- [02-03]: User.failedLoginAttempts and User.lockedUntil added to Prisma schema for server-side brute-force protection
- [Phase 02-06]: Defense-in-depth RBAC: middleware getToken + layout getServerSession + client useSession RoleGuard
- [Phase 02-06]: 403 page placed in (client) route group — listed as public path in middleware so all users can access it
- [Phase 02-06]: Provider layout allows PROVIDER and ADMIN roles — admin may need to inspect provider views
- [Phase 02-05]: ISmsService abstraction allows plugging Twilio/VonageSmsService without code changes — SimulatedSmsService logs to console in dev
- [Phase 02-05]: PhoneOtp model persists OTP codes with 5-min expiry, max 5 attempts, and usedAt invalidation — OTP step is inline in wizard (step 4) not a separate page
- [02-04]: Resend dev fallback logs magic link to console — no API key required in development
- [02-04]: forgotPasswordAction always returns success — never reveals if email is registered (security best practice)
- [02-04]: EmailVerificationBanner reappears on navigation (usePathname reset) — persistent warning per CONTEXT.md design decision
- [02-04]: Previous reset tokens invalidated before issuing new one — prevents token accumulation and replay
- [Phase 02-07]: otpauth chosen over speakeasy/node-2fa — lightweight, no native deps, works in Edge runtime
- [Phase 02-07]: totpSecretTemp stored in DB during setup, cleared after confirm2faAction validates code
- [Phase 02-07]: Suspicious login requires BOTH new IP and new user-agent to reduce false positives
- [Phase 02-07]: Login recording is fire-and-forget (void promise) — never blocks authentication flow
- [Phase 03-01]: KYC_DOC_TYPES uses 4-step array per CONTEXT.md; kycSubmissionSchema validates array+refine for all 4 types; upload stores to /public/uploads/kyc/[userId]/uuid.ext; atomic transaction for KYC submission with re-submission support
- [Phase 03-03]: trustBadge.upsert used instead of create to prevent duplicate IDENTITY_VERIFIED badge on re-approval
- [Phase 03-03]: shadcn Table component installed (was missing from components/ui/) using npx shadcn@latest add table
- [Phase 03-03]: useRouter from @/i18n/routing used in client components for locale-aware redirects
- [03-02]: useToast (shadcn @radix-ui/react-toast) used instead of sonner — project uses @radix-ui/react-toast not sonner package
- [03-02]: KycPageClient client wrapper pattern chosen over URL search params (?resubmit=true) for simpler resubmission state management
- [03-02]: Native HTML5 drag events (onDragOver, onDragLeave, onDrop) — no external DnD library per plan spec
- [03-04]: TrustBadges uses native HTML title attribute for tooltips — shadcn Tooltip not installed, avoids unnecessary dependency
- [03-04]: computeAndAwardBadges handles only QUICK_RESPONSE and TOP_PROVIDER — IDENTITY_VERIFIED managed by approveKycAction (single responsibility)
- [03-04]: Badge upsert pattern sets isActive true or false — never deletes rows, always updates (avoids unique constraint issues)
- [03-04]: getProviderBadges returns only isActive=true badges — callers never need to filter
- [Phase 03-05]: KycBanner is pure server component using getTranslations — no client bundle overhead
- [Phase 03-05]: KYC guard is page-level (not middleware) — providers can access dashboard/messaging before KYC approval, only service listing is blocked
- [Phase 03-05]: Admin KYC KPI card: real prisma.provider.count(PENDING) with amber dot indicator and Link to /admin/kyc
- [04-01]: PortfolioPhoto uses soft delete (isDeleted+deletedAt) consistent with all other models
- [04-01]: Physical file deletion is best-effort — never blocks action/API response
- [04-01]: Portfolio max=10 enforced at API route level (count check before upload)
- [04-01]: Availability upsert uses providerId_dayOfWeek compound unique — idempotent updates
- [04-01]: Zone update uses replace strategy (deleteMany + createMany) in a transaction
- [04-01]: Prisma client regenerated (npx prisma generate) after adding PortfolioPhoto model
- [04-02]: Service CRUD actions use inline Zod schemas (Plan 04-01 not yet executed) — TODO comment left for import migration to service.ts
- [04-02]: HOURLY pricingType maps to FIXED in DB (Prisma enum only has FIXED/SUR_DEVIS) — fixedPrice stores hourly rate value
- [04-02]: KYC guard helper checkKycApproved(userId) returns error string or null — used by create/update actions
- [04-02]: Photo delete uses best-effort physical file removal — fs.unlink failure is caught/logged, does not fail HTTP response
- [04-02]: Certification upload accepts application/pdf + images with 10MB limit (vs 5MB for service photos)
- [04-03]: Switch component created manually (switch.tsx) — @radix-ui/react-switch was already in package.json, only the shadcn wrapper was missing
- [04-03]: AvailabilityEditor normalizes dayOfWeek 0=Sunday..6=Saturday — matches Prisma schema and JS Date convention
- [04-03]: BlockedDatesEditor stores dates as ISO datetime (midnight UTC) — required by blockedDateSchema z.string().datetime()
- [04-03]: Edit profile page redirects to /provider/kyc if no provider record — provider record created during KYC registration
- [Phase 04-04]: ServicesGrid client wrapper: server page fetches data for SSR, client wrapper manages optimistic toggle/delete UI
- [Phase 04-04]: ActionCreateData/ActionUpdateData imported from action file to resolve null vs undefined type mismatch between validation and action schemas
- [Phase 04-04]: AlertDialog installed via shadcn (alert-dialog.tsx) for ServiceCard delete confirmation
- [Phase 04-04]: ServicePhotoUploader disabled when serviceId is null — create-then-edit flow for photos
- [04-05]: PublicServiceCard uses div instead of Link — /services/[id] route does not exist until Phase 05
- [04-05]: CertificationUploader POSTs to /api/provider/certification only — addCertificationAction not called to prevent duplicate DB writes
- [04-05]: PortfolioGallery returns null when no photos — section hidden rather than empty state
- [04-05]: PublicProfileStats grid: 2-col mobile, 5-col desktop (5th card wraps on tablet)
- [05-01]: Prisma.ServiceWhereInput and Prisma.ProviderWhereInput used for dynamic where clause — more readable than Parameters<typeof prisma.service.findMany>[0]["where"]
- [05-01]: Parent category resolved to children IDs via preliminary findUnique query — avoids complex nested Prisma query
- [05-01]: z.coerce used for numeric/boolean URL params — all URL searchParams arrive as strings
- [05-01]: providerFilter accumulated as single ProviderWhereInput before assigning to where.provider — avoids overwriting across multiple conditions
- [05-02]: ServiceDetailClient is a separate client component — server parent cannot have onClick handlers
- [05-02]: viewCount increment is fire-and-forget (void, no await) — never blocks SSR render latency
- [05-02]: Similar services: up to 4 from same category ordered by viewCount desc, section hidden when 0 results
- [05-02]: PublicServiceCard outer div replaced with Link from @/i18n/routing with as never cast — typed routes don't include /services/[id] yet
- [05-02]: Action buttons (Reserver/Demander un devis/Contacter) show Disponible prochainement toast — Phase 6 booking, Phase 9 messaging
- [05-03]: URL searchParams as filter state — server page re-renders on navigation, no client-side filter state needed
- [05-03]: buildSearchQuery() shared utility in search-query.ts — avoids duplicating Prisma where/orderBy logic between /services page and /services/[categorySlug] page
- [05-03]: SearchFilters uses mobileOnly prop — rendered twice in parent (once hidden desktop sidebar, once for mobile Sheet trigger)
- [05-03]: CategoryGrid shown only when no active filters on /services page — browsing mode vs search results mode
- [05-03]: Debounced price inputs use useRef for setTimeout handle — avoids stale closure and prevents rapid URL updates
- [05-03]: buildPageRange() builds compact pagination with ellipsis — avoids rendering all page numbers for large result sets
- [05-04]: Promise.all for parallel category + service queries — single DB round-trip latency
- [05-04]: useRef + setTimeout debounce pattern — no external library, 300ms per SRCH-03 requirement
- [05-04]: Flat items array for keyboard navigation — categories first (0..n-1), services after (n..n+m-1)
- [05-04]: Cache-Control: no-store on autocomplete route — live DB data must not be cached
- [05-04]: BottomNav already has Search icon at /services — no change needed
- [05-05]: Homepage converted to async server component — getTranslations replaces useTranslations for SSR with DB data
- [05-05]: Navbar fetches categories via useEffect + fetch('/api/search/categories') — client components cannot call Prisma directly
- [05-05]: Category browse route moved from /services/[categorySlug] to /categories/[categorySlug] — prevents dynamic route conflict with /services/[serviceId]
- [05-05]: Root category service counts aggregate children categories' services via two-level Prisma query
- [06-01]: prisma generate run after adding Quote fields (address/city/preferredDate/budget) — required for TypeScript to recognize new model fields
- [06-01]: availabilityCheck uses dayOfWeek + HH:MM string comparison — no UTC conversion needed for local time slots in Availability model
- [06-01]: conflicting booking check scans full calendar day (startOfDay to endOfDay) for PENDING/ACCEPTED status to prevent double-booking
- [06-01]: SUR_DEVIS services rejected from createBookingAction — enforces separation between direct booking and quote flows
- [06-01]: completeBookingAction atomically updates booking + payment(HELD) + provider.completedMissions in a single Prisma transaction
- [06-01]: acceptQuoteAction links booking to quote via quoteId field — enables quoting flow traceability in BookingDetail
- [06-01]: getProviderBookingsAction parses firstName/lastName from User.name field (stored as full name "firstName lastName")
- [06-01]: cancelBookingAction pre-existed in src/features/booking/actions/cancel-booking.ts — not duplicated in this plan
- [06-02]: calculateRefundPercentage accepts optional now Date for testability — pure function, zero side effects
- [06-02]: Provider cancellation always gives 100% refund regardless of timing — provider-initiated = full client responsibility
- [06-02]: CRON_SECRET not required in dev mode — allows unauthenticated cron calls locally with console.warn
- [06-02]: vercel.json cron runs every 6 hours (0 */6 * * *) as secondary sweep; lazy checkAndExpireQuote is primary mechanism
- [06-02]: Partial refund (50%) updates only refundAmount + refundedAt on payment, not status — payment stays PENDING until settlement
- [06-02]: checkAndExpireQuote lazy guard returns boolean — callers check and return error if true, before any quote operation
- [06-05]: useSearchParams + router.push(?tab=) pattern for URL-persistent tab state in ProviderBookingsList client component
- [06-05]: toCardBooking() adapter converts BookingListItem.service.photoUrl (single) to ProviderBookingCard props (service.photoUrls[]) without changing backend query structure
- [06-05]: StatusTimeline handles both terminal states (REJECTED/CANCELLED = 2-step path) and normal progression (4-step PENDING->ACCEPTED->IN_PROGRESS->COMPLETED)
- [06-05]: BookingActions imports cancelBookingProviderAction from cancel-booking.ts (Plan 02) — reuses existing logic without duplication
- [06-03]: AvailabilityCalendar fetches availability client-side on month navigation — cleaner than SSR for interactive calendar
- [06-03]: TimeSlotPicker generates 30-min slots on client from provider hours props — createBookingAction server-side is authoritative conflict guard
- [06-03]: Book page redirects SUR_DEVIS to /services/[id]/quote — preserves booking flow separation at entry point
- [06-03]: Task 1 artifacts (API, Calendar, TimeSlot) were committed in prior agent session (841c365) — recognized and not duplicated
- [06-04]: PaymentMethodSelector created in Plan 04 (not Plan 03) — Plan 03 not yet executed, Rule 3 deviation to unblock QuoteAcceptFlow; path identical to Plan 03's expected output
- [06-04]: QuoteAcceptFlow uses Dialog for all screen sizes — simplifies implementation, responsive sizing via max-w-md
- [06-04]: scheduledAt built as noon local time (12:00:00) from date-only input — avoids timezone ambiguity for date-only selection
- [06-04]: ServiceDetailClient wires both SUR_DEVIS (-> /quote) and FIXED (-> /book) — linter enforced the FIXED wire consistent with Plan 03's planned output
- [06-06]: CancelBookingButton extracted as client component — server detail pages cannot use useState, client wrapper owns dialog open/close state and calls router.refresh() on success
- [06-06]: CancelBookingDialog calls calculateRefundPercentage client-side (pure function import) — immediate refund preview with no server round-trip needed for the display step
- [06-06]: StatusTimeline is a pure (non-client) server component — no hooks needed, zero client bundle overhead when used in server pages
- [06-06]: getClientQuotesAction added to booking-queries.ts — Plan 01 created getProviderQuotesAction but not a client equivalent; added with bookingId relation for QuoteResponseCard AcceptedState link
- [06-07]: Navbar Mes reservations uses tBooking('myBookings') — long label hidden on <lg, icon always visible; CLIENT-only visibility guard
- [06-07]: ProviderSidebar pending badge fetches total via useEffect + getProviderBookingsAction(PENDING) — silently catches errors, badge is non-critical UI
- [06-07]: navigation.reservations key added to fr.json sidebar label (distinct from navigation.bookings used in BottomNav)
- [07-01]: IPaymentService interface with 3 methods (processPayment/releasePayment/refundPayment) — swapping to KonnectPaymentService requires only implementing the interface, zero frontend changes
- [07-01]: paymentService singleton export — dependency injection pattern, single import in all server actions
- [07-01]: completeBookingAction handles both HELD (post-checkout) and PENDING (CASH) payment statuses at completion
- [07-01]: releasePayment called outside Prisma transaction in completeBookingAction — avoids nested transaction issues
- [07-02]: CheckoutPage uses onValidate callback from CardPaymentForm — parent owns pay button enabled state, avoids prop drilling form data
- [07-02]: Card number stored as raw 16 digits, displayed with spaces (auto-format in onChange) — checkoutFormSchema validates raw digits
- [07-02]: Confirmation page uses ?ref= query param for reference number — processPaymentAction returns referenceNumber, CheckoutPage pushes it in URL
- [07-02]: Platform fee shown as amount * 0.05 (display only) — totalAmount already includes all fees, fee line is informational
- [07-03]: In-memory groupBy for monthly breakdown — payments per provider are bounded, avoids raw SQL dependency
- [07-03]: FIFO withdrawal links to oldest available RELEASED payment — simple, deterministic, PFE-appropriate
- [07-03]: Withdrawal dialog blocks if available < 50 TND at button level — UX enforcement before server validation
- [07-03]: fetchEarnings extracted as named function — called on mount + after successful withdrawal to refresh balance
- [07-04]: Native Intl.DateTimeFormat used instead of date-fns — date-fns not in package.json, avoids new dependency for simple formatting
- [07-04]: formatDateCompact() helper for invoice number date portion — pure Date arithmetic, zero dependencies
- [07-04]: @media print targets #invoice-printable and #statement-printable divs — allows clean printing without nav/footer
- [07-04]: Provider invoice page fetches payment first to extract bookingId, then calls getInvoiceDataAction — single auth source
- [07-04]: getMonthlyStatementAction uses startOfMonth/startOfNextMonth date range for precise month filtering
- [08-01]: Double-blind publish: both client and provider must review before either review is published — prevents bias from seeing the other's review first
- [08-01]: moderateReviewContent returns flagged=true if hasContact OR spamScore > 60 — flagged reviews stored but not auto-published
- [08-01]: updateProviderRating is not exported as server action — internal helper called only within publishBothReviews
- [08-01]: getProviderReviewsAction accepts providerId (not userId) — resolves to userId internally for targetId matching
- [08-01]: Photo upload route saves to /public/uploads/reviews/[userId]/[uuid].ext — max 3 photos enforced at schema level
- [08-01]: Author first name only in getProviderReviewsAction — extracted from User.name full name for privacy
- [08-04]: updateProviderRating moved to publication.ts (re-exported from review-actions.ts for backward compat) — avoids circular dependency
- [08-04]: publishBothReviews(bookingId) — no longer takes providerId, fetches from booking internally
- [08-04]: checkAndCloseExpiredWindows uses completedAt [11, 10] day window — daily cron processes each booking exactly once
- [08-04]: cron/reviews schedule 0 2 * * * (daily 2 AM) — review windows are day-granularity not hour-critical
- [08-04]: isReviewWindowOpen pure function — no DB call, reusable in server actions and UI components
- [08-03]: ReviewForm uses zodResolver(...) as never cast — Zod .default([]) creates input/output type split incompatible with react-hook-form generics
- [08-03]: authorRole prop in ReviewForm is unused client-side — submitReviewAction determines role from session to prevent spoofing
- [08-03]: Provider review page reuses getBookingDetailAction ownership guard — no separate ownership check needed in review page
- [Phase 08-avis-evaluations]: ReviewForm uses setValue for StarRating fields — star clicks bypass native HTML input events, shouldValidate: true triggers Zod validation
- [Phase 08-avis-evaluations]: Client review page gates on getReviewWindowAction — three states: canReview=form, hasReviewed=confirmation, expired=info message
- [Phase 08-avis-evaluations]: Laisser un avis CTA only shown when reviewWindow != null (COMPLETED + 10-day window open)
- [08-05]: CriteriaChart uses CSS-only horizontal bars — recharts not in package.json, avoids new dependency for PFE
- [08-05]: CriteriaRadarChart.tsx is a re-export alias of CriteriaChart for plan spec compatibility
- [08-05]: ReviewsList.buildDistribution() derives star distribution from current page reviews — approximate for display, server-side aggregates used for averages
- [08-05]: Provider profile page fetches initialData server-side for SSR — eliminates Avis tab loading flash
- [08-05]: ReviewCard photo lightbox uses Radix Dialog with DialogTitle sr-only for accessibility compliance
- [08-06]: moderateReviewAction validates ADMIN role — server action double-checks session.user.role for defense-in-depth
- [08-06]: Approve action sets flagged=false only — does not force-publish unpublished reviews, preserves double-blind system
- [08-06]: Reject action soft-deletes and conditionally recalculates provider rating (only if review was published)
- [08-06]: AdminReviewActions uses router.refresh() after moderation — reloads server component data without full navigation
- [08-06]: Admin reviews page uses card layout — long review text and photo thumbnails require vertical space not suited for table layout
- [08-07]: BookingReviewStatus derived server-side in list queries — reviews included in Prisma query, no extra server action call per booking card
- [08-07]: Review status chip inline in booking cards — no additional client component needed (amber=can_review, gray=pending, green=published, window_closed=no indicator)
- [08-07]: Task 2 E2E verification required no code changes — all review flow components correctly implemented in 08-01 through 08-06
- [09-01]: Regex patterns copied from review/lib/moderation.ts rather than imported — messaging moderation may evolve independently of review moderation
- [09-01]: moderateMessageContent accepts bookingStatus as string (not BookingStatus enum) — avoids importing Prisma enum into moderation utility; Set<string> comparison works correctly
- [09-01]: Cursor-based pagination uses createdAt ISO string as cursor — messages fetched DESC then reversed for oldest-first display
- [09-01]: verifyConversationParticipant is a shared internal helper (not exported) used by sendMessageAction and markMessagesAsReadAction
- [09-01]: getOrCreateConversationAction uses prisma.conversation.upsert with bookingId unique constraint — idempotent, safe to call multiple times
- [09-02]: sendNotification is fire-and-forget for email — Resend failures never throw, only console.error — callers never await email outcome
- [09-02]: NotificationPreference.inAppEnabled=false skips DB create entirely — user truly disabled in-app means no record created
- [09-02]: Tunisia is UTC+1 year-round (no DST) — quiet hours computed via getUTCHours()+1 mod 24 without external library
- [09-02]: sendNotificationBatch uses Promise.all — parallel dispatch for events that notify multiple parties (e.g., booking status changes)
- [09-02]: buildNotificationEmail returns subject + html for all 13 NotifType values including QUOTE_RECEIVED and QUOTE_RESPONDED
- [09-02]: getNotificationPreferencesAction uses upsert — idempotent, creates default preferences on first call
- [09-02]: Prisma.NotificationWhereInput used for dynamic where clause — type-safe, avoids manual type annotation
- [09-04]: DropdownMenu used instead of Popover for NotificationBell — @radix-ui/react-popover not in package.json; DropdownMenu already installed provides same overlay behavior
- [09-04]: NotificationBell allNotificationsUrl prop — role-aware: PROVIDER gets /provider/notifications, CLIENT gets /notifications, passed from Navbar session check
- [09-04]: fetchUnreadCount wrapped in useCallback with empty deps — satisfies exhaustive-deps ESLint rule, stable across renders
- [09-04]: Per-type toggles use disabledTypes array for both in-app and email — both channels disabled/enabled by same type entry; master toggles control global channel state independently
- [09-03]: ChatView uses forwardRef + useImperativeHandle — addOptimisticMessage exposed imperatively to ChatPageLayout, avoids prop drilling while keeping ChatView self-contained
- [09-03]: ChatPageLayout client wrapper pattern — server pages cannot use hooks, wrapper separates concerns; server provides conversation metadata, client manages interactive state
- [09-03]: Dynamic href cast as any for Link in ConversationList — typedRoutes: true cannot validate runtime-computed path strings; established pattern from other feature pages
- [09-03]: getConversationDetailAction added to conversation-queries.ts — server pages need minimal conversation metadata for chat header (otherUser.name, booking.serviceTitle)
- [09-03]: Near-bottom auto-scroll threshold 100px — isNearBottom() check prevents force-scrolling when user is reading older messages
- [09-03]: existingIds Set comparison in ChatView polling — O(1) duplicate detection vs O(n) array.find per fetched message
- [10-01]: Prisma.UserWhereInput used instead of Parameters<typeof prisma.user.findMany>[0]['where'] — latter fails TypeScript strict mode with Prisma v7
- [10-01]: requireAdmin() helper centralizes ADMIN role check — called at top of every admin action
- [10-01]: computeSlaDeadline() is a pure function accepting optional 'from' Date for testability — SLA: CRITICAL +2h, IMPORTANT +24h, MINOR +48h
- [10-01]: Priority sort in getAdminReportsAction done in memory on page results — avoids complex Prisma ORDER BY on enum value mapping
- [10-01]: createReportAction is available to any authenticated user (not ADMIN-only) — users can report other users/services/reviews
- [10-02]: AdminStats type extended with currentMonthUsers/previousMonthUsers and equivalents for bookings/revenue — trend arrows require month-over-month comparison
- [10-02]: TrendPercent is a proper React component (PascalCase) using useTranslations — avoids passing translation string as prop
- [10-02]: DashboardCharts is placeholder only — recharts wired in Plan 10-06 per plan spec
- [10-02]: URL searchParams as filter state in UsersDataTable — consistent with Phase 05 established pattern
- [10-02]: UserDetailActions extracted as separate client component — server detail page cannot use useState/onClick
- [10-02]: Native Intl.DateTimeFormat for dates — date-fns not in package.json (consistent with Phase 07-04 decision)
- [10-05]: buildMonthRange() initializes all months in range to 0 — avoids gaps in recharts charts for months with no data
- [10-05]: Server page reads ?startDate=&endDate= searchParams, defaults to last 6 months — date filtering via URL navigation
- [10-05]: recharts Tooltip formatter typed as (value: number | undefined) to satisfy recharts v3 strict TypeScript types
- [10-05]: avgProviderValidationHours computed from kycSubmittedAt -> kycApprovedAt diff — more accurate than createdAt
- [10-05]: Export buttons disabled (placeholder) — Plan 10-06 will implement CSV/PDF export
- [10-06]: generateCsv prepends UTF-8 BOM (\uFEFF) — required for Excel to recognize French accented characters in CSV
- [10-06]: PDF export returns text/html opened in new tab — window.print() avoids heavy pdf-lib/puppeteer dependency
- [10-06]: ExportButton uses fetch+blob for CSV downloads — enables loading spinner state tracking
- [10-06]: API route accepts ?columns=key1,key2 param — server filters columns before generation, reduces payload size
- [10-06]: ExportButton is reusable via exportType + availableColumns props — consistent export pattern across all admin pages
- [10-05]: SVG defs/linearGradient inline in AreaChart for gradient fill — no separate recharts import needed for SVG primitives
- [10-04]: Server action as prop pattern — handleGetReportDetail defined inline with "use server" in server page and passed to ReportsDataTable client component for on-demand detail fetch
- [10-04]: SLA countdown uses setInterval(60000) in SlaBadge — minute-granularity sufficient, reduces re-renders vs 1000ms
- [10-04]: Priority ordering applied in-memory on paginated results — consistent with 10-01 decision (avoids complex Prisma ORDER BY on enum)
- [Phase 10-07]: getLegalPagesAction uses upsert by slug to seed 3 default legal pages idempotently — safe to call multiple times
- [Phase 10-07]: Banner imageUrl accepts URL string (not file upload) — admin provides external URL or /public/uploads/ path
- [Phase 10-07]: ContentPageClient as separate 'use client' file — server page fetches data, client wrapper owns URL tab state

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-26
Stopped at: Completed Phase 10 Plan 10-06 — CSV/PDF Export System: generateCsv (RFC 4180, UTF-8 BOM), generatePdfHtml (printable HTML), getExportDataAction (5 types), /api/admin/export route (ADMIN auth), ExportButton component (column checkboxes, CSV fetch+blob, PDF new-tab) integrated into users and analytics pages. Commits: fbf5a95 (Task 1 pre-committed), 8cb9f41 (Task 2). ADMN-05 satisfied.
Resume file: None
