---
phase: 03-verification-kyc
plan: 01
subsystem: kyc-backend
tags: [kyc, file-upload, validation, server-action, i18n, zod]
dependency_graph:
  requires: []
  provides:
    - KYC upload API endpoint (POST /api/kyc/upload)
    - KYC submission server action (submitKycAction)
    - KYC Zod validation schemas
    - French translations for KYC namespace
  affects:
    - src/features/kyc/ (future wizard in Plan 02 will import submitKycAction)
    - src/messages/fr.json (kyc namespace now available for useTranslations)
tech_stack:
  added: []
  patterns:
    - Multipart form data parsing via request.formData()
    - File storage to /public/uploads/kyc/[userId]/ with UUID filenames
    - prisma.$transaction for atomic KYC submission (delete + createMany + update)
    - ActionResult<T> discriminated union pattern for server action responses
    - Zod .refine() for cross-field validation (all 4 doc types required)
key_files:
  created:
    - src/lib/validations/kyc.ts
    - src/app/api/kyc/upload/route.ts
    - src/features/kyc/actions/submit-kyc.ts
  modified:
    - src/messages/fr.json
decisions:
  - "[03-01] KYC_DOC_TYPES uses 4-step array (CIN_RECTO, CIN_VERSO, SELFIE, PROOF_OF_ADDRESS) per CONTEXT.md — NOT 3 as mentioned in ROADMAP"
  - "[03-01] kycSubmissionSchema validates array length=4 AND that all 4 types are present using .refine() — double validation for robustness"
  - "[03-01] Upload route returns /uploads/kyc/[userId]/[uuid].ext — relative path for Next.js public folder serving"
  - "[03-01] isResubmission flag drives conditional deletion of old KYCDocuments in transaction — only cleans up on REJECTED status, not NOT_SUBMITTED"
  - "[03-01] prisma.kYCDocument.deleteMany used for cleanup (not soft delete) — KYC documents replaced atomically on re-submission"
metrics:
  duration_minutes: 3
  completed_date: "2026-02-23"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 3 Plan 01: KYC Backend Infrastructure Summary

**One-liner:** File upload API with multipart validation + atomic submission server action using prisma transaction, plus full French KYC i18n namespace.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create KYC upload API route and validation schemas | aa42587 | src/app/api/kyc/upload/route.ts, src/lib/validations/kyc.ts |
| 2 | Create KYC submission server action and i18n translations | a3722b3 | src/features/kyc/actions/submit-kyc.ts, src/messages/fr.json |

## What Was Built

### Validation Schemas (`src/lib/validations/kyc.ts`)
- `KYC_DOC_TYPES`: `["CIN_RECTO", "CIN_VERSO", "SELFIE", "PROOF_OF_ADDRESS"]` — 4-step wizard constants
- `ALLOWED_MIME_TYPES`: `["image/jpeg", "image/jpg", "image/png"]`
- `MAX_FILE_SIZE`: 5MB (5 * 1024 * 1024)
- `kycUploadSchema`: validates `docType` is one of KYC_DOC_TYPES
- `kycSubmissionSchema`: validates array of 4 documents, all unique doc types present (via .refine())
- TypeScript types: `KycDocType`, `KycUploadData`, `KycSubmissionData`

### Upload API Route (`src/app/api/kyc/upload/route.ts`)
- POST handler accepting `multipart/form-data` with `file` (File) and `docType` fields
- Auth validation: 401 if no session, 403 if role != PROVIDER
- File validation: 400 for invalid docType, wrong MIME type, or file > 5MB
- Stores files to `/public/uploads/kyc/[userId]/[uuid].[ext]`
- Returns `{ success: true, data: { fileUrl, docType } }` on success

### Submission Server Action (`src/features/kyc/actions/submit-kyc.ts`)
- `"use server"` directive, follows ActionResult<T> pattern
- Validates auth, PROVIDER role, parses with kycSubmissionSchema
- Guards: returns error if provider not found or kycStatus == PENDING/APPROVED
- Atomic `prisma.$transaction`: deletes old docs (on re-submission), createMany 4 KYCDocuments, updates provider kycStatus to PENDING + kycSubmittedAt
- Clears `kycRejectedAt` and `kycRejectedReason` on re-submission after REJECTED

### French Translations (`src/messages/fr.json`)
- Added `"kyc"` namespace with 54 keys (including nested `adminRejectReasons`)
- Covers: wizard step labels/descriptions, upload UI, status badges, review confirmation, admin review interface, trust badge names

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

- [x] `src/lib/validations/kyc.ts` exists and exports kycUploadSchema, kycSubmissionSchema, KYC_DOC_TYPES
- [x] `src/app/api/kyc/upload/route.ts` exists and exports POST
- [x] `src/features/kyc/actions/submit-kyc.ts` exists and exports submitKycAction
- [x] `src/messages/fr.json` has `kyc` namespace with 54 keys
- [x] Commits aa42587 and a3722b3 verified in git log
- [x] `npx tsc --noEmit` passes without errors
