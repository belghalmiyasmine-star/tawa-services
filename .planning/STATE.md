# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Clients can find, book, and pay a trusted local service provider in their city — and providers can get discovered and manage their business in one place.
**Current focus:** Phase 3 — Verification KYC. Plan 01 complete (upload API + submission action + i18n). Plans 02-05 remaining.

## Current Position

Phase: 3 of 11 (Verification KYC)
Plan: 1 of 5 in current phase — COMPLETE
Status: Phase 3 in progress — Plan 03-01 complete. Ready for Plan 03-02 (KYC wizard UI).
Last activity: 2026-02-23 — Plan 03-01 complete: KYC upload API, submission server action, Zod validation schemas, French translations

Progress: [######░░░░] 18%

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
| Phase 02-authentification P02 | 7 | 2 tasks | 10 files |
| Phase 02-authentification P01 | 5 | 2 tasks | 9 files |
| Phase 01-foundation-infrastructure P07 | 10 | 2 tasks | 47 files |
| Phase 01-foundation-infrastructure P04 | 86 | 2 tasks | 28 files |
| Phase 01-foundation-infrastructure P03 | 45 | 2 tasks | 7 files |
| Phase 02-authentification P06 | 5 | 2 tasks | 6 files |
| Phase 02-authentification P05 | 5 | 2 tasks | 7 files |
| Phase 02-authentification P04 | 8 | 2 tasks | 15 files |
| Phase 02-authentification P07 | 8 | 2 tasks | 11 files |
| Phase 03-verification-kyc P01 | 3 | 2 tasks | 4 files |

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

### Pending Todos

None.

### Blockers/Concerns

None. Phase 3 Plan 01 complete. KYC backend foundation ready for Plan 02 (provider wizard UI).

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 03-01-PLAN.md — KYC upload API, submission action, validation schemas, and i18n translations
Resume file: None
