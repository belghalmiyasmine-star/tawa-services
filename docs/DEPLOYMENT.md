# Guide de Deploiement — Tawa Services

## Prerequis

| Outil | Version Minimale | Notes |
|-------|-----------------|-------|
| Node.js | >= 20 LTS | Runtime JavaScript |
| PostgreSQL | >= 17 | Base de donnees relationnelle |
| npm | >= 10 | Gestionnaire de paquets |
| Git | Latest | Controle de version |

**Optionnel** :
- Compte **Resend** pour l'envoi d'emails (verification, reset mot de passe)
- Compte **Google Cloud** pour OAuth Google
- Compte **Twilio** pour SMS OTP
- Compte **Konnect** pour paiement reel
- Cle API **Groq** pour le chatbot IA

---

## Variables d'Environnement

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `DATABASE_URL` | Oui | URL connexion PostgreSQL | `postgresql://user:pwd@localhost:5432/tawa_services` |
| `NEXTAUTH_SECRET` | Oui | Secret JWT (min 32 chars) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Oui | URL base application | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Oui | URL publique | `http://localhost:3000` |
| `RESEND_API_KEY` | Non | Cle API Resend (emails) | `re_xxxxxxxxxx` |
| `GOOGLE_CLIENT_ID` | Non | ID client Google OAuth | `xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Non | Secret Google OAuth | `GOCSPX-xxxxx` |
| `CRON_SECRET` | Non | Secret pour endpoints cron | Chaine aleatoire |
| `KONNECT_API_KEY` | Non | Cle API Konnect (paiement) | `xxx-xxx-xxx` |
| `KONNECT_API_URL` | Non | URL API Konnect | `https://api.konnect.network/api/v2` |
| `KONNECT_WALLET_ID` | Non | ID wallet Konnect | `xxx` |
| `GROQ_API_KEY` | Non | Cle API Groq (chatbot IA) | `gsk_xxxxxxxxxx` |

---

## Installation Pas a Pas

### 1. Cloner le projet

```bash
git clone https://github.com/belghalmiyasmine-star/tawa-services.git
cd tawa-services
```

### 2. Installer les dependances

```bash
npm install
```

### 3. Configurer l'environnement

```bash
cp .env.example .env.local
# Editer .env.local avec vos valeurs
```

### 4. Creer la base de donnees PostgreSQL

```sql
CREATE DATABASE tawa_services;
CREATE USER tawa_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE tawa_services TO tawa_user;
```

### 5. Appliquer les migrations

```bash
# Developpement
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

### 6. Charger les donnees de demo

```bash
npm run db:seed
```

### 7. Lancer le serveur

```bash
# Developpement
npm run dev

# Production
npm run build && npm run start
```

Application accessible sur : `http://localhost:3000/fr`

---

## Comptes de Demo

### Administrateur

| Champ | Valeur |
|-------|--------|
| Email | `admin@tawa.tn` |
| Mot de passe | `Admin123!` |
| Role | ADMIN |
| Nom | Youssef Ben Ali |

### Client Principal

| Champ | Valeur |
|-------|--------|
| Email | `salma.client@tawa.tn` |
| Mot de passe | `Test1234!` |
| Role | CLIENT |
| Nom | Salma Mejri |

### Prestataire Principal

| Champ | Valeur |
|-------|--------|
| Email | `ahmed.plombier@tawa.tn` |
| Mot de passe | `Test1234!` |
| Role | PROVIDER |
| Nom | Ahmed Ben Salah |
| Specialite | Plomberie |
| KYC | Approuve |

### Autres Comptes

| Role | Email | Mot de passe |
|------|-------|-------------|
| Client | `mohamed.client@tawa.tn` | `Test1234!` |
| Client | `yasmine.client@tawa.tn` | `Test1234!` |
| Prestataire | `fatma.menage@tawa.tn` | `Test1234!` |
| Prestataire | `mehdi.elec@tawa.tn` | `Test1234!` |
| Prestataire | `nabil.demenag@tawa.tn` | `Test1234!` |
| Prestataire | `omar.serrure@tawa.tn` | `Test1234!` |

### Scenario de Demo

> Salma cherche un plombier a La Marsa → trouve Ahmed → reserve un creneau → Ahmed accepte → service realise → Salma laisse un avis 5 etoiles.

---

## Commandes Utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de developpement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Linter ESLint |
| `npm run lint:fix` | Corriger erreurs ESLint |
| `npm run typecheck` | Verification TypeScript |
| `npm run format` | Formater avec Prettier |
| `npm run db:seed` | Charger donnees demo |
| `npm run db:push` | Sync schema → DB |
| `npm run db:studio` | Ouvrir Prisma Studio |
| `npm run db:reset` | Reset complet base |
| `npm run db:migrate` | Creer migration |
| `npm run db:migrate:deploy` | Appliquer migrations prod |
| `npm run db:generate` | Regenerer client Prisma |

---

## Limitations Connues

| Limitation | Detail |
|-----------|--------|
| Pas de WebSocket | Messagerie par polling (15s) au lieu de temps reel |
| Uploads locaux | Fichiers stockes dans `public/uploads/` (pas de S3/CDN) |
| Paiement simule | Le mode simule est actif par defaut ; Konnect necessite configuration |
| SMS simule en dev | Les OTP sont affiches dans la console en developpement |
| Pas de push notifications | Uniquement notifications in-app et email |
| Traductions partielles | Francais complet, arabe et anglais a completer |

---

## Roadmap v2

| Fonctionnalite | Description |
|---------------|-------------|
| Recherche GPS | Rayon 1-50km avec Google Maps API |
| WebSocket | Chat temps reel (remplacement polling) |
| Push notifications | Notifications mobile web |
| Traductions AR/EN | Interface complete en arabe (RTL) et anglais |
| Offres promotionnelles | Systeme de promotions pour prestataires |
| Application mobile | React Native ou PWA |
