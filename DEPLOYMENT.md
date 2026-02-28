# Guide de deploiement — Tawa Services

## Prerequis

- **Node.js** >= 20 (LTS recommande)
- **PostgreSQL** >= 17
- **npm** >= 10
- **Git**
- Compte **Resend** pour l'envoi d'emails (optionnel en developpement)

## Installation pas a pas

### 1. Cloner le projet

```bash
git clone https://github.com/belghalmiyasmine-star/tawa-services.git
cd tawa-services
```

### 2. Installer les dependances

```bash
npm install
```

Cela installe toutes les dependances et genere automatiquement le client Prisma (`postinstall`).

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Editez `.env.local` avec vos valeurs :

### 4. Lancer le serveur

```bash
npm run dev
```

Le site est accessible sur [http://localhost:3000/fr](http://localhost:3000/fr).

## Variables d'environnement

| Variable                | Requis | Description                                           | Exemple                                              |
|-------------------------|--------|-------------------------------------------------------|------------------------------------------------------|
| `DATABASE_URL`          | Oui    | URL de connexion PostgreSQL                           | `postgresql://user:password@localhost:5432/tawa_services` |
| `NEXTAUTH_SECRET`       | Oui    | Cle secrete pour NextAuth (min. 32 caracteres)        | `votre-secret-key-minimum-32-caracteres-long`        |
| `NEXTAUTH_URL`          | Oui    | URL de base de l'application                          | `http://localhost:3000`                              |
| `NEXT_PUBLIC_APP_URL`   | Oui    | URL publique de l'application                         | `http://localhost:3000`                              |
| `RESEND_API_KEY`        | Non    | Cle API Resend pour l'envoi d'emails                  | `re_xxxxxxxxxx`                                      |
| `GOOGLE_CLIENT_ID`      | Non    | ID client Google OAuth                                | `xxxxx.apps.googleusercontent.com`                   |
| `GOOGLE_CLIENT_SECRET`  | Non    | Secret client Google OAuth                            | `GOCSPX-xxxxx`                                       |
| `FACEBOOK_CLIENT_ID`    | Non    | ID client Facebook OAuth                              | `123456789`                                          |
| `FACEBOOK_CLIENT_SECRET`| Non    | Secret client Facebook OAuth                          | `abcdef123456`                                       |

### Generer un secret NextAuth

```bash
openssl rand -base64 32
```

## Configuration de la base de donnees

### Creer la base PostgreSQL

```sql
CREATE DATABASE tawa_services;
CREATE USER tawa_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE tawa_services TO tawa_user;
```

### Appliquer les migrations

```bash
# En developpement (cree et applique les migrations)
npx prisma migrate dev

# En production (applique les migrations existantes)
npx prisma migrate deploy
```

### Explorer la base de donnees

```bash
npx prisma studio
```

Ouvre une interface web sur [http://localhost:5555](http://localhost:5555) pour naviguer dans les donnees.

## Donnees de demo (seed)

### Charger les donnees

```bash
npm run db:seed
```

### Contenu du seed

Le seed cree un jeu de donnees complet :

- **24 gouvernorats** tunisiens avec leurs delegations
- **10 categories** de services (Plomberie, Electricite, Menage, Cours, Peinture, Demenagement, Jardinage, Climatisation, Serrurerie, Informatique)
- **1 administrateur**
- **15 prestataires** avec profils, services et portfolios
- **20 clients**
- **50+ services** avec descriptions, prix et photos
- **40+ reservations** a differents statuts
- **25+ avis** avec commentaires en francais et notes detaillees

### Reinitialiser la base

```bash
# Supprime toutes les donnees et relance les migrations + seed
npm run db:reset
```

## Comptes de demo

Tous les comptes de demo utilisent le mot de passe suivant sauf indication contraire.

### Administrateur

| Champ         | Valeur                |
|---------------|-----------------------|
| Email         | `admin@tawa.tn`       |
| Mot de passe  | `Admin123!`           |
| Role          | ADMIN                 |
| Nom           | Youssef Ben Ali       |

### Client principal

| Champ         | Valeur                    |
|---------------|---------------------------|
| Email         | `salma.client@tawa.tn`    |
| Mot de passe  | `Test1234!`               |
| Role          | CLIENT                    |
| Nom           | Salma Mejri               |

### Prestataire principal

| Champ         | Valeur                        |
|---------------|-------------------------------|
| Email         | `ahmed.plombier@tawa.tn`      |
| Mot de passe  | `Test1234!`                   |
| Role          | PROVIDER                      |
| Nom           | Ahmed Ben Salah               |
| Specialite    | Plomberie                     |
| Statut KYC    | Approuve                      |

### Autres comptes

| Role        | Email                      | Mot de passe |
|-------------|----------------------------|--------------|
| Client      | `mohamed.client@tawa.tn`   | `Test1234!`  |
| Client      | `yasmine.client@tawa.tn`   | `Test1234!`  |
| Prestataire | `fatma.menage@tawa.tn`     | `Test1234!`  |
| Prestataire | `mehdi.elec@tawa.tn`       | `Test1234!`  |
| Prestataire | `nabil.demenag@tawa.tn`    | `Test1234!`  |
| Prestataire | `omar.serrure@tawa.tn`     | `Test1234!`  |

### Scenario de demonstration

> Salma cherche un plombier a La Marsa → trouve Ahmed → reserve un creneau → Ahmed accepte → service realise → Salma laisse un avis 5 etoiles.

## Architecture du projet

```
tawa-services/
├── prisma/
│   ├── migrations/        # Migrations SQL generees par Prisma
│   ├── schema.prisma      # Schema de la base de donnees
│   └── seed.ts            # Script de donnees de demo
├── public/
│   └── uploads/           # Fichiers uploades (avatars, portfolios, avis)
├── src/
│   ├── app/[locale]/      # Routes Next.js (App Router)
│   │   ├── (client)/      # Pages accessibles aux clients
│   │   │   ├── page.tsx              # Page d'accueil
│   │   │   ├── services/            # Catalogue et detail des services
│   │   │   ├── providers/           # Profil public prestataire
│   │   │   ├── bookings/            # Mes reservations
│   │   │   ├── messages/            # Messagerie
│   │   │   ├── notifications/       # Centre de notifications
│   │   │   ├── settings/            # Parametres (profil, securite, notifs)
│   │   │   ├── dashboard/           # Dashboard client
│   │   │   ├── faq/                 # Questions frequentes
│   │   │   ├── how-it-works/        # Comment ca marche
│   │   │   ├── contact/             # Page de contact
│   │   │   └── legal/               # CGU et politique de confidentialite
│   │   ├── (provider)/    # Espace prestataire
│   │   │   └── provider/
│   │   │       ├── dashboard/       # Dashboard prestataire
│   │   │       ├── services/        # Gestion des services
│   │   │       ├── bookings/        # Reservations recues
│   │   │       └── earnings/        # Revenus et retraits
│   │   └── (admin)/       # Panel d'administration
│   │       └── admin/
│   │           ├── page.tsx          # Dashboard admin
│   │           ├── users/            # Gestion utilisateurs
│   │           ├── services/         # Moderation services
│   │           ├── reviews/          # Moderation avis
│   │           ├── kyc/              # Validation KYC
│   │           ├── commission/       # Suivi commission
│   │           ├── analytics/        # Statistiques
│   │           └── messages/         # Messages signales
│   ├── components/
│   │   ├── ui/            # Composants shadcn/ui (Button, Card, Dialog...)
│   │   ├── layout/        # Navbar, Footer, BottomNav, Sidebars, MobileHeader
│   │   └── shared/        # EmptyState, LanguageSwitcher, ThemeProvider
│   ├── features/          # Modules metier (feature-based architecture)
│   │   ├── auth/          # Authentification (login, register, 2FA, OAuth)
│   │   ├── booking/       # Reservations et devis
│   │   ├── payment/       # Paiements, escrow, retraits, factures
│   │   ├── review/        # Avis et moderation
│   │   ├── messaging/     # Conversations temps reel
│   │   ├── notification/  # Notifications in-app
│   │   ├── provider/      # Profils prestataires
│   │   ├── search/        # Recherche et filtres
│   │   ├── admin/         # Fonctions administration
│   │   ├── kyc/           # Verification d'identite
│   │   └── favorite/      # Favoris
│   ├── i18n/              # Configuration internationalisation
│   ├── lib/               # Utilitaires (Prisma, auth, constantes)
│   └── messages/          # Traductions (fr.json)
├── .env.example           # Template des variables d'environnement
├── tailwind.config.ts     # Configuration Tailwind CSS
├── next.config.ts         # Configuration Next.js
├── tsconfig.json          # Configuration TypeScript
└── package.json           # Dependances et scripts
```

### Principes architecturaux

- **Feature-based architecture** : chaque module metier (`features/`) contient ses propres `actions/`, `components/`, `schemas/`, et `lib/`
- **Server Components** : les pages utilisent des Server Components par defaut, les composants interactifs sont marques `"use client"`
- **Server Actions** : les mutations (create, update, delete) passent par des Server Actions dans `features/*/actions/`
- **Validation** : schemas Zod pour la validation cote client et serveur
- **Internationalisation** : next-intl avec prefixe de locale dans l'URL (`/fr/...`)
- **Theming** : next-themes avec variables CSS pour le mode clair/sombre

## Build de production

```bash
# Build
npm run build

# Lancer en production
npm run start
```

## Commandes utiles

| Commande                  | Description                              |
|---------------------------|------------------------------------------|
| `npm run dev`             | Serveur de developpement                 |
| `npm run build`           | Build de production                      |
| `npm run start`           | Serveur de production                    |
| `npm run lint`            | Linter ESLint                            |
| `npm run lint:fix`        | Corriger les erreurs ESLint              |
| `npm run typecheck`       | Verification TypeScript                  |
| `npm run format`          | Formater le code avec Prettier           |
| `npm run format:check`    | Verifier le formatage                    |
| `npm run db:seed`         | Charger les donnees de demo              |
| `npm run db:push`         | Synchroniser le schema avec la DB        |
| `npm run db:studio`       | Ouvrir Prisma Studio                     |
| `npm run db:reset`        | Reinitialiser la base de donnees         |
| `npm run db:migrate`      | Creer et appliquer une migration         |
| `npm run db:migrate:deploy` | Appliquer les migrations en production |
| `npm run db:generate`     | Regenerer le client Prisma               |
