---
phase: 01-foundation-infrastructure
plan: 02
subsystem: database
tags: [prisma, postgresql, orm, schema, migrations, soft-delete, cuid, localisation]

# Dependency graph
requires:
  - phase: 01-foundation-infrastructure
    plan: 01
    provides: next-app-scaffold, typescript-config, env-validation

provides:
  - prisma-schema-v1-complete
  - prisma-client-singleton
  - database-models-26
  - soft-delete-pattern
  - localisation-tables
  - category-hierarchy

affects:
  - all-subsequent-phases
  - auth-phase
  - booking-phase
  - payment-phase
  - review-phase
  - messaging-phase
  - notification-phase

# Tech tracking
tech-stack:
  added:
    - "@prisma/client@7.4.1"
    - "prisma@7.4.1 (dev)"
    - "dotenv (dev dependency used in prisma.config.ts)"
  patterns:
    - "Prisma v7 datasource URL in prisma.config.ts (not in schema.prisma)"
    - "Singleton PrismaClient via globalThis for Next.js hot-reload safety"
    - "CUID2 IDs via @default(cuid()) on all models"
    - "Soft delete pattern: isDeleted Boolean @default(false) + deletedAt DateTime?"
    - "Normalized location tables: Gouvernorat -> Delegation -> ProviderDelegation"
    - "Category 2-level hierarchy via parentId self-relation"
    - "dotenv.config() in prisma.config.ts to load .env.local before .env"

key-files:
  created:
    - prisma/schema.prisma
    - prisma.config.ts
    - src/lib/prisma.ts
  modified:
    - package.json

key-decisions:
  - "Prisma v7 breaking change: datasource url moved from schema.prisma to prisma.config.ts using defineConfig()"
  - "prisma.config.ts uses dotenv to load .env.local (Next.js) then .env (Prisma default) - bridges the two env loading systems"
  - "Migration PENDING - PostgreSQL credentials unknown (postgres/postgres rejected); prisma generate succeeds without DB"
  - "26 models covering all v1 domains: users, auth, providers, services, categories, bookings, quotes, payments, reviews, messaging, notifications, localization"
  - "WithdrawalRequest linked to Payment (not Provider directly) - financial audit trail preserved"
  - "Conversation linked to Booking (1:1) - all messages are booking-scoped for context"
  - "TrustBadge as separate table (not array field) - enables querying/filtering by badge type"

patterns-established:
  - "Prisma v7 config pattern: import defineConfig from prisma/config, load dotenv before using process.env"
  - "Soft delete: every primary domain model gets isDeleted + deletedAt (never hard delete in business logic)"
  - "Singleton client: globalForPrisma.prisma caching in globalThis prevents hot-reload connection leaks"

requirements-completed:
  - UI-01

# Metrics
duration: ~35min
completed: 2026-02-22
---

# Phase 1 Plan 2: PostgreSQL + Prisma ORM Schema Complet v1 Summary

**Prisma v7 schema with 26 models covering all Tawa Services v1 domains (users, providers, services, bookings, payments, reviews, messaging, notifications, localization) with CUID2 IDs, universal soft delete, and normalized Gouvernorat/Delegation location tables.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-02-22T09:05:23Z
- **Completed:** 2026-02-22T09:40:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created complete Prisma v1 schema with 26 models covering all business domains
- All primary models have `isDeleted Boolean @default(false)` + `deletedAt DateTime?` for soft delete
- Prisma client generated successfully (50,264 lines of TypeScript types)
- `src/lib/prisma.ts` singleton pattern configured for Next.js hot-reload safety
- All DB scripts added: `db:generate`, `db:push`, `db:migrate`, `db:studio`, `db:reset`, `postinstall`
- `npm run typecheck` passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Prisma and create complete v1 schema** - `4239e91` (feat)
2. **Task 2: Configure Prisma singleton client and prisma.config.ts** - `7e0de2d` (feat)

## Files Created/Modified

- `prisma/schema.prisma` - Complete v1 schema with 26 models, 13 enumerations, soft delete on all primary models
- `prisma.config.ts` - Prisma v7 datasource configuration (URL from dotenv-loaded .env.local)
- `src/lib/prisma.ts` - Singleton PrismaClient for Next.js (dev logging + production error-only logging)
- `package.json` - Added db:generate, db:push, db:migrate, db:studio, db:reset, postinstall scripts

## Schema Models Inventory

| Domain | Models |
|--------|--------|
| Localisation | Gouvernorat, Delegation |
| Users & Auth | User, Account, Session, VerificationToken, EmailVerification, PasswordReset |
| Provider Profile | Provider, ProviderDelegation, TrustBadge, Availability, BlockedDate, Certification |
| KYC | KYCDocument |
| Catalogue | Category, Service |
| Booking & Quotes | Booking, Quote |
| Payments | Payment, WithdrawalRequest |
| Reviews | Review |
| Messaging | Conversation, Message |
| Notifications | Notification, NotificationPreference |

## Enumerations Defined

| Enum | Values |
|------|--------|
| Role | CLIENT, PROVIDER, ADMIN |
| KYCStatus | NOT_SUBMITTED, PENDING, APPROVED, REJECTED |
| ServiceStatus | DRAFT, PENDING_APPROVAL, ACTIVE, SUSPENDED, DELETED |
| PricingType | FIXED, SUR_DEVIS |
| BookingStatus | PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, REJECTED, CANCELLED |
| QuoteStatus | PENDING, RESPONDED, ACCEPTED, DECLINED, EXPIRED |
| PaymentStatus | PENDING, HELD, RELEASED, REFUNDED, FAILED |
| PaymentMethod | CARD, D17, FLOUCI, CASH |
| NotifType | 13 notification types (BOOKING_*, QUOTE_*, PAYMENT_RECEIVED, REVIEW_RECEIVED, KYC_*, NEW_MESSAGE, SYSTEM) |

## DB Scripts in package.json

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run db:generate` | `prisma generate` | Re-generate TypeScript client after schema changes |
| `npm run db:push` | `prisma db push` | Sync schema to DB without creating migrations (prototyping) |
| `npm run db:migrate` | `prisma migrate dev` | Create and apply a named migration |
| `npm run db:studio` | `prisma studio` | Open Prisma Studio GUI at localhost:5555 |
| `npm run db:reset` | `prisma migrate reset --force` | Drop DB, re-apply all migrations + seed |
| `npm run postinstall` | `prisma generate` | Auto-generate client after `npm install` (deployment-ready) |

## Decisions Made

1. **Prisma v7 config pattern** - Prisma 7.4.1 introduced a breaking change: `url = env("DATABASE_URL")` in `datasource db {}` block of schema.prisma is no longer supported. The URL must be in `prisma.config.ts` via `defineConfig({ datasource: { url: ... } })`.
2. **dotenv bridging** - Next.js uses `.env.local`, Prisma uses `.env`. Added `dotenv.config()` calls in `prisma.config.ts` to load `.env.local` first (with `.env` as fallback), bridging both systems.
3. **Conversation 1:1 with Booking** - Messages are always booking-scoped. No floating conversations. Simplifies authorization (if you have booking access, you have conversation access).
4. **TrustBadge as separate table** - Enables efficient queries like "find all providers with IDENTITY_VERIFIED badge". Array fields on Provider would require LIKE queries.
5. **WithdrawalRequest linked to Payment** - Preserves the financial audit trail (payout links to specific payment/booking).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prisma v7 breaking change: datasource url not in schema.prisma**
- **Found during:** Task 1 (schema validation)
- **Issue:** `npx prisma validate` returned P1012 error - "The datasource property `url` is no longer supported in schema files"
- **Fix:** Removed `url = env("DATABASE_URL")` from `datasource db {}` in schema.prisma; created `prisma.config.ts` with `defineConfig({ datasource: { url: ... } })`
- **Files modified:** prisma/schema.prisma, prisma.config.ts (new)
- **Verification:** `npx prisma validate` returns "The schema is valid"
- **Committed in:** 4239e91 (Task 1 commit)

**2. [Rule 1 - Bug] Prisma env() throws on missing DATABASE_URL; dotenv bridge needed**
- **Found during:** Task 1 (post-schema fix validation)
- **Issue:** Prisma v7's `env()` from `prisma/config` reads only from `process.env` (not from `.env` files), throwing `PrismaConfigEnvError` when DATABASE_URL is not in shell environment
- **Fix:** Used `dotenv.config()` in `prisma.config.ts` to load `.env.local` then `.env` before passing `process.env["DATABASE_URL"]` to `defineConfig()`
- **Files modified:** prisma.config.ts
- **Verification:** `npx prisma validate` succeeds, `npx prisma generate` succeeds
- **Committed in:** 7e0de2d (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 - Bugs related to Prisma v7 breaking changes)
**Impact on plan:** Both fixes necessary to adapt to Prisma v7 API changes. No scope creep.

## Issues Encountered

**Migration PENDING - PostgreSQL authentication failed**

`npx prisma migrate dev --name init` failed with P1000: Authentication failed. The PostgreSQL 17 service is running (pg_isready confirms port 5432 is accepting connections) but credentials `postgres:postgres` (from .env.local) are rejected. The actual password set during PostgreSQL 17 installation is unknown.

**Impact:** Schema exists and client is generated. Migration files not created. All subsequent phases that require actual DB interaction will need valid credentials.

**Required action before next DB-dependent phase:** Update `DATABASE_URL` in `.env.local` with correct credentials, then run `npm run db:migrate` or `npm run db:push`.

## User Setup Required

Database credentials need to be corrected before migration can be applied:

1. Find correct PostgreSQL 17 credentials (set during installation)
2. Update `DATABASE_URL` in `.env.local`: `postgresql://USER:PASSWORD@localhost:5432/tawa_services`
3. Create the database: `createdb -U USER tawa_services`
4. Run migration: `npm run db:migrate` (or `npm run db:push` for no-migration sync)

## Next Phase Readiness

- Prisma schema complete and validated - all v1 models available for reference by subsequent phases
- Prisma client generated - TypeScript types for all models ready to use
- `src/lib/prisma.ts` singleton ready for import by API routes and server components
- **Blocker:** DB credentials must be resolved before any phase requiring actual DB queries (Auth, Booking, etc.)

---
*Phase: 01-foundation-infrastructure*
*Completed: 2026-02-22*

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `prisma/schema.prisma` exists | FOUND |
| `prisma.config.ts` exists | FOUND |
| `src/lib/prisma.ts` exists | FOUND |
| `SUMMARY.md` exists | FOUND |
| Commit `4239e91` exists | FOUND (feat(01-02): install Prisma v7 and create complete v1 schema) |
| Commit `7e0de2d` exists | FOUND (feat(01-02): configure Prisma singleton client and prisma.config.ts) |
