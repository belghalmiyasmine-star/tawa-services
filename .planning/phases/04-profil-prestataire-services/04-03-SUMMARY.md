---
phase: 04-profil-prestataire-services
plan: "03"
subsystem: provider-profile-ui
tags: [react-hook-form, next-intl, shadcn, file-upload, tabs, zod, availability, zones, portfolio]
dependency_graph:
  requires:
    - updateProfileAction (04-01)
    - updateZonesAction (04-01)
    - updateAvailabilityAction (04-01)
    - updateBlockedDatesAction (04-01)
    - updatePortfolioPhotoCaptionAction (04-01)
    - POST /api/provider/photo (04-01)
    - POST/DELETE /api/provider/portfolio (04-01)
    - updateProfileSchema, zoneSchema, availabilitySchema (04-01)
    - provider namespace i18n keys (04-01)
  provides:
    - ProfileEditForm component with react-hook-form + zodResolver
    - PhotoUpload component (avatar with camera overlay, 5MB client validation)
    - ZoneSelector component (gouvernorat accordion + delegation checkboxes)
    - PortfolioUploader component (10-slot grid with captions + delete)
    - AvailabilityEditor component (7-day weekly schedule with Switch toggles)
    - BlockedDatesEditor component (date list with add/remove)
    - /provider/profile/edit page (5-tab server component)
    - shadcn Switch UI component
  affects:
    - Plan 05 (Certifications tab placeholder is here, will be filled by 04-05)
tech_stack:
  added:
    - "@radix-ui/react-switch (shadcn Switch component)"
  patterns:
    - react-hook-form + zodResolver pattern (same as RegisterWizard in Phase 2)
    - Server component fetches all data, passes as props to client components
    - Each sub-component handles its own save action + toast feedback
    - Per-slot loading state for file uploads (uploadingSlot/deletingId state)
    - Client-side file validation before upload (MIME type + size)
    - Accordion pattern for gouvernorat/delegation hierarchy
key_files:
  created:
    - src/features/provider/components/ProfileEditForm.tsx
    - src/features/provider/components/PhotoUpload.tsx
    - src/features/provider/components/ZoneSelector.tsx
    - src/features/provider/components/PortfolioUploader.tsx
    - src/features/provider/components/AvailabilityEditor.tsx
    - src/features/provider/components/BlockedDatesEditor.tsx
    - src/app/[locale]/(provider)/provider/profile/edit/page.tsx
    - src/components/ui/switch.tsx
  modified: []
decisions:
  - "[04-03]: Switch component created manually (switch.tsx) — @radix-ui/react-switch was already in package.json, only the shadcn wrapper was missing"
  - "[04-03]: AvailabilityEditor normalizes dayOfWeek 0=Sunday..6=Saturday — matches Prisma schema and JS Date convention"
  - "[04-03]: BlockedDatesEditor stores dates as ISO datetime (midnight UTC) — required by blockedDateSchema z.string().datetime()"
  - "[04-03]: ZoneSelector uses Set<string> for selectedIds — O(1) toggle and membership checks"
  - "[04-03]: PortfolioUploader uses per-photo deletingId state — supports concurrent delete attempts gracefully"
  - "[04-03]: Edit profile page redirects to /provider/kyc if no provider record — provider record created during KYC registration"
metrics:
  duration_minutes: 8
  completed_date: "2026-02-23"
  tasks_completed: 2
  files_created: 8
  files_modified: 0
---

# Phase 4 Plan 03: Provider Profile Edit UI Summary

**One-liner:** Provider profile edit page with 5-tab layout — ProfileEditForm (react-hook-form/zod), PhotoUpload (camera overlay), ZoneSelector (gouvernorat accordion), PortfolioUploader (10-slot grid), AvailabilityEditor (7-day schedule with Switch), BlockedDatesEditor (date list).

## What Was Built

### Task 1: Profile edit form + photo upload + zone selector + portfolio uploader + page

**`src/features/provider/components/PhotoUpload.tsx`:**
- Circular avatar (128x128) with hover camera overlay
- Hidden file input (accept="image/jpeg,image/png,image/webp")
- Client-side validation: MIME type check + 5MB size limit
- POST to `/api/provider/photo` with FormData, toast success/error
- Loading spinner inside overlay during upload

**`src/features/provider/components/ZoneSelector.tsx`:**
- Props: `initialDelegationIds` + `gouvernorats` (from server)
- Accordion per gouvernorat (ChevronDown/Up), delegations as checkboxes in 2-col grid
- "Tout selectionner" / "Tout deselectionner" per gouvernorat
- Selected zones shown as Badge chips with X to remove
- Saves via `updateZonesAction({ delegationIds: [...] })`, toast feedback

**`src/features/provider/components/PortfolioUploader.tsx`:**
- 2-col (mobile) / 3-col (desktop) grid, up to 10 slots
- Existing photos with hover Trash2 overlay (per-photo deletingId state)
- Inline caption input below each photo (onBlur calls `updatePortfolioPhotoCaptionAction`)
- Empty slot with dashed border + Plus icon triggers file upload
- POST `/api/provider/portfolio`, DELETE `/api/provider/portfolio` with `{ photoId }`
- Counter badge "X/10 photos"

**`src/features/provider/components/ProfileEditForm.tsx`:**
- react-hook-form with `zodResolver(updateProfileSchema)`
- Fields: displayName (required), bio (Textarea + char counter /2000), phone, yearsExperience (number), languages (7 checkbox options: Francais/Arabe/Anglais/Amazigh/Espagnol/Italien/Allemand)
- PhotoUpload integrated at top
- Two-column grid on desktop, single column on mobile
- Submits via `updateProfileAction(data)`, toast success/error

**`src/app/[locale]/(provider)/provider/profile/edit/page.tsx`:**
- Server component with auth check and provider fetch
- Fetches: provider with delegations, all gouvernorats+delegations, availabilities (normalized to 7 slots), blocked dates, portfolio photos
- Redirects to `/provider/kyc` if no provider record
- Tabs: Informations | Zones | Disponibilites | Portfolio | Certifications
- `generateMetadata` using `t("editProfile")`

### Task 2: Availability editor and blocked dates editor

**`src/features/provider/components/AvailabilityEditor.tsx`:**
- 7 rows (dayOfWeek 0=Sunday to 6=Saturday)
- Each row: shadcn Switch toggle, day label (from t(dayKey)), start + end time inputs
- Time inputs disabled (opacity-40) when slot is inactive
- Default schedule: Mon-Fri active 08:00-18:00, Sat-Sun inactive
- "Enregistrer" calls `updateAvailabilityAction({ slots })` with all 7 slots
- Toast success/error

**`src/components/ui/switch.tsx`:**
- shadcn Switch component using `@radix-ui/react-switch`
- Created manually since the package was already installed but the UI wrapper was missing

**`src/features/provider/components/BlockedDatesEditor.tsx`:**
- Native `<input type="date">` with `min=today` (prevents past dates)
- Optional reason field (max 200 chars)
- Add button inserts entry sorted by date ascending
- Each row: formatted display date, reason, Trash2 button
- Validates: no past dates, no duplicates
- Saves via `updateBlockedDatesAction({ dates })` (replace all strategy)
- Toast success/error

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] BlockedDate model has no isDeleted field**
- **Found during:** Task 1, TypeScript check
- **Issue:** Page fetched blocked dates with `where: { isDeleted: false }` but `BlockedDate` model in schema has no soft-delete fields
- **Fix:** Removed `isDeleted: false` filter — only `{ providerId: provider.id }` used
- **Files modified:** `src/app/[locale]/(provider)/provider/profile/edit/page.tsx`
- **Commit:** 484034e

**2. [Rule 3 - Blocking] shadcn Switch component missing**
- **Found during:** Task 2 implementation (plan specifies shadcn Switch)
- **Issue:** `switch.tsx` was not in `src/components/ui/` but `@radix-ui/react-switch` was already in package.json
- **Fix:** Created `src/components/ui/switch.tsx` manually using the @radix-ui/react-switch primitive
- **Files modified:** `src/components/ui/switch.tsx` (new)
- **Commit:** 484034e

### Pre-existing Work

Plan 04-04 was partially executed before this plan (out of order). Files `PhotoUpload.tsx`, `ServiceCard.tsx`, `ServicesGrid.tsx`, `alert-dialog.tsx`, and 3 service pages were already present as untracked files. They were picked up in the Task 2 commit but are part of the correct phase output.

## Verification

- `npx tsc --noEmit` — zero errors (confirmed twice)
- All 8 files created and verified with file checks
- Line counts meet minimums: ProfileEditForm (214), ZoneSelector (273), AvailabilityEditor (177), PortfolioUploader (273), page (204)
- All French labels sourced from `useTranslations("provider")` — no hardcoded strings
- All save actions connect to server actions from Plan 04-01

## Self-Check: PASSED

Files verified:
- FOUND: src/features/provider/components/ProfileEditForm.tsx
- FOUND: src/features/provider/components/PhotoUpload.tsx
- FOUND: src/features/provider/components/ZoneSelector.tsx
- FOUND: src/features/provider/components/PortfolioUploader.tsx
- FOUND: src/features/provider/components/AvailabilityEditor.tsx
- FOUND: src/features/provider/components/BlockedDatesEditor.tsx
- FOUND: src/app/[locale]/(provider)/provider/profile/edit/page.tsx
- FOUND: src/components/ui/switch.tsx

Commits verified:
- 484034e: feat(04-03): create profile edit UI — form, photo upload, zone selector, portfolio
- dd9057c: feat(04-03): create availability editor and blocked dates editor components
