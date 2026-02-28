# Tawa Services

Plateforme de mise en relation entre clients et prestataires de services en Tunisie. Recherchez, reservez et payez des services professionnels en toute securite.

## Architecture

```
src/
├── app/[locale]/
│   ├── (client)/          # Pages client (recherche, reservation, paiement)
│   ├── (provider)/        # Espace prestataire (services, bookings, revenus)
│   └── (admin)/           # Panel admin (utilisateurs, KYC, analytics)
├── components/
│   ├── ui/                # Composants Shadcn/ui (Button, Card, Dialog, etc.)
│   ├── layout/            # Navbar, Footer, BottomNav, Sidebars
│   └── shared/            # EmptyState, ThemeProvider, KycBanner, etc.
├── features/
│   ├── auth/              # Inscription, connexion, 2FA, OAuth
│   ├── booking/           # Reservations, devis, annulations
│   ├── payment/           # Paiements, escrow, factures, retraits
│   ├── review/            # Avis double-aveugle, moderation
│   ├── messaging/         # Conversations client-prestataire
│   ├── notification/      # Notifications in-app temps reel
│   ├── provider/          # Profil, portfolio, certifications
│   ├── search/            # Recherche, filtres, autocomplete
│   ├── admin/             # Dashboard admin, analytics, export
│   └── kyc/               # Verification d'identite (CIN + selfie)
├── i18n/                  # Configuration next-intl (FR)
├── lib/                   # Prisma client, auth config, constantes
└── messages/              # Fichiers de traduction (fr.json)
```

## Stack technique

| Couche        | Technologie                              |
|---------------|------------------------------------------|
| Framework     | Next.js 15 (App Router, Server Components) |
| UI            | React 19, Tailwind CSS 3, Shadcn/ui      |
| Base de donnees | PostgreSQL + Prisma 7 (adapter-pg)     |
| Auth          | NextAuth 4 (credentials + OAuth Google)  |
| i18n          | next-intl (francais, extensible)         |
| Email         | Resend                                   |
| Charts        | Recharts                                 |
| Theme         | next-themes (clair/sombre)               |
| Icons         | Lucide React                             |

## Fonctionnalites

- **Recherche** : autocomplete, filtres (categorie, prix, zone, note), tri, pagination
- **10 categories** : Plomberie, Electricite, Menage, Cours, Peinture, Demenagement, Jardinage, Climatisation, Serrurerie, Informatique
- **Reservation** : wizard multi-etapes, calendrier de disponibilite, creneaux horaires
- **Devis** : demande sur devis pour services non tarifes, reponse prestataire, acceptation
- **Paiement** : carte, D17, Flouci, especes — escrow securise, remboursement automatique
- **Commission** : 12% preleve par la plateforme, suivi admin avec export CSV
- **Avis** : systeme double-aveugle (client + prestataire), radar des criteres, moderation
- **Messagerie** : conversations par reservation, temps reel avec polling
- **KYC** : verification d'identite (CIN recto/verso + selfie), validation admin, badges de confiance
- **2FA** : TOTP (Google Authenticator) ou SMS, gestion complete dans les parametres
- **Notifications** : 13 types (reservations, paiements, avis, KYC, messages), preferences
- **Admin** : dashboard stats, gestion utilisateurs, moderation services/avis, analytics, signalements avec SLA
- **Dark mode** : theme clair/sombre avec variables CSS
- **Responsive** : mobile-first, bottom nav mobile, sidebar desktop

## Prerequis

- Node.js >= 18
- PostgreSQL >= 14
- Compte Resend (envoi d'emails)

## Installation

```bash
# 1. Cloner le depot
git clone <repo-url>
cd tawa-services

# 2. Installer les dependances
npm install

# 3. Configurer l'environnement
cp .env.example .env.local
# Editer .env.local avec vos valeurs :
#   DATABASE_URL=postgresql://user:password@localhost:5432/tawa
#   NEXTAUTH_SECRET=<votre-secret>
#   NEXTAUTH_URL=http://localhost:3000
#   RESEND_API_KEY=<votre-cle>
#   GOOGLE_CLIENT_ID=<optionnel>
#   GOOGLE_CLIENT_SECRET=<optionnel>

# 4. Initialiser la base de donnees
npx prisma migrate dev

# 5. Charger les donnees de demo
npm run db:seed

# 6. Lancer le serveur
npm run dev
```

Le site est accessible sur [http://localhost:3000/fr](http://localhost:3000/fr).

## Comptes de demo

| Role        | Email                     | Mot de passe |
|-------------|---------------------------|--------------|
| Admin       | admin@tawa.tn             | Test1234!    |
| Client      | salma.client@tawa.tn      | Test1234!    |
| Prestataire | ahmed.plombier@tawa.tn    | Test1234!    |

**Scenario demo** : Salma cherche un plombier a La Marsa → trouve Ahmed → reserve → Ahmed accepte → service termine → Salma note 5 etoiles.

20 clients, 15 prestataires, 50+ services, 40+ reservations, 25+ avis avec commentaires en francais.

## Scripts

| Commande              | Description                          |
|-----------------------|--------------------------------------|
| `npm run dev`         | Serveur de developpement             |
| `npm run build`       | Build de production                  |
| `npm run start`       | Serveur de production                |
| `npm run lint`        | Linter ESLint                        |
| `npm run typecheck`   | Verification TypeScript              |
| `npm run db:seed`     | Charger les donnees de demo          |
| `npm run db:push`     | Pousser le schema vers la DB         |
| `npm run db:studio`   | Ouvrir Prisma Studio                 |
| `npm run db:reset`    | Reinitialiser la base de donnees     |

## Structure des donnees

```
User (CLIENT | PROVIDER | ADMIN)
  └── Provider (profil, KYC, badges, certifications)
       └── Service (titre, prix, categorie, photos)
            └── Booking (statut, paiement, conversation)
                 ├── Payment (escrow, commission 12%)
                 ├── Review (double-aveugle, criteres)
                 ├── Conversation → Messages
                 └── Quote (devis sur demande)
```

## Licence

Projet prive — tous droits reserves.
