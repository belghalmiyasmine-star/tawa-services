# Phase 4 Context: Profil Prestataire & Services

## Design Decisions

### Provider Profile
- Public profile page at `/providers/[id]`: cover photo, avatar, name, verified badge, rating stars (yellow), city, "Membre depuis..." date
- Stats: missions completed, response rate %, average response time
- Tabs: Services | Avis | À propos
- À propos tab: bio, languages spoken, experience years, intervention zone, certifications
- Edit profile page for provider: all fields editable, photo upload
- Portfolio section: up to 10 work photos with captions

### Service Listing
- Create service form: title (max 80 chars), description (150-1000 chars with counter), category dropdown (2-level: main + subcategory), price type radio (Tarif fixe / Taux horaire / Sur devis), price input in TND (hidden if Sur devis), duration, up to 5 photos (drag to reorder), inclusions/exclusions lists
- Service card component: image, title, price formatted TND, provider name+photo, rating stars, city, heart icon for favorites
- My services page for provider: grid of own services, create/edit/toggle active/delete actions
- Public service detail page: image gallery, title, category badge, price, provider mini-card, full description, "Réserver" or "Demander un devis" button, similar services section

### Categories
- 10 main categories with subcategories (already in seed data from Phase 1)
- Categories page: grid of category cards with emoji icons + service count
- Category detail page: subcategory filter chips + grid of services

### Availability
- Weekly schedule editor: Monday-Sunday, toggle on/off per day, start/end time
- Blocked dates: calendar picker to block specific dates
- Available slots API: checks weekly schedule + blocked dates + existing bookings

### Rates
- Hourly rate and/or fixed rate fields
- Intervention zone: multi-select of cities/delegations from Location table

### UI/UX
- Same rounded/soft Airbnb style
- All text French with i18n keys
- Mobile-first responsive design
