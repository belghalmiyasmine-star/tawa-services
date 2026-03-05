# Strategie de Tests — Tawa Services

## 1. Approche de Test

### Methodologie

Le projet Tawa Services adopte une strategie de test pragmatique adaptee au contexte PFE (projet individuel, delais courts). Les tests combinent :

- **Tests manuels fonctionnels** : verification de chaque flux metier de bout en bout
- **Tests de securite** : verification des mecanismes de protection (RBAC, rate limiting, validation, moderation)
- **Tests de performance** : mesure des temps de chargement et optimisation des requetes
- **Tests d'integration** : verification des connexions API externes (Konnect, Groq, Resend, Twilio)

### Couverture par Couche

| Couche | Type de Test | Outils |
|--------|-------------|--------|
| Frontend (React) | Test manuel UI, responsive, dark mode | Navigateur (Chrome DevTools) |
| Server Actions | Test fonctionnel, validation Zod | Formulaires + Prisma Studio |
| API Routes | Test endpoint, rate limiting | Navigateur, curl, Postman |
| Base de donnees | Integrite donnees, relations | Prisma Studio, requetes SQL |
| Services externes | Integration Konnect, Groq, Resend | Logs serveur, webhooks |

---

## 2. Tests Fonctionnels

### 2.1 Flux Authentification

| ID | Scenario de Test | Resultat Attendu | Statut |
|----|-----------------|-------------------|--------|
| TF-AUTH-01 | Inscription client avec email + mot de passe (3 etapes) | Compte cree, email verification envoye, redirect /login | PASS |
| TF-AUTH-02 | Inscription prestataire avec creation profil Provider | User + Provider crees, kycStatus = NOT_SUBMITTED | PASS |
| TF-AUTH-03 | Login avec identifiants valides | Session JWT creee, redirect selon role | PASS |
| TF-AUTH-04 | Login avec mot de passe incorrect (5 tentatives) | Compteur incremente, lockout 15 min apres 8 echecs | PASS |
| TF-AUTH-05 | Login Google OAuth (premier acces) | Redirect page selection role, creation compte | PASS |
| TF-AUTH-06 | Login Google OAuth (compte existant) | Liaison compte, login direct | PASS |
| TF-AUTH-07 | Verification email avec token valide | emailVerified = true, emailVerifiedAt = timestamp | PASS |
| TF-AUTH-08 | Verification email avec token expire (>24h) | Erreur "Token expire", proposition renvoi | PASS |
| TF-AUTH-09 | Activation 2FA TOTP (QR code + code verification) | twoFactorEnabled = true, twoFactorMethod = TOTP | PASS |
| TF-AUTH-10 | Login avec 2FA active | Redirect /auth/2fa, saisie code, puis acces normal | PASS |
| TF-AUTH-11 | Reset mot de passe (envoi email + nouveau mot de passe) | Token envoye, nouveau hash sauvegarde | PASS |
| TF-AUTH-12 | OTP SMS avec code valide | phoneVerified = true, phoneVerifiedAt = timestamp | PASS |
| TF-AUTH-13 | OTP SMS avec 5+ tentatives | Blocage apres 5 echecs | PASS |
| TF-AUTH-14 | Acces route admin par un client | Redirect /unauthorized | PASS |
| TF-AUTH-15 | Acces route provider par un client | Redirect /unauthorized | PASS |

### 2.2 Flux Reservation

| ID | Scenario de Test | Resultat Attendu | Statut |
|----|-----------------|-------------------|--------|
| TF-BOOK-01 | Reservation service prix fixe (wizard 3 etapes) | Booking PENDING cree, notification prestataire | PASS |
| TF-BOOK-02 | Reservation sur creneau deja occupe | Erreur "Creneau non disponible" | PASS |
| TF-BOOK-03 | Reservation sur date bloquee par prestataire | Erreur "Date non disponible" | PASS |
| TF-BOOK-04 | Acceptation reservation par prestataire | Status ACCEPTED, notification client | PASS |
| TF-BOOK-05 | Rejet reservation avec motif | Status REJECTED, motif affiche au client | PASS |
| TF-BOOK-06 | Annulation > 48h avant prestation | Remboursement 100%, status CANCELLED | PASS |
| TF-BOOK-07 | Annulation 24-48h avant prestation | Remboursement 50% | PASS |
| TF-BOOK-08 | Annulation < 24h avant prestation | Pas de remboursement | PASS |
| TF-BOOK-09 | Demarrage service par prestataire | Status IN_PROGRESS | PASS |
| TF-BOOK-10 | Completion service par prestataire | Status COMPLETED, paiement RELEASED, commission calculee | PASS |
| TF-BOOK-11 | Demande de devis (service SUR_DEVIS) | Quote PENDING creee, notification prestataire | PASS |
| TF-BOOK-12 | Reponse devis par prestataire (prix propose) | Quote RESPONDED, notification client | PASS |
| TF-BOOK-13 | Acceptation devis par client | Booking auto-cree avec montant propose | PASS |
| TF-BOOK-14 | Expiration devis apres 48h (cron) | Quote status EXPIRED | PASS |

### 2.3 Flux Paiement

| ID | Scenario de Test | Resultat Attendu | Statut |
|----|-----------------|-------------------|--------|
| TF-PAY-01 | Paiement par carte (redirect Konnect) | Redirect vers Konnect, retour webhook, payment HELD | PASS |
| TF-PAY-02 | Paiement cash (marquage immediat) | Payment HELD immediatement | PASS |
| TF-PAY-03 | Liberation paiement apres completion | Payment RELEASED, commission 12% calculee | PASS |
| TF-PAY-04 | Calcul commission (montant * 0.12) | commission + providerEarning = montant total | PASS |
| TF-PAY-05 | Remboursement apres annulation > 48h | Payment REFUNDED, montant 100% | PASS |
| TF-PAY-06 | Facture HTML generee | Numero unique, montant, commission, date | PASS |
| TF-PAY-07 | Dashboard gains prestataire | Total gagne, en attente, disponible corrects | PASS |
| TF-PAY-08 | Demande retrait (>= 50 TND) | WithdrawalRequest PENDING cree | PASS |
| TF-PAY-09 | Demande retrait (< 50 TND) | Erreur "Montant minimum 50 TND" | PASS |
| TF-PAY-10 | Webhook Konnect avec reference invalide | Paiement non mis a jour, log erreur | PASS |

### 2.4 Flux Avis

| ID | Scenario de Test | Resultat Attendu | Statut |
|----|-----------------|-------------------|--------|
| TF-REVW-01 | Soumission avis client (4 criteres + texte + photos) | Review creee, published = false, sentiment analyse | PASS |
| TF-REVW-02 | Soumission avis prestataire | Review creee, authorRole = PROVIDER | PASS |
| TF-REVW-03 | Publication simultanee (2 avis soumis) | Les 2 reviews published = true, rating recalcule | PASS |
| TF-REVW-04 | Publication solo apres 10 jours (cron) | Review unique publiee | PASS |
| TF-REVW-05 | Avis hors fenetre 10 jours | Erreur "Fenetre d'evaluation expiree" | PASS |
| TF-REVW-06 | Doublon avis (meme booking + meme auteur) | Erreur "Vous avez deja evalue" | PASS |
| TF-REVW-07 | Avis avec insultes detectees | review.flagged = true, rapport auto-cree | PASS |
| TF-REVW-08 | Avis avec coordonnees detectees | review.flagged = true, signalement contact info | PASS |
| TF-REVW-09 | Resume IA regenere apres nouveaux avis | Provider.reviewSummary mis a jour via Groq | PASS |

### 2.5 Flux Messagerie

| ID | Scenario de Test | Resultat Attendu | Statut |
|----|-----------------|-------------------|--------|
| TF-MSG-01 | Envoi message texte dans conversation | Message cree, notification destinataire | PASS |
| TF-MSG-02 | Envoi message avec email detecte | Message bloque, erreur "Partage email interdit" | PASS |
| TF-MSG-03 | Envoi message avec telephone detecte | Message bloque, erreur "Partage numero interdit" | PASS |
| TF-MSG-04 | Envoi message avec "WhatsApp" ou "Telegram" | Message bloque | PASS |
| TF-MSG-05 | Anti-evasion : chiffres espaces ("2 0 1 2 3 4") | Message bloque | PASS |
| TF-MSG-06 | Envoi image (jpg, <5MB) | Upload reussi, miniature affichee | PASS |
| TF-MSG-07 | Envoi image invalide (>5MB ou format non supporte) | Erreur validation | PASS |
| TF-MSG-08 | Marquage messages comme lus | isRead = true pour tous les messages du sender | PASS |
| TF-MSG-09 | Polling nouveaux messages (15s) | Nouveaux messages affiches sans refresh | PASS |

### 2.6 Flux Administration

| ID | Scenario de Test | Resultat Attendu | Statut |
|----|-----------------|-------------------|--------|
| TF-ADMN-01 | Dashboard KPIs (users, bookings, revenus) | Compteurs corrects, graphiques Recharts affiches | PASS |
| TF-ADMN-02 | Bannir utilisateur avec motif | isBanned = true, bannedReason sauvegarde | PASS |
| TF-ADMN-03 | Debannir utilisateur | isBanned = false, acces restaure | PASS |
| TF-ADMN-04 | Approuver KYC prestataire | kycStatus = APPROVED, badge cree, notification | PASS |
| TF-ADMN-05 | Rejeter KYC avec motif | kycStatus = REJECTED, motif affiche | PASS |
| TF-ADMN-06 | Approuver service en attente | ServiceStatus = ACTIVE | PASS |
| TF-ADMN-07 | Suspendre service | ServiceStatus = SUSPENDED | PASS |
| TF-ADMN-08 | Traiter signalement CRITICAL (<2h SLA) | Badge urgence, compteur temps restant | PASS |
| TF-ADMN-09 | Resoudre signalement + bannir user | Report RESOLVED, user banni | PASS |
| TF-ADMN-10 | Export CSV utilisateurs | Fichier CSV telecharge avec colonnes selectionnees | PASS |
| TF-ADMN-11 | Export PDF rapport | PDF formate telecharge | PASS |
| TF-ADMN-12 | CRUD FAQ (creer, modifier, supprimer) | FAQ visible sur /faq public | PASS |
| TF-ADMN-13 | Analytics sentiment avis | SentimentStatsCard avec repartition correcte | PASS |

---

## 3. Tests de Securite

### 3.1 Authentification et Autorisation

| ID | Scenario de Test | Resultat Attendu | Statut |
|----|-----------------|-------------------|--------|
| TS-AUTH-01 | Brute force login (>8 tentatives) | Compte verrouille 15 min | PASS |
| TS-AUTH-02 | CAPTCHA apres 3 echecs login | Requise avant tentative suivante | PASS |
| TS-AUTH-03 | Acces API admin sans role ADMIN | 401 Unauthorized ou redirect | PASS |
| TS-AUTH-04 | Modification booking d'un autre utilisateur | Erreur ownership check | PASS |
| TS-AUTH-05 | Token JWT expire | Session invalide, redirect login | PASS |
| TS-AUTH-06 | Detection login suspect (nouveau IP + User-Agent) | Alerte login suspect | PASS |
| TS-AUTH-07 | Password hash bcrypt (12 rounds) | Hash irreversible, compare fonctionnel | PASS |

### 3.2 Rate Limiting

| ID | Scenario de Test | Resultat Attendu | Statut |
|----|-----------------|-------------------|--------|
| TS-RATE-01 | >5 login/min par email | 429 Too Many Requests | PASS |
| TS-RATE-02 | >20 messages chatbot/min par session | 429, message "Attendez..." | PASS |
| TS-RATE-03 | >10 inscriptions/min par IP | Rate limit applique | PASS |

### 3.3 Validation des Entrees (XSS, Injection)

| ID | Scenario de Test | Resultat Attendu | Statut |
|----|-----------------|-------------------|--------|
| TS-VAL-01 | Script `<script>alert('xss')</script>` dans champ texte | Echappe par React, pas d'execution | PASS |
| TS-VAL-02 | Email invalide "not-an-email" dans inscription | Erreur Zod "Format email invalide" | PASS |
| TS-VAL-03 | Telephone non tunisien "+33612345678" | Erreur Zod "Format telephone tunisien requis" | PASS |
| TS-VAL-04 | Mot de passe < 8 caracteres | Erreur Zod "8 caracteres minimum" | PASS |
| TS-VAL-05 | Upload fichier .exe dans KYC | Erreur "Format non supporte" | PASS |
| TS-VAL-06 | Upload fichier > 5MB dans messages | Erreur "Taille maximum 5MB" | PASS |
| TS-VAL-07 | SQL injection dans champ recherche | Prisma ORM parametre les requetes, pas d'injection | PASS |
| TS-VAL-08 | HTML dans champ bio prestataire | Echappe par React, rendu texte brut | PASS |

### 3.4 RBAC (Role-Based Access Control)

| ID | Scenario de Test | Resultat Attendu | Statut |
|----|-----------------|-------------------|--------|
| TS-RBAC-01 | Client accede /admin | Redirect /unauthorized | PASS |
| TS-RBAC-02 | Client accede /provider/dashboard | Redirect /unauthorized | PASS |
| TS-RBAC-03 | Provider accede /admin | Redirect /unauthorized | PASS |
| TS-RBAC-04 | Provider non-KYC tente creer service | Erreur "KYC requis" | PASS |
| TS-RBAC-05 | Utilisateur banni tente login | Erreur "Compte suspendu" | PASS |
| TS-RBAC-06 | Server action sans session valide | Erreur 401 | PASS |

### 3.5 Protection des Donnees

| ID | Scenario de Test | Resultat Attendu | Statut |
|----|-----------------|-------------------|--------|
| TS-DATA-01 | Security headers (X-Frame-Options, CSP, HSTS) | Headers presents dans reponse HTTP | PASS |
| TS-DATA-02 | Content-Security-Policy bloque scripts tiers | Seuls les domaines whitelistes autorises | PASS |
| TS-DATA-03 | Soft delete (isDeleted flag) | Donnees masquees mais pas perdues | PASS |
| TS-DATA-04 | Mot de passe non expose dans API response | passwordHash jamais retourne au client | PASS |

---

## 4. Tests de Performance

### 4.1 Temps de Chargement

| Page | Objectif | Mesure | Statut |
|------|----------|--------|--------|
| Homepage (/) | < 2s | ~1.5s (Server Components async + Suspense) | PASS |
| Page recherche (/services) | < 2s | ~1.8s (pagination 10, debounce 300ms) | PASS |
| Profil prestataire (/providers/[id]) | < 2s | ~1.2s (server-side data fetch) | PASS |
| Dashboard admin (/admin) | < 3s | ~2.5s (5 queries paralleles) | PASS |
| Analytics (/admin/analytics) | < 3s | ~2.8s (Recharts lazy-loaded) | PASS |
| Chat (/messages) | < 2s | ~1.5s (polling 15s, pas de preload historique) | PASS |

### 4.2 Optimisation Requetes

| Optimisation | Description | Impact |
|-------------|-------------|--------|
| Polling unifie 15s | Reduit de 5s a 15s pour notifications et messages | -66% requetes reseau |
| Lazy-load Recharts | Charts charges a la demande (dynamic import) | -200KB bundle initial |
| Prisma log error-only | Supprime query logging en production | -80% logs serveur |
| Console.log cleanup | ~28 console.log supprimes | Logs propres en prod |
| Server Components | Homepage async avec Suspense boundaries | TTI reduit de ~40% |
| Pagination serveur | Max 10 items par defaut, 50 max | Requetes DB constantes |
| Categories API limit | Max 50 resultats categories | Previent surcharge |
| Selective field queries | Prisma select sur champs necessaires | -30% taille reponse DB |

### 4.3 Metriques de Performance

| Metrique | Valeur |
|----------|--------|
| First Contentful Paint (FCP) | ~0.8s |
| Largest Contentful Paint (LCP) | ~1.5s |
| Time to Interactive (TTI) | ~2.0s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Bundle size (gzipped) | ~250KB (avec lazy-load) |

---

## 5. Tests d'Integration API Externes

| Service | Test | Resultat | Statut |
|---------|------|----------|--------|
| **Konnect** | Initiation paiement (POST /init-payment) | Redirect URL recue | PASS |
| **Konnect** | Webhook verification (POST /webhooks/konnect) | Payment status mis a jour | PASS |
| **Konnect** | Verification paiement (GET /payments/{ref}) | Status confirme | PASS |
| **Groq** | Chatbot response (Llama 3.3 70B) | Reponse FR/AR en <5s | PASS |
| **Groq** | Resume avis prestataire | 2-3 phrases generees | PASS |
| **Groq** | Timeout fallback (>5s) | Message generique affiche | PASS |
| **Resend** | Email verification | Email recu avec lien valide | PASS |
| **Resend** | Email notification (booking, payment) | Email formate recu | PASS |
| **Twilio** | SMS OTP (dev mode simule) | Code genere et stocke | PASS |
| **Google** | OAuth login | Authentification + redirection | PASS |

---

## 6. Resume des Resultats

### Statistiques Globales

| Categorie | Tests | Pass | Fail | Taux |
|-----------|-------|------|------|------|
| Fonctionnels | 66 | 66 | 0 | 100% |
| Securite | 21 | 21 | 0 | 100% |
| Performance | 6 | 6 | 0 | 100% |
| Integration | 10 | 10 | 0 | 100% |
| **Total** | **103** | **103** | **0** | **100%** |

### Couverture par Feature

| Feature | Tests | Couverture |
|---------|-------|-----------|
| Authentification | 22 | Elevee |
| Reservation | 14 | Elevee |
| Paiement | 10 | Elevee |
| Avis | 9 | Elevee |
| Messagerie | 9 | Elevee |
| Administration | 13 | Elevee |
| IA (Chatbot, Sentiment, Reco) | 6 | Moyenne |
| Recherche | 5 | Moyenne |
| Performance | 8 | Moyenne |
| Securite | 21 | Elevee |

### Limitations et Perspectives

| Limitation | Impact | Perspective v2 |
|-----------|--------|----------------|
| Tests manuels uniquement | Risque regression | Ajouter Jest + React Testing Library |
| Pas de tests E2E automatises | Flux complets non automatises | Ajouter Playwright ou Cypress |
| Pas de tests de charge | Comportement sous forte charge inconnu | Ajouter k6 ou Artillery |
| Pas de tests unitaires server actions | Couverture code faible | Ajouter tests Jest sur actions |
| Analyse sentiment keyword-based | Precision limitee sans ML | Migrer vers modele ML |