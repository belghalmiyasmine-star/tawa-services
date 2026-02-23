---
phase: 04-profil-prestataire-services
plan: "01"
subsystem: provider-backend
tags: [prisma, server-actions, api-routes, validation, i18n, portfolio, availability, zones]
dependency_graph:
  requires: []
  provides:
    - PortfolioPhoto model and responseRate field in Prisma schema
    - updateProfileSchema, availabilitySchema, blockedDateSchema, zoneSchema, portfolioPhotoSchema
    - createServiceSchema, updateServiceSchema
    - updateProfileAction, updateZonesAction, updateAvailabilityAction, updateBlockedDatesAction
    - getPortfolioPhotosAction, updatePortfolioPhotoCaptionAction, deletePortfolioPhotoAction
    - POST /api/provider/photo — avatar upload
    - POST/DELETE /api/provider/portfolio — portfolio photo upload and removal
    - provider and service namespaces in fr.json (~150 keys)
  affects:
    - Plans 03 and 04 depend on these schemas and actions
tech_stack:
  added: []
  patterns:
    - ActionResult<T> discriminated union for all server actions
    - Prisma.$transaction for atomic multi-step DB operations
    - Ownership verification before any mutation
    - Soft delete (isDeleted + deletedAt) for portfolio photos
    - Best-effort physical file deletion after soft delete
    - prisma.availability.upsert with compound unique key (providerId_dayOfWeek)
key_files:
  created:
    - prisma/schema.prisma (responseRate field + PortfolioPhoto model + portfolioPhotos relation)
    - src/lib/validations/provider.ts
    - src/lib/validations/service.ts
    - src/features/provider/actions/update-profile.ts
    - src/features/provider/actions/manage-zones.ts
    - src/features/provider/actions/manage-availability.ts
    - src/features/provider/actions/manage-portfolio.ts
    - src/app/api/provider/photo/route.ts
    - src/app/api/provider/portfolio/route.ts
  modified:
    - src/messages/fr.json (provider ~90 keys + service ~60 keys namespaces)
decisions:
  - "[04-01]: PortfolioPhoto uses soft delete (isDeleted+deletedAt) consistent with all other models"
  - "[04-01]: Physical file deletion is best-effort — never blocks the action/API response"
  - "[04-01]: Portfolio max=10 enforced at API route level (count check before upload)"
  - "[04-01]: Availability upsert uses providerId_dayOfWeek compound unique — idempotent updates"
  - "[04-01]: Zone update uses replace strategy (deleteMany + createMany) in a transaction"
  - "[04-01]: Blocked dates use replace strategy — simplest UI for managing a set of dates"
  - "[04-01]: Prisma client regenerated (npx prisma generate) after adding PortfolioPhoto model"
metrics:
  duration_minutes: 7
  completed_date: "2026-02-23"
  tasks_completed: 2
  files_created: 9
  files_modified: 1
---

# Phase 4 Plan 01: Provider Backend Infrastructure Summary

**One-liner:** Provider profile backend with PortfolioPhoto Prisma model, 5 Zod validation schemas, 7 server actions, 2 file upload API routes, and 150+ French i18n keys.

## What Was Built

### Task 1: Prisma Schema + Zod Schemas + i18n (already committed in pre-existing commits)

**Prisma schema additions (`prisma/schema.prisma`):**
- Added `responseRate Float?` field to Provider model (percentage of requests responded to)
- Added `PortfolioPhoto` model with soft delete support (isDeleted, deletedAt), sortOrder, caption (max 200 chars), and cascade delete from Provider
- Added `portfolioPhotos PortfolioPhoto[]` relation to Provider model
- Applied via `npx prisma db push` — database synchronized

**Zod validation schemas:**

`src/lib/validations/provider.ts` exports:
- `updateProfileSchema` — displayName (2-100), bio (max 2000), phone (tunisian format, optional nullable), yearsExperience (0-50 int), languages (max 10)
- `availabilitySchema` — 7-slot weekly schedule with startTime < endTime refine for active slots
- `blockedDateSchema` — array of { date: ISO datetime, reason: max 200 chars }
- `zoneSchema` — delegationIds array (min 1 cuid2)
- `portfolioPhotoSchema` — caption (max 200 chars)

`src/lib/validations/service.ts` exports:
- `createServiceSchema` — title (5-80), description (150-1000), categoryId, pricingType (FIXED/HOURLY/SUR_DEVIS), fixedPrice required when FIXED or HOURLY, durationMinutes (15-1440), inclusions/exclusions (max 20 items), conditions (max 2000)
- `updateServiceSchema` — extends createServiceSchema with id field

**i18n (`src/messages/fr.json`):**
- `provider` namespace: ~90 keys covering profile form labels, day names (Mon-Sun), availability, zones, portfolio section, stats, tabs, validation errors
- `service` namespace: ~60 keys covering form labels, pricing types, status labels, actions, my services page

### Task 2: Server Actions + API Routes

**`src/features/provider/actions/update-profile.ts`:**
- `updateProfileAction(data)`: validates session + PROVIDER role, parses with updateProfileSchema, calls `prisma.provider.update({ where: { userId } })`, returns `{ id }`

**`src/features/provider/actions/manage-zones.ts`:**
- `updateZonesAction(data)`: validates session + role, uses `prisma.$transaction([deleteMany, createMany])` to atomically replace all intervention zones, returns `{ count }`

**`src/features/provider/actions/manage-availability.ts`:**
- `updateAvailabilityAction(data)`: validates session + role, upserts 7 availability slots using `prisma.$transaction([...7 upserts])` with compound unique `providerId_dayOfWeek`, returns `{ updated: 7 }`
- `updateBlockedDatesAction(data)`: validates session + role, atomically replaces blocked dates via `prisma.$transaction([deleteMany, createMany])`, returns `{ count }`

**`src/features/provider/actions/manage-portfolio.ts`:**
- `getPortfolioPhotosAction()`: fetches non-deleted photos ordered by sortOrder asc
- `updatePortfolioPhotoCaptionAction({ photoId, caption })`: verifies ownership, updates caption
- `deletePortfolioPhotoAction(photoId)`: verifies ownership, soft deletes record, best-effort unlink

**`src/app/api/provider/photo/route.ts`** — POST:
- Auth (401/403), MIME validation (JPEG/PNG/WebP), size check (5MB max)
- Saves to `/public/uploads/providers/[userId]/avatar-[uuid].[ext]`
- Updates `provider.photoUrl` via `prisma.provider.update`
- Returns `{ photoUrl }`

**`src/app/api/provider/portfolio/route.ts`** — POST + DELETE:
- POST: checks current count <= 10, saves to `/public/uploads/providers/[userId]/portfolio/[uuid].[ext]`, determines sortOrder via aggregate max, creates PortfolioPhoto record
- DELETE: JSON body `{ photoId }`, ownership check, soft delete + best-effort file unlink

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma client not regenerated after schema changes**
- **Found during:** Task 2 TypeScript check
- **Issue:** `prisma.portfolioPhoto` was not recognized — PortfolioPhoto model was in schema but Prisma client hadn't been regenerated
- **Fix:** Ran `npx prisma generate` to regenerate the Prisma client with the new model
- **Files modified:** none (binary client files)
- **Commit:** Included in task 2 commit

### Pre-existing Work

The "phase 3" and "feat(04-02)" commits by the previous developer had already implemented:
- `prisma/schema.prisma` — PortfolioPhoto model + responseRate field
- `src/lib/validations/provider.ts` — all 5 schemas
- `src/lib/validations/service.ts` — createServiceSchema + updateServiceSchema
- `src/messages/fr.json` — provider + service namespaces

Task 1 artifacts were already in HEAD at plan execution start. Plan 04-02 was also already executed (out of order). This plan's Task 2 was the primary missing piece.

## Verification

- `npx prisma db push` — "The database is already in sync with the Prisma schema" (confirmed)
- `npx tsc --noEmit` — zero errors (confirmed)
- All 6 server action/API files exist and export expected functions
- All 5 Zod schemas exported with TypeScript types
- fr.json has provider and service namespaces with comprehensive keys

## Self-Check: PASSED

Files verified:
- FOUND: src/features/provider/actions/update-profile.ts
- FOUND: src/features/provider/actions/manage-zones.ts
- FOUND: src/features/provider/actions/manage-availability.ts
- FOUND: src/features/provider/actions/manage-portfolio.ts
- FOUND: src/app/api/provider/photo/route.ts
- FOUND: src/app/api/provider/portfolio/route.ts
- FOUND: src/lib/validations/provider.ts
- FOUND: src/lib/validations/service.ts
- FOUND: prisma/schema.prisma

Commit verified: 5ff43fb (feat(04-01): create provider server actions and photo upload APIs)
