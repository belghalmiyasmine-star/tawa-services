# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Clients can find, book, and pay a trusted local service provider in their city — and providers can get discovered and manage their business in one place.
**Current focus:** Phase 2 — Authentication (Phase 1 complete)

## Current Position

Phase: 1 of 11 (Foundation & Infrastructure) — COMPLETE
Plan: 7 of 7 in current phase — ALL COMPLETE
Status: Phase 1 complete, ready for Phase 2
Last activity: 2026-02-22 — Plan 01-07 completed (GitHub Actions CI pipeline: lint + typecheck + build + format + prisma validate)

Progress: [####░░░░░] 9%

## Performance Metrics

**Velocity:**
- Total plans completed: 7 (all Phase 1 plans: 01-01 through 01-07)
- Average duration: ~45 minutes
- Total execution time: ~3.5h

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Infrastructure | 7/7 | ~3.5h | ~45min |

**Recent Trend:**
- Last 5 plans: 01-01 (25min), 01-03 (30min), 01-06 (75min), 01-07 (10min)
- Trend: Efficient execution as patterns established

*Updated after each plan completion*
| Phase 01-foundation-infrastructure P07 | 10 | 2 tasks | 47 files |
| Phase 01-foundation-infrastructure P04 | 86 | 2 tasks | 28 files |
| Phase 01-foundation-infrastructure P03 | 45 | 2 tasks | 7 files |

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
- [01-02]: Migration PENDING — PostgreSQL credentials postgres/postgres rejected; db:migrate requires valid credentials
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

### Pending Todos

None.

### Blockers/Concerns

None. Phase 1 complete. Ready to begin Phase 2 (Authentication).

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed .planning/phases/01-foundation-infrastructure/01-07-PLAN.md — GitHub Actions CI pipeline, npm scripts suite, prisma seed placeholder, dependabot
Resume file: None
