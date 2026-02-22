# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Clients can find, book, and pay a trusted local service provider in their city — and providers can get discovered and manage their business in one place.
**Current focus:** Phase 1 — Foundation & Infrastructure

## Current Position

Phase: 1 of 11 (Foundation & Infrastructure)
Plan: 6 of 7 in current phase
Status: In progress
Last activity: 2026-02-22 — Plan 01-02 completed (PostgreSQL + Prisma schema complet v1, 26 models)

Progress: [####░░░░░] 8%

## Performance Metrics

**Velocity:**
- Total plans completed: 4 (01-01, 01-03, 01-06, plus concurrent plans)
- Average duration: ~50 minutes
- Total execution time: ~3.5h

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Infrastructure | 6/7 | ~3.5h | ~50min |

**Recent Trend:**
- Last 5 plans: 01-01 (25min), 01-03 (30min), 01-06 (75min)
- Trend: Longer plans as complexity increases

*Updated after each plan completion*
| Phase 01-foundation-infrastructure P04 | 86 | 2 tasks | 28 files |

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

### Pending Todos

None.

### Blockers/Concerns

None. Next: Execute plan 01-07 (CI pipeline or final plan for Phase 1).

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed .planning/phases/01-foundation-infrastructure/01-04-PLAN.md — shadcn/ui design system, 19 components, Tawa Services color tokens, next-themes dark mode
Resume file: None
