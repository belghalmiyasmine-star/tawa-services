---
phase: 04-profil-prestataire-services
plan: 02
subsystem: api
tags: [prisma, nextjs, server-actions, file-upload, services, certifications]

# Dependency graph
requires:
  - phase: 03-verification-kyc
    provides: KYC approval status used as guard in service creation/update actions

provides:
  - Service CRUD server actions (create, update, toggle status, delete, list) with KYC guard
  - Photo upload API for service work photos (max 5 per service, 5MB each)
  - Certification upload API accepting images and PDF up to 10MB
  - Certification management server actions (add, soft-delete, list)

affects:
  - 04-04-services-ui
  - 04-03-provider-profile-ui
  - 05-categories-discovery

# Tech tracking
tech-stack:
  added: []
  patterns:
    - KYC guard pattern — checkKycApproved helper queries kycStatus before create/update
    - HOURLY pricing maps to FIXED in DB — UI convention, fixedPrice stores the hourly rate
    - Soft delete pattern — isDeleted + deletedAt + status DELETED for services, isDeleted + deletedAt for certifications
    - Ownership verification — findFirst({ where: { id, provider: { userId }, isDeleted: false } }) guards all mutations
    - File upload pattern — UUID filename, mkdir recursive, writeFile, relative URL stored in DB

key-files:
  created:
    - src/features/provider/actions/manage-services.ts
    - src/app/api/service/photos/route.ts
    - src/app/api/provider/certification/route.ts
    - src/features/provider/actions/manage-certifications.ts
  modified: []

key-decisions:
  - "Service CRUD actions inline Zod schemas (instead of importing from service.ts) because Plan 04-01 had not yet executed when 04-02 ran — TODO comment left for future import migration"
  - "HOURLY pricingType maps to FIXED in DB — Prisma enum only has FIXED and SUR_DEVIS; UI distinguishes display convention, fixedPrice field stores hourly rate"
  - "KYC guard is a reusable helper (checkKycApproved) extracted from inline code — used by both createServiceAction and updateServiceAction"
  - "Photo delete uses best-effort physical file removal — fs.unlink failure is caught and logged, does not fail the request"
  - "Certification upload API accepts application/pdf in addition to images, with 10MB limit (vs 5MB for service photos)"

patterns-established:
  - "KYC guard helper: checkKycApproved(userId) returns error string or null — reusable across all service mutation actions"
  - "Service ownership check: prisma.service.findFirst({ where: { id, providerId: provider.id, isDeleted: false } }) before all mutations"
  - "Certification ownership check via nested relation: prisma.certification.findFirst({ where: { id, provider: { userId }, isDeleted: false } })"
  - "File storage paths: /public/uploads/services/[serviceId]/[uuid].[ext] and /public/uploads/providers/[userId]/certs/[uuid].[ext]"

requirements-completed: [PROF-02, PROF-03, PROF-08]

# Metrics
duration: 15min
completed: 2026-02-23
---

# Phase 4 Plan 02: Service Backend & File Uploads Summary

**Service CRUD server actions with KYC guard, work photo upload API (max 5/service), and certification management with PDF support**

## Performance

- **Duration:** 15 min
- **Started:** 2026-02-23T16:32:25Z
- **Completed:** 2026-02-23T16:47:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- 5 service management server actions exported: createServiceAction (KYC guard), updateServiceAction (KYC guard + ownership), toggleServiceStatusAction (ACTIVE/DRAFT toggle), deleteServiceAction (soft delete), getProviderServicesAction
- Service photo upload API (POST + DELETE) enforces 5-photo maximum per service, stores to /public/uploads/services/[serviceId]/
- Certification upload API accepts JPEG, PNG, WebP, and PDF files up to 10MB, stores to /public/uploads/providers/[userId]/certs/
- 3 certification management actions: addCertificationAction, deleteCertificationAction (soft delete with ownership check), getProviderCertificationsAction
- TypeScript compiles with zero errors across all 4 new files

## Task Commits

Each task was committed atomically:

1. **Task 1: Service CRUD server actions with KYC guard** - `8a2fe77` (feat)
2. **Task 2: Photo upload APIs and certification management** - `7d7099e` (feat)

**Plan metadata:** (to be committed with SUMMARY.md and STATE.md)

## Files Created/Modified

- `src/features/provider/actions/manage-services.ts` — 5 service actions with KYC guard, ownership verification, and ActionResult pattern
- `src/app/api/service/photos/route.ts` — POST (upload) and DELETE (remove) handlers for service work photos
- `src/app/api/provider/certification/route.ts` — POST handler for certification/diploma upload (images + PDF)
- `src/features/provider/actions/manage-certifications.ts` — 3 certification management server actions

## Decisions Made

- **Inline Zod schemas**: Plan 04-01 (which creates service.ts validation) was not yet executed, so inline schemas matching the same shape were created with a TODO comment for future import migration.
- **HOURLY → FIXED mapping**: Prisma's PricingType enum only has FIXED and SUR_DEVIS. HOURLY pricingType is accepted by the action but stored as FIXED in the database; the fixedPrice field holds the hourly rate.
- **KYC guard as helper function**: `checkKycApproved(userId)` is a shared helper called at the top of both createServiceAction and updateServiceAction — avoids duplication and keeps guard logic in one place.
- **Best-effort file deletion**: fs.unlink in the DELETE photo handler is wrapped in a try/catch that logs a warning but does not fail the HTTP response — file may already be gone.
- **Certification soft delete**: certifications use isDeleted + deletedAt (no status field in schema), matching the existing Prisma model definition.

## Deviations from Plan

None — plan executed exactly as written. The inline schema approach was explicitly specified by the plan as the fallback when Plan 04-01 has not yet completed.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. Upload directories are created automatically at runtime with `mkdir({ recursive: true })`.

## Next Phase Readiness

- Service backend fully complete — Plan 04-04 (service UI) can use all 5 service actions
- Photo upload API ready for integration into service creation/edit forms
- Certification upload API ready for provider profile settings UI (Plan 04-03)
- All providers need KYC APPROVED status to create/update services (guard enforced at action level)

---
*Phase: 04-profil-prestataire-services*
*Completed: 2026-02-23*
