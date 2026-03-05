# Export Jira — Tawa Services

## Format d'Import

Ce document est structure pour un import Jira avec la hierarchie :
- **Epic** → Phase du projet
- **Story** → User Story avec criteres d'acceptation
- **Task** → Tache technique par story
- **Sprint** → Assignation sprint

---

## Epics

| Epic Key | Nom | Description | Sprint |
|----------|-----|-------------|--------|
| TAWA-E01 | Authentification | Inscription, connexion, OAuth, verification, 2FA, RBAC | Sprint 1 |
| TAWA-E02 | Verification KYC | Upload documents, review admin, trust badges | Sprint 1 |
| TAWA-E03 | Profils & Services | Profil prestataire, CRUD services, disponibilites | Sprint 1 |
| TAWA-E04 | Recherche & Decouverte | Categories, filtres, autocomplete, pagination | Sprint 1 |
| TAWA-E05 | Reservation | Booking direct, devis, annulation, progression statut | Sprint 1 |
| TAWA-E06 | Paiement | Checkout, escrow, commission 12%, factures | Sprint 2 |
| TAWA-E07 | Avis & Evaluations | Avis bidirectionnel, publication simultanee, moderation | Sprint 2 |
| TAWA-E08 | Messagerie | Chat in-app, moderation contenu, images | Sprint 2 |
| TAWA-E09 | Notifications | In-app, email, preferences, heures silence | Sprint 2 |
| TAWA-E10 | Administration | Dashboard, gestion users/services/reports, analytics, export | Sprint 2 |
| TAWA-E11 | Bug Fixes & Polish | Corrections bugs, pages manquantes, loading states | Sprint 3 |
| TAWA-E12 | IA & Intelligence | Chatbot, sentiment, resumes, recommandations | Sprint 4 |
| TAWA-E13 | Hardening | Performance, securite auth, admin ameliore | Sprint 4 |

---

## Stories & Tasks

### Epic TAWA-E01 : Authentification

#### TAWA-S001 : Inscription Email/Password
- **Type** : Story
- **Priorite** : Highest
- **Story Points** : 5
- **Sprint** : Sprint 1
- **Description** : En tant que visiteur, je veux creer un compte avec email et mot de passe afin d'acceder aux fonctionnalites de la plateforme
- **Criteres d'acceptation** :
  - [ ] Formulaire 3 etapes (role, infos, password+CGU)
  - [ ] Validation Zod (email, tel tunisien +216, password 8+ chars)
  - [ ] Hash bcrypt avant stockage
  - [ ] Email de verification envoye automatiquement
  - [ ] Redirection vers page login apres inscription

**Tasks** :
| Task Key | Description | Estimation |
|----------|-------------|------------|
| TAWA-T001 | Creer schema Zod d'inscription | 1h |
| TAWA-T002 | Implementer registerAction server action | 2h |
| TAWA-T003 | Creer composant RegistrationWizard 3 etapes | 3h |
| TAWA-T004 | Ajouter traductions i18n inscription | 1h |

#### TAWA-S002 : Choix Role Inscription
- **Type** : Story
- **Priorite** : Highest
- **SP** : 3
- **Sprint** : Sprint 1
- **Description** : En tant que visiteur, je veux choisir mon role (CLIENT/PROVIDER) lors de l'inscription
- **Criteres** :
  - [ ] Selection role a l'etape 1
  - [ ] Si PROVIDER: creation automatique du profil Provider lie au User

#### TAWA-S003 : Connexion Google OAuth
- **Type** : Story
- **Priorite** : High
- **SP** : 5
- **Sprint** : Sprint 1
- **Description** : En tant qu'utilisateur, je veux me connecter via Google afin de simplifier l'acces
- **Criteres** :
  - [ ] Bouton Google avec icone sur page login
  - [ ] Premiere connexion redirige vers page choix de role
  - [ ] Session persiste apres fermeture navigateur

#### TAWA-S004 : Verification Email
- **Type** : Story
- **Priorite** : Highest
- **SP** : 3
- **Sprint** : Sprint 1
- **Description** : En tant qu'utilisateur, je veux verifier mon email par lien magique
- **Criteres** :
  - [ ] Token unique genere (24h expiry)
  - [ ] Email envoye via Resend
  - [ ] Page verification avec gestion etats (valide, expire, deja verifie)
  - [ ] Transaction atomique (email verifie + token marque utilise)

#### TAWA-S005 : Verification Telephone OTP
- **Type** : Story
- **Priorite** : Highest
- **SP** : 5
- **Sprint** : Sprint 1
- **Description** : En tant qu'utilisateur, je veux verifier mon telephone par code OTP SMS
- **Criteres** :
  - [ ] OTP 6 chiffres genere (5 min expiry)
  - [ ] Maximum 5 tentatives par OTP
  - [ ] ISmsService abstraction (Twilio prod, console dev)

#### TAWA-S006 : Reset Mot de Passe
- **Type** : Story
- **Priorite** : Highest
- **SP** : 3
- **Sprint** : Sprint 1
- **Description** : En tant qu'utilisateur, je veux reinitialiser mon mot de passe par email
- **Criteres** :
  - [ ] Token 1h envoye par email
  - [ ] Formulaire nouveau mot de passe
  - [ ] Token a usage unique

#### TAWA-S007 : 2FA TOTP/SMS
- **Type** : Story
- **Priorite** : Low
- **SP** : 8
- **Sprint** : Sprint 1
- **Description** : En tant qu'utilisateur, je veux activer le 2FA pour securiser mon compte
- **Criteres** :
  - [ ] Configuration TOTP (QR code) ou SMS
  - [ ] Challenge 2FA intercale pendant connexion
  - [ ] Desactivation avec verification mot de passe

#### TAWA-S008 : RBAC Middleware
- **Type** : Story
- **Priorite** : Highest
- **SP** : 5
- **Sprint** : Sprint 1
- **Description** : En tant qu'admin, je veux que les routes soient protegees par role
- **Criteres** :
  - [ ] /admin/* accessible uniquement par ADMIN
  - [ ] /provider/* accessible par PROVIDER et ADMIN
  - [ ] Routes publiques sans auth
  - [ ] Redirection 403 si role insuffisant

---

### Epic TAWA-E02 : Verification KYC

#### TAWA-S009 : Upload Documents KYC
- **Type** : Story
- **Priorite** : Highest
- **SP** : 5
- **Sprint** : Sprint 1
- **Description** : En tant que prestataire, je veux uploader CIN, selfie et justificatif domicile
- **Criteres** :
  - [ ] Wizard 4 etapes (CIN recto, CIN verso, selfie, justificatif)
  - [ ] Upload images max 5MB
  - [ ] Statut passe a PENDING apres soumission

#### TAWA-S010 : Admin Review KYC
- **Type** : Story
- **Priorite** : Highest
- **SP** : 5
- **Sprint** : Sprint 1
- **Criteres** :
  - [ ] Liste soumissions KYC en attente
  - [ ] Visualisation documents uploades
  - [ ] Boutons Approuver/Rejeter avec commentaire

#### TAWA-S011 : Trust Badges Automatiques
- **Type** : Story
- **Priorite** : Highest
- **SP** : 3
- **Sprint** : Sprint 1
- **Criteres** :
  - [ ] Badge IDENTITY_VERIFIED apres approbation KYC
  - [ ] Badge affiche sur profil public
  - [ ] Guard : pas de creation service sans KYC APPROVED

---

### Epic TAWA-E05 : Reservation

#### TAWA-S017 : Booking Direct Prix Fixe
- **Type** : Story
- **Priorite** : Highest
- **SP** : 8
- **Sprint** : Sprint 1
- **Description** : En tant que client, je veux reserver un service fixe en 3 etapes
- **Criteres** :
  - [ ] Calendrier disponibilite prestataire
  - [ ] Selection creneau horaire
  - [ ] Verification conflits et disponibilite
  - [ ] Confirmation avec note client optionnelle

#### TAWA-S018 : Demande de Devis
- **Type** : Story
- **Priorite** : Highest
- **SP** : 5
- **Sprint** : Sprint 1
- **Criteres** :
  - [ ] Formulaire description besoin + budget optionnel
  - [ ] Expiration automatique 48h (cron job)
  - [ ] Reponse prestataire avec prix propose

#### TAWA-S019 : Gestion Reservations Provider
- **Type** : Story
- **Priorite** : Highest
- **SP** : 3
- **Sprint** : Sprint 1
- **Criteres** :
  - [ ] Onglets par statut (En attente, Acceptees, En cours, Terminees, Annulees)
  - [ ] Boutons Accepter/Rejeter sur reservations PENDING
  - [ ] Boutons Demarrer/Terminer sur reservations acceptees

#### TAWA-S020 : Politique Annulation
- **Type** : Story
- **Priorite** : Highest
- **SP** : 5
- **Sprint** : Sprint 1
- **Criteres** :
  - [ ] >48h avant: remboursement 100%
  - [ ] 24-48h: remboursement partiel
  - [ ] <24h: aucun remboursement
  - [ ] Affichage montant remboursement avant confirmation

---

### Epic TAWA-E06 : Paiement

#### TAWA-S023 : Checkout 4 Methodes
- **Type** : Story
- **Priorite** : Highest
- **SP** : 8
- **Sprint** : Sprint 2
- **Criteres** :
  - [ ] 4 methodes: Carte, D17, Flouci, Cash
  - [ ] Affichage breakdown (montant, commission 12%, gain prestataire)
  - [ ] Statut passe de PENDING a HELD (escrow)

#### TAWA-S024 : Escrow et Release
- **Type** : Story
- **Priorite** : Highest
- **SP** : 5
- **Sprint** : Sprint 2
- **Criteres** :
  - [ ] Paiement retenu en escrow (HELD)
  - [ ] Liberation apres COMPLETED avec 12% commission
  - [ ] Notification prestataire lors de liberation

#### TAWA-S025 : Dashboard Gains Prestataire
- **Type** : Story
- **Priorite** : Highest
- **SP** : 3
- **Sprint** : Sprint 2
- **Criteres** :
  - [ ] Solde disponible, en attente, total gagne
  - [ ] Historique transactions avec detail commission
  - [ ] Ventilation mensuelle

#### TAWA-S026 : Factures
- **Type** : Story
- **Priorite** : High
- **SP** : 5
- **Sprint** : Sprint 2
- **Criteres** :
  - [ ] Facture HTML imprimable par transaction
  - [ ] Releve mensuel pour prestataire
  - [ ] Accessible par client et prestataire

---

### Epic TAWA-E07 : Avis & Evaluations

#### TAWA-S027 : Avis Client (4 criteres)
- **Type** : Story
- **Priorite** : Highest
- **SP** : 8
- **Sprint** : Sprint 2
- **Criteres** :
  - [ ] 4 criteres (qualite, ponctualite, communication, proprete) 1-5 etoiles
  - [ ] Texte libre + max 3 photos
  - [ ] Fenetre de 10 jours apres completion
  - [ ] Auto-moderation (detection coordonnees, insultes)

#### TAWA-S028 : Avis Provider (Bidirectionnel)
- **Type** : Story
- **Priorite** : Highest
- **SP** : 3
- **Sprint** : Sprint 2
- **Criteres** :
  - [ ] Le prestataire note le client dans la meme fenetre
  - [ ] Publication double-aveugle

#### TAWA-S029 : Publication Simultanee
- **Type** : Story
- **Priorite** : Highest
- **SP** : 5
- **Sprint** : Sprint 2
- **Criteres** :
  - [ ] Avis visibles seulement quand les 2 parties ont evalue
  - [ ] Cron job pour publier avis solo apres 10 jours

---

### Epic TAWA-E10 : Administration

#### TAWA-S035 : Dashboard Admin KPIs
- **Type** : Story
- **Priorite** : Highest
- **SP** : 8
- **Sprint** : Sprint 2
- **Criteres** :
  - [ ] KPI cards: utilisateurs, reservations, revenus, taux satisfaction
  - [ ] Graphiques Recharts: revenue line, bookings bar, categories pie
  - [ ] Filtrage par plage de dates
  - [ ] Comparaison periode precedente (tendance)

#### TAWA-S036 : Gestion Utilisateurs Admin
- **Type** : Story
- **Priorite** : Highest
- **SP** : 5
- **Sprint** : Sprint 2
- **Criteres** :
  - [ ] DataTable avec recherche et filtres (role, statut)
  - [ ] Actions: activer, desactiver, bannir (avec motif), supprimer
  - [ ] Protection: impossible de bannir un ADMIN
  - [ ] Page detail utilisateur

#### TAWA-S037 : Signalements avec SLA
- **Type** : Story
- **Priorite** : Highest
- **SP** : 8
- **Sprint** : Sprint 2
- **Criteres** :
  - [ ] Tableau trie par priorite (CRITICAL, IMPORTANT, MINOR)
  - [ ] Badge SLA avec countdown (2h, 24h, 48h)
  - [ ] Workflow: Open → Investigating → Resolved/Dismissed
  - [ ] Detail Sheet avec contexte complet

#### TAWA-S038 : Export CSV/PDF
- **Type** : Story
- **Priorite** : High
- **SP** : 5
- **Sprint** : Sprint 2
- **Criteres** :
  - [ ] Selection colonnes a exporter
  - [ ] Formats CSV et PDF
  - [ ] Types: utilisateurs, services, transactions, revenus, reports

---

### Epic TAWA-E12 : IA & Intelligence

#### TAWA-S043 : Chatbot IA
- **Type** : Story
- **Priorite** : Low
- **SP** : 8
- **Sprint** : Sprint 4
- **Criteres** :
  - [ ] Widget flottant bas-droite (350x500px desktop, fullscreen mobile)
  - [ ] Integration Groq API (llama-3.3-70b)
  - [ ] Bilingue FR/AR, dialecte tunisien
  - [ ] Rate limit 20 msg/min
  - [ ] Fallback gracieux si API indisponible

#### TAWA-S044 : Analyse Sentiment Avis
- **Type** : Story
- **Priorite** : High
- **SP** : 5
- **Sprint** : Sprint 4
- **Criteres** :
  - [ ] Classification POSITIVE/NEUTRAL/NEGATIVE sans API
  - [ ] Detection menaces/insultes (FR+AR) → rapport auto
  - [ ] Integration dans soumission d'avis

#### TAWA-S045 : Resume IA Avis
- **Type** : Story
- **Priorite** : Low
- **SP** : 5
- **Sprint** : Sprint 4
- **Criteres** :
  - [ ] Resume 2-3 phrases par Groq (min 3 avis requis)
  - [ ] Cache sur Provider.reviewSummary
  - [ ] Affichage sur profil prestataire onglet Avis

#### TAWA-S046 : Recommandations Prestataires
- **Type** : Story
- **Priorite** : Low
- **SP** : 5
- **Sprint** : Sprint 4
- **Criteres** :
  - [ ] Algorithme scoring sans API
  - [ ] Facteurs: categorie, ville, KYC, note, missions
  - [ ] Retourne top 6 prestataires

---

## Assignation Sprints

| Sprint | Dates | Epics | Stories | Total SP |
|--------|-------|-------|---------|----------|
| Sprint 1 | 22-24 Fev | E01, E02, E03, E04, E05 | S001-S022 | ~130 SP |
| Sprint 2 | 24-26 Fev | E06, E07, E08, E09, E10 | S023-S042 | ~110 SP |
| Sprint 3 | 26 Fev - 1 Mar | E11 | S043-S055 | ~30 SP |
| Sprint 4 | 1-5 Mar | E12, E13 | S056-S070 | ~45 SP |

---

## Mapping Phase → Epic

| Phase | Epic | Stories |
|-------|------|---------|
| Phase 1: Foundation | (Infrastructure - pas de stories) | - |
| Phase 2: Auth | E01 | S001-S008 |
| Phase 3: KYC | E02 | S009-S011 |
| Phase 4: Profils & Services | E03 | S012-S016 |
| Phase 5: Recherche | E04 | S017-S019 |
| Phase 6: Reservation | E05 | S020-S022 |
| Phase 7: Paiement | E06 | S023-S026 |
| Phase 8: Avis | E07 | S027-S030 |
| Phase 9: Messagerie | E08, E09 | S031-S034 |
| Phase 10: Admin | E10 | S035-S042 |
| Phase 12-15: Polish | E11 | S043-S055 |
| Phase 16-21: AI & Hardening | E12, E13 | S056-S070 |
