---
phase: 05-recherche-decouverte
plan: 02
subsystem: ui
tags: [next.js, prisma, react, tailwind, next-intl, typescript]

# Dependency graph
requires:
  - phase: 04-profil-prestataire-services
    provides: PublicServiceCard component (now receives Link update), Provider model with all relations
  - phase: 05-01
    provides: ProviderMiniCard skeleton, search namespace i18n keys in fr.json
provides:
  - Service detail page at /services/[serviceId] with SSR Prisma query and generateMetadata
  - ServiceImageGallery component (main image + thumbnail navigation)
  - ServiceDetailClient component (Reserver/Demander un devis/Contacter action buttons with coming-soon toast)
  - ProviderMiniCard component (avatar, rating, city, verified badge, trust badges, profile link)
  - PublicServiceCard now links to /services/[id] instead of placeholder div
affects:
  - phase-06-reservations (Reserver button wired to # — Phase 6 implements booking flow)
  - phase-09-messaging (Contacter button wired to # — Phase 9 implements messaging)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fire-and-forget view count increment: void prisma.service.update() without await"
    - "Service detail page follows SSR pattern: server component fetches all data, passes to client components"
    - "ServiceDetailClient wraps action buttons as client component — server parent, client child buttons"
    - "as never type cast for href in Link with typed routes when dynamic segment not in routing config"

key-files:
  created:
    - src/app/[locale]/(client)/services/[serviceId]/page.tsx
    - src/features/search/components/ServiceImageGallery.tsx
    - src/features/search/components/ServiceDetailClient.tsx
  modified:
    - src/features/provider/components/PublicServiceCard.tsx

key-decisions:
  - "ServiceDetailClient is a separate client component — server parent cannot have onClick handlers"
  - "viewCount increment is fire-and-forget (void, no await) to avoid blocking SSR render latency"
  - "Similar services query: up to 4 services from same category, ordered by viewCount desc, section hidden when 0 results"
  - "PublicServiceCard outer div replaced with Link from @/i18n/routing with as never cast — typed routes don't include /services/[id] yet"
  - "ProviderMiniCard is async server component using getTranslations — no use client overhead"
  - "Action buttons (Reserver/Demander un devis/Contacter) all show Disponible prochainement toast — Phase 6 booking, Phase 9 messaging"

patterns-established:
  - "Service detail pattern: SSR page fetches full data including provider.trustBadges, provider.delegations; passes slices to child components"
  - "Image gallery: aspect-[4/3] main image + thumbnail row, selectedIndex state, up to 5 thumbnails"
  - "Coming-soon placeholder: useToast with title=comingSoonToast for future phase features"

requirements-completed: [SRCH-05]

# Metrics
duration: 25min
completed: 2026-02-24
---

# Phase 5 Plan 02: Service Detail Page Summary

**SSR service detail page at /services/[serviceId] with image gallery, provider mini-card, inclusions/exclusions, and similar services section**

## Performance

- **Duration:** 25 min
- **Started:** 2026-02-24T13:34:01Z
- **Completed:** 2026-02-24T14:00:00Z
- **Tasks:** 2
- **Files modified:** 4 (3 created, 1 updated)

## Accomplishments
- Service detail page at `/services/[serviceId]` with full SSR data (Prisma query including category, provider, trust badges, delegations)
- ServiceImageGallery component with main aspect-[4/3] image and thumbnail row (max 5) using useState
- ServiceDetailClient with conditional CTA (Reserver vs Demander un devis based on pricingType) and coming-soon toast
- PublicServiceCard now links to /services/[id] — completing the navigation chain from search/provider profile to detail page

## Task Commits

Each task was committed atomically:

1. **Task 1: Service detail page with SSR data and image gallery** - `491f18c` (feat)
2. **Task 2: ProviderMiniCard, ServiceDetailClient, PublicServiceCard links** - `b681db8` (feat)

## Files Created/Modified
- `src/app/[locale]/(client)/services/[serviceId]/page.tsx` - SSR service detail page with generateMetadata, Prisma query, 2-column layout, similar services
- `src/features/search/components/ServiceImageGallery.tsx` - Client component, main image + thumbnail navigation
- `src/features/search/components/ServiceDetailClient.tsx` - Client action buttons with useToast coming-soon placeholder
- `src/features/provider/components/PublicServiceCard.tsx` - Changed outer div to Link pointing to /services/[id]

## Decisions Made
- Fire-and-forget viewCount increment: `void prisma.service.update()` without await — never blocks SSR render
- ServiceDetailClient is a separate "use client" component even though the page is server-rendered — needed for onClick handlers
- ProviderMiniCard is an async server component using `getTranslations` — no client bundle overhead for static data
- Similar services section is hidden entirely (not rendered) when 0 results — no empty state shown
- All action buttons use `#` href with coming-soon toast — Phase 6 (booking) and Phase 9 (messaging) will replace these

## Deviations from Plan

None — plan executed exactly as written. ProviderMiniCard was already scaffolded by Phase 05-01 (same session) with aria-label fix already applied.

## Issues Encountered

- ProviderMiniCard had already been created by Phase 05-01 (same agent run earlier today). My write was identical to the existing file. No rework needed.
- The bash shell in the git bash environment has issues with paths containing spaces (`/c/Users/pc dell`), causing spurious exit code 1. TypeScript checks were verified using direct `node` calls to `tsc.js` which showed clean PASS output.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Service detail page complete — clients can navigate from any PublicServiceCard to the full detail page
- Reserver/Demander un devis buttons ready for Phase 6 booking flow implementation
- Contacter button ready for Phase 9 messaging implementation
- ProviderMiniCard "Voir le profil" link correctly routes to /providers/[providerId] (Phase 4)
- Similar services section drives discovery within a category

---
*Phase: 05-recherche-decouverte*
*Completed: 2026-02-24*
