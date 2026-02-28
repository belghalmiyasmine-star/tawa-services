# Tawa Services

Marketplace de services tunisien. Plateforme de mise en relation entre clients et prestataires de services professionnels en Tunisie. Recherchez, reservez et payez des services en toute securite.

## Fonctionnalites

- **Authentification** : inscription multi-etapes, connexion email/Google/Facebook, 2FA (TOTP & SMS), reinitialisation de mot de passe
- **KYC** : verification d'identite (CIN recto/verso + selfie), validation admin, badges de confiance
- **Reservation** : wizard multi-etapes, calendrier de disponibilite, creneaux horaires, devis sur demande
- **Paiement** : carte, D17, Flouci, especes — escrow securise, commission 12%, remboursement automatique
- **Avis** : systeme double-aveugle (client + prestataire), radar des criteres, moderation automatique
- **Messagerie** : conversations par reservation, temps reel avec polling, moderation des contacts
- **Notifications** : 13 types (reservations, paiements, avis, KYC, messages), preferences par type
- **Administration** : dashboard stats, gestion utilisateurs, moderation services/avis, analytics, commission, export CSV

## Stack technique

| Couche          | Technologie                                  |
|-----------------|----------------------------------------------|
| Framework       | Next.js 15 (App Router, Server Components)   |
| Langage         | TypeScript                                   |
| Base de donnees | PostgreSQL + Prisma 7                        |
| Auth            | NextAuth 4 (credentials + OAuth Google)      |
| UI              | Tailwind CSS 3 + shadcn/ui (Radix)           |
| Frontend        | React 19                                     |
| i18n            | next-intl (francais)                         |
| Email           | Resend                                       |
| Charts          | Recharts                                     |
| Theme           | next-themes (clair/sombre)                   |
| Icons           | Lucide React                                 |
| Validation      | Zod + React Hook Form                        |

## Captures d'ecran

<!-- Ajoutez vos captures d'ecran ici -->

### Page d'accueil
![Page d'accueil](docs/screenshots/homepage.png)

### Recherche de services
![Recherche](docs/screenshots/search.png)

### Detail d'un service
![Detail service](docs/screenshots/service-detail.png)

### Espace prestataire
![Dashboard prestataire](docs/screenshots/provider-dashboard.png)

### Panel admin
![Panel admin](docs/screenshots/admin-dashboard.png)

### Mode sombre
![Mode sombre](docs/screenshots/dark-mode.png)

## Demarrage rapide

### Prerequis

- Node.js >= 20
- PostgreSQL >= 17
- Compte Resend (envoi d'emails, optionnel en dev)

### Installation

```bash
# 1. Cloner le depot
git clone https://github.com/belghalmiyasmine-star/tawa-services.git
cd tawa-services

# 2. Installer les dependances
npm install

# 3. Configurer l'environnement
cp .env.example .env.local
# Editer .env.local avec vos valeurs (voir DEPLOYMENT.md pour le detail)

# 4. Creer et migrer la base de donnees
npx prisma migrate dev

# 5. Charger les donnees de demo (optionnel)
npm run db:seed

# 6. Lancer le serveur de developpement
npm run dev
```

Le site est accessible sur [http://localhost:3000/fr](http://localhost:3000/fr).

## Scripts disponibles

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

## Structure du projet

```
src/
├── app/[locale]/
│   ├── (client)/          # Pages client (recherche, reservation, paiement)
│   ├── (provider)/        # Espace prestataire (services, bookings, revenus)
│   └── (admin)/           # Panel admin (utilisateurs, KYC, analytics)
├── components/
│   ├── ui/                # Composants shadcn/ui (Button, Card, Dialog, etc.)
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
│   ├── kyc/               # Verification d'identite (CIN + selfie)
│   └── favorite/          # Favoris et listes de souhaits
├── i18n/                  # Configuration next-intl (FR)
├── lib/                   # Prisma client, auth config, constantes
└── messages/              # Fichiers de traduction (fr.json)
```

## Modele de donnees

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
