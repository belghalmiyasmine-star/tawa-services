# Phase 6: Systeme de Reservation — Context

## User Design Decisions

### Two Booking Flows

1. **Direct booking** (fixed/hourly services) — 3-step wizard:
   - Step 1: Select date/time from provider availability calendar
   - Step 2: Enter address + city + instructions
   - Step 3: Confirm + select payment method

2. **Quote request** ("sur devis" services) — form:
   - Describe need (min 50 chars)
   - Preferred date
   - Address
   - Optional budget
   - Provider responds within 48h with price, client accepts/declines

### Booking Status Machine

PENDING → ACCEPTED → IN_PROGRESS → COMPLETED

Alternative terminal states: REJECTED, CANCELLED

- Provider has accept/reject buttons with rejection reason field
- Notifications on every status change

### Cancellation Policy

- More than 48h before: full refund (100%)
- 24h to 48h before: partial refund
- Less than 24h: no refund (0%)

### Payment Step

Shows 4 payment methods:
- Carte bancaire
- D17
- Flouci
- Especes (cash)

Simulated checkout with "Mode demonstration" banner (no real payment processing).

### Client Booking Pages

- **List page**: tabs (A venir, En cours, Passees, Annulees)
- **Detail page**: status timeline showing progression

### Provider Booking Pages

- **List page**: tabs (Nouvelles demandes, Acceptees, En cours, Historique)
- **Action buttons**: accept / reject / start / complete

### UI Style

- Mobile-first design
- Same Airbnb-inspired style as rest of app
- Consistent with existing shadcn/tailwind patterns
