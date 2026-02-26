---
phase: 10-panneau-administration
plan: "07"
subsystem: admin-content
tags: [prisma, server-actions, react-hook-form, zod, shadcn, tabs, admin, faq, banners, legal-pages]

dependency_graph:
  requires:
    - phase: 10-01
      provides: "Faq, LegalPage, Banner Prisma models + requireAdmin() helper + admin i18n namespace"
  provides:
    - "Zod schemas for FAQ/LegalPage/Banner CRUD validation"
    - "Server actions: createFaqAction, updateFaqAction, deleteFaqAction, getFaqsAction"
    - "Server actions: getLegalPagesAction, updateLegalPageAction"
    - "Server actions: getBannersAction, createBannerAction, updateBannerAction, deleteBannerAction, toggleBannerActiveAction"
    - "FaqEditor client component with categorized list, add/edit/delete dialogs"
    - "LegalPageEditor component with 3 independent page editors (CGU, Privacy, Legal Mentions)"
    - "BannerManager component with grid, thumbnail, active toggle, date scheduling"
    - "ContentPageClient 3-tab wrapper with URL-persisted tab state"
    - "Rewritten admin/content page with parallel data fetching"
  affects:
    - 10-panneau-administration
    - future-phases

tech-stack:
  added: []
  patterns:
    - "ContentPageClient pattern: server page fetches data, client wrapper owns tab state via URL searchParams"
    - "getLegalPagesAction upsert pattern: idempotent seeding of 3 default legal pages on first call"
    - "Banner imageUrl: URL string input (not file upload) — admin provides URL to external/public image"

key-files:
  created:
    - src/features/admin/schemas/content-schemas.ts
    - src/features/admin/actions/content-actions.ts
    - src/features/admin/components/FaqEditor.tsx
    - src/features/admin/components/LegalPageEditor.tsx
    - src/features/admin/components/BannerManager.tsx
    - src/features/admin/components/ContentPageClient.tsx
  modified:
    - src/app/[locale]/(admin)/admin/content/page.tsx

key-decisions:
  - "getLegalPagesAction uses upsert by slug to seed 3 default pages idempotently — safe to call multiple times without duplicates"
  - "Banner imageUrl accepts URL string (not file upload) — admin provides external URL or /public/uploads/ path; file upload out of scope"
  - "ContentPageClient as separate 'use client' file — server page handles SSR data, client wrapper owns interactive tab state"
  - "URL-persisted tab state via ?tab=faq|legal|banners searchParams — consistent with established pattern from Phase 05"
  - "FaqEditor uses react-hook-form + zodResolver with createFaqSchema/updateFaqSchema toggled by isEditing boolean"
  - "LegalPageEditor uses independent local state per page (useState) — no global form, each page saves independently"
  - "BannerManager active toggle calls toggleBannerActiveAction directly (no confirm dialog) — passive UI, router.refresh() to reflect change"

patterns-established:
  - "Content page pattern: 3-tab admin interface (FAQ/LegalPages/Banners) with URL-persisted active tab"
  - "Soft-delete pattern: isDeleted=true + deletedAt=now() used consistently for FAQ and Banner deletion"

requirements-completed:
  - ADMN-06

duration: 35
completed: "2026-02-26"
---

# Phase 10 Plan 07: Content Management Summary

**Tabbed content management system: FaqEditor with category filters + LegalPageEditor with 3 independent page editors (CGU/Privacy/Mentions) + BannerManager with image preview, active toggle, and date scheduling — all backed by full CRUD server actions with ADMIN role enforcement**

## Performance

- **Duration:** 35 min
- **Started:** 2026-02-26T15:32:16Z
- **Completed:** 2026-02-26T16:07:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Content schemas (createFaqSchema, updateFaqSchema, updateLegalPageSchema, createBannerSchema, updateBannerSchema) validated all content CRUD operations
- 11 server actions covering full FAQ/LegalPage/Banner CRUD with ADMIN role check via requireAdmin()
- FaqEditor with category tab filter (all/general/booking/payment/provider), card list, add/edit/delete dialogs using react-hook-form + zodResolver
- LegalPageEditor with 3 independent save forms per legal page, large textarea (min-h-[400px]), last-modified timestamp display
- BannerManager with 2-column grid, image thumbnail, active toggle Switch, date range display, add/edit/delete dialogs
- 3-tab ContentPageClient with URL-persisted tab state (?tab=faq|legal|banners), admin/content page with parallel data fetching

## Task Commits

Each task was committed atomically:

1. **Task 1: Content actions/schemas + FaqEditor + LegalPageEditor** - `100574b` (feat)
2. **Task 2: BannerManager + ContentPageClient + content page** - `e7b8459` (feat)

**Plan metadata:** `[docs commit hash]` (docs: complete plan)

## Files Created/Modified
- `src/features/admin/schemas/content-schemas.ts` - Zod schemas for FAQ/LegalPage/Banner CRUD
- `src/features/admin/actions/content-actions.ts` - 11 server actions with ADMIN role enforcement
- `src/features/admin/components/FaqEditor.tsx` - Categorized FAQ list with add/edit/delete dialogs
- `src/features/admin/components/LegalPageEditor.tsx` - 3 independent legal page editors with large textarea
- `src/features/admin/components/BannerManager.tsx` - Banner grid with thumbnail, active toggle, date scheduling, CRUD
- `src/features/admin/components/ContentPageClient.tsx` - 3-tab client wrapper with URL-persisted tab state
- `src/app/[locale]/(admin)/admin/content/page.tsx` - Server page with parallel data fetching

## Decisions Made
- getLegalPagesAction uses upsert by slug to seed 3 default pages idempotently — avoids duplicate seeding on repeated calls
- Banner imageUrl accepts URL string (not file upload) — admin provides external URL or /public/uploads/ path; file upload is out of scope per plan spec
- ContentPageClient as separate "use client" file — server page handles SSR data, client wrapper owns interactive tab state
- URL-persisted tab state via ?tab= searchParams — consistent with established Phase 05 pattern for filter state
- LegalPageEditor uses independent local state per page (useState) — no global form, each page saves independently

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in commission-queries.ts and AnalyticsPageClient.tsx (out-of-scope files from prior plans) — logged as out-of-scope, not fixed
- Bash shell has permission issues with paths containing spaces — used script file workaround for git commands

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Content management fully implemented: FAQ CRUD, Legal Page editing, Banner management
- ADMN-06 requirement satisfied
- Phase 10 plan 07 complete, ready for next plan in phase 10

## Self-Check: PASSED

- FOUND: src/features/admin/schemas/content-schemas.ts
- FOUND: src/features/admin/actions/content-actions.ts
- FOUND: src/features/admin/components/FaqEditor.tsx
- FOUND: src/features/admin/components/LegalPageEditor.tsx
- FOUND: src/features/admin/components/BannerManager.tsx
- FOUND: src/features/admin/components/ContentPageClient.tsx
- FOUND: src/app/[locale]/(admin)/admin/content/page.tsx
- FOUND commit: 100574b (feat(10-07): Add content schemas, actions, FaqEditor, LegalPageEditor)
- FOUND commit: e7b8459 (feat(10-07): Add BannerManager, ContentPageClient, rewrite content page)
