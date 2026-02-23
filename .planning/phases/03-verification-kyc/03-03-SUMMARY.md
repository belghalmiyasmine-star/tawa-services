---
phase: 03-verification-kyc
plan: 03
subsystem: kyc-admin-review
tags: [kyc, admin, server-actions, prisma-transaction, shadcn, next-intl]
dependency_graph:
  requires:
    - 03-01 (KYC upload API + submitKycAction + validation schemas + fr.json kyc namespace)
  provides:
    - Admin KYC list page at /admin/kyc
    - Admin KYC detail review page at /admin/kyc/[id]
    - approveKycAction (sets APPROVED + IDENTITY_VERIFIED badge + KYC_APPROVED notification)
    - rejectKycAction (sets REJECTED with reason+comment + KYC_REJECTED notification)
    - getKycSubmissions (pending list sorted oldest-first with isOverdue flag)
    - getKycSubmissionDetail (full provider info + documents)
  affects:
    - 03-04 (provider KYC status page will read kycStatus updated by these actions)
    - Phase 10 (admin dashboard KYC widget can use getKycSubmissions count)
tech_stack:
  added:
    - shadcn Table component (src/components/ui/table.tsx)
  patterns:
    - prisma.$transaction for atomic approve/reject with badge+notification
    - trustBadge.upsert to prevent duplicate IDENTITY_VERIFIED badge constraint
    - useTransition for non-blocking server action calls in client components
    - Dialog component for click-to-enlarge document zoom
    - i18n routing (useRouter from @/i18n/routing) for locale-aware redirects
    - useToast hook from @/hooks/use-toast for success/error feedback
key_files:
  created:
    - src/features/kyc/actions/review-kyc.ts
    - src/features/kyc/components/KycSubmissionList.tsx
    - src/features/kyc/components/KycReviewDetail.tsx
    - src/app/[locale]/(admin)/admin/kyc/page.tsx
    - src/app/[locale]/(admin)/admin/kyc/[id]/page.tsx
    - src/components/ui/table.tsx
  modified: []
decisions:
  - "[03-03] trustBadge.upsert used instead of create to prevent duplicate IDENTITY_VERIFIED badge on re-approval"
  - "[03-03] tx.provider.update (in Prisma transaction) matches prisma.provider.update key_link pattern"
  - "[03-03] Face comparison (CIN Recto + Selfie side-by-side) shown first in document grid per CONTEXT.md"
  - "[03-03] shadcn Table component installed (was missing from components/ui/) using npx shadcn@latest add table"
  - "[03-03] useRouter from @/i18n/routing used in client components for locale-aware redirects to /admin/kyc"
metrics:
  duration_minutes: 4
  completed_date: "2026-02-23"
  tasks_completed: 2
  files_created: 6
  files_modified: 0
---

# Phase 3 Plan 03: Admin KYC Review Interface Summary

**One-liner:** Admin KYC review interface with sortable pending list, overdue indicators, zoomable document viewer with face comparison, and approve/reject actions using prisma transactions + badge + notification.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create admin KYC review server actions | 8fc0a78 | src/features/kyc/actions/review-kyc.ts |
| 2 | Create admin KYC list page and review detail page | 33e4f55 | KycSubmissionList.tsx, KycReviewDetail.tsx, admin/kyc/page.tsx, admin/kyc/[id]/page.tsx, table.tsx |

## What Was Built

### Server Actions (`src/features/kyc/actions/review-kyc.ts`)

**Types exported:**
- `KycSubmissionSummary`: summary row type for list page (providerId, displayName, email, phone, registeredAt, submittedAt, documentCount, isOverdue)
- `KycSubmissionDetail`: full detail type for review page (+ kycStatus, documents array)
- `KycDocumentDetail`: individual document type (docType, fileUrl, uploadedAt)

**Actions exported:**
- `approveKycAction(providerId)`: verifies ADMIN role + PENDING status, uses prisma.$transaction to update kycStatus=APPROVED + kycApprovedAt, upsert IDENTITY_VERIFIED TrustBadge, create KYC_APPROVED Notification
- `rejectKycAction({ providerId, reason, comment? })`: validates reason against 4 valid values, combines reason+comment into kycRejectedReason, updates kycStatus=REJECTED + kycRejectedAt, creates KYC_REJECTED Notification
- `getKycSubmissions()`: queries PENDING providers ordered by kycSubmittedAt ASC, computes isOverdue (>48h threshold), returns KycSubmissionSummary[]
- `getKycSubmissionDetail(providerId)`: full provider+documents include, returns KycSubmissionDetail

### KycSubmissionList Component (`src/features/kyc/components/KycSubmissionList.tsx`)
- Client component with sortable "Soumis le" column (ASC/DESC toggle with ArrowUpDown icon)
- Table columns: Prestataire, Email, Soumis le, Documents (count), Statut
- Overdue indicator: red destructive Badge with AlertCircle icon and "En retard (>48h)" text
- Normal pending: outline Badge "En attente"
- Row click navigates to `/admin/kyc/[providerId]` via useRouter from @/i18n/routing
- Empty state: CheckCircle2 icon + "Aucune verification en attente" message
- French dates via Intl.DateTimeFormat("fr-FR")

### KycReviewDetail Component (`src/features/kyc/components/KycReviewDetail.tsx`)
- Two-column desktop layout (lg:grid-cols-2), stacked on mobile
- Left: Provider info card (name, email, phone, registered date, submission date, overdue badge)
- Right: Document viewer with face comparison (CIN Recto + Selfie side-by-side first)
- DocumentCard: image with Next.js Image fill + DialogTrigger overlay for zoom
- Zoom dialog: full 70vh image display with object-contain
- Overdue warning banner (red border + AlertCircle icon) shown at top when isOverdue
- Approve: green button, useTransition, toast on success, redirect to /admin/kyc
- Reject: Dialog with Select (4 reason options from fr.json) + Textarea for comment, useTransition
- Loading spinners with Loader2 during async operations
- All text via useTranslations("kyc") from fr.json kyc namespace

### Admin KYC List Page (`src/app/[locale]/(admin)/admin/kyc/page.tsx`)
- Server component, calls getKycSubmissions()
- Title "Verifications KYC" + count Badge "{N} verification(s) en attente"
- Error state with destructive styling if server action fails
- Renders KycSubmissionList with submissions data
- generateMetadata: title "KYC Review | Admin"

### Admin KYC Detail Page (`src/app/[locale]/(admin)/admin/kyc/[id]/page.tsx`)
- Server component, extracts id from params (Promise params for Next.js 15)
- Calls getKycSubmissionDetail(id), redirects to /admin/kyc on error
- Back button via Link to /admin/kyc
- Header shows provider name + email
- Renders KycReviewDetail with full detail data
- generateMetadata: "KYC — {name} | Admin"

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Missing Component] Installed missing shadcn Table component**
- **Found during:** Task 2 implementation
- **Issue:** Plan required shadcn `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell` but table.tsx was not in src/components/ui/
- **Fix:** Ran `npx shadcn@latest add table --yes` to install the component
- **Files modified:** src/components/ui/table.tsx (created)
- **Commit:** 33e4f55

**2. [Rule 1 - Bug] Fixed incorrect toast import path**
- **Found during:** Task 2 — KycReviewDetail.tsx
- **Issue:** Initial code imported `{ toast }` from `@/components/ui/use-toast` which doesn't exist; project uses `useToast` hook from `@/hooks/use-toast`
- **Fix:** Changed to `import { useToast } from "@/hooks/use-toast"` and used `const { toast } = useToast()` inside component
- **Files modified:** src/features/kyc/components/KycReviewDetail.tsx

**3. [Rule 1 - Bug] Fixed redirect paths to use locale-aware router**
- **Found during:** Task 2 — KycReviewDetail.tsx
- **Issue:** Used `next/navigation` useRouter with hardcoded `/fr/admin/kyc` instead of i18n-aware routing
- **Fix:** Changed import to `useRouter from "@/i18n/routing"` and paths to `/admin/kyc` (locale prefix handled automatically)
- **Files modified:** src/features/kyc/components/KycReviewDetail.tsx

## Self-Check: PASSED

- [x] src/features/kyc/actions/review-kyc.ts exists and exports approveKycAction, rejectKycAction, getKycSubmissions, getKycSubmissionDetail
- [x] src/features/kyc/components/KycSubmissionList.tsx exists (120 lines, min 60)
- [x] src/features/kyc/components/KycReviewDetail.tsx exists (354 lines, min 80)
- [x] src/app/[locale]/(admin)/admin/kyc/page.tsx exists (43 lines, min 20)
- [x] src/app/[locale]/(admin)/admin/kyc/[id]/page.tsx exists (60 lines, min 20)
- [x] Commit 8fc0a78 (Task 1) verified in git log
- [x] Commit 33e4f55 (Task 2) verified in git log
- [x] `npx tsc --noEmit` passes without errors
- [x] prisma.provider.update pattern present in review-kyc.ts (via tx.provider.update)
- [x] approveKycAction called in KycReviewDetail.tsx
- [x] rejectKycAction called in KycReviewDetail.tsx
