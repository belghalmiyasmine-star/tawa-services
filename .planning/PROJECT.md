# Tawa Services

## What This Is

Tawa Services is a Tunisian online service marketplace platform (similar to TaskRabbit/NeedHelp/Urban Company, adapted for the Tunisian market). Clients search for local service providers (plumbers, cleaners, tutors, electricians, etc.), book services through direct booking or quote-based requests, pay (simulated with Konnect-ready architecture), and leave reviews. Providers create verified profiles, list services, manage bookings, and track earnings. Admins have full control over users, services, reports, and analytics.

## Core Value

Clients can find, book, and pay a trusted local service provider in their city — and providers can get discovered and manage their business in one place.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Client can search and filter providers by service category and city
- [ ] Client can book services (direct booking for fixed-price, quote request for "sur devis")
- [ ] Provider can create a verified profile and list services with pricing
- [ ] Provider can manage bookings (accept/reject/complete)
- [ ] Simulated payment flow with Konnect-ready payment service layer
- [ ] Review and rating system for completed services
- [ ] Admin full control panel (users, services, reports, analytics)
- [ ] Mandatory KYC verification for providers (CIN/passport upload, admin approval)
- [ ] i18n infrastructure with next-intl (French primary, ready for Arabic/English)
- [ ] City/delegation-level location filtering
- [ ] Admin analytics dashboard with KPIs and data export (CSV/PDF)

### Out of Scope

- Radius-based GPS search — deferred to post-PFE (requires Google Maps API integration)
- Real payment processing — simulated for v1, Konnect integration post-PFE
- Arabic and English translations — i18n infrastructure built, translation files added later
- Mobile native app — web-first, responsive design
- Real-time chat between client and provider — deferred to v2
- Video/image-heavy service portfolios — basic image upload only for v1

## Context

- **Project type:** PFE (Projet de Fin d'Etudes) — must be demo-ready with polished end-to-end flows and seeded data, but built with production-ready architecture so minimal work is needed to actually launch after the PFE defense.
- **Market:** Tunisia — service marketplace adapted for local geography (gouvernorats, delegations, cities like La Marsa, Ariana, Manouba, Carthage), local payment methods (D17, Flouci, cash, card), and French as primary language.
- **Booking model:** Dual-flow — direct booking for fixed-price services (client picks time, provider accepts/rejects) and quote-based requests for "sur devis" services (client describes job, provider sends quote, client accepts/declines).
- **Payment architecture:** Simulated checkout UI showing all Tunisian payment methods. Designed with a clean payment service abstraction layer so the simulated backend can be swapped for real Konnect (konnect.network) API integration with zero frontend changes. Escrow model: client pays → platform holds → service completed → provider paid minus 12% commission.
- **Admin capabilities:** User management (approve/ban providers, KYC verification, dispute handling), service management (approve/suspend, manage categories), reports with priority levels (critical <2h, important <24h, minor <48h), analytics (active users, transactions, revenue, conversion rate, satisfaction, category/geographic breakdowns), content management (FAQ, CGU, banners), system notifications, CSV/PDF export.
- **CDC research (9 platforms analyzed):** Mobile-first design (80% mobile), bottom nav for mobile, card-based scrolling, 3-screen max booking flow, real-time search with autocomplete, provider portfolios with certifications, bidirectional ratings (client ↔ provider), trust badges ("Identite Verifiee", "Reponse Rapide", "Top Prestataire"), KYC: CIN + selfie + proof of address with 48h admin validation, cancellation policy (>48h full refund, 24-48h partial, <24h no refund), messaging with auto-moderation (block contact info sharing).

## Constraints

- **Tech stack**: Next.js 15 (App Router) + TypeScript, PostgreSQL + Prisma ORM, NextAuth.js, Tailwind CSS + shadcn/ui, Zod, recharts, react-hook-form, lucide-react, next-intl
- **Language**: French primary UI with full i18n from day 1 (every string via `t('key')` pattern)
- **Location**: City/delegation-level for v1 (no GPS/radius)
- **Payment**: Simulated with pluggable service layer (Konnect-ready)
- **Verification**: Mandatory KYC for providers before listing services
- **Demo**: Seeded data for PFE presentation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 15 App Router + TypeScript | Modern full-stack framework, SSR/SSG support, strong ecosystem | — Pending |
| PostgreSQL + Prisma over MongoDB | Relational data (users, bookings, reviews) fits SQL better, Prisma provides type-safe queries | — Pending |
| Dual booking flow (direct + quote) | Matches Tunisian market reality — some services are fixed-price, others are "sur devis" | — Pending |
| Simulated payment with service abstraction | Ships faster for PFE while keeping clean path to Konnect integration | — Pending |
| City-level location (not GPS radius) | Simpler for MVP, GPS/radius deferred to post-PFE enhancement | — Pending |
| next-intl for i18n from day 1 | Zero-cost to add later if infrastructure is built from the start | — Pending |
| Mandatory KYC for providers | Trust is critical for a service marketplace — verified providers only | — Pending |

---
*Last updated: 2026-02-21 after initialization*
