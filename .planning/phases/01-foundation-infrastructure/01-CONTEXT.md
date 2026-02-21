# Phase 1: Foundation & Infrastructure - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the complete development environment: Next.js 15 App Router project scaffold, PostgreSQL + Prisma schema with all v1 models, next-intl i18n infrastructure (French primary), global layout (navbar, footer, mobile bottom nav), shadcn/ui design system with Tailwind, and CI pipeline. No feature logic — just the foundation all subsequent sprints build on.

</domain>

<decisions>
## Implementation Decisions

### Layout & Navigation
- **Mobile bottom nav (5 tabs):** Home, Search, Bookings, Messages, Profile — visible below 768px
- **Desktop navbar:** Logo + categories dropdown + search bar + auth/avatar — visible >= 768px
- **Footer:** Full multi-column footer — Tawa Services, Pour les clients, Pour les prestataires, Aide, Legal
- **3 completely separate layouts** per role:
  - Client layout: public pages + client dashboard
  - Provider layout: provider dashboard with different nav items
  - Admin layout: admin panel with sidebar navigation
- Footer hidden on admin layout
- Bottom nav adapts per role (provider sees Dashboard instead of Search, etc.)

### Design System
- **Primary color:** Blue (#2563EB) — trustworthy, professional
- **Secondary/accent:** Warm orange/amber for CTAs and accents
- **Style:** Rounded & soft — large border-radius, soft shadows, airy spacing (Airbnb-inspired)
- **Backgrounds:** Clean white with subtle gray sections
- **Theme:** Light + dark mode with toggle in navbar
- **Typography:** Claude's discretion (font that feels modern, accessible, works well in French)
- **Target audience feel:** Trustworthy, modern, accessible — users may not be tech-savvy

### Database Schema
- **Service categories:** Two-level hierarchy (main category → subcategories). E.g., Maison → Plomberie, Electricite, Menage
- **IDs:** CUID2 for all models — collision-resistant, URL-safe, sortable
- **Location storage:** Separate `Gouvernorat` and `Delegation` tables with foreign keys — normalized, providers reference delegations they cover via junction table
- **Soft delete:** All models use `isDeleted` flag + `deletedAt` timestamp — data recoverable, audit trail

### Project Structure
- **Route organization:** Hybrid — route groups for layout `/(client)/`, `/(provider)/`, `/(admin)/` with feature-based routes within each group
- **Component organization:** Feature folders — `src/features/auth/`, `src/features/booking/`, each with components, hooks, utils
- **API layer:** Mix — Server Actions for form mutations (create booking, update profile), Route Handlers for external/webhook APIs (`/api/webhooks/`, `/api/cron/`)
- **State management:** Server-first — Server Components + React Query (TanStack Query) for client data fetching, minimal client-side state
- **Shared components:** `src/components/ui/` (shadcn), `src/components/shared/` (app-specific reusables)

### Claude's Discretion
- Font family choice (modern, readable, works well in French)
- Exact spacing scale and typography scale
- Loading skeleton design patterns
- Error state components design
- Exact Tailwind theme token values beyond primary/secondary
- Dark mode color adjustments
- CI pipeline specifics (GitHub Actions vs other)

</decisions>

<specifics>
## Specific Ideas

- Style should feel like Airbnb — rounded, soft, trustworthy
- Target users are Tunisians who may not be tech-savvy, so the interface must be intuitive and clear
- Categories dropdown in navbar similar to marketplace platforms showing icons + labels
- The 3 layouts should feel like 3 distinct apps unified by the same design system
- Admin layout should have a collapsible sidebar (not a navbar)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-infrastructure*
*Context gathered: 2026-02-21*
