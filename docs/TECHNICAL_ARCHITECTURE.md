# Architecture Technique — Tawa Services

## 1. Vue d'ensemble du Projet

**Tawa Services** est une plateforme de mise en relation entre clients et prestataires de services en Tunisie. Le projet est developpe avec une architecture moderne basee sur :

| Technologie | Version | Role |
|-------------|---------|------|
| Next.js | 15 (App Router) | Framework full-stack React |
| TypeScript | 5.x (strict) | Typage statique |
| PostgreSQL | 15+ | Base de donnees relationnelle |
| Prisma | 7.x | ORM avec migrations |
| NextAuth.js | 4.x | Authentification (JWT) |
| Tailwind CSS | 4.x | Styles utilitaires |
| shadcn/ui | - | Composants UI (Radix) |
| next-intl | - | Internationalisation (FR/AR/EN) |
| Zod | 3.x | Validation de schemas |
| Recharts | - | Graphiques admin analytics |
| Groq API | llama-3.3-70b | Chatbot IA + resumes d'avis |

---

## 2. Structure du Projet

```
tawa-services/
├── prisma/
│   ├── schema.prisma           # 30 modeles, 16 enums
│   └── seed.ts                 # 920+ lignes de donnees demo
├── public/
│   ├── uploads/                # Fichiers uploades (KYC, photos, messages)
│   ├── logo.svg / logo-white.svg
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── [locale]/           # Routes internationalises
│   │   │   ├── (client)/       # Route group client
│   │   │   │   ├── page.tsx            # Homepage
│   │   │   │   ├── auth/               # Login, register, verify, 2FA
│   │   │   │   ├── bookings/           # Mes reservations
│   │   │   │   ├── contact/            # Contact form
│   │   │   │   ├── faq/                # FAQ searchable
│   │   │   │   ├── legal/              # CGU, privacy
│   │   │   │   ├── messages/           # Messagerie client
│   │   │   │   ├── notifications/      # Centre de notifications
│   │   │   │   ├── providers/          # Profils prestataires publics
│   │   │   │   ├── services/           # Detail service, recherche
│   │   │   │   └── settings/           # Parametres, securite
│   │   │   ├── (provider)/     # Route group prestataire
│   │   │   │   └── provider/
│   │   │   │       ├── dashboard/      # Tableau de bord
│   │   │   │       ├── bookings/       # Gestion reservations
│   │   │   │       ├── services/       # Gestion services
│   │   │   │       ├── earnings/       # Gains et paiements
│   │   │   │       ├── messages/       # Messagerie provider
│   │   │   │       ├── profile/        # Edition profil
│   │   │   │       └── kyc/            # Verification KYC
│   │   │   ├── (admin)/        # Route group admin
│   │   │   │   └── admin/
│   │   │   │       ├── page.tsx        # Dashboard admin
│   │   │   │       ├── analytics/      # Graphiques et KPIs
│   │   │   │       ├── users/          # Gestion utilisateurs
│   │   │   │       ├── services/       # Gestion services
│   │   │   │       ├── reports/        # Signalements
│   │   │   │       ├── reviews/        # Moderation avis
│   │   │   │       ├── kyc/            # Revue KYC
│   │   │   │       ├── commission/     # Suivi commissions
│   │   │   │       └── content/        # FAQ, legal, banners
│   │   │   └── layout.tsx      # Layout racine avec ChatbotLoader
│   │   ├── api/                # Routes API REST
│   │   │   ├── auth/[...nextauth]/  # NextAuth handler
│   │   │   ├── chat/                # Chatbot IA
│   │   │   ├── cron/                # Jobs planifies
│   │   │   ├── kyc/upload/          # Upload KYC
│   │   │   ├── messages/upload/     # Upload images chat
│   │   │   ├── provider/            # Availability, photo, portfolio
│   │   │   ├── review/photos/       # Upload photos avis
│   │   │   ├── search/              # Autocomplete, categories, services
│   │   │   ├── service/photos/      # Upload photos service
│   │   │   ├── admin/export/        # Export CSV/PDF
│   │   │   └── webhooks/konnect/    # Webhook paiement
│   │   ├── globals.css         # Styles globaux + tokens design
│   │   ├── layout.tsx          # Layout HTML racine
│   │   └── sitemap.ts          # Sitemap dynamique
│   ├── components/
│   │   ├── layout/             # Navbar, Footer, Sidebars, BottomNav
│   │   ├── shared/             # LanguageSwitcher, Logo, EmptyState
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── ChatbotWidget.tsx   # Widget chatbot IA
│   │   └── ChatbotLoader.tsx   # Chargement dynamique chatbot
│   ├── features/               # Modules metier
│   │   ├── admin/              # Actions + composants admin
│   │   ├── auth/               # Actions + composants auth
│   │   ├── booking/            # Actions + composants reservation
│   │   ├── favorite/           # Toggle favoris
│   │   ├── home/               # Composants homepage
│   │   ├── kyc/                # Actions KYC
│   │   ├── messaging/          # Actions + composants messagerie
│   │   ├── notification/       # Actions + composants notifications
│   │   ├── payment/            # Actions paiement + factures
│   │   ├── provider/           # Actions + composants prestataire
│   │   ├── review/             # Actions + composants avis
│   │   └── search/             # Composants recherche
│   ├── hooks/                  # Custom React hooks
│   ├── i18n/                   # Configuration next-intl
│   ├── lib/
│   │   ├── ai/                 # Modules IA (chatbot, analyzer, recommendation)
│   │   ├── auth.ts             # Configuration NextAuth
│   │   ├── db.ts               # Singleton Prisma
│   │   ├── email.ts            # Service email (Resend)
│   │   ├── rate-limit.ts       # Rate limiter
│   │   └── sms/                # Service SMS (Twilio + simule)
│   └── messages/               # Fichiers traduction (fr.json, ar.json, en.json)
├── .env.example                # Variables d'environnement
├── next.config.ts              # Configuration Next.js
├── tailwind.config.ts          # Configuration Tailwind
└── package.json                # Dependencies et scripts
```

---

## 3. Flux d'Authentification

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUX D'INSCRIPTION                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Utilisateur                                                     │
│      │                                                           │
│      ▼                                                           │
│  [Page Register]                                                 │
│      │                                                           │
│      ├── Etape 1: Choix du role (CLIENT / PROVIDER)             │
│      ├── Etape 2: Infos personnelles (nom, email, tel tunisien) │
│      ├── Etape 3: Mot de passe + acceptation CGU               │
│      └── Etape 4: Verification OTP telephone                    │
│              │                                                   │
│              ▼                                                   │
│      [registerAction] ─── bcrypt hash ─── Prisma create User    │
│              │                                                   │
│              ▼                                                   │
│      [sendVerificationEmailAction] ─── Resend API               │
│              │                                                   │
│              ▼                                                   │
│      Email avec lien /verify-email?token=xxx                    │
│              │                                                   │
│              ▼                                                   │
│      [verifyEmailAction] ─── Marque emailVerified=true          │
│              │                  + emailVerifiedAt=now()          │
│              ▼                                                   │
│      Compte actif, redirection login                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     FLUX DE CONNEXION                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Utilisateur                                                     │
│      │                                                           │
│      ├── [Email/Password] ──► CredentialsProvider               │
│      │       │                                                   │
│      │       ├── Verifie email verifie                          │
│      │       ├── Verifie compte non banni                       │
│      │       ├── Verifie tentatives (lockout 15min apres 5)     │
│      │       └── bcrypt.compare()                               │
│      │                                                           │
│      └── [Google OAuth] ──► GoogleProvider                      │
│              │                                                   │
│              └── Si premiere connexion → /auth/oauth-role        │
│                                                                  │
│      ▼                                                           │
│  Token JWT genere (session callback)                            │
│      │                                                           │
│      ├── Si 2FA active:                                         │
│      │       ├── needs2fa=true dans le token                    │
│      │       ├── Middleware redirige vers /auth/2fa             │
│      │       ├── Saisie code TOTP ou SMS OTP                   │
│      │       └── [verify2faLoginAction] → needs2fa=false        │
│      │                                                           │
│      └── Si 2FA inactive:                                       │
│              └── Redirection selon role                          │
│                  ├── CLIENT  → /                                │
│                  ├── PROVIDER → /provider/dashboard              │
│                  └── ADMIN    → /admin                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│              REINITIALISATION MOT DE PASSE                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [forgotPasswordAction] → Token 1h → Email Resend               │
│      │                                                           │
│      ▼                                                           │
│  /auth/reset-password?token=xxx                                 │
│      │                                                           │
│      ▼                                                           │
│  [resetPasswordAction] → bcrypt hash → mise a jour              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Flux de Paiement

```
┌──────────────────────────────────────────────────────────────────┐
│                   FLUX DE PAIEMENT                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. RESERVATION                                                  │
│     Client selectionne service → choisit creneau                │
│     [createBookingAction] → Booking (status: PENDING)           │
│                                                                  │
│  2. ACCEPTATION                                                  │
│     Prestataire accepte → [acceptBookingAction]                 │
│     Booking (status: ACCEPTED)                                  │
│                                                                  │
│  3. CHECKOUT                                                     │
│     Client va sur /bookings/[id] → bouton "Payer"              │
│     Page checkout affiche:                                      │
│     ┌─────────────────────────────────┐                         │
│     │  Methode de paiement:           │                         │
│     │  ○ Carte bancaire               │                         │
│     │  ○ D17 (mobile money)           │                         │
│     │  ○ Flouci                       │                         │
│     │  ○ Cash (especes)               │                         │
│     │                                 │                         │
│     │  Montant:     150.000 TND       │                         │
│     │  Commission:   18.000 TND (12%) │                         │
│     │  Prestataire: 132.000 TND       │                         │
│     └─────────────────────────────────┘                         │
│                                                                  │
│  4. PAIEMENT (ESCROW)                                           │
│     [processPaymentAction] →                                    │
│       ├── Simulated: Payment (HELD) immediat                    │
│       └── Konnect:   Redirect → Konnect → Webhook → HELD       │
│                                                                  │
│  5. EXECUTION DU SERVICE                                        │
│     Prestataire marque "Demarre"  → IN_PROGRESS                │
│     Prestataire marque "Termine"  → COMPLETED                  │
│                                                                  │
│  6. LIBERATION (RELEASE)                                        │
│     [completeBookingAction] →                                   │
│       ├── Payment: HELD → RELEASED                              │
│       ├── Commission 12% calculee                               │
│       ├── providerEarning = amount * 0.88                       │
│       └── Notification au prestataire                           │
│                                                                  │
│  7. ANNULATION (optionnel)                                      │
│     [cancelBookingAction] →                                     │
│       ├── > 48h avant: remboursement 100%                       │
│       ├── 24-48h:      remboursement partiel                    │
│       └── < 24h:       aucun remboursement                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Flux de Messagerie

```
┌──────────────────────────────────────────────────────────────────┐
│                   FLUX DE MESSAGERIE                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CREATION DE CONVERSATION                                    │
│     Client clique "Contacter" sur profil/service                │
│     [getOrCreateConversationAction] →                           │
│       ├── Cherche conversation existante pour le booking        │
│       └── Si absente: cree Conversation liee au Booking         │
│                                                                  │
│  2. ENVOI DE MESSAGE                                            │
│     [sendMessageAction] →                                       │
│       ├── Moderation automatique du contenu                     │
│       │   ├── Detection tel: +216, 00216, 8 chiffres            │
│       │   ├── Detection email: regex @                          │
│       │   └── Si detecte: message bloque + flag                 │
│       ├── Sauvegarde Message en base                            │
│       ├── Envoi notification NEW_MESSAGE                        │
│       └── Support image optionnel (imageUrl)                    │
│                                                                  │
│  3. ENVOI D'IMAGE                                               │
│     [POST /api/messages/upload] →                               │
│       ├── Validation: jpg/png/webp, max 5MB                    │
│       ├── Stockage: /public/uploads/messages/                   │
│       └── Retour URL → incluse dans sendMessageAction           │
│                                                                  │
│  4. LECTURE                                                      │
│     [getConversationMessagesAction] →                           │
│       ├── Pagination par curseur                                │
│       └── Polling 15s (pas de WebSocket)                        │
│                                                                  │
│  5. MARQUAGE LU                                                 │
│     [markMessagesAsReadAction] →                                │
│       └── Tous les messages de l'autre participant → isRead=true│
│                                                                  │
│  6. AFFICHAGE                                                    │
│     ├── ConversationList: liste triee par dernier message       │
│     ├── ChatView: bulles de message + images                    │
│     ├── MessageBubble: texte + miniature image cliquable        │
│     └── MessageInput: champ texte + bouton paperclip            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Fonctionnalites IA

### 6.1 Chatbot (Groq API)

```
┌─────────────────────────────────────────────────┐
│  ChatbotWidget (flottant bas-droite)            │
│  ├── POST /api/chat                             │
│  │   ├── Rate limit: 20 msg/min par session     │
│  │   ├── Historique: max 20 messages            │
│  │   └── Groq: llama-3.3-70b-versatile          │
│  │       ├── System prompt bilingue (FR/AR)     │
│  │       ├── Max tokens: 300                    │
│  │       ├── Temperature: 0.7                   │
│  │       └── Fallback si API indisponible       │
│  └── UI: 350x500px desktop, plein ecran mobile  │
└─────────────────────────────────────────────────┘
```

### 6.2 Analyse de Sentiment (locale, sans API)

```
Soumission avis → analyzeReview() →
  ├── Score = 60% poids etoiles + 40% poids mots-cles
  ├── Resultat: POSITIVE / NEUTRAL / NEGATIVE
  ├── Detection menaces (FR+AR) → CRITICAL → Report auto
  ├── Detection insultes (63 mots) → IMPORTANT → Report auto
  └── Detection contact (tel/email) → MINOR → Report auto
```

### 6.3 Resume d'Avis (Groq API)

```
Publication d'avis → regenerateProviderSummary() →
  ├── Recupere les 20 derniers avis publies (min 3 requis)
  ├── Groq: resume en 2-3 phrases (max 200 tokens)
  └── Cache sur Provider.reviewSummary
```

### 6.4 Recommandations (locale, sans API)

```
getRecommendations(userId) →
  ├── Meme categorie: +30 points
  ├── Meme ville: +25 points
  ├── KYC verifie: +20 points
  ├── Note >= 4.5: +15 points
  ├── 10+ missions: +10 points
  ├── Avis textuels: +5 points
  ├── Deja reserve: -5 points
  └── Retourne top 6 providers
```

---

## 7. Schema de Base de Donnees

30 modeles Prisma organises en 8 domaines :

| Domaine | Modeles | Nombre |
|---------|---------|--------|
| Localisation | Gouvernorat, Delegation | 2 |
| Utilisateurs & Auth | User, Account, Session, VerificationToken, EmailVerification, PasswordReset, PhoneOtp, LoginRecord | 8 |
| Profil Prestataire | Provider, ProviderDelegation, TrustBadge, Availability, BlockedDate, Certification, PortfolioPhoto | 7 |
| KYC | KYCDocument | 1 |
| Categories & Services | Category, Service, Favorite | 3 |
| Reservations | Booking, Quote | 2 |
| Paiements | Payment, WithdrawalRequest | 2 |
| Avis | Review | 1 |
| Messagerie | Conversation, Message | 2 |
| Notifications | Notification, NotificationPreference | 2 |
| Administration | Report, Faq, LegalPage, ContactMessage, Banner | 5 |

Voir `docs/DATABASE_SCHEMA.md` pour le detail complet.

---

## 8. Routes API

### Routes REST (17 endpoints)

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET/POST | `/api/auth/[...nextauth]` | Handler NextAuth (login/logout/session) | - |
| POST | `/api/chat` | Chatbot IA | Non (rate limit session) |
| GET | `/api/cron/expire-quotes` | Cron: expirer devis >48h | CRON_SECRET |
| GET | `/api/cron/reviews` | Cron: fermer fenetres avis | CRON_SECRET |
| POST | `/api/kyc/upload` | Upload documents KYC | PROVIDER |
| POST | `/api/messages/upload` | Upload images messagerie | Authentifie |
| GET | `/api/provider/availability` | Disponibilites prestataire | Public |
| POST | `/api/provider/certification` | Upload certifications | PROVIDER |
| POST | `/api/provider/photo` | Upload photo profil | PROVIDER |
| POST/DELETE | `/api/provider/portfolio` | CRUD photos portfolio | PROVIDER |
| POST | `/api/review/photos` | Upload photos avis | Authentifie |
| GET | `/api/search/autocomplete` | Recherche autocomplete | Public |
| GET | `/api/search/categories` | Liste categories + counts | Public |
| GET | `/api/search/services` | Recherche services filtres | Public |
| POST/DELETE | `/api/service/photos` | CRUD photos service | PROVIDER |
| GET | `/api/admin/export` | Export CSV/PDF | ADMIN |
| POST | `/api/webhooks/konnect` | Webhook paiement Konnect | Webhook |

### Server Actions (88 actions)

Voir `docs/API_REFERENCE.md` pour la reference complete.

---

## 9. Securite

### 9.1 RBAC (Role-Based Access Control)

```
Middleware next-intl + auth combine:
  ├── Routes publiques: /, /auth/*, /providers, /services, /faq, /contact, /legal/*
  ├── Routes authentifiees: /dashboard, /settings, /bookings
  ├── Routes PROVIDER: /provider/* (PROVIDER ou ADMIN)
  ├── Routes ADMIN: /admin/* (ADMIN uniquement)
  └── Redirection 403 si role insuffisant
```

### 9.2 Protections

| Mesure | Implementation |
|--------|---------------|
| Hachage mot de passe | bcrypt (salt rounds par defaut) |
| Tokens JWT | NextAuth JWT strategy, secret 32+ chars |
| Verrouillage connexion | 5 tentatives → lockout 15 min |
| 2FA | TOTP (authenticator app) ou SMS OTP |
| Rate limiting | 20 msg/min chatbot, tentatives OTP limitees |
| Moderation contenu | Regex detection tel/email dans messages et avis |
| Validation entrees | Zod sur toutes les server actions |
| CRON protection | Secret partage pour endpoints cron |
| Upload securise | Validation MIME, taille max (5MB/10MB), stockage local |
| Soft delete | isDeleted flag au lieu de suppression physique |
| XSS | React escape par defaut, pas de dangerouslySetInnerHTML |
| En-tetes securite | Configuration Next.js (headers) |

### 9.3 KYC (Know Your Customer)

```
Prestataire → Upload (CIN recto/verso, selfie, justificatif domicile)
  → Statut PENDING → Admin review → APPROVED/REJECTED
  → Si APPROVED: badge IDENTITY_VERIFIED + acces creation service
  → Si REJECTED: motif fourni, nouvelle soumission possible
```

---

## 10. Internationalisation (i18n)

| Aspect | Detail |
|--------|--------|
| Framework | next-intl |
| Locales | `fr` (defaut), `ar`, `en` |
| Fichiers | `src/messages/fr.json` (~800 cles), `ar.json`, `en.json` |
| Routing | Prefixe locale dans URL: `/fr/...`, `/ar/...`, `/en/...` |
| RTL | Support prevu pour arabe |
| Switcher | `LanguageSwitcher.tsx` dans la Navbar (Globe dropdown) |
| Pattern | `t('namespace.key')` via `useTranslations()` |
| Middleware | `createMiddleware(routing)` gere la redirection automatique |

---

## 11. Integrations Tierces

| Service | Usage | Configuration |
|---------|-------|---------------|
| **Twilio** | Envoi SMS OTP (verification telephone) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| **Konnect** | Passerelle paiement tunisienne | `KONNECT_API_KEY`, `KONNECT_API_URL`, `KONNECT_WALLET_ID` |
| **Groq** | LLM pour chatbot + resumes d'avis | `GROQ_API_KEY` (modele llama-3.3-70b-versatile) |
| **Google OAuth** | Connexion sociale | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Resend** | Emails transactionnels (verification, reset) | `RESEND_API_KEY` |

### Architecture SMS modulaire

```
src/lib/sms/
├── index.ts       # Factory: retourne Twilio ou Simulated selon env
├── types.ts       # Interface ISmsService
├── twilio.ts      # Implementation Twilio
└── simulated.ts   # Implementation simulee (console.log en dev)
```

### Architecture Paiement modulaire

```
src/lib/payment/
├── payment.service.ts          # Interface IPaymentService
├── simulated-payment.service.ts # Implementation simulee
└── konnect-payment.service.ts   # Implementation Konnect
```

---

## 12. Diagramme de Composants

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐  │
│  │  Pages Client │  │ Pages Provider│  │   Pages Admin        │  │
│  │  (React SSR)  │  │ (React SSR)   │  │   (React SSR)        │  │
│  └──────┬───────┘  └──────┬────────┘  └──────────┬───────────┘  │
│         │                  │                      │              │
│  ┌──────▼──────────────────▼──────────────────────▼───────────┐  │
│  │              Composants Partages (shadcn/ui)               │  │
│  │  Navbar, Footer, BottomNav, Sidebars, ChatbotWidget       │  │
│  └──────────────────────────┬─────────────────────────────────┘  │
│                             │                                    │
├─────────────────────────────┼────────────────────────────────────┤
│                         BACKEND                                  │
│  ┌──────────────────────────▼─────────────────────────────────┐  │
│  │               Server Actions (88 actions)                   │  │
│  │  auth/ booking/ payment/ review/ messaging/ admin/ kyc/    │  │
│  └──────────────────────────┬─────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼─────────────────────────────────┐  │
│  │                  API Routes (17 endpoints)                  │  │
│  │  /api/auth  /api/chat  /api/search  /api/cron  /api/kyc   │  │
│  └──────────────────────────┬─────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼─────────────────────────────────┐  │
│  │                   Couche Services                          │  │
│  │  IPaymentService, ISmsService, EmailService, AI modules    │  │
│  └──────────────────────────┬─────────────────────────────────┘  │
│                             │                                    │
├─────────────────────────────┼────────────────────────────────────┤
│                        DONNEES                                   │
│  ┌──────────────────────────▼─────────────────────────────────┐  │
│  │                    Prisma ORM                              │  │
│  │              30 modeles, 16 enums                          │  │
│  └──────────────────────────┬─────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼─────────────────────────────────┐  │
│  │                  PostgreSQL 15+                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                    SERVICES EXTERNES                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐  │
│  │  Twilio  │ │ Konnect  │ │  Groq    │ │ Google │ │ Resend │  │
│  │  (SMS)   │ │(Paiement)│ │ (LLM IA) │ │(OAuth) │ │(Email) │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ └────────┘  │
└──────────────────────────────────────────────────────────────────┘
```
