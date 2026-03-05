# Roadmap: Tawa Services

## Milestones

- ✅ **v1.0 MVP** - Phases 1-11 (shipped 2026-02-27)
- ✅ **v1.1 Polish & PFE Ready** - Phases 12-15 (completed 2026-03-01)
- 🚧 **v1.2 Production Hardening & AI** - Phases 16-21 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-11) - SHIPPED 2026-02-27</summary>

### Phase 1: Foundation & Infrastructure

**Sprint Goal**: L'equipe dispose d'un environnement de developpement fonctionnel avec base de donnees seedable, routage App Router operationnel, systeme i18n initialise et pipeline CI/CD pret — permettant a tous les sprints suivants de demarrer sans blocage technique.

**Depends on**: Nothing (premier sprint)

**Requirements**: UI-01, UI-02, UI-03, UI-04 (infrastructure uniquement pour ce sprint)

**Success Criteria** (what must be TRUE):
  1. Le projet demarre avec `npm run dev` sans erreur et affiche une page d'accueil avec layout global (navbar, footer, bottom nav mobile)
  2. Le schema Prisma contient tous les modeles v1 (User, Provider, Service, Booking, Payment, Review, Message, Notification) et les migrations s'appliquent sans erreur sur PostgreSQL
  3. Toutes les chaines UI sont chargees via `t('key')` avec next-intl — aucune chaine hardcodee visible dans le code source
  4. La mise en page est mobile-first : bottom navigation visible sur viewport < 768px, layout desktop sur >= 768px
  5. Le pipeline CI (lint + typecheck + tests) passe au vert sur chaque push

**Plans**: 7 plans

Plans:
- [x] 01-01-PLAN.md — Initialisation Next.js 15 App Router + TypeScript strict + ESLint + Prettier + env vars typees
- [x] 01-02-PLAN.md — PostgreSQL + Prisma ORM: schema complet v1 (20+ modeles, CUID2, soft delete, localisation normalisee)
- [x] 01-03-PLAN.md — next-intl: middleware routage par locale, dictionnaire fr.json, pattern t('key') global
- [x] 01-04-PLAN.md — shadcn/ui + Tailwind: tokens design (bleu primaire, orange accent, rounded), composants de base, dark mode
- [x] 01-05-PLAN.md — 3 layouts distincts: Navbar desktop, BottomNav mobile, Footer, AdminSidebar collapsible (checkpoint visuel)
- [x] 01-06-PLAN.md — Types globaux TypeScript, schemas Zod de base (phone tunisien, auth), constantes metier, pages placeholder
- [x] 01-07-PLAN.md — Pipeline CI GitHub Actions: lint + typecheck + build + prisma validate sur chaque push/PR

---

### Phase 2: Authentification

**Sprint Goal**: Tout utilisateur peut creer un compte, se connecter (email/password ou OAuth Google/Facebook), rester connecte entre sessions, reinitialiser son mot de passe, verifier son email et son numero de telephone — avec RBAC complet protegant toutes les routes par role.

**Depends on**: Phase 1

**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08

**Success Criteria** (what must be TRUE):
  1. Un nouveau client peut s'inscrire avec email/mot de passe en choisissant son role (CLIENT ou PROVIDER), reoit un email de verification et ne peut pas acceder aux routes proteges avant verification
  2. Un utilisateur peut se connecter via Google ou Facebook et sa session persiste apres fermeture et reouverture de l'onglet
  3. Un utilisateur ayant oublie son mot de passe peut le reinitialiser via un lien email fonctionnel
  4. Un numero de telephone tunisien invalide (hors format +216 ou 8 chiffres) est rejete a l'inscription avec message d'erreur clair
  5. Un ADMIN accedant a `/admin`, un CLIENT accedant a `/provider/dashboard`, ou un PROVIDER accedant a `/admin` est redirige vers une page 403 ou la page de connexion appropriee

**Plans**: 7 plans

Plans:
- [x] 02-01-PLAN.md — NextAuth.js config: JWT strategy, CredentialsProvider + Google + Facebook, Prisma adapter, session callbacks, SessionProvider
- [x] 02-02-PLAN.md — Registration wizard: 3-step form (role, personal info, password/CGU), register server action, bcrypt hashing
- [x] 02-03-PLAN.md — Login page: email/password form, OAuth buttons, progressive lockout (CAPTCHA + 15min lock), OAuth role selection
- [x] 02-04-PLAN.md — Email verification (Resend magic link) + password reset flow (1h token expiry)
- [x] 02-05-PLAN.md — SMS OTP phone verification: ISmsService abstraction, simulated in dev, inline wizard step 4
- [x] 02-06-PLAN.md — RBAC middleware: next-intl + auth combined, RoleGuard component, 403 page, route group protection
- [x] 02-07-PLAN.md — Optional 2FA (TOTP + SMS), suspicious login detection, security settings page, final verification

---

### Phase 3: Verification KYC

**Sprint Goal**: Un prestataire peut soumettre ses documents d'identite (CIN/passeport, selfie, justificatif de domicile), un admin peut les examiner et approuver/rejeter dans l'interface d'administration, et les trust badges sont affiches automatiquement sur le profil apres approbation — bloquant toute mise en ligne de service sans KYC valide.

**Depends on**: Phase 2

**Requirements**: KYC-01, KYC-02, KYC-03, KYC-04, KYC-05, KYC-06

**Success Criteria** (what must be TRUE):
  1. Un prestataire connecte peut uploader 3 documents (CIN/passeport, selfie, justificatif domicile) depuis son dashboard et voir le statut "En attente de verification"
  2. Un admin peut voir la liste de toutes les demandes KYC en attente, visualiser les documents uploades et cliquer Approuver ou Rejeter avec commentaire optionnel
  3. Apres approbation admin, le badge "Identite Verifiee" apparait immediatement sur le profil prestataire sans action supplementaire
  4. Si un prestataire KYC non-approuve tente d'acceder a la page de creation de service, il est redirige vers la page de statut KYC avec message explicatif
  5. Le workflow KYC complet (soumission → approbation → badge) est tracable via les statuts PENDING, APPROVED, REJECTED en base de donnees

**Plans**: 5 plans

Plans:
- [x] 03-01-PLAN.md — KYC upload API route, submission server action, Zod schemas, i18n translations
- [x] 03-02-PLAN.md — Provider KYC 4-step wizard (CIN recto/verso, selfie, justificatif) + status page
- [x] 03-03-PLAN.md — Admin KYC review interface (list, document viewer, approve/reject with reasons)
- [x] 03-04-PLAN.md — Trust badges component + badge computation logic (identity, quick response, top provider)
- [x] 03-05-PLAN.md — KYC guard banner on provider dashboard, admin KYC pending count, end-to-end verification

---

### Phase 4: Profil Prestataire & Services

**Sprint Goal**: Un prestataire KYC-approuve peut creer et publier un profil complet avec photo, bio, zones d'intervention, disponibilites — et lister des services avec tarification (fixe ou sur devis), photos de travaux, certifications, inclusions/exclusions — le tout visible par les clients sur des pages de profil publiques.

**Depends on**: Phase 3

**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06, PROF-07, PROF-08

**Success Criteria** (what must be TRUE):
  1. Un prestataire peut remplir et sauvegarder son profil (nom, bio, photo, contact, villes couverts, langues, experience) et le voir publie sur une URL publique `/providers/{id}`
  2. Un prestataire peut creer un service avec titre (80 chars max), description (150-1000 chars), prix fixe ou "sur devis", categorie, duree, et jusqu'a 5 photos de travaux
  3. Un prestataire peut definir un calendrier de disponibilite hebdomadaire (jours et horaires) avec des dates bloquees specifiques
  4. Le profil public affiche les statistiques en temps reel : missions terminees, note moyenne, nombre d'avis, temps de reponse moyen
  5. Un service peut specifier des listes d'inclusions et d'exclusions claires, et des conditions particulieres

**Plans**: 5 plans

Plans:
- [x] 04-01-PLAN.md — Backend profil prestataire: validations Zod, server actions CRUD, upload photo, i18n
- [x] 04-02-PLAN.md — Backend services: CRUD server actions avec KYC guard, upload photos/certifications
- [x] 04-03-PLAN.md — UI edition profil: formulaire, zones d'intervention, disponibilites, photo upload
- [x] 04-04-PLAN.md — UI services: formulaire creation/edition, photos de travaux, My Services page
- [x] 04-05-PLAN.md — Page profil public: header, statistiques, onglets Services/Avis/A propos, certifications

---

### Phase 5: Recherche & Decouverte

**Sprint Goal**: Un client peut parcourir les services par categorie, filtrer par ville/delegation, effectuer une recherche avec autocompletion en temps reel, trier les resultats par note/prix/disponibilite, filtrer par statut verifie et plage de prix — et visualiser des fiches prestataires completement informees.

**Depends on**: Phase 4

**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04, SRCH-05

**Success Criteria** (what must be TRUE):
  1. Un client sur la page d'accueil peut cliquer sur une categorie (Plomberie, Menage, Cours, Electricite, etc.) et voir la liste des prestataires correspondants avec leurs notes et tarifs
  2. Un client peut filtrer les resultats par ville ou delegation tunisienne et voir uniquement les prestataires couvrant cette zone
  3. En tapant dans la barre de recherche, des suggestions apparaissent en moins de 300ms sans rechargement de page
  4. Un client peut trier les resultats par "Meilleure note", "Prix croissant", "Disponible maintenant" et filtrer par "Verifie uniquement" et plage de prix min/max
  5. En cliquant sur un prestataire, le client voit son profil complet avec portfolio photos, certifications, trust badges et tous ses avis

**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md — Search API backend: validation schemas, categories API with counts, service search API with filters/sort/pagination, i18n keys
- [x] 05-02-PLAN.md — Service detail page: image gallery, provider mini-card, inclusions/exclusions, action buttons, similar services, PublicServiceCard linking
- [x] 05-03-PLAN.md — Category browsing + search results page: category grid, sidebar filters (Sheet mobile), sort dropdown, pagination, results grid
- [x] 05-04-PLAN.md — Autocomplete search: API endpoint, debounce 300ms component, Navbar/BottomNav integration
- [x] 05-05-PLAN.md — Integration: homepage DB-driven categories, Navbar dynamic categories, end-to-end flow verification checkpoint

---

### Phase 6: Systeme de Reservation

**Sprint Goal**: Un client peut reserver un service a prix fixe en 3 ecrans maximum (service → details → paiement), envoyer une demande de devis pour un service "sur devis", le prestataire peut accepter/rejeter les reservations et devis, et les statuts de reservation progressent correctement avec la politique d'annulation appliquee.

**Depends on**: Phase 5

**Requirements**: BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, BOOK-07, BOOK-08

**Success Criteria** (what must be TRUE):
  1. Un client peut reserver un service fixe en selectionnant un creneau disponible sur le calendrier du prestataire et confirmer en 3 ecrans maximum
  2. Un client peut envoyer une demande de devis en decrivant son besoin, et le prestataire dispose de 48h pour repondre avec un prix avant expiration automatique
  3. Un prestataire peut voir toutes ses reservations groupees par statut (En attente, Acceptees, En cours, Terminees, Annulees) dans son dashboard
  4. La progression des statuts PENDING → ACCEPTED → IN_PROGRESS → COMPLETED est correctement appliquee et visible par les deux parties
  5. Si un client annule une reservation, le remboursement applicable (100% > 48h, partiel 24-48h, 0% < 24h) est correctement calcule et affiche

**Plans**: 7 plans

Plans:
- [x] 06-01-PLAN.md — Backend booking: Prisma schema additions, Zod schemas, booking/quote CRUD actions, query actions, i18n keys
- [x] 06-02-PLAN.md — Cancellation policy + quote expiration: refund tier calculation, cancel actions, cron endpoint
- [x] 06-03-PLAN.md — Direct booking wizard: availability calendar, time slot picker, 3-step wizard, payment selector
- [x] 06-04-PLAN.md — Quote request flow: quote form, response card, accept/decline flow
- [x] 06-05-PLAN.md — Provider booking dashboard: tabbed list, action buttons, quote response, booking detail
- [x] 06-06-PLAN.md — Client bookings pages: Mes reservations tabs, booking detail, status timeline, cancel dialog
- [x] 06-07-PLAN.md — Navigation integration + end-to-end verification checkpoint

---

### Phase 7: Paiement Simule

**Sprint Goal**: Un client peut payer une reservation via une interface de checkout presentant les methodes de paiement tunisiennes (carte, D17, Flouci, cash), le modele d'escrow est simule en base de donnees, les prestataires voient leurs gains et commissions, des factures sont generees automatiquement, et l'architecture est propre pour une integration Konnect future sans modification frontend.

**Depends on**: Phase 6

**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, PAY-08

**Success Criteria** (what must be TRUE):
  1. Apres confirmation d'une reservation, le client voit une page de paiement avec 4 methodes (carte bancaire, D17, Flouci, cash) et peut "payer" — le statut passe a HELD (escrow)
  2. Apres marquage service COMPLETED, le paiement est "libere" au prestataire avec deduction automatique de 12% de commission visible dans le dashboard
  3. Un prestataire peut voir dans son dashboard : gains cumules, paiements en attente, historique des transactions avec detail commission
  4. Une facture PDF ou HTML imprimable est generee automatiquement pour chaque transaction terminee, accessible par client et prestataire
  5. Le service de paiement est isole derriere une interface `IPaymentService` — remplacer la simulation par Konnect ne necessite que d'implementer cette interface

**Plans**: 5 plans

Plans:
- [x] 07-01-PLAN.md — IPaymentService abstraction layer + SimulatedPaymentService + escrow actions + i18n keys
- [x] 07-02-PLAN.md — Checkout page (4 payment methods, card form, fee breakdown) + confirmation page with reference number
- [x] 07-03-PLAN.md — Provider earnings dashboard (balance cards, monthly breakdown, transaction history, withdrawal requests)
- [x] 07-04-PLAN.md — Invoice generation (printable HTML template) + monthly statements + tax retention notice
- [x] 07-05-PLAN.md — Navigation wiring (booking flow -> checkout, sidebar earnings) + end-to-end verification checkpoint

---

### Phase 8: Avis & Evaluations

**Sprint Goal**: Apres completion d'un service, le client et le prestataire peuvent chacun laisser une evaluation (1-5 etoiles avec criteres detailles, texte, jusqu'a 3 photos) dans une fenetre de 10 jours — les avis sont publies simultanement une fois les deux parties ont evalue — et les moyennes sont agregees et utilisees dans le tri des resultats de recherche.

**Depends on**: Phase 7

**Requirements**: REVW-01, REVW-02, REVW-03, REVW-04, REVW-05, REVW-06, REVW-07, REVW-08

**Success Criteria** (what must be TRUE):
  1. Un client peut noter un prestataire sur 4 criteres (qualite, ponctualite, communication, proprete) et laisser un texte libre et jusqu'a 3 photos dans les 10 jours suivant la fin du service
  2. Le prestataire peut egalement noter le client (systeme bidirectionnel) dans la meme fenetre de 10 jours
  3. Les avis des deux parties ne sont visibles publiquement que lorsque les deux ont soumis leur evaluation (publication simultanee)
  4. Un avis contenant des informations de contact (email, telephone) ou du contenu defamatoire est automatiquement signale et masque en attente de moderation
  5. La note moyenne sur le profil prestataire se met a jour immediatement apres publication des avis et est utilisee pour trier les resultats de recherche

**Plans**: 7 plans

Plans:
- [x] 08-01-PLAN.md — Backend: Zod schemas, review CRUD actions, auto-moderation utility, photo upload API, i18n keys
- [x] 08-02-PLAN.md — Client review form: StarRating, CriteriaRatingGroup, ReviewPhotoUploader, ReviewForm, client review page
- [x] 08-03-PLAN.md — Provider review form: provider review page, booking detail integration (bidirectional)
- [x] 08-04-PLAN.md — Simultaneous publication logic, 10-day window enforcement, cron expiration job
- [x] 08-05-PLAN.md — Review display: ReviewCard, ReviewsList, RatingBreakdown, CriteriaRadarChart components
- [x] 08-06-PLAN.md — Provider profile Avis tab integration, admin review moderation page, rating aggregation
- [x] 08-07-PLAN.md — Navigation wiring, booking list review indicators, end-to-end verification

---

### Phase 9: Messagerie & Notifications

**Sprint Goal**: Un client et un prestataire peuvent echanger des messages in-app pour coordonner une reservation, le systeme bloque automatiquement le partage d'informations de contact, des notifications en-app et email sont envoyees pour tous les evenements transactionnels, et l'utilisateur peut configurer ses preferences de notification.

**Depends on**: Phase 6 (bookings necessaires pour conversations)

**Requirements**: MSG-01, MSG-02, MSG-03, MSG-04, NOTF-01, NOTF-02, NOTF-03, NOTF-04

**Success Criteria** (what must be TRUE):
  1. Un client et un prestataire partageant une reservation peuvent s'envoyer des messages depuis leurs interfaces respectives, avec historique conserve 12 mois
  2. Si un utilisateur tente d'envoyer un numero de telephone ou email dans un message, le message est bloque ou le contenu sensible masque avec explication
  3. Le badge de notifications dans la navbar affiche le nombre de messages non lus et se met a jour sans rechargement de page
  4. Un utilisateur reoit des notifications in-app pour : nouvelle reservation, acceptation/rejet, nouveau message, nouvel avis, paiement recu, approbation profil
  5. Un utilisateur peut desactiver certains types de notifications (ex: emails marketing) et definir des heures de silence depuis ses preferences

**Plans**: 5 plans

Plans:
- [x] 09-01-PLAN.md — Messaging backend: Zod schemas, server actions CRUD, message moderation, i18n keys
- [x] 09-02-PLAN.md — Notification backend: server actions, central dispatcher, email templates (Resend), i18n keys
- [x] 09-03-PLAN.md — Messaging UI: conversation list, chat view with 5s polling, message bubbles, read receipts
- [x] 09-04-PLAN.md — Notification UI: bell dropdown, notifications page (Tout/Non lus), preferences form
- [x] 09-05-PLAN.md — Integration: wire notifications into all actions, nav links, Contacter button, E2E verification

---

### Phase 10: Panneau d'Administration

**Sprint Goal**: Un administrateur dispose d'un panneau de controle complet pour gerer les utilisateurs (approbation KYC, ban), les services (approbation/suspension, categories), les signalements avec SLA prioritises (critique <2h, important <24h, mineur <48h), un tableau de bord analytique avec KPIs exportables en CSV/PDF, et la gestion du contenu editorial de la plateforme.

**Depends on**: Phase 9

**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-05, ADMN-06, ADMN-07, ADMN-08

**Success Criteria** (what must be TRUE):
  1. Un admin peut voir la liste de tous les utilisateurs, changer leur statut (actif/banni), approuver ou rejeter un dossier KYC avec commentaire
  2. Un admin peut approuver ou suspendre un service, creer/modifier/supprimer des categories, et mettre en avant des annonces
  3. Les signalements (reports) s'affichent avec leur priorite (critique/important/mineur) et le temps restant selon le SLA, et l'admin peut les traiter et fermer
  4. Le tableau de bord analytics affiche en temps reel : utilisateurs actifs, nombre de transactions, revenus totaux, taux de conversion, taux de satisfaction, repartitions par categorie et par region
  5. Un admin peut exporter n'importe quel rapport (utilisateurs, transactions, revenus) en CSV et PDF depuis l'interface

**Plans**: 8 plans

Plans:
- [x] 10-01-PLAN.md — Schema additions (Report/FAQ/Banner/LegalPage), admin server actions (user/service/report CRUD), i18n keys
- [x] 10-02-PLAN.md — Dashboard homepage (real stats, KPI trend arrows) + user management (datatable, search/filter, ban/unban, detail)
- [x] 10-03-PLAN.md — Service management (datatable, approve/suspend, featured toggle) + category CRUD (tree view, add/edit/delete dialogs)
- [x] 10-04-PLAN.md — Reports/signalements (prioritized table, SLA countdown badges, detail Sheet, investigate/resolve/dismiss workflow)
- [x] 10-05-PLAN.md — Analytics dashboard (recharts: revenue line, bookings bar, categories pie, user growth area, KPI cards, date range, breakdowns)
- [x] 10-06-PLAN.md — Export CSV/PDF (generator utilities, API route, column selection, download/print)
- [x] 10-07-PLAN.md — Content management (FAQ editor with categories, legal page editor, banner manager with scheduling)
- [x] 10-08-PLAN.md — Commission oversight (12% tracking, provider payouts) + system notifications + sidebar update + breadcrumbs

---

### Phase 11: Demo Data, Polish & PFE Readiness

**Sprint Goal**: La plateforme est completement prete pour la soutenance PFE : donnees de demo realistes seedees (prestataires, clients, services, reservations, avis, transactions en TND), toutes les pages sont responsives mobile-first, les flows E2E critiques sont testes et documentes, les performances Lighthouse sont acceptables, et le rapport technique peut referencer l'implementation reelle.

**Depends on**: Phase 10

**Requirements**: UI-01, UI-02, UI-03, UI-04

**Note**: Rolled into v1.1 milestone and completed across Phases 13-15.

**Success Criteria** (what must be TRUE):
  1. La base de donnees contient des donnees de demo realistes : au moins 10 prestataires verifies dans differentes categories et villes tunisiennes, 20+ services, 30+ reservations a divers statuts, 50+ avis, historique de transactions en TND
  2. Toutes les pages cles sont entierement utilisables sur mobile (375px) et desktop (1280px) sans elements casses
  3. Le flow de demo complet (recherche → profil → reservation → paiement → avis) s'execute sans erreur sur les donnees seedees
  4. Les scores Lighthouse (performance, accessibilite, SEO) atteignent au minimum 75/100 sur les pages publiques
  5. Le switcher de langue est visible dans la navbar et le mecanisme i18n fonctionne — pret pour ajout traductions AR/EN

**Plans**: Rolled into v1.1 phases

Plans:
- [x] Seed data — Completed in Phase 15 (prisma/seed.ts: 920+ lines, realistic Tunisian data)
- [x] Language switcher — Completed in Phase 13 (LanguageSwitcher.tsx component in Navbar)
- [x] Loading skeletons — Completed in Phase 13 (loading.tsx for all route groups)
- [x] Error boundary — Completed in Phase 13 (error.tsx global error page)
- [x] Mobile layouts — Completed in Phase 13 (AdminBottomNav, AdminMobileHeader, MobileHeader)
- [x] Documentation — Completed in Phase 15 (README.md, DEPLOYMENT.md)

</details>

---

### ✅ v1.1 Polish & PFE Ready (Completed 2026-03-01)

#### Phase 12: Bug Fixes

**Goal**: Every known bug in the platform is resolved — i18n encoding, autocomplete icons, navigation links, favorites, dashboard stats, admin panel issues, dark mode contrast, auto-moderation, email locale links, and zone selection all work correctly.

**Depends on**: Phase 11 (v1.0 codebase)

**Requirements**: BUGF-01 through BUGF-14

**Success Criteria** (what must be TRUE):
  1. French accented characters display correctly on all pages
  2. The search autocomplete shows icon components beside each suggestion
  3. Footer links navigate to their respective pages without 404
  4. Client navbar dashboard link, favorites, email verification link all function correctly
  5. Admin analytics recharts render with real data, unsuspend toggle works, category filter works
  6. Dark mode has sufficient contrast across all pages

**Plans**: 5 plans

Plans:
- [x] 12-01-PLAN.md — French accents in i18n, autocomplete icons, footer links, navbar dashboard link
- [x] 12-02-PLAN.md — Favorites toggle, client dashboard stats, provider withdrawal math
- [x] 12-03-PLAN.md — Admin analytics charts, unsuspend button, category filter
- [x] 12-04-PLAN.md — Dark mode contrast, auto-moderation regex
- [x] 12-05-PLAN.md — Email verification locale prefix, zone selector state

---

#### Phase 13: UX Polish & Missing Pages

**Goal**: The homepage conveys platform trust with a reviews carousel and featured top providers, the client dashboard presents meaningful stats at a glance, and all public pages expected by a real marketplace (FAQ, CGU, Contact, Privacy Policy, How it works) exist and are accessible from the footer.

**Depends on**: Phase 12

**Requirements**: UX-01, UX-02, UX-03, PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05

**Success Criteria** (what must be TRUE):
  1. ✅ The homepage displays a scrollable carousel of recent verified client reviews with star ratings
  2. ✅ The homepage displays a "Top Prestataires" section showing the highest-rated verified providers
  3. ✅ The client dashboard shows stats cards: total bookings, total amount spent, reviews given, active bookings
  4. ✅ All five public pages (FAQ, Contact, CGU, Privacy Policy, How it works) are accessible via footer links

**Completed**: 2026-02-28 (commit `77c46d1`)

**What was built**:
- `TestimonialsCarousel.tsx` — Auto-scrolling carousel of 5-star reviews (3 at a time on desktop, pauses on hover)
- `TopProvidersGrid.tsx` — Top 6 providers by rating with avatar, stars, city, mission count, verified badge
- `CategoryGrid.tsx` — DB-driven category cards with Lucide icons and service counts
- Homepage rewritten as async server component with 3 parallel Prisma queries (categories take:10, reviews take:8, providers take:6)
- Client dashboard enhanced with real stats (total bookings, amount spent, reviews, active bookings)
- 5 public pages created: `/faq` (Accordion), `/contact`, `/legal/cgu`, `/legal/privacy`, `/how-it-works`
- Footer links updated to point to all public pages
- `LanguageSwitcher.tsx` — Globe dropdown in Navbar for locale switching
- `EmptyState.tsx` — Reusable empty state component
- Loading skeletons for all major route groups (client, provider, admin)
- `error.tsx` — Global error boundary
- `AdminBottomNav.tsx` + `AdminMobileHeader.tsx` — Mobile navigation for admin panel
- `MobileHeader.tsx` — Enhanced mobile header with notifications
- `accordion.tsx` — shadcn Accordion UI component for FAQ

---

#### Phase 14: Integration Wiring

**Goal**: The payment flow connects end-to-end through the UI, notifications fire for every transactional action, the Contacter button opens messaging, and the Konnect payment gateway is integrated.

**Depends on**: Phase 12

**Requirements**: INTG-01, INTG-02

**Success Criteria** (what must be TRUE):
  1. ✅ Booking wizard navigates to checkout, earnings sidebar link works, payment confirmation redirects correctly
  2. ✅ Notifications dispatched for: new booking, accepted/rejected, payment, review, KYC status
  3. ✅ "Contacter" button on provider profile/service page opens messaging interface

**Completed**: 2026-02-28 (commit `77c46d1`)

**What was built**:
- `ContactProviderButton.tsx` — Opens/creates conversation from service detail or provider profile page
- `GuestHeartButton.tsx` — Favorite button that redirects guests to login
- Notification wiring into booking accept/reject/cancel actions
- Service detail page integration with ContactProvider and GuestHeart buttons
- Provider profile page integration with contact button
- Admin messages stub page (`/admin/messages`)

---

#### Phase 15: PFE Readiness

**Goal**: The platform is fully demo-ready for the PFE soutenance — realistic Tunisian seed data, language switcher, deployment guide, and all performance optimizations.

**Depends on**: Phases 13 and 14

**Requirements**: PFE-01 through PFE-07

**Success Criteria** (what must be TRUE):
  1. ✅ Database contains realistic Tunisian demo data (10+ providers, 20+ services, 30+ bookings, 50+ reviews)
  2. ✅ All key pages functional at 375px mobile and 1280px desktop
  3. ✅ Language switcher visible in navbar
  4. ✅ Complete demo flow works end-to-end on seeded data
  5. ✅ DEPLOYMENT.md exists with setup guide, demo credentials, schema overview

**Completed**: 2026-03-01 (commits `63fc713`, `11d0c99`, `3fe8b2f`)

**What was built**:
- `prisma/seed.ts` — 920+ line seed script with realistic Tunisian data (gouvernorats, delegations, categories, providers across cities, services, bookings, reviews, payments)
- `README.md` — Project overview, tech stack, features, getting started guide
- `DEPLOYMENT.md` — Full deployment guide with environment variables, database setup, demo accounts
- Konnect payment gateway integration (`konnect-payment.service.ts`, webhook route `/api/webhooks/konnect`, payment-failed page)
- SMS service refactored into modular architecture (`lib/sms/index.ts`, `simulated.ts`, `twilio.ts`, `types.ts`)
- Phone validation updated for international format support

---

### 🚧 v1.2 Production Hardening & AI (In Progress)

#### Phase 16: Performance Optimization

**Goal**: Reduce page load times, eliminate unnecessary console logging, optimize polling intervals, and lazy-load heavy components.

**Depends on**: Phase 15

**Completed**: 2026-03-03 (commit `3fe8b2f` + uncommitted changes)

**What was built**:
- [x] Polling intervals unified to 15s across all components (ConversationList, ChatView, Navbar, BottomNav, ProviderSidebar, NotificationBell)
- [x] ~28 console.log statements removed across 12 files (kept console.error/warn)
- [x] Recharts lazy-loaded with `next/dynamic` + loading skeletons in admin analytics
- [x] Prisma logging set to error-only in all environments
- [x] Debug useEffect and onClick handlers removed from ReviewForm
- [x] Homepage refactored: single blocking `Promise.all` split into 3 independent async server components with Suspense boundaries and skeleton fallbacks
- [x] `TestimonialsCarousel` and `TopProvidersGrid` lazy-imported via `await import()` inside Suspense sections
- [x] `/api/search/categories` route: added `take: 50` limit (was unlimited)

---

#### Phase 17: Messaging Enhancements

**Goal**: Improve messaging UX with corrected display order, image sharing capability, and accessibility fixes.

**Depends on**: Phase 16

**Completed**: 2026-03-03 (uncommitted changes)

**What was built**:
- [x] Conversation list display order swapped: service name (bold) first, then client/provider name below (ConversationList.tsx + both chat page headers)
- [x] Image sending in chat: paperclip button, file picker (jpg/png/webp, max 5MB), upload to `/uploads/messages/` via `POST /api/messages/upload`
- [x] Image thumbnails in chat bubbles (max 200px width), clickable to open full-size modal dialog
- [x] Prisma schema: `imageUrl` nullable field added to Message model
- [x] `MessageInput.tsx` rewritten with image preview, upload progress, and combined text+image send
- [x] `MessageBubble.tsx` rewritten with image display, `VisuallyHidden` `DialogTitle` for accessibility
- [x] `ChatPageLayout.tsx` and `ChatView.tsx` updated to pass `imageUrl` through optimistic messages
- [x] `conversation-queries.ts` MessageItem type updated with `imageUrl`, query select updated
- [x] `message-actions.ts` sendMessageAction accepts optional `imageUrl`
- [x] French i18n keys added: `attachImage`, `removeImage`, `imageTooLarge`, `errors.uploadFailed`
- [x] New API route: `POST /api/messages/upload` — image upload for chat messages

---

#### Phase 18: UX Safety & Confirmation Dialogs

**Goal**: Add confirmation dialogs to destructive actions to prevent accidental operations.

**Depends on**: Phase 16

**Completed**: 2026-03-03 (uncommitted changes)

**What was built**:
- [x] `ConfirmDialog` component created (`src/components/ui/confirm-dialog.tsx`) — reusable AlertDialog with title, description, confirm/cancel, variant support
- [x] Logout confirmation added to all 3 logout buttons: Navbar (client/provider), AdminSidebar, ProviderSidebar
- [x] All show "Voulez-vous vraiment vous déconnecter ?" with Annuler/Confirmer buttons, destructive variant
- [x] signOut() only called after user confirms

---

#### Phase 19: AI-Powered Features

**Goal**: Add intelligent AI capabilities to the platform — a multilingual chatbot assistant for user support, automated review sentiment analysis with admin analytics, AI-generated review summaries on provider profiles, and a smart provider recommendation engine.

**Depends on**: Phase 16

**Completed**: 2026-03-04 (uncommitted changes)

**What was built**:

**Chatbot System (4 files)**:
- [x] `src/lib/ai/chatbot.ts` — Groq API integration (llama-3.3-70b-versatile model), bilingual system prompt (FR/AR/Tunisian dialect), max 300 tokens, temperature 0.7, graceful fallback
- [x] `src/app/api/chat/route.ts` — `POST /api/chat` endpoint with rate limiting (20 msg/min per session), history sanitization (max 20 messages), session ID tracking
- [x] `src/components/ChatbotWidget.tsx` — Floating bottom-right chat UI (350x500px desktop, fullscreen mobile), typing indicator, bilingual welcome message, ARIA accessibility, auto-scroll
- [x] `src/components/ChatbotLoader.tsx` — `next/dynamic` SSR-disabled loader for client-only rendering
- [x] `src/app/[locale]/layout.tsx` — ChatbotLoader integrated into root layout (appears on all pages)

**Review Sentiment Analysis (2 files)**:
- [x] `src/lib/ai/review-analyzer.ts` — Keyword-based sentiment classifier (no API calls): POSITIVE/NEUTRAL/NEGATIVE scoring (60% star weight + 40% keyword weight), threat detection (FR+AR) → CRITICAL, insult detection (41 FR + 22 AR keywords) → IMPORTANT, contact info detection → MINOR
- [x] `src/lib/ai/review-summary.ts` — Groq-powered 2-3 sentence review summaries, cached on `Provider.reviewSummary` field, regenerates on new review publication, requires min 3 reviews, max 200 tokens
- [x] `src/features/review/actions/review-actions.ts` — `submitReviewAction` now calls `analyzeReview()` to auto-set sentiment field and auto-create reports for flagged content
- [x] `src/features/review/lib/publication.ts` — `regenerateProviderSummary()` called after review publication

**Provider Recommendations (1 file)**:
- [x] `src/lib/ai/recommendation.ts` — Scoring algorithm (no API calls): same category +30, same city +25, KYC verified +20, rating ≥4.5 +15, 10+ missions +10, has text reviews +5, already-booked penalty -5. Returns top 6 recommended provider IDs

**Admin Sentiment Analytics (2 files)**:
- [x] `src/features/admin/actions/analytics-queries.ts` — `getSentimentStatsAction()` added: positive/neutral/negative counts, percentage, period-over-period trend comparison
- [x] `src/features/admin/components/SentimentStatsCard.tsx` — Dashboard card with positive percentage, trend indicator (TrendingUp/Down), color-coded breakdown bar (green/yellow/red), legend with counts
- [x] `src/features/admin/components/AnalyticsPageClient.tsx` — SentimentStatsCard integrated into analytics dashboard
- [x] `src/app/[locale]/(admin)/admin/analytics/page.tsx` — Fetches sentiment stats in parallel with other analytics

**Provider Profile AI Integration (2 files)**:
- [x] `src/features/review/components/PositiveReviewsBadge.tsx` — Server component showing "XX% avis positifs" badge, color-coded (green ≥80%, yellow ≥60%, red <60%)
- [x] `src/app/[locale]/(client)/providers/[providerId]/page.tsx` — AI review summary block ("Resume des avis — Genere par IA") + PositiveReviewsBadge on Avis tab

**Prisma Schema**:
- [x] `Review.sentiment` — nullable String field ("POSITIVE" | "NEUTRAL" | "NEGATIVE")
- [x] `Provider.reviewSummary` — nullable Text field for cached AI summary

**Environment**:
- [x] `GROQ_API_KEY` added to `src/env.ts` (optional) and `.env.example`

**i18n**:
- [x] `chatbot.*` keys added to `fr.json` (title, welcome, placeholder, send, close, error)

---

#### Phase 20: Contact & Content Enhancements

**Goal**: Make the contact page functional with a real form that persists to database, add search functionality to the FAQ page, and flesh out the CGU/terms of service page with comprehensive legal content.

**Depends on**: Phase 13 (pages must exist)

**Completed**: 2026-03-04 (uncommitted changes)

**What was built**:

**Contact Form System (3 files)**:
- [x] `src/app/[locale]/(client)/contact/contact-action.ts` — Server action: validates name/email/subject/message (min 10 chars), saves to `ContactMessage` Prisma model, returns French success/error messages
- [x] `src/app/[locale]/(client)/contact/contact-form.tsx` — Client component: 4-field form (name, email, subject, textarea), field-level validation, submit loading state, success/error feedback, auto-reset on success
- [x] `src/app/[locale]/(client)/contact/page.tsx` — Rewritten: 2-col layout with contact form + sidebar cards (email, phone, address, hours with icons)

**Searchable FAQ (2 files)**:
- [x] `src/app/[locale]/(client)/faq/faq-client.tsx` — Client component: 3 sections (General/Clients/Prestataires, 18+ FAQs), real-time search filtering across questions and answers, result count, "Contact us" fallback link, Accordion UI
- [x] `src/app/[locale]/(client)/faq/page.tsx` — Rewritten as server wrapper delegating to FaqClient component

**CGU/Terms of Service (1 file)**:
- [x] `src/app/[locale]/(client)/legal/cgu/page.tsx` — Full legal document with 10 sections: platform overview, booking conditions, 12% commission structure, cancellation policy (24h cutoff), KYC requirements, data protection (Tunisian law), 10-day review window, account suspension rules

**Prisma Schema**:
- [x] `ContactMessage` model added — id, name, email, subject, message (Text), isRead, createdAt

---

#### Phase 21: Auth Hardening & Admin Improvements

**Goal**: Strengthen authentication flows with proper verification timestamps and improved OAuth, and enhance admin management interfaces with better action controls and AI-flag indicators.

**Depends on**: Phase 16

**Completed**: 2026-03-04 (uncommitted changes)

**What was built**:

**Auth Verification Enhancements (4 files)**:
- [x] `src/features/auth/actions/verify-email.ts` — Enhanced: atomic transaction (marks email verified + token used), specific error codes (ALREADY_VERIFIED, TOKEN_EXPIRED, TOKEN_INVALID), sets `emailVerifiedAt` timestamp
- [x] `src/features/auth/actions/verify-otp.ts` — Enhanced: 5-attempt limit with counter increment, expiration check, sets `phoneVerifiedAt` timestamp on success
- [x] `src/features/auth/components/OAuthButtons.tsx` — Enhanced: Google login button with icon, loading state, "Or" separator, redirects to `/auth/oauth-role`
- [x] `src/app/[locale]/(client)/auth/login/page.tsx` — OAuth buttons integrated above email/password form
- [x] `src/app/[locale]/(client)/auth/verify-email/page.tsx` — Multi-state handling: no token, valid token, already verified, expired token — with visual icons (CheckCircle2, XCircle)

**Admin Management Improvements (4 files)**:
- [x] `src/features/admin/components/UserActionsDropdown.tsx` — Enhanced: ban with required reason (min 5 chars), unban, activate/deactivate, delete, admin protection
- [x] `src/features/admin/components/UserDetailActions.tsx` — Same actions as dropdown but card-based layout for detail page, admin notes on confirmation dialogs
- [x] `src/features/admin/components/ServiceActionsDropdown.tsx` — Enhanced: approve (PENDING_APPROVAL → ACTIVE), suspend with reason, unsuspend, toggle featured, view link
- [x] `src/features/admin/components/ReportDetailSheet.tsx` — AI-flagged review badges showing flagging reasons, status timeline, SLA deadline tracking

**Booking & Payment Hardening (2 files)**:
- [x] `src/features/booking/actions/manage-bookings.ts` — Enhanced: availability checks (day/time/blocked dates/conflicts), real-time notifications on accept/reject/start/complete, atomic payment release with 12% commission
- [x] `src/features/payment/actions/payment-actions.ts` — Enhanced: hold-and-release pattern, commission calculation, provider notification on payment received

**Prisma Schema**:
- [x] `User.emailVerifiedAt` — nullable DateTime field
- [x] `User.phoneVerifiedAt` — nullable DateTime field

---

## Progress

**Execution Order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Infrastructure | v1.0 | 7/7 | Complete | 2026-02-22 |
| 2. Authentification | v1.0 | 7/7 | Complete | 2026-02-22 |
| 3. Verification KYC | v1.0 | 5/5 | Complete | 2026-02-23 |
| 4. Profil Prestataire & Services | v1.0 | 5/5 | Complete | 2026-02-23 |
| 5. Recherche & Decouverte | v1.0 | 5/5 | Complete | 2026-02-24 |
| 6. Systeme de Reservation | v1.0 | 7/7 | Complete | 2026-02-24 |
| 7. Paiement Simule | v1.0 | 5/5 | Complete | 2026-02-25 |
| 8. Avis & Evaluations | v1.0 | 7/7 | Complete | 2026-02-25 |
| 9. Messagerie & Notifications | v1.0 | 5/5 | Complete | 2026-02-26 |
| 10. Panneau d'Administration | v1.0 | 8/8 | Complete | 2026-02-26 |
| 11. Demo Data, Polish & PFE Readiness | v1.0 | Rolled into v1.1 | Complete | 2026-03-01 |
| 12. Bug Fixes | v1.1 | 5/5 | Complete | 2026-02-27 |
| 13. UX Polish & Missing Pages | v1.1 | Done | Complete | 2026-02-28 |
| 14. Integration Wiring | v1.1 | Done | Complete | 2026-02-28 |
| 15. PFE Readiness | v1.1 | Done | Complete | 2026-03-01 |
| 16. Performance Optimization | v1.2 | Done | Complete | 2026-03-03 |
| 17. Messaging Enhancements | v1.2 | Done | Complete | 2026-03-03 |
| 18. UX Safety & Confirmation Dialogs | v1.2 | Done | Complete | 2026-03-03 |
| 19. AI-Powered Features | v1.2 | Done | Complete | 2026-03-04 |
| 20. Contact & Content Enhancements | v1.2 | Done | Complete | 2026-03-04 |
| 21. Auth Hardening & Admin Improvements | v1.2 | Done | Complete | 2026-03-04 |
