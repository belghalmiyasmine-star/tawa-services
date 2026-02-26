---
phase: 10-panneau-administration
plan: "01"
subsystem: admin-foundation
tags: [prisma, server-actions, i18n, admin, reports, validation]
dependency_graph:
  requires: []
  provides:
    - Report model with ReportPriority/ReportStatus/ReportType enums
    - Faq, LegalPage, Banner Prisma models
    - Admin server actions for user/service/report management
    - Admin Zod validation schemas
    - Admin i18n namespace in fr.json
  affects:
    - prisma/schema.prisma
    - src/features/admin/
    - src/messages/fr.json
tech_stack:
  added: []
  patterns:
    - ActionResult<T> discriminated union for all admin actions
    - requireAdmin() helper for ADMIN role guard
    - Prisma.UserWhereInput / ServiceWhereInput / ReportWhereInput for type-safe dynamic queries
    - computeSlaDeadline() pure function for SLA based on priority
key_files:
  created:
    - prisma/schema.prisma (modified — 4 new models + 3 new enums)
    - src/features/admin/schemas/admin-schemas.ts
    - src/features/admin/actions/admin-queries.ts
    - src/features/admin/actions/admin-actions.ts
  modified:
    - src/messages/fr.json (admin namespace added)
decisions:
  - "Prisma.UserWhereInput used instead of Parameters<typeof prisma.user.findMany>[0]['where'] — the latter fails TypeScript strict mode with Prisma v7"
  - "requireAdmin() helper centralizes ADMIN role check — called at top of every admin action"
  - "computeSlaDeadline() is a pure function accepting optional 'from' Date for testability"
  - "Priority sort in getAdminReportsAction done in memory (bounded page results) to avoid complex Prisma ORDER BY on enum"
  - "createReportAction is available to any authenticated user (not ADMIN-only) — users can report other users"
metrics:
  duration: 30
  completed_date: "2026-02-26"
  tasks: 2
  files: 5
requirements:
  - ADMN-01
  - ADMN-02
  - ADMN-03
---

# Phase 10 Plan 01: Admin Panel Foundation Summary

**One-liner:** Prisma schema with Report/FAQ/Banner/LegalPage models plus complete admin server actions for user management, service moderation, report CRUD, and dashboard stats.

## What Was Built

### Task 1: Prisma Schema + Admin Server Actions

**Schema changes (prisma/schema.prisma):**
- Added 3 new enums: `ReportPriority` (CRITICAL/IMPORTANT/MINOR), `ReportStatus` (OPEN/INVESTIGATING/RESOLVED/DISMISSED), `ReportType` (USER/SERVICE/REVIEW/MESSAGE)
- Added `Report` model with SLA deadline, priority, status, reporter/reported relations, soft delete
- Added `Faq` model with category, sortOrder, isActive, soft delete
- Added `LegalPage` model with unique slug (cgu/privacy/legal-mentions), content, updatedBy
- Added `Banner` model with position, dateRange, isActive, soft delete
- Added `reportsMade` and `reportsReceived` relations to User model
- Ran `prisma generate` and `prisma db push` — database synchronized

**Validation schemas (src/features/admin/schemas/admin-schemas.ts):**
- `banUserSchema`, `unbanUserSchema` for user management
- `approveServiceSchema`, `suspendServiceSchema` for service moderation
- `createReportSchema` with reportedId, type, reason, priority, referenceId
- `updateReportSchema` with status and adminNote
- `adminUserFilterSchema`, `adminServiceFilterSchema`, `adminReportFilterSchema` with pagination

**Admin queries (src/features/admin/actions/admin-queries.ts):**
- `getAdminUsersAction(filters)` — paginated user list with KYC status
- `getAdminServicesAction(filters)` — paginated service list with provider/category
- `getAdminReportsAction(filters)` — paginated reports sorted by priority (CRITICAL first)
- `getAdminStatsAction()` — dashboard stats: totalUsers, totalRevenue, monthlyRevenue, bookingsByStatus, userGrowth, revenueByCategory
- `getUserDetailAction(userId)` — full user detail with bookingsCount, reviewsCount, reportsCount
- `getReportDetailAction(reportId)` — full report with reporter/reported details

**Admin write actions (src/features/admin/actions/admin-actions.ts):**
- `banUserAction(data)` — ban user with reason; cannot ban ADMIN
- `unbanUserAction(data)` — unban user
- `activateUserAction(userId)` — activate user
- `deactivateUserAction(userId)` — deactivate user; cannot deactivate ADMIN
- `deleteUserAction(userId)` — soft-delete user; cannot delete ADMIN
- `approveServiceAction(data)` — set service status to ACTIVE
- `suspendServiceAction(data)` — set service status to SUSPENDED
- `createReportAction(data)` — create report with SLA deadline computed from priority
- `updateReportAction(data)` — update report status/note; sets resolvedAt for terminal states

### Task 2: Admin i18n Keys

Added comprehensive `admin` namespace to `src/messages/fr.json` with 11 sub-sections:
- `dashboard` — KPI card labels, chart labels, date ranges
- `users` — user management UI (search, filters, actions, confirmations)
- `services` — service management UI
- `categories` — category management UI
- `reports` — report management UI with priority/status/type labels
- `analytics` — analytics page labels
- `content` — FAQ, legal pages, banners management
- `commission` — commission and payout labels
- `notifications` — admin notification sending UI
- `breadcrumbs` — admin navigation breadcrumbs
- `common` — shared admin UI strings (noResults, pagination, etc.)

## Verification

- `npx prisma validate` passes — schema has Report, Faq, LegalPage, Banner models
- `npx tsc --noEmit` passes — 0 TypeScript errors (exit code 0)
- fr.json valid JSON with admin namespace containing 11 sub-sections, 150+ keys

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type annotation for Prisma where clauses**
- **Found during:** Task 1 TypeScript verification
- **Issue:** `Parameters<typeof prisma.user.findMany>[0]["where"]` fails with Prisma v7 strict TypeScript — the parameter type is a union where `where` may not exist
- **Fix:** Used proper `Prisma.UserWhereInput`, `Prisma.ServiceWhereInput`, `Prisma.ReportWhereInput` imported from `@prisma/client`
- **Files modified:** `src/features/admin/actions/admin-queries.ts`
- **Commit:** 09301c1

## Self-Check: PASSED

- FOUND: prisma/schema.prisma
- FOUND: src/features/admin/schemas/admin-schemas.ts
- FOUND: src/features/admin/actions/admin-queries.ts
- FOUND: src/features/admin/actions/admin-actions.ts
- FOUND: src/messages/fr.json
- FOUND commit: 09301c1 (feat(10-01): Prisma admin models + admin server actions)
- FOUND commit: 49e5c26 (feat(10-01): Add admin i18n namespace to fr.json)
