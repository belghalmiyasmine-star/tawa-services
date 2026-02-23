# Phase 3: Verification KYC — Design Decisions

## Upload Flow
- 4-step wizard matching Phase 2 registration style (same rounded/soft Airbnb UI)
- Step 1: CIN recto — drag-and-drop zone + click to upload, image preview after upload, retake button
- Step 2: CIN verso — same UI as step 1
- Step 3: Selfie holding CIN — camera icon, instructions text "Prenez une photo de vous tenant votre CIN a cote de votre visage", image preview
- Step 4: Proof of address document (justificatif de domicile) — upload zone
- Progress indicator at top showing current step
- File validation: images only (jpg, jpeg, png), max 5MB per file, client-side validation before upload
- Store files in /public/uploads/kyc/[userId]/ with unique filenames (uuid)
- Final review screen showing all 4 documents before submission
- Submit button -> confirmation dialog "Vos documents seront examines sous 48h"

## Provider Status Tracking
- After submission: status page at /provider/kyc showing:
  - "En attente de verification" (yellow/amber badge, hourglass icon) — submitted, waiting for admin
  - "Identite verifiee" (green badge, checkmark icon) — approved
  - "Rejete" (red badge, X icon) — rejected with reason displayed and "Soumettre a nouveau" button
- Timeline visualization showing submission date, review date
- Notification sent on status change (email + in-app)
- KYC status visible on provider dashboard

## Admin KYC Review (in admin panel)
- List of pending KYC submissions sortable by date, with urgency indicator (>48h = overdue in red)
- Click to open review page showing:
  - Provider info (name, email, phone, registration date)
  - All 4 documents displayed large, side by side, zoomable (click to enlarge in dialog)
  - Face comparison: selfie next to CIN photo
  - "Approuver" button (green) -> sets user.isVerified=true, creates ProviderProfile if not exists, sends approval notification
  - "Rejeter" button (red) -> opens dialog with rejection reason dropdown (Document illisible, Photo non conforme, Informations ne correspondent pas, Autre) + optional text field, sends rejection notification
- Admin can re-review rejected submissions
- Dashboard widget: "X verifications en attente" with count

## Trust Badges (after approval)
- "Identite Verifiee" blue badge (lucide BadgeCheck icon) displayed on:
  - Provider profile page (next to name)
  - ProviderCard component (in search results)
  - ServiceCard component
  - Booking confirmation page
- Tooltip on hover: "Ce prestataire a verifie son identite aupres de Tawa Services"
- "Reponse Rapide" badge: auto-awarded if average response time < 1 hour
- "Top Prestataire" badge: auto-awarded if rating > 4.5 and > 10 completed bookings

## Blocking Rules
- Provider CANNOT list services until KYC status = APPROVED
- Provider CAN access dashboard and messaging before KYC approval
- Show banner on provider dashboard: "Completez votre verification d'identite pour commencer a proposer vos services"
- Provider profile shows "Non verifie" gray badge if not approved
