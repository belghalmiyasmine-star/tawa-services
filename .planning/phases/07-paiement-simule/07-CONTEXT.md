# Phase 7: Paiement Simule — Design Context

## Design Decisions

### Architecture
- **Payment service abstraction layer** (interface) that can swap from simulated to real Konnect API later
- `IPaymentService` interface with `SimulatedPaymentService` implementation
- Konnect-ready architecture — replacing simulation requires only implementing the interface

### Checkout Flow
- 4 payment methods displayed:
  - **Carte bancaire**: simulated card form (number, expiry, CVV with format validation only — no real processing)
  - **D17**: logo + pay button (one-click simulated)
  - **Flouci**: logo + pay button (one-click simulated)
  - **Especes**: cash on delivery flow
- Banner **"Mode demonstration — Paiement simule"** on ALL payment screens
- Fee breakdown on checkout: service price + Tawa fees = total TND
- Payment confirmation page with reference number

### Escrow Model
- Client pays → platform holds (HELD) → service completed → provider paid minus 12% commission (RELEASED)
- Automatic release on booking COMPLETED status

### Provider Earnings Dashboard
- Balance card: available / pending amounts
- Monthly breakdown table: month, missions count, gross revenue, 12% commission, net earnings
- Transaction history list
- "Demander un virement" button (simulated, minimum 50 TND threshold)

### Invoice Generation
- Auto-generated invoice per completed booking
- Accessible by both client and prestataire
