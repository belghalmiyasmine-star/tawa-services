# Journal des Sprints — Tawa Services

## Resume

| Sprint | Dates | Phases | Objectif | Statut |
|--------|-------|--------|----------|--------|
| Sprint 1 | 22-24 Fev 2026 | 1-6 | Fondation → Reservation | Termine |
| Sprint 2 | 24-26 Fev 2026 | 7-10 | Paiement → Admin | Termine |
| Sprint 3 | 26-28 Fev 2026 | 11-14 | Bug fixes, Polish | Termine |
| Sprint 4 | 1-5 Mars 2026 | 15-21 | PFE, AI, Hardening | Termine |

---

## Sprint 1 : Fondation → Reservation (22-24 Fev 2026)

### Sprint Planning
- **Objectif du sprint** : Livrer la fondation technique complete et les flux principaux (inscription, KYC, services, recherche, reservation) pour permettre un premier parcours client-prestataire de bout en bout.
- **User Stories selectionnees** : 35 stories (US-101 a US-313) — 143 SP
- **Estimation Planning Poker** :
  - Infrastructure (Phase 1) : 8 SP — unanime
  - Auth (Phase 2) : 37 SP — consensus apres discussion 2FA (vote initial 5/8/8, final 8)
  - KYC (Phase 3) : 18 SP — unanime
  - Profils & Services (Phase 4) : 34 SP — consensus (vote portfolio 3/5, final 3)
  - Recherche (Phase 5) : 18 SP — unanime
  - Reservation (Phase 6) : 34 SP — consensus (vote annulation 3/5/8, final 5)

### Definition of Done (Sprint 1)
- [ ] Fonctionnalite implementee et testee manuellement
- [ ] Interface responsive (mobile, tablette, desktop)
- [ ] Donnees persistees dans PostgreSQL via Prisma
- [ ] Textes en francais via next-intl (fichier fr.json)
- [ ] Validation des entrees avec schemas Zod
- [ ] Server actions avec verification session et role (RBAC)
- [ ] Pas de regression sur les fonctionnalites existantes
- [ ] Code TypeScript sans erreurs de compilation

### Objectifs
- Mettre en place l'infrastructure technique complete
- Implementer l'authentification multi-methodes
- Creer le systeme KYC et profils prestataires
- Developper la recherche et les reservations

### Phases Livrees

#### Phase 1 : Foundation & Infrastructure (22 Fev)
- **7 plans executes** : Next.js 15 App Router, Prisma schema (30 modeles), next-intl (FR), shadcn/ui design system, 3 layouts (client/provider/admin), types TypeScript + Zod, CI pipeline
- **Decisions cles** : JWT strategy au lieu de sessions DB, Tailwind 4 avec tokens design Tawa (bleu primaire, orange accent), CUID pour tous les IDs, soft delete systematique
- **Fichiers principaux** : `schema.prisma`, `middleware.ts`, `Navbar.tsx`, `Footer.tsx`, `AdminSidebar.tsx`, `fr.json`

#### Phase 2 : Authentification (22 Fev)
- **7 plans executes** : NextAuth.js config, wizard inscription 3 etapes, login + OAuth, verification email (Resend), OTP SMS, RBAC middleware, 2FA TOTP/SMS
- **Decisions cles** : bcrypt pour hachage, lockout progressif (5 tentatives → 15 min), ISmsService abstraction pour dev/prod, 2FA optionnel
- **Fichiers principaux** : `auth.ts`, `register.ts`, `login/page.tsx`, `verify-email.ts`, `middleware.ts`

#### Phase 3 : Verification KYC (23 Fev)
- **5 plans executes** : API upload KYC, wizard 4 etapes (CIN, selfie, justificatif), admin review, trust badges, guard banner
- **Decisions cles** : Upload local (pas de S3 pour PFE), 4 types documents, badges automatiques apres approbation
- **Fichiers principaux** : `kyc/upload/route.ts`, `submit-kyc.ts`, `review-kyc.ts`, `TrustBadges.tsx`

#### Phase 4 : Profil Prestataire & Services (23 Fev)
- **5 plans executes** : CRUD profil, CRUD services (avec KYC guard), UI edition, page profil public
- **Decisions cles** : 80 chars max titre service, pricing FIXED ou SUR_DEVIS, max 5 photos travaux, disponibilite hebdomadaire
- **Fichiers principaux** : `manage-services.ts`, `update-profile.ts`, `providers/[providerId]/page.tsx`

#### Phase 5 : Recherche & Decouverte (24 Fev)
- **5 plans executes** : API recherche backend, page detail service, grille categories + filtres, autocomplete 300ms
- **Decisions cles** : Debounce 300ms autocomplete, pagination URL-based, filtres dans Sheet mobile, tri par note/prix/disponibilite
- **Fichiers principaux** : `search/services/route.ts`, `search/autocomplete/route.ts`, `CategoryGrid.tsx`

#### Phase 6 : Systeme de Reservation (24 Fev)
- **7 plans executes** : CRUD booking/quote, politique annulation, wizard 3 etapes, dashboard provider, pages client
- **Decisions cles** : Politique annulation en 3 paliers (>48h, 24-48h, <24h), devis expire 48h, cron job expiration
- **Fichiers principaux** : `manage-bookings.ts`, `manage-quotes.ts`, `cancel-booking.ts`, `BookingConfirmation.tsx`

### Metriques Sprint 1
- **Plans executes** : 36
- **Modeles Prisma crees** : 30
- **Pages UI creees** : ~30
- **Composants crees** : ~50

### Sprint Review
- **Fonctionnalites livrees** : 6 phases completes (Foundation, Auth, KYC, Profils/Services, Recherche, Reservation)
- **Demo** : Parcours complet visiteur → inscription → verification email → login → recherche → reservation
- **Retour parties prenantes** :
  - Inscription 3 etapes fluide, validation Zod bien integree
  - KYC wizard intuitif, feedback rapide sur upload
  - Recherche avec autocompletion reactive (300ms debounce)
  - Reservation en 3 etapes simple et claire
  - Demande : ameliorer le feedback visuel sur le dashboard prestataire

### Retrospective Sprint 1
- **Ce qui a bien marche** :
  - Architecture Next.js 15 App Router + Server Components = performance excellente
  - Prisma schema bien concu des le depart (30 modeles stables)
  - Zod + React Hook Form = validation robuste avec zero bug de formulaire
  - RBAC middleware centralise = securite homogene sur toutes les routes
- **Problemes rencontres** :
  - Tailwind 4 a necessite des ajustements par rapport a la v3 (syntaxe tokens)
  - next-intl configuration initiale complexe avec App Router
  - Upload KYC : gestion des fichiers locaux (pas de S3) limite la scalabilite
- **Ameliorations pour le prochain sprint** :
  - Ajouter des loading skeletons pour meilleur UX
  - Prevoir les notifications des le debut du flux
  - Documenter les decisions d'architecture au fil de l'eau

### Burndown Sprint 1
- **Stories planifiees** : 35 (143 SP)
- **Jour 1 (22 Fev)** : 14 stories completees (Phase 1 + Phase 2) — 45 SP
- **Jour 2 (23 Fev)** : 10 stories completees (Phase 3 + Phase 4) — 52 SP
- **Jour 3 (24 Fev)** : 11 stories completees (Phase 5 + Phase 6) — 46 SP
- **Stories completees** : 35/35 (100%)
- **Velocity realisee** : 143 SP / 3 jours = 48 SP/jour

---

## Sprint 2 : Paiement → Admin (24-26 Fev 2026)

### Sprint Planning
- **Objectif du sprint** : Completer les flux transactionnels (paiement escrow, avis, messagerie) et construire le panneau d'administration avec analytics pour permettre le pilotage de la plateforme.
- **User Stories selectionnees** : 26 stories (US-401 a US-709) — 120 SP
- **Estimation Planning Poker** :
  - Paiement (Phase 7) : 35 SP — discussion sur escrow (vote 5/8, final 5), consensus IPaymentService abstraction
  - Avis (Phase 8) : 33 SP — vote double-aveugle (3/5/8, final 5), consensus moderation auto
  - Messagerie (Phase 9) : 16 SP — unanime (polling vs WebSocket : decision polling pour simplicity PFE)
  - Admin (Phase 10) : 42 SP — vote analytics (5/8/13, final 8), consensus SLA signalements

### Definition of Done (Sprint 2)
- [ ] Fonctionnalite implementee et testee manuellement
- [ ] Interface responsive (mobile, tablette, desktop)
- [ ] Donnees persistees dans PostgreSQL via Prisma
- [ ] Textes en francais via next-intl
- [ ] Validation des entrees avec schemas Zod
- [ ] Notifications declenchees pour chaque evenement transactionnel
- [ ] Escrow : paiement retenu (HELD) puis libere (RELEASED) a la completion
- [ ] Server actions avec verification session, role et ownership

### Objectifs
- Implementer le systeme de paiement avec escrow
- Creer le systeme d'avis bidirectionnel
- Developper la messagerie in-app
- Construire le panneau d'administration complet

### Phases Livrees

#### Phase 7 : Paiement Simule (25 Fev)
- **5 plans executes** : IPaymentService abstraction, checkout (4 methodes), dashboard gains, factures HTML, wiring
- **Decisions cles** : Commission 12% plateforme, escrow simule (HELD → RELEASED), 4 methodes tunisiennes (carte, D17, Flouci, cash), IPaymentService pour future integration Konnect
- **Fichiers principaux** : `payment-actions.ts`, `earnings-queries.ts`, `invoice-actions.ts`, `CheckoutPage.tsx`

#### Phase 8 : Avis & Evaluations (25 Fev)
- **7 plans executes** : Backend avis, formulaire client (4 criteres), formulaire provider, publication simultanee, composants affichage, integration profil, moderation admin
- **Decisions cles** : Publication double-aveugle (les 2 parties doivent evaluer), fenetre 10 jours, 4 criteres (qualite, ponctualite, communication, proprete), auto-moderation regex
- **Fichiers principaux** : `review-actions.ts`, `ReviewForm.tsx`, `StarRating.tsx`, `ReviewCard.tsx`

#### Phase 9 : Messagerie & Notifications (26 Fev)
- **5 plans executes** : Backend messaging + moderation, backend notifications + dispatcher, UI messagerie (polling 5s), UI notifications (bell, page, preferences)
- **Decisions cles** : Polling au lieu de WebSocket (simplicite PFE), moderation bloque partage coordonnees, 13 types de notification, heures de silence configurables
- **Fichiers principaux** : `message-actions.ts`, `conversation-queries.ts`, `ChatView.tsx`, `NotificationBell.tsx`

#### Phase 10 : Panneau d'Administration (26 Fev)
- **8 plans executes** : Schema admin (Report/FAQ/Banner/LegalPage), dashboard stats, gestion users, gestion services, signalements SLA, analytics Recharts, export CSV/PDF, contenu editorial, commission
- **Decisions cles** : SLA priorise (CRITICAL <2h, IMPORTANT <24h, MINOR <48h), Recharts pour graphiques, export CSV/PDF avec selection colonnes, CRUD FAQ/legal/banners
- **Fichiers principaux** : `admin-queries.ts`, `analytics-queries.ts`, `AnalyticsPageClient.tsx`, `ReportsDataTable.tsx`

### Metriques Sprint 2
- **Plans executes** : 25
- **Pages admin creees** : 12
- **Composants admin** : ~20
- **Charts Recharts** : 5 (line, bar, pie, area, KPI cards)

### Sprint Review
- **Fonctionnalites livrees** : 4 phases completes (Paiement, Avis, Messagerie, Admin)
- **Demo** : Flux complet booking → checkout → paiement → completion → avis bidirectionnel → dashboard admin avec analytics
- **Retour parties prenantes** :
  - Escrow bien compris par les utilisateurs (feedback visuel HELD → RELEASED)
  - Double-aveugle des avis apprecie (evite les represailles)
  - Messagerie fonctionnelle mais polling 5s trop agressif (a optimiser)
  - Dashboard admin tres complet, graphiques Recharts clairs
  - Demande : ajouter export PDF, ameliorer moderation automatique

### Retrospective Sprint 2
- **Ce qui a bien marche** :
  - IPaymentService abstraction = passage simule → Konnect sans refactoring
  - Publication double-aveugle des avis = conception elegante
  - Recharts integration fluide pour analytics admin
  - SLA priorise pour signalements = workflow admin structure
- **Problemes rencontres** :
  - Polling 5s trop frequent, impacte les performances (a reduire a 15s)
  - Moderation regex initiale trop basique (faux negatifs sur coordonnees obfusquees)
  - Commission 12% hardcodee → a rendre configurable
  - Beaucoup de console.log restants en production
- **Ameliorations pour le prochain sprint** :
  - Optimiser le polling (15s minimum)
  - Ajouter loading skeletons partout
  - Nettoyer les console.log
  - Ajouter les pages publiques manquantes (FAQ, CGU, Contact)

### Burndown Sprint 2
- **Stories planifiees** : 26 (120 SP)
- **Jour 1 (25 Fev)** : 13 stories completees (Phase 7 + Phase 8) — 68 SP
- **Jour 2 (26 Fev)** : 13 stories completees (Phase 9 + Phase 10) — 52 SP
- **Stories completees** : 26/26 (100%)
- **Velocity realisee** : 120 SP / 2 jours = 60 SP/jour

---

## Sprint 3 : Bug Fixes, Polish & Pages Manquantes (26 Fev - 1 Mars 2026)

### Sprint Planning
- **Objectif du sprint** : Stabiliser la plateforme (correction de 14 bugs identifies), ajouter les pages publiques manquantes, integrer les flux de navigation et preparer la demo PFE avec des donnees tunisiennes realistes.
- **User Stories selectionnees** : 5 stories (US-507, PAGE-01 a PAGE-05) + 14 bugs (BUGF-01 a BUGF-14) — 12 SP + corrections
- **Estimation Planning Poker** :
  - Bug fixes (Phase 12) : 8 SP — estimation par bug (1-2 SP chacun)
  - UX Polish (Phase 13) : 5 SP — consensus
  - Wiring (Phase 14) : 3 SP — unanime
  - PFE Readiness (Phase 15) : 8 SP — vote seed data (3/5/8, final 5), Konnect integration (8)

### Definition of Done (Sprint 3)
- [ ] Tous les 14 bugs identifies corriges et verifies
- [ ] Pages publiques accessibles sans authentification
- [ ] Navigation complete de bout en bout sans dead-end
- [ ] Seed data realiste avec donnees tunisiennes
- [ ] 16 loading skeletons ajoutes sur les pages principales
- [ ] Integration Konnect testee avec webhook
- [ ] Error boundary global fonctionnel

### Objectifs
- Corriger tous les bugs identifies apres v1.0
- Ajouter les pages publiques manquantes
- Integrer les flux de navigation
- Preparer la demo PFE avec seed data

### Phases Livrees

#### Phase 12 : Bug Fixes (27 Fev)
- **5 plans executes** : Accents FR i18n, icones autocomplete, liens footer, favoris, stats dashboard, analytics Recharts, dark mode, auto-moderation, email verification URL, zone selector
- **14 bugs corriges** (BUGF-01 a BUGF-14)
- **Fichiers modifies** : ~25

#### Phase 13 : UX Polish & Missing Pages (28 Fev)
- **Composants crees** : TestimonialsCarousel, TopProvidersGrid, CategoryGrid, LanguageSwitcher, EmptyState, AdminBottomNav, MobileHeader
- **Pages creees** : FAQ (Accordion), Contact, CGU, Privacy, How it works
- **Homepage reecrite** : Server component async avec 3 queries Prisma paralleles
- **16 loading skeletons** ajoutes + error boundary global
- **Fichiers crees** : ~25

#### Phase 14 : Integration Wiring (28 Fev)
- **Composants** : ContactProviderButton, GuestHeartButton
- **Notifications** cablees dans toutes les actions transactionnelles
- **Navigation** : booking → checkout → confirmation complete

#### Phase 15 : PFE Readiness (1 Mars)
- **Seed data** : 920+ lignes, donnees tunisiennes realistes (gouvernorats, delegations, categories, 10+ prestataires, 20+ services, 30+ bookings, 50+ avis)
- **Documentation** : README.md, DEPLOYMENT.md
- **Konnect** : Integration passerelle paiement (263 lignes), webhook, page echec paiement
- **SMS** : Refactoring modulaire (index.ts, simulated.ts, twilio.ts, types.ts)

### Metriques Sprint 3
- **Bugs corriges** : 14
- **Pages publiques ajoutees** : 5
- **Composants nouveaux** : ~15
- **Loading skeletons** : 16

### Sprint Review
- **Fonctionnalites livrees** : 4 phases (Bug Fixes, UX Polish, Wiring, PFE Readiness)
- **Demo** : Navigation complete visiteur → client → prestataire avec donnees tunisiennes realistes, pages FAQ/Contact/CGU, integration Konnect
- **Retour parties prenantes** :
  - 14 bugs corriges = stabilite nettement amelioree
  - Pages publiques (FAQ, Contact, CGU) completent l'experience visiteur
  - Seed data 920+ lignes = demo convaincante avec noms/villes tunisiennes
  - Konnect integration fonctionnelle (263 lignes, webhook + page echec)
  - Loading skeletons = meilleure perception de performance
  - Demande : ajouter chatbot IA, ameliorer securite auth

### Retrospective Sprint 3
- **Ce qui a bien marche** :
  - Approche systematique des bugs (BUGF-01 a BUGF-14) = rien n'est oublie
  - Homepage reecrite en Server Components async = temps de chargement divise
  - Seed data realiste = demo PFE credible
  - Konnect integration propre avec IPaymentService (zero refactoring)
- **Problemes rencontres** :
  - Certains bugs interdependants (fix accents → casse autocomplete)
  - Konnect documentation API limitee, necessitant trial-and-error
  - SMS service modulaire a necessite refactoring (4 fichiers)
  - Manque de tests automatises = regression detection manuelle
- **Ameliorations pour le prochain sprint** :
  - Ajouter fonctionnalites IA (chatbot, sentiment, recommandations)
  - Durcir la securite (email verification atomique, OTP limites)
  - Optimiser performances (polling 15s, lazy-load charts)
  - Nettoyer console.log restants

### Burndown Sprint 3
- **Stories planifiees** : 5 stories + 14 bugs
- **Jour 1-2 (27-28 Fev)** : 14 bugs corriges + UX Polish + Wiring — Phase 12, 13, 14
- **Jour 3 (1 Mars)** : PFE Readiness (seed, docs, Konnect, SMS refactor) — Phase 15
- **Stories completees** : 5/5 + 14/14 bugs (100%)
- **Velocity realisee** : 12 SP + 14 bugs / 3 jours

---

## Sprint 4 : AI, Enhancements & Hardening (1-5 Mars 2026)

### Sprint Planning
- **Objectif du sprint** : Ajouter l'intelligence artificielle (chatbot, sentiment, recommandations), optimiser les performances, durcir la securite et ameliorer l'UX avec images chat et dialogues de confirmation.
- **User Stories selectionnees** : 8 stories (US-508, US-603, US-709, US-801 a US-804) — 39 SP
- **Estimation Planning Poker** :
  - Performance (Phase 16) : 3 SP — unanime
  - Messaging images (Phase 17) : 5 SP — consensus
  - UX Safety dialogs (Phase 18) : 2 SP — unanime
  - AI Features (Phase 19) : 21 SP — vote chatbot (5/8/13, final 8), sentiment (3/5, final 5)
  - Contact/Content (Phase 20) : 5 SP — unanime
  - Auth Hardening (Phase 21) : 5 SP — consensus (transaction atomique email verif)

### Definition of Done (Sprint 4)
- [ ] Fonctionnalite implementee et testee manuellement
- [ ] Interface responsive (mobile, tablette, desktop)
- [ ] Donnees persistees dans PostgreSQL via Prisma
- [ ] Internationalisation (FR, AR, EN) pour les nouvelles pages
- [ ] Validation Zod sur toutes les nouvelles entrees
- [ ] Rate limiting sur les API publiques (chat, login)
- [ ] Modules IA avec fallback en cas d'erreur API
- [ ] Zero console.log en production
- [ ] Security headers configures (CSP, HSTS, X-Frame-Options)

### Objectifs
- Optimiser les performances
- Ajouter les fonctionnalites IA (chatbot, sentiment, recommandations)
- Ameliorer la messagerie et la securite
- Durcir l'authentification et l'administration

### Phases Livrees

#### Phase 16 : Performance Optimization (3 Mars)
- Polling unifie 15s, ~28 console.log supprimes, Recharts lazy-loaded, Prisma log error-only
- Homepage refactoree : Suspense boundaries + async server components independants
- Categories API limitee a 50 resultats

#### Phase 17 : Messaging Enhancements (3 Mars)
- **Images dans le chat** : bouton paperclip, upload API, miniatures cliquables, modal plein ecran
- **Ordre d'affichage** : nom service en gras d'abord, puis nom utilisateur
- **Accessibilite** : DialogTitle masque visuellement pour conformite Radix
- **Prisma** : champ `imageUrl` sur Message

#### Phase 18 : UX Safety & Confirmation Dialogs (3 Mars)
- **ConfirmDialog** composant reutilisable (AlertDialog avec variantes)
- **Confirmation deconnexion** sur les 3 boutons logout (Navbar, AdminSidebar, ProviderSidebar)

#### Phase 19 : AI-Powered Features (4 Mars)
- **Chatbot Groq** : Widget flottant, API rate-limited, modele llama-3.3-70b, bilingue FR/AR
- **Analyse sentiment** : Classificateur par mots-cles (63 insultes FR+AR), auto-creation rapports
- **Resumes d'avis** : Groq genere 2-3 phrases, cache sur Provider.reviewSummary
- **Recommandations** : Algorithme scoring sans API (meme categorie +30, meme ville +25, etc.)
- **Analytics sentiment** : SentimentStatsCard dans dashboard admin
- **Badge avis positifs** : PositiveReviewsBadge sur profil prestataire
- **4 fichiers IA crees** : chatbot.ts, review-analyzer.ts, review-summary.ts, recommendation.ts

#### Phase 20 : Contact & Content Enhancements (4 Mars)
- **Contact** : Formulaire fonctionnel (4 champs) + server action + layout 2 colonnes
- **FAQ** : Recherche temps reel, 3 sections, 18+ questions
- **CGU** : Document legal complet (10 sections)
- **Prisma** : ContactMessage model

#### Phase 21 : Auth Hardening & Admin Improvements (4 Mars)
- **Email verification** : Transaction atomique, codes erreur specifiques, timestamps
- **OTP** : Limite 5 tentatives, timestamps verification
- **OAuth** : Google button avec icone, separateur "Ou"
- **Admin** : Ban avec motif, actions service ameliorees, badges IA sur rapports
- **Booking** : Verification disponibilite enrichie, notifications temps reel, liberation paiement atomique
- **Prisma** : `emailVerifiedAt`, `phoneVerifiedAt` sur User

### Metriques Sprint 4
- **Modules IA crees** : 4
- **Fichiers nouveaux** : 14
- **Fichiers modifies** : 29
- **Modeles Prisma ajoutes** : 1 (ContactMessage)
- **Champs Prisma ajoutes** : 5

### Sprint Review
- **Fonctionnalites livrees** : 6 phases (Performance, Messaging Images, UX Safety, AI Features, Contact/Content, Auth Hardening)
- **Demo** : Chatbot IA bilingue, analyse sentiment sur avis, recommandations personnalisees, images dans chat, dialogues confirmation, securite renforcee
- **Retour parties prenantes** :
  - Chatbot IA impressionnant (repond en FR, AR standard et dialecte tunisien)
  - Analyse sentiment efficace : 63 mots-cles FR+AR, auto-signalement
  - Recommandations pertinentes (algorithme scoring sans API externe)
  - Images dans chat = valeur ajoutee pour coordination travaux
  - Dialogues confirmation deconnexion = bonne pratique UX
  - Auth hardening : transactions atomiques, verification email robuste
  - Performance : polling 15s, lazy-load charts, ~28 console.log supprimes

### Retrospective Sprint 4
- **Ce qui a bien marche** :
  - Chatbot Groq (Llama 3.3 70B) = reponses pertinentes avec timeout 5s et fallback
  - Analyse sentiment keyword-based = zero cout API, 60% note + 40% mots-cles
  - Recommandations scoring local = rapide, pas de dependance externe
  - Auth hardening : transactions atomiques pour verification email/OTP
  - Security headers (CSP, HSTS, X-Frame-Options) = securite enterprise-grade
- **Problemes rencontres** :
  - Groq API parfois lent (>5s) → necessitant le fallback message
  - Analyse sentiment sans ML = precision limitee (mots-cles seulement)
  - Recommandations sans ML = scoring heuristique, pas d'apprentissage
  - Quelques edge cases de moderation messages non couverts
- **Ameliorations pour v2** :
  - Passer a un vrai modele ML pour l'analyse sentiment
  - WebSocket pour la messagerie temps reel
  - Push notifications mobile
  - Geolocalisation GPS avec Google Maps
  - Tests automatises (unit + integration + E2E)

### Burndown Sprint 4
- **Stories planifiees** : 8 (39 SP)
- **Jour 1 (3 Mars)** : 3 phases (Performance, Messaging, UX Safety) — 10 SP
- **Jour 2 (4 Mars)** : 3 phases (AI Features, Contact, Auth Hardening) — 29 SP
- **Stories completees** : 8/8 (100%)
- **Velocity realisee** : 39 SP / 2 jours = 20 SP/jour

---

## Resume Global des Sprints

| Sprint | Dates | Stories | SP | Velocity/jour | Completion |
|--------|-------|---------|-----|---------------|------------|
| Sprint 1 | 22-24 Fev | 35 | 143 | 48 SP/j | 100% |
| Sprint 2 | 24-26 Fev | 26 | 120 | 60 SP/j | 100% |
| Sprint 3 | 26 Fev-1 Mar | 5+14 bugs | 12+bugs | — | 100% |
| Sprint 4 | 1-5 Mar | 8 | 39 | 20 SP/j | 100% |
| **Total** | **12 jours** | **76 stories** | **314 SP** | **~26 SP/j** | **100%** |
