---
phase: 04-profil-prestataire-services
plan: 04
subsystem: ui
tags: [react, nextjs, react-hook-form, shadcn, zod, tailwind, file-upload, services]

# Dependency graph
requires:
  - phase: 04-profil-prestataire-services
    plan: 02
    provides: Service CRUD server actions (createServiceAction, updateServiceAction, toggleServiceStatusAction, deleteServiceAction), photo upload API (/api/service/photos), KYC guard helper
  - phase: 03-verification-kyc
    provides: KYC approval status required for page-level guard on service creation

provides:
  - ServiceForm component (react-hook-form, 2-level category selector, 3 pricing types, char counters, inclusions/exclusions repeaters)
  - ServicePhotoUploader component (5-slot grid, upload, delete, HTML5 drag reorder)
  - InclusionsExclusionsEditor component (controlled repeater, add/remove, max 20 items)
  - ServiceCard component (status badge, actions: edit/toggle/delete with AlertDialog)
  - ServicesGrid client wrapper (optimistic toggle/delete state)
  - My Services page (/provider/services) with grid and empty state
  - Create service page (/provider/services/new) with KYC guard
  - Edit service page (/provider/services/[serviceId]/edit) with KYC guard and ownership check

affects:
  - 04-05-provider-public-profile
  - 05-categories-discovery

# Tech tracking
tech-stack:
  added:
    - "@radix-ui/react-alert-dialog (via shadcn alert-dialog component install)"
  patterns:
    - ServicesGrid client wrapper pattern — server page fetches data, client wrapper manages optimistic UI for toggle/delete without full page reload
    - KYC page-level guard — both /provider/services/new and /provider/services/[id]/edit query kycStatus and redirect to /provider/kyc if not APPROVED
    - Two-level category selector — parent select + conditional subcategory select rendered only when parent has children
    - ActionCreateData/ActionUpdateData type imports from action file — resolves null/undefined mismatch between Zod schema and action signature

key-files:
  created:
    - src/features/provider/components/ServiceForm.tsx
    - src/features/provider/components/ServicePhotoUploader.tsx
    - src/features/provider/components/InclusionsExclusionsEditor.tsx
    - src/features/provider/components/ServiceCard.tsx
    - src/features/provider/components/ServicesGrid.tsx
    - src/app/[locale]/(provider)/provider/services/page.tsx
    - src/app/[locale]/(provider)/provider/services/new/page.tsx
    - src/app/[locale]/(provider)/provider/services/[serviceId]/edit/page.tsx
    - src/components/ui/alert-dialog.tsx
  modified:
    - src/features/provider/components/PhotoUpload.tsx (import fix)

key-decisions:
  - "ServicesGrid is a separate client component rather than making the server page client — preserves SSR data fetch while enabling optimistic toggle/delete UI"
  - "ActionCreateData/ActionUpdateData imported from manage-services.ts for payload construction — resolves null vs undefined type mismatch between validation schema and action schema"
  - "AlertDialog installed via shadcn (alert-dialog.tsx) instead of using Dialog — proper destructive action pattern"
  - "ServicePhotoUploader disabled (shows message) when serviceId is null — user must save service first before adding photos (create-then-edit flow)"
  - "Pricing type restoration from DB: HOURLY stored as FIXED in DB — edit page restores as FIXED (no DB discriminator available)"

patterns-established:
  - "Two-level category selector: parentCategories filter (parentId === null), subcategories derived from selected parent.children, categoryId form field set to parentId when no children exist"
  - "Optimistic UI pattern: server page passes initialServices, client ServicesGrid holds local state and updates immediately on toggle/delete action success"
  - "KYC page-level guard: server component queries provider.kycStatus before rendering form, redirects to /provider/kyc if not APPROVED"

requirements-completed: [PROF-02, PROF-03, PROF-08]

# Metrics
duration: 8min
completed: 2026-02-23
---

# Phase 4 Plan 04: Service Management UI Summary

**Service creation/editing UI with react-hook-form, 5-slot photo uploader with HTML5 drag reorder, inclusions/exclusions repeaters, My Services grid with optimistic status toggle, and KYC-guarded service pages**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-23T16:42:25Z
- **Completed:** 2026-02-23T16:50:33Z
- **Tasks:** 2
- **Files modified:** 9 created, 1 modified

## Accomplishments

- ServiceForm with react-hook-form + zodResolver: title/description char counters, 2-level category selector (parent → subcategory), 3 pricing type radio buttons (FIXED/HOURLY/SUR_DEVIS), conditional price field, InclusionsExclusionsEditor repeaters, photo uploader in edit mode
- ServicePhotoUploader: 5-slot grid (2 cols mobile, 3 cols desktop), upload via POST /api/service/photos, delete via DELETE, HTML5 native drag-and-drop reorder, per-slot loading spinners, disabled state for new services
- InclusionsExclusionsEditor: controlled repeater with add/remove (max 20 items, 200 chars each), useTranslations("service") labels
- ServiceCard: photo thumbnail with gray placeholder, status badge overlay (Active/Draft/Pending/Suspended), category path display, price formatting, edit/toggle/delete actions with AlertDialog confirm
- ServicesGrid: client wrapper for optimistic toggle/delete without page reload
- My Services page: SSR data fetch, responsive grid (1/2/3 cols), empty state with CTA, service count display
- New/Edit service pages: KYC guard (APPROVED check), ownership verification, category tree fetch

## Task Commits

Each task was committed atomically:

1. **Task 1: ServiceForm, ServicePhotoUploader, InclusionsExclusionsEditor** - `8228dd6` (feat)
2. **Task 2: ServiceCard, ServicesGrid, My Services page, new/edit pages** - `dd9057c` (feat, committed by previous session as part of 04-03)

## Files Created/Modified

- `src/features/provider/components/ServiceForm.tsx` — Full service creation/editing form with react-hook-form, 2-level category selector, 3 pricing types, char counters, inclusions/exclusions, photo uploader
- `src/features/provider/components/ServicePhotoUploader.tsx` — 5-slot photo grid with upload, delete, HTML5 drag reorder, loading states
- `src/features/provider/components/InclusionsExclusionsEditor.tsx` — Controlled text repeater for inclusions/exclusions (max 20 items, 200 chars)
- `src/features/provider/components/ServiceCard.tsx` — Service card with status badge overlay, category path, price, edit/toggle/delete actions and AlertDialog confirm
- `src/features/provider/components/ServicesGrid.tsx` — Client wrapper for optimistic toggle/delete state management
- `src/app/[locale]/(provider)/provider/services/page.tsx` — My Services SSR page with grid + empty state
- `src/app/[locale]/(provider)/provider/services/new/page.tsx` — Create service page with KYC guard
- `src/app/[locale]/(provider)/provider/services/[serviceId]/edit/page.tsx` — Edit service page with KYC guard and ownership check
- `src/components/ui/alert-dialog.tsx` — shadcn AlertDialog component (installed for ServiceCard delete confirm)
- `src/features/provider/components/PhotoUpload.tsx` — Fixed broken import path (bug fix)

## Decisions Made

- **ServicesGrid client wrapper**: Server page fetches data for SSR, client wrapper manages local state for optimistic UI — avoids making the entire My Services page a client component.
- **Type mismatch resolution**: Imported `ActionCreateData`/`ActionUpdateData` from the action file directly to avoid null/undefined mismatch between validation schema (`number | undefined`) and action schema (`number | null | undefined`).
- **AlertDialog install**: `alert-dialog.tsx` was not in the project's shadcn components — installed via `npx shadcn@latest add alert-dialog` for the delete confirmation pattern.
- **Create-then-edit photo flow**: ServicePhotoUploader shows "save first" message when `serviceId` is null — on create success, form redirects to the edit page where photos can be added.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed broken import in PhotoUpload.tsx**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** `src/features/provider/components/PhotoUpload.tsx` imported `useToast` from `@/components/ui/use-toast` (non-existent path). The hook lives at `@/hooks/use-toast`.
- **Fix:** Updated import path to `@/hooks/use-toast`
- **Files modified:** `src/features/provider/components/PhotoUpload.tsx`
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** `8228dd6` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Installed AlertDialog shadcn component**
- **Found during:** Task 2 (TypeScript check after ServiceCard creation)
- **Issue:** Plan specified shadcn AlertDialog for delete confirmation but `alert-dialog.tsx` was not installed
- **Fix:** Ran `npx shadcn@latest add alert-dialog` to install the component
- **Files modified:** `src/components/ui/alert-dialog.tsx` (created)
- **Verification:** TypeScript compiles, delete confirmation dialog renders
- **Committed in:** `dd9057c` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 missing critical)
**Impact on plan:** Both fixes necessary for correct operation. No scope creep.

## Issues Encountered

- TypeScript null/undefined type mismatch between Zod validation schema (`number | undefined`) and action inline schema (`number | null | undefined`): resolved by importing action's own exported types (`ActionCreateData`/`ActionUpdateData`) and building typed payload objects explicitly.
- Task 2 files were already committed by the prior Plan 04-03 execution session (which anticipatorily created service pages alongside availability editor). Verified content correctness — all files match plan spec.

## User Setup Required

None — no external service configuration required. All components use existing APIs and server actions.

## Next Phase Readiness

- Service management UI fully complete — providers can create, edit, toggle active/draft, and delete services
- Photo uploader ready for use on edit page — requires service creation first (create-then-edit flow)
- ServiceCard ready for reuse in public provider profile page (Plan 04-05)
- My Services page accessible at /provider/services
- KYC guard enforced on all service creation/editing pages

---
*Phase: 04-profil-prestataire-services*
*Completed: 2026-02-23*
