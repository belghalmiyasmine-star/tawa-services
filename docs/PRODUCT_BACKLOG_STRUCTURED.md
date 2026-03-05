# Product Backlog Structure — Tawa Services

## Structure Hierarchique

```
THEME → EPIC → Feature → User Story (format INVEST)
```

**Legende MoSCoW** : Must (M) = indispensable | Should (S) = important | Could (C) = souhaitable | Won't (W) = hors scope v1

**Story Points** : Estimation relative (Fibonacci : 1, 2, 3, 5, 8, 13)

**Format User Story** : "En tant que [role], je veux [action] afin de [valeur metier]"

---

## THEME 1 : Acces et Securite

> Garantir un acces securise a la plateforme avec verification d'identite et protection des comptes.

### EPIC 1.1 : Authentification

#### Feature 1.1.1 : Inscription Multi-etapes

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-101 | En tant que visiteur, je veux creer un compte avec email et mot de passe afin d'acceder aux fonctionnalites de la plateforme | M | 5 | S1 | - Formulaire 3 etapes (infos, role, confirmation) |
| | | | | | - Validation Zod (email RFC 5322, tel tunisien +216, password min 8 chars) |
| | | | | | - Hash bcrypt 12 rounds |
| | | | | | - Redirection vers login avec message "Verifiez votre email" |
| US-102 | En tant que visiteur, je veux choisir mon role (client ou prestataire) lors de l'inscription afin d'avoir l'interface adaptee a mon usage | M | 3 | S1 | - Choix CLIENT ou PROVIDER a l'etape 2 |
| | | | | | - Si PROVIDER : creation automatique du profil Provider |
| | | | | | - Redirect selon role apres login |

#### Feature 1.1.2 : Connexion

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-103 | En tant qu'utilisateur, je veux me connecter via Google OAuth afin de simplifier l'acces a mon compte | S | 5 | S1 | - Bouton Google avec icone officielle |
| | | | | | - Separateur "Ou continuez avec" |
| | | | | | - Page selection role si premier login OAuth |
| | | | | | - Liaison compte existant si meme email |
| US-104 | En tant qu'utilisateur, je veux reinitialiser mon mot de passe par email afin de recuperer l'acces a mon compte | M | 3 | S1 | - Formulaire forgot-password avec email |
| | | | | | - Token securise envoye par Resend |
| | | | | | - Expiration token 24h |
| | | | | | - Page reset-password avec nouveau mot de passe |

#### Feature 1.1.3 : Verification de Compte

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-105 | En tant qu'utilisateur, je veux recevoir un email de verification afin de confirmer mon adresse email | M | 3 | S1 | - Email envoye via Resend avec lien /verify-email?token=xxx |
| | | | | | - Token expire apres 24h |
| | | | | | - Transaction atomique (token + emailVerified + emailVerifiedAt) |
| | | | | | - Banniere rappel si email non verifie |
| US-106 | En tant qu'utilisateur, je veux verifier mon numero de telephone par SMS OTP afin de securiser mon compte | M | 5 | S1 | - OTP 6 chiffres envoye via Twilio (ou simule en dev) |
| | | | | | - Expiration 10 min |
| | | | | | - Max 5 tentatives avant blocage |
| | | | | | - phoneVerified = true + phoneVerifiedAt |

#### Feature 1.1.4 : Securite Avancee

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-107 | En tant qu'utilisateur, je veux activer l'authentification a deux facteurs (TOTP ou SMS) afin de proteger mon compte contre les acces non autorises | C | 8 | S1 | - Choix TOTP (QR code) ou SMS |
| | | | | | - Page /auth/2fa pour saisie code |
| | | | | | - Middleware intercepte si needs2fa=true |
| | | | | | - Desactivation possible depuis settings |
| US-108 | En tant qu'administrateur, je veux que les routes soient protegees par role (RBAC) afin d'empecher les acces non autorises | M | 5 | S1 | - Middleware verifie session + role sur chaque route |
| | | | | | - Redirect /login si non authentifie |
| | | | | | - Redirect /unauthorized si mauvais role |
| | | | | | - Lockout progressif : 8 tentatives → 15 min blocage |
| | | | | | - Detection login suspect (nouveau IP + User-Agent) |

**Sous-total EPIC 1.1** : 37 SP — 8 stories — Sprint 1

---

### EPIC 1.2 : Verification KYC

#### Feature 1.2.1 : Soumission Documents

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-109 | En tant que prestataire, je veux uploader mes documents d'identite (CIN recto, CIN verso, selfie, justificatif domicile) afin de verifier mon identite | M | 5 | S1 | - Wizard 4 etapes avec upload fichier |
| | | | | | - Validation type (jpg, png, pdf) et taille (max 5MB) |
| | | | | | - Upload local /public/uploads/kyc/ |
| | | | | | - kycStatus passe a PENDING |
| | | | | | - Notification admin |

#### Feature 1.2.2 : Administration KYC

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-110 | En tant qu'administrateur, je veux examiner les demandes KYC afin d'approuver ou rejeter les prestataires | M | 5 | S1 | - Liste KYC en attente sur dashboard admin |
| | | | | | - Visualisation des 4 documents |
| | | | | | - Boutons Approuver / Rejeter avec motif |
| | | | | | - kycApprovedAt ou kycRejectedAt |
| US-111 | En tant que prestataire approuve, je veux voir un badge "Identite Verifiee" sur mon profil afin d'inspirer confiance aux clients | M | 3 | S1 | - TrustBadge IDENTITY_VERIFIED cree automatiquement |
| | | | | | - Badge affiche sur profil public |
| | | | | | - Badge visible dans resultats recherche |
| US-112 | En tant que prestataire non-KYC, je veux etre empeche de creer des services afin de maintenir la qualite de la plateforme | M | 2 | S1 | - Guard sur createService : kycStatus === APPROVED |
| | | | | | - Banniere KYC sur dashboard prestataire |
| | | | | | - Lien direct vers page soumission KYC |
| US-113 | En tant que prestataire rejete, je veux connaitre le motif du rejet afin de corriger et resoumettre ma demande | S | 2 | S1 | - Motif affiche sur page KYC |
| | | | | | - Bouton "Resoumettre" disponible |
| | | | | | - Nouveau statut PENDING apres resoumission |
| US-114 | En tant qu'administrateur, je veux voir le nombre de KYC en attente sur mon dashboard afin de prioriser les revues | S | 1 | S1 | - Compteur KYC PENDING dans card admin |
| | | | | | - Lien direct vers liste KYC |

**Sous-total EPIC 1.2** : 18 SP — 6 stories — Sprint 1

---

## THEME 2 : Gestion des Prestataires

> Permettre aux prestataires de creer et gerer leur presence professionnelle sur la plateforme.

### EPIC 2.1 : Profil Prestataire

#### Feature 2.1.1 : Gestion du Profil

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-201 | En tant que prestataire, je veux remplir mon profil (nom, bio, photo, experience, langues) afin de me presenter aux clients potentiels | M | 5 | S1 | - Formulaire edition avec upload photo |
| | | | | | - Bio max 500 chars |
| | | | | | - Langues : selection multiple (FR, AR, EN) |
| | | | | | - Annees d'experience : champ numerique |
| US-202 | En tant que client, je veux voir le profil public d'un prestataire avec ses statistiques afin de choisir le bon prestataire | M | 5 | S1 | - Page /providers/{id} avec photo, bio, rating |
| | | | | | - Stats : missions completees, taux reponse, temps reponse |
| | | | | | - Badges de confiance |
| | | | | | - Resume IA des avis |
| | | | | | - Bouton "Contacter" et "Reserver" |

#### Feature 2.1.2 : Portfolio et Certifications

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-203 | En tant que prestataire, je veux uploader des certifications afin de justifier mes competences professionnelles | S | 3 | S1 | - Upload fichier (pdf, jpg, png, max 10MB) |
| | | | | | - Titre + description optionnelle |
| | | | | | - Affichage sur profil public |
| US-204 | En tant que prestataire, je veux avoir un portfolio photos afin de montrer mes realisations passees | S | 3 | S1 | - Upload multi-photos (max 10, jpg/png/webp) |
| | | | | | - Legende optionnelle par photo |
| | | | | | - Galerie sur profil public |

### EPIC 2.2 : Services

#### Feature 2.2.1 : CRUD Services

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-205 | En tant que prestataire, je veux creer des services avec titre, description, prix et photos afin d'etre decouvert par les clients | M | 8 | S1 | - Titre max 80 chars, description obligatoire |
| | | | | | - Pricing : FIXED (prix fixe) ou SUR_DEVIS |
| | | | | | - Max 5 photos par service |
| | | | | | - Duree estimee en minutes |
| | | | | | - Status : DRAFT → PENDING_APPROVAL → ACTIVE |
| | | | | | - KYC guard : kycStatus === APPROVED requis |
| US-206 | En tant que prestataire, je veux specifier des inclusions et exclusions pour mes services afin de clarifier mon offre aux clients | S | 2 | S1 | - Listes inclusions[] et exclusions[] (texte libre) |
| | | | | | - Affichage avec icones check/x sur page service |

#### Feature 2.2.2 : Disponibilites et Zones

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-207 | En tant que prestataire, je veux definir mes disponibilites hebdomadaires et bloquer des dates afin de gerer mon planning | M | 5 | S1 | - Grille 7 jours × plages horaires |
| | | | | | - Dates bloquees (vacances, etc.) |
| | | | | | - Verification conflit avant creation booking |
| US-208 | En tant que prestataire, je veux choisir mes zones d'intervention (gouvernorats/delegations) afin de limiter ma zone de service | M | 3 | S1 | - Selecteur gouvernorat → delegations |
| | | | | | - Multi-selection possible |
| | | | | | - Filtrage cote recherche |

**Sous-total THEME 2** : 34 SP — 8 stories — Sprint 1

---

## THEME 3 : Decouverte et Reservation

> Permettre aux clients de trouver et reserver des prestataires facilement.

### EPIC 3.1 : Recherche

#### Feature 3.1.1 : Recherche et Filtres

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-301 | En tant que client, je veux parcourir les services par categorie afin de trouver le type de prestataire recherche | M | 5 | S1 | - Grille categories avec icones sur homepage |
| | | | | | - Categories hierarchiques (parent/enfant) |
| | | | | | - Clic → page resultats filtre par categorie |
| US-302 | En tant que client, je veux filtrer les resultats par ville et delegation afin de trouver des prestataires proches de chez moi | M | 3 | S1 | - Selecteur gouvernorat → delegations |
| | | | | | - Filtre dans URL (pagination SEO) |
| | | | | | - 24 gouvernorats, 264 delegations |
| US-303 | En tant que client, je veux avoir une recherche avec autocompletion afin de trouver rapidement ce que je cherche | S | 5 | S1 | - Debounce 300ms sur saisie |
| | | | | | - Max 5 suggestions |
| | | | | | - Affiche categorie + nom service |
| US-304 | En tant que client, je veux trier les resultats par note, prix ou disponibilite afin de comparer les prestataires | S | 3 | S1 | - Options tri : Meilleure note, Prix croissant, Prix decroissant |
| | | | | | - Tri applique cote serveur |
| US-305 | En tant que client, je veux filtrer par "Verifie uniquement" et plage de prix afin d'affiner mes resultats | S | 2 | S1 | - Checkbox "KYC Verifie uniquement" |
| | | | | | - Slider prix min/max |
| | | | | | - Filtres dans Sheet mobile |

**Sous-total EPIC 3.1** : 18 SP — 5 stories — Sprint 1

### EPIC 3.2 : Reservation

#### Feature 3.2.1 : Reservation Directe

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-306 | En tant que client, je veux reserver un service a prix fixe en 3 etapes maximum afin de simplifier le processus de reservation | M | 8 | S1 | - Wizard 3 etapes : date → resume → confirmation |
| | | | | | - Calendrier avec disponibilites prestataire |
| | | | | | - Verification conflits (meme service, meme jour) |
| | | | | | - Note optionnelle au prestataire |
| | | | | | - Status initial : PENDING |
| | | | | | - Notification au prestataire |
| US-307 | En tant que client, je veux envoyer une demande de devis pour un service "sur devis" afin d'obtenir un prix personnalise | M | 5 | S1 | - Formulaire description du besoin + budget indicatif |
| | | | | | - QuoteStatus : PENDING → RESPONDED → ACCEPTED/DECLINED |
| | | | | | - Expiration 48h automatique (cron) |

#### Feature 3.2.2 : Gestion des Reservations

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-308 | En tant que prestataire, je veux accepter ou rejeter les reservations afin de gerer mes engagements professionnels | M | 3 | S1 | - Boutons Accepter / Rejeter sur dashboard |
| | | | | | - Motif obligatoire pour rejet |
| | | | | | - Notification client |
| US-309 | En tant que prestataire, je veux repondre aux devis avec un prix propose dans les 48h afin de ne pas perdre de clients | M | 5 | S1 | - Champ prix propose + delai estime |
| | | | | | - Client accepte ou decline |
| | | | | | - Si accepte : creation booking automatique |
| US-310 | En tant que prestataire, je veux voir mes reservations groupees par statut afin d'avoir une vue d'ensemble de mon activite | M | 3 | S1 | - Onglets : En attente, Acceptees, En cours, Completees |
| | | | | | - Compteurs par statut |
| US-311 | En tant que client, je veux suivre la progression de ma reservation (PENDING → ACCEPTED → IN_PROGRESS → COMPLETED) afin de connaitre l'etat en temps reel | M | 3 | S1 | - Timeline visuelle avec etapes |
| | | | | | - Couleurs par statut |
| | | | | | - Date de chaque changement |
| US-312 | En tant que client, je veux annuler une reservation avec remboursement selon la politique d'annulation afin de me desengager si necessaire | M | 5 | S1 | - Politique 3 paliers : >48h (100%), 24-48h (50%), <24h (0%) |
| | | | | | - Confirmation dialog avant annulation |
| | | | | | - Motif obligatoire |
| | | | | | - Remboursement automatique si applicable |
| US-313 | En tant que client, je veux voir l'historique de toutes mes reservations afin de suivre mes demandes passees et en cours | S | 2 | S1 | - Liste paginee avec filtres par statut |
| | | | | | - Details accessible par clic |

**Sous-total EPIC 3.2** : 34 SP — 8 stories — Sprint 1

---

## THEME 4 : Transactions

> Securiser les echanges financiers entre clients et prestataires.

### EPIC 4.1 : Paiement

#### Feature 4.1.1 : Processus de Paiement

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-401 | En tant que client, je veux payer via carte bancaire, D17, Flouci ou cash afin d'utiliser ma methode de paiement preferee | M | 8 | S2 | - 4 methodes affichees sur page checkout |
| | | | | | - Carte : redirect vers Konnect |
| | | | | | - Cash : marquage HELD immediat |
| | | | | | - Resume montant + commission avant confirmation |
| US-402 | En tant que client, je veux que mon paiement soit retenu en escrow jusqu'a la completion du service afin de proteger ma transaction | M | 5 | S2 | - Payment status PENDING → HELD (apres paiement) |
| | | | | | - Fonds bloques jusqu'a COMPLETED |
| | | | | | - RELEASED apres completion service |
| US-403 | En tant que developpeur, je veux que le paiement utilise une interface IPaymentService afin de faciliter le passage entre paiement simule et Konnect reel | M | 5 | S2 | - Interface IPaymentService abstraite |
| | | | | | - SimulatedPaymentService pour dev |
| | | | | | - KonnectPaymentService pour prod |
| | | | | | - Switch par variable d'environnement |

#### Feature 4.1.2 : Escrow et Commission

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-404 | En tant que prestataire, je veux recevoir le paiement apres completion du service (moins 12% commission) afin d'etre remunere pour mon travail | M | 3 | S2 | - commission = amount * 0.12 |
| | | | | | - providerEarning = amount * 0.88 |
| | | | | | - Calcul automatique a la completion |
| | | | | | - Notification PAYMENT_RECEIVED |
| US-405 | En tant que prestataire, je veux voir mes gains cumules et paiements en attente sur mon dashboard afin de suivre ma tresorerie | M | 3 | S2 | - Card : Total gagne, En attente, Disponible |
| | | | | | - Graphique evolution gains (Recharts) |
| US-406 | En tant que prestataire, je veux voir l'historique de mes transactions avec detail des commissions afin de suivre ma comptabilite | S | 3 | S2 | - Tableau pagine : date, service, montant, commission, net |
| | | | | | - Filtres par periode |
| US-407 | En tant qu'utilisateur, je veux recevoir une facture imprimable pour chaque transaction afin d'avoir un justificatif de paiement | S | 5 | S2 | - Facture HTML generee automatiquement |
| | | | | | - Numero facture unique |
| | | | | | - Bouton "Imprimer" / "Telecharger PDF" |
| US-408 | En tant que prestataire, je veux demander un retrait de mes gains disponibles afin de recevoir mon argent | S | 3 | S2 | - Montant minimum 50 TND |
| | | | | | - WithdrawalRequest status : PENDING → PAID/REJECTED |
| | | | | | - Admin approve/rejette |

**Sous-total THEME 4** : 35 SP — 8 stories — Sprint 2

---

## THEME 5 : Confiance et Qualite

> Etablir un ecosysteme de confiance grace aux avis, a la moderation et aux badges.

### EPIC 5.1 : Avis et Evaluations

#### Feature 5.1.1 : Systeme d'Avis Bidirectionnel

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-501 | En tant que client, je veux noter un prestataire sur 4 criteres (qualite, ponctualite, communication, proprete) avec texte et photos afin de partager mon experience | M | 8 | S2 | - Note globale 1-5 etoiles |
| | | | | | - 4 sous-criteres optionnels |
| | | | | | - Texte libre + max 3 photos |
| | | | | | - Fenetre 10 jours apres completion |
| | | | | | - 1 seul avis par booking par role |
| US-502 | En tant que prestataire, je veux aussi noter le client (systeme bidirectionnel) dans les 10 jours suivant la prestation afin d'evaluer sa fiabilite | M | 3 | S2 | - Meme formulaire adapte (note + texte) |
| | | | | | - authorRole = PROVIDER |
| US-503 | En tant qu'utilisateur, je veux que les avis soient publies simultanement quand les deux parties ont evalue afin de garantir l'impartialite | M | 5 | S2 | - Double-aveugle : les deux parties ne voient rien avant publication |
| | | | | | - Si 2 avis soumis : publication immediate des deux |
| | | | | | - Si 1 seul : cron publie apres 10 jours |
| | | | | | - publishedAt timestamp |

#### Feature 5.1.2 : Moderation des Avis

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-504 | En tant qu'administrateur, je veux que les avis contenant des coordonnees ou insultes soient automatiquement signales afin de proteger les utilisateurs | M | 3 | S2 | - Regex detection email, telephone, reseaux sociaux |
| | | | | | - Detection 63 insultes FR + AR |
| | | | | | - review.flagged = true si detecte |
| | | | | | - Creation automatique Report |
| US-505 | En tant que client, je veux voir la note moyenne et les avis sur le profil prestataire afin de faire un choix eclaire | M | 3 | S2 | - Note moyenne + nombre d'avis |
| | | | | | - Liste des avis publies avec date et note |
| | | | | | - Photos des avis affichees |
| US-506 | En tant qu'administrateur, je veux moderer les avis signales (approuver/rejeter) afin de garantir la qualite du contenu | S | 3 | S2 | - Liste avis flagged sur admin |
| | | | | | - Actions : publier, supprimer, ignorer |
| US-507 | En tant que visiteur, je veux voir un carousel de temoignages sur la page d'accueil afin d'evaluer la fiabilite de la plateforme | S | 3 | S3 | - Carousel horizontal des meilleurs avis |
| | | | | | - Photo, nom, note, extrait texte |
| | | | | | - Donnees depuis reviews publiees (note >= 4) |

#### Feature 5.1.3 : Intelligence des Avis

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-508 | En tant que visiteur, je veux voir un resume IA des avis sur le profil prestataire afin d'avoir une synthese rapide sans tout lire | C | 5 | S4 | - Resume 2-3 phrases genere par Groq |
| | | | | | - Cache sur Provider.reviewSummary |
| | | | | | - Regenere quand nouveaux avis publies |

**Sous-total EPIC 5.1** : 33 SP — 8 stories — Sprint 2-4

### EPIC 5.2 : Badges de Confiance

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-509 | En tant que prestataire, je veux recevoir des badges automatiques (Identite Verifiee, Reponse Rapide, Top Provider, Avis Positifs) afin d'augmenter ma visibilite | S | 3 | S1/S4 | - IDENTITY_VERIFIED : apres KYC approved |
| | | | | | - QUICK_RESPONSE : responseTimeHours < 2 |
| | | | | | - TOP_PROVIDER : rating >= 4.5 + missions >= 10 |
| | | | | | - PositiveReviewsBadge : > 80% avis positifs |

---

## THEME 6 : Communication

> Faciliter les echanges entre clients et prestataires de maniere securisee.

### EPIC 6.1 : Messagerie In-App

#### Feature 6.1.1 : Chat

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-601 | En tant que client, je veux envoyer des messages au prestataire pour coordonner les details d'une reservation | M | 5 | S2 | - Conversation creee par booking |
| | | | | | - Interface chat avec bulles |
| | | | | | - Polling 15s pour nouveaux messages |
| | | | | | - Indicateur de lecture (vu) |
| US-602 | En tant qu'utilisateur, je veux que les coordonnees personnelles soient bloquees dans les messages afin d'eviter les contournements de la plateforme | M | 3 | S2 | - Regex bloque : emails, telephones, reseaux sociaux |
| | | | | | - Anti-evasion : chiffres espaces, emails obfusques |
| | | | | | - Message erreur explicatif |
| US-603 | En tant qu'utilisateur, je veux envoyer des images dans le chat afin de partager des details visuels sur le travail a effectuer | S | 5 | S4 | - Bouton paperclip pour upload |
| | | | | | - Validation : jpg/png/webp, max 5MB |
| | | | | | - Miniature cliquable → modal plein ecran |
| | | | | | - API /messages/upload |
| US-604 | En tant qu'utilisateur, je veux voir l'historique de mes conversations avec indicateurs de lecture afin de suivre mes echanges | S | 3 | S2 | - Liste conversations triee par dernier message |
| | | | | | - Badge non-lu sur chaque conversation |
| | | | | | - Nom du service en gras + nom utilisateur |

### EPIC 6.2 : Notifications

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-605 | En tant qu'utilisateur, je veux recevoir des notifications in-app pour tous les evenements transactionnels afin d'etre informe en temps reel | M | 5 | S2 | - 13 types : BOOKING_REQUEST, ACCEPTED, REJECTED, COMPLETED, CANCELLED, QUOTE_RECEIVED, QUOTE_RESPONDED, PAYMENT_RECEIVED, REVIEW_RECEIVED, KYC_APPROVED, KYC_REJECTED, NEW_MESSAGE, SYSTEM |
| | | | | | - Polling pour nouveaux messages |
| US-606 | En tant qu'utilisateur, je veux voir le badge de notifications non lues dans la navbar afin de savoir immediatement si j'ai des actions en attente | M | 2 | S2 | - Badge rouge avec compteur dans NotificationBell |
| | | | | | - Mise a jour par polling |
| US-607 | En tant qu'utilisateur, je veux recevoir des emails pour les evenements importants afin d'etre averti meme hors plateforme | S | 3 | S2 | - Emails via Resend pour : nouvelle reservation, paiement, KYC |
| | | | | | - Templates HTML formates |
| US-608 | En tant qu'utilisateur, je veux configurer mes preferences de notification et heures de silence afin de controler les alertes que je recois | C | 3 | S2 | - Toggle par type (in-app, email) |
| | | | | | - Heures de silence (quietStart, quietEnd) |
| | | | | | - Page /settings/notifications |

**Sous-total THEME 6** : 29 SP — 8 stories — Sprint 2/4

---

## THEME 7 : Pilotage

> Donner a l'administrateur les outils pour superviser et piloter la plateforme.

### EPIC 7.1 : Dashboard Admin

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-701 | En tant qu'administrateur, je veux voir un dashboard avec KPIs en temps reel (utilisateurs, bookings, revenus, KYC) afin de piloter la plateforme | M | 8 | S2 | - Cards : Total users, Bookings actifs, Revenus mois, KYC en attente |
| | | | | | - Graphiques Recharts (line, bar, pie) |
| | | | | | - Donnees temps reel via server components |

### EPIC 7.2 : Gestion Utilisateurs et Services

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-702 | En tant qu'administrateur, je veux gerer les utilisateurs (activer/bannir/supprimer) avec filtres et recherche afin de maintenir la qualite de la communaute | M | 5 | S2 | - Tableau pagine avec recherche par nom/email |
| | | | | | - Filtres : role, statut, KYC |
| | | | | | - Actions : bannir (avec motif), debannir, supprimer |
| US-703 | En tant qu'administrateur, je veux approuver/suspendre des services et gerer les categories afin de controler l'offre sur la plateforme | M | 5 | S2 | - Liste services avec statut |
| | | | | | - Actions : approuver, suspendre, supprimer |
| | | | | | - CRUD categories (parent/enfant) |

### EPIC 7.3 : Signalements et Moderation

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-704 | En tant qu'administrateur, je veux traiter les signalements avec SLA priorise afin de resoudre les problemes dans les delais | M | 8 | S2 | - SLA : CRITICAL <2h, IMPORTANT <24h, MINOR <48h |
| | | | | | - Badge couleur selon urgence |
| | | | | | - Compteur temps restant |
| | | | | | - Actions : investiguer, resoudre, rejeter |

### EPIC 7.4 : Analytics et Exports

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-705 | En tant qu'administrateur, je veux voir les analytics detaillees avec graphiques de tendances afin d'analyser les performances de la plateforme | M | 8 | S2 | - Revenue mensuel (line chart) |
| | | | | | - Bookings par statut (bar chart) |
| | | | | | - Repartition categories (pie chart) |
| | | | | | - Croissance utilisateurs (area chart) |
| US-706 | En tant qu'administrateur, je veux exporter les rapports en CSV et PDF afin de partager les donnees avec les parties prenantes | S | 5 | S2 | - Export CSV avec selection colonnes |
| | | | | | - Export PDF formate |
| | | | | | - Filtres date applicable aux exports |

### EPIC 7.5 : Contenu Editorial

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-707 | En tant qu'administrateur, je veux gerer le contenu editorial (FAQ, CGU, banners) afin de maintenir la communication avec les utilisateurs | S | 5 | S2 | - CRUD FAQ avec categories et tri |
| | | | | | - CRUD pages legales |
| | | | | | - CRUD banners (dates debut/fin, type) |

### EPIC 7.6 : Commission

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-708 | En tant qu'administrateur, je veux suivre les commissions (12%) et les versements prestataires afin de piloter la rentabilite | M | 3 | S2 | - Total commissions percues |
| | | | | | - Demandes de retrait en attente |
| | | | | | - Actions : approuver/rejeter retrait |
| US-709 | En tant qu'administrateur, je veux voir les statistiques de sentiment des avis avec tendances afin de detecter les problemes de qualite | C | 3 | S4 | - SentimentStatsCard : repartition positive/neutre/negative |
| | | | | | - Tendance mensuelle |
| | | | | | - Lien vers avis flagged |

**Sous-total THEME 7** : 50 SP — 9 stories — Sprint 2/4

---

## THEME 8 : Intelligence Artificielle

> Enrichir l'experience utilisateur grace a l'IA et l'analyse automatisee.

### EPIC 8.1 : Chatbot IA

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-801 | En tant qu'utilisateur, je veux un chatbot intelligent pour repondre a mes questions sur la plateforme afin d'obtenir de l'aide instantanee | C | 8 | S4 | - Widget flottant coin bas-droit |
| | | | | | - API Groq (Llama 3.3 70B) |
| | | | | | - Bilingue FR/AR (dont dialecte tunisien) |
| | | | | | - Rate limit : 20 msg/min |
| | | | | | - Historique 20 messages |
| | | | | | - Timeout 5s avec fallback |

### EPIC 8.2 : Analyse Sentiment

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-802 | En tant qu'administrateur, je veux que les avis soient automatiquement analyses pour detecter le sentiment afin de prioriser la moderation | S | 5 | S4 | - Score = 60% note + 40% mots-cles |
| | | | | | - Classificateur : POSITIVE / NEUTRAL / NEGATIVE |
| | | | | | - 63 mots-cles FR+AR |
| | | | | | - Severite : CRITICAL (menaces), IMPORTANT (insultes), MINOR (contact) |
| | | | | | - Auto-creation rapport si CRITICAL |

### EPIC 8.3 : Recommandations

| ID | User Story | MoSCoW | SP | Sprint | Criteres d'Acceptation |
|----|-----------|--------|-----|--------|----------------------|
| US-803 | En tant que client, je veux recevoir des recommandations de prestataires basees sur mon historique afin de decouvrir des prestataires pertinents | C | 5 | S4 | - Algorithme scoring (sans API) : |
| | | | | | - Meme categorie +30, meme ville +25, KYC +20 |
| | | | | | - Rating >=4.5 +15, >=4.0 +10 |
| | | | | | - >10 missions +10, deja reserve -5 |
| | | | | | - Top 6 affiches sur homepage |
| US-804 | En tant que visiteur, je veux voir un resume IA des avis sur le profil prestataire afin d'avoir une synthese rapide | C | 5 | S4 | - Groq genere 2-3 phrases de resume |
| | | | | | - Cache dans Provider.reviewSummary |
| | | | | | - Regenere apres nouveaux avis |

**Sous-total THEME 8** : 23 SP — 4 stories — Sprint 4

---

## Resume Global

### Par Theme

| Theme | Nom | Stories | SP | Sprints |
|-------|-----|---------|-----|---------|
| T1 | Acces et Securite | 14 | 55 | S1 |
| T2 | Gestion des Prestataires | 8 | 34 | S1 |
| T3 | Decouverte et Reservation | 13 | 52 | S1 |
| T4 | Transactions | 8 | 35 | S2 |
| T5 | Confiance et Qualite | 9 | 36 | S2-S4 |
| T6 | Communication | 8 | 29 | S2/S4 |
| T7 | Pilotage | 9 | 50 | S2/S4 |
| T8 | Intelligence Artificielle | 4 | 23 | S4 |
| **Total** | | **73** | **314** | **S1-S4** |

### Par Priorite MoSCoW

| Priorite | Stories | SP | % Stories |
|----------|---------|-----|-----------|
| Must (M) | 46 | 210 | 63% |
| Should (S) | 19 | 77 | 26% |
| Could (C) | 8 | 27 | 11% |
| Won't (W) | 0 | 0 | 0% |

### Par Sprint

| Sprint | Stories | SP | Velocity |
|--------|---------|-----|----------|
| Sprint 1 | 35 | 143 | 143 SP |
| Sprint 2 | 26 | 120 | 120 SP |
| Sprint 3 | 4 | 12 | 12 SP |
| Sprint 4 | 8 | 39 | 39 SP |

### Backlog v2 (Hors Scope)

| ID | User Story | MoSCoW | SP |
|----|-----------|--------|-----|
| V2-01 | En tant que client, je veux chercher par rayon GPS (1-50km) avec Google Maps afin de trouver des prestataires proches geographiquement | W | 13 |
| V2-02 | En tant que client, je veux basculer entre vue carte et vue liste afin de visualiser les resultats geographiquement | W | 8 |
| V2-03 | En tant qu'utilisateur, je veux un chat temps reel avec WebSocket afin d'avoir des echanges instantanes sans polling | W | 13 |
| V2-04 | En tant qu'utilisateur mobile, je veux recevoir des push notifications afin d'etre averti en temps reel sur mon telephone | W | 8 |
| V2-05 | En tant qu'utilisateur arabophone, je veux l'interface en arabe (RTL) complete afin d'utiliser la plateforme dans ma langue | W | 13 |
| V2-06 | En tant qu'utilisateur anglophone, je veux l'interface en anglais afin d'utiliser la plateforme dans ma langue | W | 8 |