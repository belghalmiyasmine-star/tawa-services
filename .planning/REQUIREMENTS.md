# Requirements: Tawa Services

**Defined:** 2026-02-27
**Core Value:** Clients can find, book, and pay a trusted local service provider in their city — and providers can get discovered and manage their business in one place.

## v1.1 Requirements

Requirements for milestone v1.1 — Polish, Bug Fixes & PFE Readiness. Continues from v1.0 (60 requirements complete).

### Bug Fixes

- [x] **BUGF-01**: French accents display correctly in all i18n translations (é, è, ê, ç, à, etc.)
- [x] **BUGF-02**: Search autocomplete shows proper icons instead of icon names rendered as text
- [x] **BUGF-03**: Footer links (FAQ, CGU, Contact, Comment ça marche) navigate to correct pages
- [x] **BUGF-04**: Client navbar dashboard link points to correct destination
- [x] **BUGF-05**: Favorites feature works correctly (save/unsave providers or services)
- [x] **BUGF-06**: Client dashboard displays real statistics (bookings count, spending, reviews given)
- [x] **BUGF-07**: Provider withdrawal calculation uses correct amounts (available balance minus commission)
- [x] **BUGF-08**: Admin analytics graphs render with real data (recharts charts not empty)
- [x] **BUGF-09**: Admin can unsuspend previously suspended services (toggle back to active)
- [x] **BUGF-10**: Admin category filter works correctly on services management page
- [x] **BUGF-11**: Dark mode has proper contrast across all pages — no white text on white cards
- [x] **BUGF-12**: Auto-moderation regex catches phone numbers and emails in reviews and messages
- [x] **BUGF-13**: Email verification link includes locale prefix (/fr/) — no 404 on click
- [x] **BUGF-14**: Provider profile zone selector allows selecting intervention zones (city/delegation)

### UX Improvements

- [ ] **UX-01**: Homepage displays client reviews carousel (recent verified reviews with ratings)
- [ ] **UX-02**: Homepage displays top-rated providers section (highest-rated verified providers)
- [ ] **UX-03**: Client dashboard polished with stats cards (total bookings, total spent, reviews given, active bookings)

### Missing Pages

- [ ] **PAGE-01**: FAQ page with categorized questions and answers (accessible from footer)
- [ ] **PAGE-02**: Contact page with contact information or form (accessible from footer)
- [ ] **PAGE-03**: CGU (Terms & Conditions / Conditions Generales d'Utilisation) page
- [ ] **PAGE-04**: Privacy Policy (Politique de Confidentialite) page
- [ ] **PAGE-05**: How it works (Comment ca marche) page explaining the platform flow

### PFE Readiness

- [ ] **PFE-01**: Seed script with realistic Tunisian demo data (10+ providers across categories/cities, 20+ services, 30+ bookings at various statuses, 50+ reviews, transaction history in TND)
- [ ] **PFE-02**: Mobile responsiveness audit and fixes across all pages (375px mobile, 1280px desktop)
- [ ] **PFE-03**: Language switcher UI component (Globe dropdown) in navbar — ready for AR/EN translations
- [ ] **PFE-04**: Performance optimization (Suspense boundaries, lazy loading images, Next.js config tuning)
- [ ] **PFE-05**: Accessibility & SEO audit (meta tags, robots.txt, sitemap.xml, aria labels, alt text)
- [ ] **PFE-06**: E2E demo flow verification on seeded data (search → profile → booking → payment → review)
- [ ] **PFE-07**: Technical documentation (DEPLOYMENT.md with setup guide, schema overview, demo accounts)

### Integration Wiring

- [ ] **INTG-01**: Payment flow navigation wiring (booking flow → checkout page, sidebar earnings link, confirmation redirects)
- [ ] **INTG-02**: Notification dispatch wired into all transactional actions (booking, payment, review, KYC) + Contacter button opens messaging

## v1.0 Requirements (Completed)

All 60 v1.0 requirements shipped. See MILESTONES.md for full list.

Categories: AUTH (8), KYC (6), PROF (8), SRCH (5), BOOK (8), PAY (8), REVW (8), MSG (4), NOTF (4), ADMN (8), UI (4)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Location Enhancement

- **LOC-01**: Radius-based GPS search with Google Maps API (1-50km)
- **LOC-02**: Map + list view toggle for search results

### Payment Integration

- **KPAY-01**: Real Konnect (konnect.network) payment gateway integration
- **KPAY-02**: Real escrow with actual fund holding and disbursement

### Communication

- **COM-01**: Real-time chat with WebSocket (currently simulated with polling)
- **COM-02**: Push notifications (mobile web)

### Internationalization

- **I18N-01**: Arabic translation files
- **I18N-02**: English translation files

### Advanced Features

- **ADV-01**: Optional 2FA for accounts
- **ADV-02**: Provider promotional offers and discounts
- **ADV-03**: Client favorites/saved providers list (enhanced version beyond basic BUGF-05 fix)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app (iOS/Android) | Web-first responsive design covers mobile use |
| Video content/streaming | Storage/bandwidth costs too high for MVP |
| AI-powered matching/recommendations | Complexity not justified for v1 |
| Multi-country support | Tunisia-only for v1 |
| Subscription/membership tiers | Simple commission model sufficient |
| Escrow with real bank integration | Simulated for PFE, Konnect deferred to v2 |
| Arabic/English translations | Infrastructure built (PFE-03 switcher), translation files deferred |
| New feature development | v1.1 is polish/fix only — no new capabilities |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUGF-01 | Phase 12 | Complete |
| BUGF-02 | Phase 12 | Complete |
| BUGF-03 | Phase 12 | Complete |
| BUGF-04 | Phase 12 | Complete |
| BUGF-05 | Phase 12 | Complete |
| BUGF-06 | Phase 12 | Complete |
| BUGF-07 | Phase 12 | Complete |
| BUGF-08 | Phase 12 | Complete |
| BUGF-09 | Phase 12 | Complete |
| BUGF-10 | Phase 12 | Complete |
| BUGF-11 | Phase 12 | Complete |
| BUGF-12 | Phase 12 | Complete |
| BUGF-13 | Phase 12 | Complete |
| BUGF-14 | Phase 12 | Complete |
| UX-01 | Phase 13 | Pending |
| UX-02 | Phase 13 | Pending |
| UX-03 | Phase 13 | Pending |
| PAGE-01 | Phase 13 | Pending |
| PAGE-02 | Phase 13 | Pending |
| PAGE-03 | Phase 13 | Pending |
| PAGE-04 | Phase 13 | Pending |
| PAGE-05 | Phase 13 | Pending |
| INTG-01 | Phase 14 | Pending |
| INTG-02 | Phase 14 | Pending |
| PFE-01 | Phase 15 | Pending |
| PFE-02 | Phase 15 | Pending |
| PFE-03 | Phase 15 | Pending |
| PFE-04 | Phase 15 | Pending |
| PFE-05 | Phase 15 | Pending |
| PFE-06 | Phase 15 | Pending |
| PFE-07 | Phase 15 | Pending |

**Coverage:**
- v1.1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-27 after v1.1 roadmap created (Phases 12-15)*
