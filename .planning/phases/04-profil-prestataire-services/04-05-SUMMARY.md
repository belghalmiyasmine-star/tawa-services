---
phase: 04-profil-prestataire-services
plan: "05"
subsystem: provider-public-profile
tags: [nextjs, server-component, tabs, prisma, i18n, file-upload, gallery, certifications]
dependency_graph:
  requires:
    - prisma.provider (Phase 1 schema)
    - TrustBadges component (Phase 03-04)
    - /api/provider/certification (Phase 04-01)
    - deleteCertificationAction (Phase 04-01)
    - getProviderCertificationsAction (Phase 04-01)
    - services with category/provider (Phase 04-02)
    - portfolioPhotos (Phase 04-01)
    - edit profile page with 4 tabs (Phase 04-03)
  provides:
    - Public provider profile page at /providers/[providerId]
    - PublicProfileHeader component (avatar, name, badges, stars, city, member since)
    - PublicProfileStats component (5 stat cards incl. response rate %)
    - PublicProfileAbout component (bio, experience, languages, zones, portfolio, certifications)
    - PortfolioGallery component (read-only 2/3-col grid)
    - PublicServiceCard component (Airbnb-style with provider mini-section)
    - CertificationUploader component (POST to /api/provider/certification)
    - CertificationsList component (list + delete + refresh)
    - Edit profile Certifications tab (5th tab)
  affects:
    - Phase 05 (categories/discovery — will use PublicServiceCard pattern)
    - Phase 08 (reviews — Avis tab is placeholder, will be filled)
tech_stack:
  added: []
  patterns:
    - Server component pattern for public-facing profile (no "use client" needed)
    - Single DB write point for certifications (API route only, no duplicate addCertificationAction)
    - Client state refresh pattern via server action (getProviderCertificationsAction)
    - TrustBadges used in server component via async getTranslations (component is "use client" — wraps in async server component)
key_files:
  created:
    - src/features/provider/components/PublicProfileHeader.tsx
    - src/features/provider/components/PublicProfileStats.tsx
    - src/features/provider/components/PublicProfileAbout.tsx
    - src/features/provider/components/PublicServiceCard.tsx
    - src/features/provider/components/PortfolioGallery.tsx
    - src/app/[locale]/(client)/providers/[providerId]/page.tsx
    - src/features/provider/components/CertificationUploader.tsx
    - src/features/provider/components/CertificationsList.tsx
  modified:
    - src/app/[locale]/(provider)/provider/profile/edit/page.tsx (added Certifications tab content + certification fetch)
    - src/messages/fr.json (added 15 certificationXxx keys to provider namespace)
decisions:
  - "[04-05]: PublicServiceCard uses div instead of Link — /services/[id] route does not exist until Phase 05"
  - "[04-05]: Heart icon is a div placeholder — favorites feature is Phase 06"
  - "[04-05]: CertificationUploader POSTs to /api/provider/certification only — addCertificationAction not called to prevent duplicate DB writes"
  - "[04-05]: PortfolioGallery returns null when photos.length === 0 — section hidden rather than showing empty state"
  - "[04-05]: PublicProfileStats uses grid-cols-2 on mobile, lg:grid-cols-5 on desktop — 5th card wraps to 2nd row on tablet"
metrics:
  duration_minutes: 6
  completed_date: "2026-02-23"
  tasks_completed: 2
  tasks_pending: 1
  files_created: 8
  files_modified: 2
---

# Phase 4 Plan 05: Public Provider Profile Summary

**One-liner:** Public provider profile at /providers/[id] with hero header (avatar, badges, stars, city), 5 stat cards (incl. response rate %), 3-tab layout (Services/Avis/A propos with portfolio gallery and certifications), plus certification management UI integrated into edit profile.

## Status

Tasks 1-2 complete and committed. Task 3 (checkpoint:human-verify) pending human verification.

## What Was Built

### Task 1: Public provider profile page and components

**`src/features/provider/components/PublicProfileHeader.tsx`:**
- Server component (no "use client") — uses `getTranslations`
- Circular avatar (120px mobile / 160px desktop) with UserCircle placeholder
- Display name (text-2xl bold)
- TrustBadges with `size="md"` (server component wraps "use client" TrustBadges — valid in Next.js)
- Star rating display: filled/half/empty stars using Lucide Star icons + numeric rating + review count
- City derived from first delegation's gouvernorat name (or "Tunisie" if no zones)
- "Membre depuis {month} {year}" formatted from createdAt

**`src/features/provider/components/PublicProfileStats.tsx`:**
- Server component — 5 stat cards in responsive grid (2-col mobile, 5-col desktop)
- Stats: completedMissions, rating (X.X/5), ratingCount, responseRate (N% or N/A), responseTimeHours (< 1h / Nh or N/A)
- Each card: white rounded-xl, icon + bold value + muted label
- All labels from `getTranslations("provider")`

**`src/features/provider/components/PortfolioGallery.tsx`:**
- Server component — read-only gallery, returns null if no photos
- 2-col mobile / 3-col desktop grid, 1:1 aspect ratio images, captions below
- Section heading from `t("portfolioSection")`

**`src/features/provider/components/PublicProfileAbout.tsx`:**
- Server component — A propos tab content
- Bio (whitespace-pre-line, placeholder if empty)
- Experience (Briefcase icon, skipped if 0)
- Languages (Globe icon, comma-separated)
- Zones grouped by gouvernorat with accordion-style display
- PortfolioGallery embedded
- Certifications list with FileText/Image icons and ExternalLink to file

**`src/features/provider/components/PublicServiceCard.tsx`:**
- Server component — Airbnb-style card
- Photo or gradient placeholder, category badge, 2-line title
- Provider mini-section: 32px avatar circle + displayName + star + rating
- City from first delegation, price (TND or Sur devis), duration if set
- Heart placeholder (div, no functionality) — favorites Phase 06

**`src/app/[locale]/(client)/providers/[providerId]/page.tsx`:**
- SSR server component in (client) route group — publicly accessible
- Prisma query includes: user, trustBadges, delegations, certifications, portfolioPhotos, services (ACTIVE only)
- Service includes: category+parent, provider (displayName, photoUrl, rating, delegations)
- notFound() if provider not found or not active
- generateMetadata: dynamic title, description from bio (first 160 chars), OG tags
- Layout: hero header > 5 stats > Tabs (Services / Avis placeholder / A propos)

### Task 2: Certification management components

**`src/features/provider/components/CertificationUploader.tsx`:**
- "use client" — form with title input (required, 2-200 chars) + file input (image/*, .pdf, 10MB)
- Client-side validation: MIME type + size before upload
- POSTs to `/api/provider/certification` (single DB write point — no addCertificationAction call)
- Loading state during upload, toast success with certification title, calls `onUploadSuccess()`
- Submit button disabled until both title and file valid

**`src/features/provider/components/CertificationsList.tsx`:**
- "use client" — local certifications state initialized from props
- List of certification cards: FileText/Image icon, title, upload date, ExternalLink view, Trash2 delete
- Delete via deleteCertificationAction + AlertDialog confirmation + refresh via getProviderCertificationsAction
- CertificationUploader mounted below list, onUploadSuccess refreshes list
- Empty state: "Aucune certification ajoutee"
- All labels from useTranslations("provider")

**Edit profile page update:**
- Added `certifications` fetch via `prisma.certification.findMany`
- Replaced placeholder Certifications tab with `<CertificationsList>` component

**fr.json additions:**
- 15 new keys in `provider` namespace: certificationSection, certificationEmpty, certificationTitle, certificationTitlePlaceholder, certificationFile, certificationAdd, certificationUploading, certificationAdded, certificationUploadError, certificationDelete, certificationDeleteConfirm, certificationDeleted, certificationDeleteError, certificationView

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PublicServiceCard used next/link with non-existent route**
- **Found during:** Task 1, TypeScript check (`typedRoutes: true` in next.config.ts)
- **Issue:** Plan specified `Link href={/services/${id}}` but `/services/[id]` route does not exist (Phase 05 feature)
- **Fix:** Replaced `<Link>` with `<div>` wrapper — card is visual only, no navigation
- **Comment added:** "Service detail page is built in Phase 5"
- **Files modified:** `src/features/provider/components/PublicServiceCard.tsx`

**2. [Rule 1 - Bug] Heart button onClick not compatible with server component**
- **Found during:** Task 1, TypeScript check
- **Issue:** onClick handler is only valid in "use client" components
- **Fix:** Replaced `<button onClick>` with `<div>` placeholder
- **Files modified:** `src/features/provider/components/PublicServiceCard.tsx`

## Task 3 Status: PENDING (checkpoint:human-verify)

Task 3 requires human verification of the complete Phase 4 E2E flow. See checkpoint section returned to orchestrator.

## Self-Check: PASSED

Files verified:
- FOUND: src/features/provider/components/PublicProfileHeader.tsx
- FOUND: src/features/provider/components/PublicProfileStats.tsx
- FOUND: src/features/provider/components/PublicProfileAbout.tsx
- FOUND: src/features/provider/components/PublicServiceCard.tsx
- FOUND: src/features/provider/components/PortfolioGallery.tsx
- FOUND: src/app/[locale]/(client)/providers/[providerId]/page.tsx
- FOUND: src/features/provider/components/CertificationUploader.tsx
- FOUND: src/features/provider/components/CertificationsList.tsx

Commits verified:
- f5f9748: feat(04-05): create public provider profile page and components
- 90e65f6: feat(04-05): add certification management components and integrate into edit profile

TypeScript: `npx tsc --noEmit` exits 0 — zero errors.
