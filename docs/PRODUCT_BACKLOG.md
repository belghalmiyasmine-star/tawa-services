# Product Backlog — Tawa Services

## Legende

- **Priorite MoSCoW** : Must (indispensable), Should (important), Could (souhaitable)
- **Statut** : Done, In Progress, Planned
- **SP** : Story Points (estimation relative)

---

## Epic 1 : Authentification (AUTH)

| ID | User Story | Priorite | SP | Statut |
|----|-----------|----------|-----|--------|
| AUTH-01 | En tant que visiteur, je veux creer un compte avec email et mot de passe afin d'acceder aux fonctionnalites de la plateforme | Must | 5 | Done |
| AUTH-02 | En tant que visiteur, je veux choisir mon role (client ou prestataire) lors de l'inscription afin d'avoir l'interface adaptee | Must | 3 | Done |
| AUTH-03 | En tant qu'utilisateur, je veux me connecter via Google OAuth afin de simplifier l'acces a mon compte | Should | 5 | Done |
| AUTH-04 | En tant qu'utilisateur, je veux recevoir un email de verification afin de confirmer mon adresse email | Must | 3 | Done |
| AUTH-05 | En tant qu'utilisateur, je veux verifier mon numero de telephone par SMS OTP afin de securiser mon compte | Must | 5 | Done |
| AUTH-06 | En tant qu'utilisateur, je veux reinitialiser mon mot de passe par email afin de recuperer l'acces a mon compte | Must | 3 | Done |
| AUTH-07 | En tant qu'utilisateur, je veux activer l'authentification a deux facteurs (TOTP ou SMS) afin de proteger mon compte | Could | 8 | Done |
| AUTH-08 | En tant qu'administrateur, je veux que les routes soient protegees par role (RBAC) afin d'empecher les acces non autorises | Must | 5 | Done |

**Total Epic** : 37 SP — 8/8 Done

---

## Epic 2 : Verification KYC (KYC)

| ID | User Story | Priorite | SP | Statut |
|----|-----------|----------|-----|--------|
| KYC-01 | En tant que prestataire, je veux uploader mes documents d'identite (CIN, selfie, justificatif) afin de verifier mon identite | Must | 5 | Done |
| KYC-02 | En tant qu'administrateur, je veux examiner les demandes KYC afin d'approuver ou rejeter les prestataires | Must | 5 | Done |
| KYC-03 | En tant que prestataire approuve, je veux voir un badge "Identite Verifiee" sur mon profil afin d'inspirer confiance | Must | 3 | Done |
| KYC-04 | En tant que prestataire non-KYC, je veux etre empeche de creer des services afin de maintenir la qualite de la plateforme | Must | 2 | Done |
| KYC-05 | En tant que prestataire rejete, je veux connaitre le motif du rejet afin de corriger ma soumission | Should | 2 | Done |
| KYC-06 | En tant qu'administrateur, je veux voir le nombre de KYC en attente sur mon dashboard afin de prioriser les revues | Should | 1 | Done |

**Total Epic** : 18 SP — 6/6 Done

---

## Epic 3 : Profils & Services (PROF)

| ID | User Story | Priorite | SP | Statut |
|----|-----------|----------|-----|--------|
| PROF-01 | En tant que prestataire, je veux remplir mon profil (nom, bio, photo, experience, langues) afin de me presenter aux clients | Must | 5 | Done |
| PROF-02 | En tant que prestataire, je veux creer des services avec titre, description, prix et photos afin d'etre decouvert | Must | 8 | Done |
| PROF-03 | En tant que prestataire, je veux definir mes disponibilites hebdomadaires et bloquer des dates afin de gerer mon planning | Must | 5 | Done |
| PROF-04 | En tant que client, je veux voir le profil public d'un prestataire avec ses statistiques afin de choisir le bon prestataire | Must | 5 | Done |
| PROF-05 | En tant que prestataire, je veux specifier des inclusions et exclusions pour mes services afin de clarifier mon offre | Should | 2 | Done |
| PROF-06 | En tant que prestataire, je veux uploader des certifications afin de justifier mes competences | Should | 3 | Done |
| PROF-07 | En tant que prestataire, je veux choisir mes zones d'intervention (villes/delegations) afin de limiter ma zone de service | Must | 3 | Done |
| PROF-08 | En tant que prestataire, je veux avoir un portfolio photos afin de montrer mes realisations passees | Should | 3 | Done |

**Total Epic** : 34 SP — 8/8 Done

---

## Epic 4 : Recherche & Decouverte (SRCH)

| ID | User Story | Priorite | SP | Statut |
|----|-----------|----------|-----|--------|
| SRCH-01 | En tant que client, je veux parcourir les services par categorie afin de trouver le type de prestataire recherche | Must | 5 | Done |
| SRCH-02 | En tant que client, je veux filtrer les resultats par ville et delegation afin de trouver des prestataires proches | Must | 3 | Done |
| SRCH-03 | En tant que client, je veux avoir une recherche avec autocompletion afin de trouver rapidement ce que je cherche | Should | 5 | Done |
| SRCH-04 | En tant que client, je veux trier les resultats par note, prix ou disponibilite afin de comparer les prestataires | Should | 3 | Done |
| SRCH-05 | En tant que client, je veux filtrer par "Verifie uniquement" et plage de prix afin d'affiner mes resultats | Should | 2 | Done |

**Total Epic** : 18 SP — 5/5 Done

---

## Epic 5 : Reservation (BOOK)

| ID | User Story | Priorite | SP | Statut |
|----|-----------|----------|-----|--------|
| BOOK-01 | En tant que client, je veux reserver un service a prix fixe en 3 etapes maximum afin de simplifier le processus | Must | 8 | Done |
| BOOK-02 | En tant que client, je veux envoyer une demande de devis pour un service "sur devis" afin d'obtenir un prix | Must | 5 | Done |
| BOOK-03 | En tant que prestataire, je veux accepter ou rejeter les reservations afin de gerer mes engagements | Must | 3 | Done |
| BOOK-04 | En tant que prestataire, je veux repondre aux devis avec un prix propose dans les 48h afin de ne pas perdre de clients | Must | 5 | Done |
| BOOK-05 | En tant que prestataire, je veux voir mes reservations groupees par statut afin d'avoir une vue d'ensemble | Must | 3 | Done |
| BOOK-06 | En tant que client, je veux suivre la progression de ma reservation (PENDING → ACCEPTED → IN_PROGRESS → COMPLETED) afin de connaitre l'etat | Must | 3 | Done |
| BOOK-07 | En tant que client, je veux annuler une reservation avec remboursement selon la politique (>48h: 100%, 24-48h: partiel, <24h: 0%) | Must | 5 | Done |
| BOOK-08 | En tant que client, je veux voir l'historique de toutes mes reservations afin de suivre mes demandes | Should | 2 | Done |

**Total Epic** : 34 SP — 8/8 Done

---

## Epic 6 : Paiement (PAY)

| ID | User Story | Priorite | SP | Statut |
|----|-----------|----------|-----|--------|
| PAY-01 | En tant que client, je veux payer via carte bancaire, D17, Flouci ou cash afin d'utiliser ma methode preferee | Must | 8 | Done |
| PAY-02 | En tant que client, je veux que mon paiement soit retenu en escrow afin de proteger ma transaction | Must | 5 | Done |
| PAY-03 | En tant que prestataire, je veux recevoir le paiement apres completion du service (moins 12% commission) | Must | 3 | Done |
| PAY-04 | En tant que prestataire, je veux voir mes gains cumules et paiements en attente sur mon dashboard | Must | 3 | Done |
| PAY-05 | En tant que prestataire, je veux voir l'historique de mes transactions avec detail des commissions | Should | 3 | Done |
| PAY-06 | En tant qu'utilisateur, je veux recevoir une facture imprimable pour chaque transaction | Should | 5 | Done |
| PAY-07 | En tant que prestataire, je veux demander un retrait de mes gains disponibles | Should | 3 | Done |
| PAY-08 | En tant que developpeur, je veux que le paiement utilise une interface IPaymentService afin de faciliter l'integration Konnect | Must | 5 | Done |

**Total Epic** : 35 SP — 8/8 Done

---

## Epic 7 : Avis & Evaluations (REVW)

| ID | User Story | Priorite | SP | Statut |
|----|-----------|----------|-----|--------|
| REVW-01 | En tant que client, je veux noter un prestataire sur 4 criteres (qualite, ponctualite, communication, proprete) avec texte et photos | Must | 8 | Done |
| REVW-02 | En tant que prestataire, je veux aussi noter le client (systeme bidirectionnel) dans les 10 jours | Must | 3 | Done |
| REVW-03 | En tant qu'utilisateur, je veux que les avis soient publies simultanement quand les deux parties ont evalue | Must | 5 | Done |
| REVW-04 | En tant qu'administrateur, je veux que les avis contenant des coordonnees soient automatiquement signales | Must | 3 | Done |
| REVW-05 | En tant que client, je veux voir la note moyenne et les avis sur le profil prestataire | Must | 3 | Done |
| REVW-06 | En tant qu'administrateur, je veux moderer les avis signales (approuver/rejeter) | Should | 3 | Done |
| REVW-07 | En tant que visiteur, je veux voir un carousel de temoignages sur la page d'accueil afin d'evaluer la fiabilite de la plateforme | Should | 3 | Done |
| REVW-08 | En tant que visiteur, je veux voir un resume IA des avis sur le profil prestataire afin d'avoir une synthese rapide | Could | 5 | Done |

**Total Epic** : 33 SP — 8/8 Done

---

## Epic 8 : Messagerie (MSG)

| ID | User Story | Priorite | SP | Statut |
|----|-----------|----------|-----|--------|
| MSG-01 | En tant que client, je veux envoyer des messages au prestataire pour coordonner une reservation | Must | 5 | Done |
| MSG-02 | En tant qu'utilisateur, je veux que les coordonnees soient bloquees dans les messages afin d'eviter les contournements | Must | 3 | Done |
| MSG-03 | En tant qu'utilisateur, je veux envoyer des images dans le chat afin de partager des details visuels | Should | 5 | Done |
| MSG-04 | En tant qu'utilisateur, je veux voir l'historique de mes conversations avec indicateurs de lecture | Should | 3 | Done |

**Total Epic** : 16 SP — 4/4 Done

---

## Epic 9 : Notifications (NOTF)

| ID | User Story | Priorite | SP | Statut |
|----|-----------|----------|-----|--------|
| NOTF-01 | En tant qu'utilisateur, je veux recevoir des notifications in-app pour tous les evenements transactionnels | Must | 5 | Done |
| NOTF-02 | En tant qu'utilisateur, je veux voir le badge de notifications non lues dans la navbar | Must | 2 | Done |
| NOTF-03 | En tant qu'utilisateur, je veux recevoir des emails pour les evenements importants (nouvelle reservation, paiement) | Should | 3 | Done |
| NOTF-04 | En tant qu'utilisateur, je veux configurer mes preferences de notification et heures de silence | Could | 3 | Done |

**Total Epic** : 13 SP — 4/4 Done

---

## Epic 10 : Administration (ADMN)

| ID | User Story | Priorite | SP | Statut |
|----|-----------|----------|-----|--------|
| ADMN-01 | En tant qu'administrateur, je veux gerer les utilisateurs (activer/bannir/supprimer) avec filtres et recherche | Must | 5 | Done |
| ADMN-02 | En tant qu'administrateur, je veux approuver/suspendre des services et gerer les categories | Must | 5 | Done |
| ADMN-03 | En tant qu'administrateur, je veux traiter les signalements avec SLA priorise (CRITICAL <2h, IMPORTANT <24h, MINOR <48h) | Must | 8 | Done |
| ADMN-04 | En tant qu'administrateur, je veux voir un dashboard analytique avec KPIs en temps reel | Must | 8 | Done |
| ADMN-05 | En tant qu'administrateur, je veux exporter les rapports en CSV et PDF | Should | 5 | Done |
| ADMN-06 | En tant qu'administrateur, je veux gerer le contenu editorial (FAQ, CGU, banners) | Should | 5 | Done |
| ADMN-07 | En tant qu'administrateur, je veux suivre les commissions (12%) et les versements prestataires | Must | 3 | Done |
| ADMN-08 | En tant qu'administrateur, je veux voir les statistiques de sentiment des avis avec tendances | Could | 3 | Done |

**Total Epic** : 42 SP — 8/8 Done

---

## Epic 11 : IA & Intelligence (AI)

| ID | User Story | Priorite | SP | Statut |
|----|-----------|----------|-----|--------|
| AI-01 | En tant qu'utilisateur, je veux un chatbot intelligent pour repondre a mes questions sur la plateforme | Could | 8 | Done |
| AI-02 | En tant qu'administrateur, je veux que les avis soient automatiquement analyses pour detecter le sentiment | Should | 5 | Done |
| AI-03 | En tant que visiteur, je veux voir un resume IA des avis sur le profil prestataire | Could | 5 | Done |
| AI-04 | En tant que client, je veux recevoir des recommandations de prestataires basees sur mon historique | Could | 5 | Done |

**Total Epic** : 23 SP — 4/4 Done

---

## Epic 12 : Pages Publiques & Contenu (PAGE)

| ID | User Story | Priorite | SP | Statut |
|----|-----------|----------|-----|--------|
| PAGE-01 | En tant que visiteur, je veux acceder a une page FAQ avec recherche afin de trouver des reponses rapidement | Should | 3 | Done |
| PAGE-02 | En tant que visiteur, je veux pouvoir contacter la plateforme via un formulaire afin de poser mes questions | Should | 5 | Done |
| PAGE-03 | En tant que visiteur, je veux lire les CGU afin de connaitre les conditions d'utilisation | Must | 2 | Done |
| PAGE-04 | En tant que visiteur, je veux lire la politique de confidentialite afin de comprendre l'utilisation de mes donnees | Must | 2 | Done |
| PAGE-05 | En tant que visiteur, je veux comprendre comment fonctionne la plateforme afin de me convaincre de l'utiliser | Should | 2 | Done |

**Total Epic** : 14 SP — 5/5 Done

---

## Backlog v2 (Planned)

| ID | User Story | Priorite | SP | Statut |
|----|-----------|----------|-----|--------|
| LOC-01 | En tant que client, je veux chercher par rayon GPS (1-50km) avec Google Maps afin de trouver des prestataires proches | Could | 13 | Planned |
| LOC-02 | En tant que client, je veux basculer entre vue carte et vue liste afin de visualiser les resultats geographiquement | Could | 8 | Planned |
| COM-01 | En tant qu'utilisateur, je veux un chat temps reel avec WebSocket afin d'avoir des echanges instantanes | Should | 13 | Planned |
| COM-02 | En tant qu'utilisateur mobile, je veux recevoir des push notifications afin d'etre averti en temps reel | Should | 8 | Planned |
| I18N-01 | En tant qu'utilisateur arabophone, je veux l'interface en arabe (RTL) afin d'utiliser la plateforme dans ma langue | Should | 13 | Planned |
| I18N-02 | En tant qu'utilisateur anglophone, je veux l'interface en anglais afin d'utiliser la plateforme dans ma langue | Could | 8 | Planned |

---

## Resume

| Metrique | Valeur |
|----------|--------|
| **Total User Stories** | 76 (v1) + 6 (v2) = 82 |
| **Total Story Points** | 287 (v1) + 63 (v2) = 350 |
| **Stories Done** | 76 / 76 (v1 = 100%) |
| **Epics** | 12 |
| **Velocity moyenne** | ~72 SP / sprint |
