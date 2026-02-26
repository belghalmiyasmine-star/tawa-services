# Requirements: Tawa Services

**Defined:** 2026-02-21
**Core Value:** Clients can find, book, and pay a trusted local service provider in their city — and providers can get discovered and manage their business in one place.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can create account with email and password (role selection: CLIENT or PROVIDER)
- [x] **AUTH-02**: User receives email verification link after signup
- [x] **AUTH-03**: User can reset password via email link
- [x] **AUTH-04**: User session persists across browser refresh (NextAuth.js sessions)
- [x] **AUTH-05**: User can log in via Google or Facebook (NextAuth.js social providers)
- [x] **AUTH-06**: Role-based access control (CLIENT, PROVIDER, ADMIN) with route protection
- [x] **AUTH-07**: User must verify phone number via SMS (+216 format or 8 digits)
- [x] **AUTH-08**: Registration validates Tunisian phone format, unique email/phone, password 8+ chars

### KYC Verification

- [x] **KYC-01**: Provider can upload CIN/passport photo for identity verification
- [x] **KYC-02**: Provider can upload selfie for identity match
- [x] **KYC-03**: Provider can upload proof of address document
- [x] **KYC-04**: Admin reviews and approves/rejects KYC within 48h, trust badges awarded on approval
- [x] **KYC-05**: Provider cannot list services until KYC is approved
- [x] **KYC-06**: Trust badges displayed on profile: "Identite Verifiee", "Reponse Rapide", "Top Prestataire"

### Provider Profile

- [x] **PROF-01**: Provider can create profile with display name, bio, photo, contact info, cities covered
- [x] **PROF-02**: Provider can list services with title (80 chars max), description (150-1000 chars), pricing (fixed or sur devis), category, duration
- [x] **PROF-03**: Provider can upload work photos (max 5 per service), professional certifications, diplomas
- [x] **PROF-04**: Provider can set availability calendar (weekly schedule + blocked dates)
- [x] **PROF-05**: Provider can specify languages spoken, years of experience, hourly and fixed rates
- [x] **PROF-06**: Provider can define intervention zone (city/delegation list)
- [x] **PROF-07**: Provider profile displays statistics (completed missions, average rating, total reviews, response time)
- [x] **PROF-08**: Service listing includes inclusions/exclusions lists and conditions

### Search & Discovery

- [x] **SRCH-01**: Client can browse services by category (Plomberie, Menage, Cours, Electricite, etc.)
- [x] **SRCH-02**: Client can filter providers by city/delegation
- [x] **SRCH-03**: Real-time autocomplete search suggestions as user types
- [x] **SRCH-04**: Client can sort results by rating, price, availability; filter by verified status, price range
- [x] **SRCH-05**: Client can view provider profiles with portfolio, certifications, badges, and reviews

### Booking

- [x] **BOOK-01**: Client can directly book fixed-price services by selecting a time slot
- [x] **BOOK-02**: Client can send quote request for "sur devis" services (describe job, provider responds with price)
- [x] **BOOK-03**: Provider can accept or reject direct bookings and quote requests
- [x] **BOOK-04**: Provider has 48h to respond to quote requests before auto-expiry
- [x] **BOOK-05**: Booking status flow: PENDING → ACCEPTED → IN_PROGRESS → COMPLETED (with REJECTED and CANCELLED alternatives)
- [x] **BOOK-06**: Provider dashboard shows bookings by status: pending, accepted, in-progress, completed, cancelled
- [x] **BOOK-07**: Cancellation policy enforced: >48h full refund, 24-48h partial refund, <24h no refund
- [x] **BOOK-08**: 3-screen maximum booking flow (select service → confirm details → payment)

### Payment

- [x] **PAY-01**: Simulated checkout UI showing Tunisian payment methods (card, D17, Flouci, cash)
- [x] **PAY-02**: Escrow model: client pays → platform holds → service completed → provider paid minus 12% commission
- [x] **PAY-03**: Provider earnings dashboard showing earnings, pending payments, commission breakdown
- [x] **PAY-04**: Auto-generated invoices/receipts for completed transactions
- [x] **PAY-05**: Monthly earnings statements for providers
- [x] **PAY-06**: Provider withdrawal requests (minimum 50 TND)
- [x] **PAY-07**: Tax summaries and 5-year document retention
- [x] **PAY-08**: Payment service abstraction layer (pluggable for future Konnect integration)

### Reviews & Ratings

- [x] **REVW-01**: Client can rate provider 1-5 stars with text review after service completion
- [x] **REVW-02**: Provider can rate client (bidirectional rating system)
- [x] **REVW-03**: Criteria-based ratings: quality, punctuality, communication, cleanliness
- [x] **REVW-04**: Photo upload with reviews (max 3 photos)
- [x] **REVW-05**: 10-day submission window after service completion
- [x] **REVW-06**: Simultaneous publication (both parties review before either is visible)
- [x] **REVW-07**: Auto-moderation for defamatory/spam content
- [x] **REVW-08**: Rating aggregation displayed on profiles, used for search sorting

### Messaging

- [x] **MSG-01**: In-app messaging between client and provider for booking coordination
- [x] **MSG-02**: Auto-moderation blocking contact info sharing (phone, email) to keep transactions on-platform
- [x] **MSG-03**: Read receipts and unread count badge in navbar
- [x] **MSG-04**: Conversation history with 12-month retention

### Notifications

- [x] **NOTF-01**: In-app notifications for booking requests, acceptance/rejection, new messages, new reviews, payments received, profile approval
- [x] **NOTF-02**: Email notifications for transactional events (bookings, password reset, verification)
- [x] **NOTF-03**: Notification preferences (enable/disable by type)
- [x] **NOTF-04**: Quiet hours setting for notification delivery

### Admin

- [x] **ADMN-01**: Admin can view, approve, ban users and validate KYC submissions
- [x] **ADMN-02**: Admin can approve/suspend services, manage service categories, feature listings
- [x] **ADMN-03**: Admin can handle reports/signalements with priority levels (critical <2h, important <24h, minor <48h)
- [ ] **ADMN-04**: Analytics dashboard with KPIs: active users, transaction count, revenue, conversion rate, satisfaction rate, category/geographic breakdowns
- [ ] **ADMN-05**: Data export as CSV/PDF
- [ ] **ADMN-06**: Content management: homepage content, banners, FAQ, CGU (Terms & Conditions), legal pages
- [ ] **ADMN-07**: System notifications and newsletters to users
- [ ] **ADMN-08**: Provider earnings and commission oversight

### UI/UX & Infrastructure

- [x] **UI-01**: Mobile-first responsive design (80% mobile, 20% desktop)
- [x] **UI-02**: Bottom navigation bar for mobile, card-based scrolling
- [x] **UI-03**: i18n infrastructure with next-intl (French primary, translation keys for all strings, language switcher ready)
- [x] **UI-04**: Seeded demo data for PFE presentation

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
- **ADV-03**: Client favorites/saved providers list

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app (iOS/Android) | Web-first responsive design covers mobile use |
| Video content/streaming | Storage/bandwidth costs too high for MVP |
| AI-powered matching/recommendations | Complexity not justified for v1 |
| Multi-country support | Tunisia-only for v1 |
| Subscription/membership tiers | Simple commission model sufficient |
| Escrow with real bank integration | Simulated for PFE, Konnect deferred to v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UI-01 | Phase 1 + Phase 11 | Complete |
| UI-02 | Phase 1 + Phase 11 | Complete |
| UI-03 | Phase 1 + Phase 11 | Complete |
| UI-04 | Phase 11 | Complete |
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 2 | Complete |
| AUTH-06 | Phase 2 | Complete |
| AUTH-07 | Phase 2 | Complete |
| AUTH-08 | Phase 2 | Complete |
| KYC-01 | Phase 3 | Complete |
| KYC-02 | Phase 3 | Complete |
| KYC-03 | Phase 3 | Complete |
| KYC-04 | Phase 3 | Complete |
| KYC-05 | Phase 3 | Complete |
| KYC-06 | Phase 3 | Complete |
| PROF-01 | Phase 4 | Complete |
| PROF-02 | Phase 4 | Complete |
| PROF-03 | Phase 4 | Complete |
| PROF-04 | Phase 4 | Complete |
| PROF-05 | Phase 4 | Complete |
| PROF-06 | Phase 4 | Complete |
| PROF-07 | Phase 4 | Complete |
| PROF-08 | Phase 4 | Complete |
| SRCH-01 | Phase 5 | Complete |
| SRCH-02 | Phase 5 | Complete |
| SRCH-03 | Phase 5 | Complete |
| SRCH-04 | Phase 5 | Complete |
| SRCH-05 | Phase 5 | Complete |
| BOOK-01 | Phase 6 | Complete |
| BOOK-02 | Phase 6 | Complete |
| BOOK-03 | Phase 6 | Complete |
| BOOK-04 | Phase 6 | Complete |
| BOOK-05 | Phase 6 | Complete |
| BOOK-06 | Phase 6 | Complete |
| BOOK-07 | Phase 6 | Complete |
| BOOK-08 | Phase 6 | Complete |
| PAY-01 | Phase 7 | Complete |
| PAY-02 | Phase 7 | Complete |
| PAY-03 | Phase 7 | Complete |
| PAY-04 | Phase 7 | Complete |
| PAY-05 | Phase 7 | Complete |
| PAY-06 | Phase 7 | Complete |
| PAY-07 | Phase 7 | Complete |
| PAY-08 | Phase 7 | Complete |
| REVW-01 | Phase 8 | Complete |
| REVW-02 | Phase 8 | Complete |
| REVW-03 | Phase 8 | Complete |
| REVW-04 | Phase 8 | Complete |
| REVW-05 | Phase 8 | Complete |
| REVW-06 | Phase 8 | Complete |
| REVW-07 | Phase 8 | Complete |
| REVW-08 | Phase 8 | Complete |
| MSG-01 | Phase 9 | Complete |
| MSG-02 | Phase 9 | Complete |
| MSG-03 | Phase 9 | Complete |
| MSG-04 | Phase 9 | Complete |
| NOTF-01 | Phase 9 | Complete |
| NOTF-02 | Phase 9 | Complete |
| NOTF-03 | Phase 9 | Complete |
| NOTF-04 | Phase 9 | Complete |
| ADMN-01 | Phase 10 | Complete |
| ADMN-02 | Phase 10 | Complete |
| ADMN-03 | Phase 10 | Complete |
| ADMN-04 | Phase 10 | Pending |
| ADMN-05 | Phase 10 | Pending |
| ADMN-06 | Phase 10 | Pending |
| ADMN-07 | Phase 10 | Pending |
| ADMN-08 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 60 total
- Mapped to phases: 60
- Unmapped: 0 — Coverage complete

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-21 — Traceability populated after roadmap creation (11 phases)*
