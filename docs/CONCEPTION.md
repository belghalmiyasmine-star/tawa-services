# Conception UML — Tawa Services

Ce document contient l'analyse du besoin metier, les diagrammes UML en format textuel et l'architecture logicielle de la plateforme Tawa Services. Tous les diagrammes sont prets a etre convertis en images via **PlantUML** (`plantuml -tpng CONCEPTION.md`) ou **draw.io**.

---

## 0. Besoin Metier

### 0.1 Problematique

En Tunisie, les particuliers ne disposent pas d'un moyen centralise et fiable pour trouver des prestataires de services a domicile verifies. Cela genere un manque de confiance, des retards, et une absence de tracabilite des prestations.

**Constats terrain :**
- Pas de plateforme nationale dediee aux services a domicile (plomberie, electricite, menage, jardinage, etc.)
- Les clients cherchent via le bouche-a-oreille ou les reseaux sociaux, sans garantie de qualite
- Les prestataires independants n'ont pas de vitrine professionnelle en ligne
- Aucune tracabilite : pas de suivi des prestations, pas d'avis verifies, pas de paiement securise
- Absence de verification d'identite des prestataires (risque de fraude)

### 0.2 Vision du Produit

**Tawa Services** est une plateforme web de mise en relation entre particuliers et prestataires de services a domicile en Tunisie. Elle apporte :

| Probleme | Solution Tawa Services |
|----------|----------------------|
| Manque de confiance | Verification KYC obligatoire (CIN + selfie + justificatif), badges de confiance |
| Pas de tracabilite | Cycle de vie complet : reservation → paiement → avis bidirectionnel |
| Recherche difficile | Recherche multicritere (categorie, ville, delegation, prix, note) avec autocompletion |
| Paiement non securise | Escrow (fonds retenus jusqu'a completion), integration Konnect, commission 12% |
| Pas d'avis fiables | Systeme double-aveugle (client et prestataire evaluent), publication simultanee, analyse IA sentiment |
| Communication non tracee | Messagerie in-app avec moderation automatique (blocage coordonnees) |
| Pas de pilotage | Dashboard admin avec KPIs temps reel, analytics, exports CSV/PDF |

### 0.3 Perimetre Fonctionnel

#### Inclus (v1.0)
- Authentification multi-methodes (email, Google OAuth, 2FA TOTP/SMS)
- Verification d'identite KYC en 4 etapes
- Gestion des profils prestataires (services, disponibilites, zones, portfolio, certifications)
- Recherche et decouverte de services (filtres, categories, autocompletion)
- Reservation directe et demande de devis
- Paiement avec escrow (carte via Konnect, D17, Flouci, cash)
- Avis bidirectionnel avec analyse de sentiment IA
- Messagerie in-app avec moderation automatique et partage d'images
- Notifications in-app et email (13 types)
- Panel administration complet (analytics, gestion utilisateurs/services/signalements, exports)
- Chatbot IA bilingue (FR/AR) base sur Groq (Llama 3.3 70B)
- Recommandations intelligentes de prestataires
- Pages publiques (FAQ, Contact, CGU, Politique confidentialite, Comment ca marche)
- Internationalisation (FR, AR, EN)
- Mode sombre/clair

#### Exclu (v2.0 - perspectives)
- Geolocalisation GPS et recherche par rayon (Google Maps)
- Chat temps reel WebSocket
- Notifications push mobile
- Application mobile native (React Native)
- Interface arabe RTL complete
- Paiement international

### 0.4 Parties Prenantes

| Partie Prenante | Role | Interactions Cles |
|----------------|------|-------------------|
| **Client** (particulier) | Cherche, reserve et evalue des prestataires | Inscription, recherche, reservation, paiement, avis, messagerie |
| **Prestataire** (professionnel) | Offre ses services, gere ses reservations | Inscription, KYC, creation services, gestion reservations, gains |
| **Administrateur** | Supervise la plateforme, modere le contenu | KYC review, moderation avis/messages, analytics, gestion signalements |
| **Systeme** (processus automatise) | Execute les taches planifiees | Expiration devis 48h, publication avis solo 10j, analyse sentiment, envoi notifications/emails |

### 0.5 Diagramme de Contexte

```
@startuml
!define RECTANGLE class

actor "Client\n(Particulier)" as Client
actor "Prestataire\n(Professionnel)" as Provider
actor "Administrateur" as Admin

rectangle "Tawa Services\n(Plateforme Web)" as Platform {
}

cloud "Konnect\n(Paiement)" as Konnect
cloud "Groq API\n(IA/Chatbot)" as Groq
cloud "Resend\n(Email)" as Resend
cloud "Twilio\n(SMS)" as Twilio
cloud "Google\n(OAuth)" as Google
database "PostgreSQL\n(Base de donnees)" as DB

Client --> Platform : Rechercher, Reserver,\nPayer, Evaluer, Messagerie
Provider --> Platform : Creer services,\nGerer reservations,\nSuivre gains
Admin --> Platform : Moderer, Analyser,\nGerer KYC, Exporter

Platform --> Konnect : Initier paiement,\nVerifier webhook
Platform --> Groq : Chatbot,\nResume avis
Platform --> Resend : Emails transactionnels
Platform --> Twilio : OTP SMS
Platform --> Google : Authentification OAuth
Platform --> DB : Lecture/Ecriture donnees
@enduml
```

### 0.6 Methodologie de Developpement

**Methodologie** : Scrum adapte (sprints courts de 2-3 jours)

| Element Scrum | Application |
|---------------|-------------|
| Product Owner | Encadrant academique |
| Scrum Master / Dev Team | Etudiant (1 personne) |
| Sprint | 4 sprints de 2-5 jours |
| Product Backlog | 76 user stories (v1), 287 story points |
| Sprint Planning | Estimation Planning Poker, selection stories par priorite MoSCoW |
| Daily Scrum | Auto-revue quotidienne des objectifs |
| Sprint Review | Demo des fonctionnalites livrees |
| Sprint Retrospective | Bilan et ajustements |
| Definition of Done | Fonctionnalite testee, UI responsive, donnees persistees, i18n, validation Zod |

**Outils utilises** :
- **Git** : Controle de version
- **VS Code** : IDE principal
- **Claude Code** : Assistant IA pour le developpement
- **Prisma Studio** : Administration base de donnees
- **PlantUML** : Modelisation UML
- **Recharts** : Visualisation analytics

---

## 1. Diagramme de Cas d'Utilisation

### Acteurs

| Acteur | Description |
|--------|-------------|
| **Visiteur** | Utilisateur non authentifie |
| **Client** | Utilisateur authentifie avec role CLIENT |
| **Prestataire** | Utilisateur authentifie avec role PROVIDER |
| **Administrateur** | Utilisateur authentifie avec role ADMIN |
| **Systeme** | Processus automatise (cron, IA, notifications) |

### Cas d'Utilisation par Acteur

#### Visiteur
```
@startuml
left to right direction
actor Visiteur

rectangle "Plateforme Tawa Services" {
  Visiteur --> (S'inscrire)
  Visiteur --> (Se connecter)
  Visiteur --> (Se connecter via Google)
  Visiteur --> (Reinitialiser mot de passe)
  Visiteur --> (Parcourir les categories)
  Visiteur --> (Rechercher un service)
  Visiteur --> (Voir profil prestataire)
  Visiteur --> (Consulter la FAQ)
  Visiteur --> (Consulter les CGU)
  Visiteur --> (Contacter la plateforme)
  Visiteur --> (Utiliser le chatbot IA)
}
@enduml
```

#### Client
```
@startuml
left to right direction
actor Client

rectangle "Espace Client" {
  Client --> (Reserver un service)
  Client --> (Demander un devis)
  Client --> (Annuler une reservation)
  Client --> (Payer une reservation)
  Client --> (Evaluer un prestataire)
  Client --> (Envoyer un message)
  Client --> (Envoyer une image dans le chat)
  Client --> (Voir ses reservations)
  Client --> (Voir ses notifications)
  Client --> (Configurer ses preferences notifications)
  Client --> (Ajouter un service en favori)
  Client --> (Modifier son profil)
  Client --> (Changer son mot de passe)
  Client --> (Activer la 2FA)
  Client --> (Voir ses statistiques)
}
@enduml
```

#### Prestataire
```
@startuml
left to right direction
actor Prestataire

rectangle "Espace Prestataire" {
  Prestataire --> (Soumettre documents KYC)
  Prestataire --> (Completer son profil)
  Prestataire --> (Creer un service)
  Prestataire --> (Modifier un service)
  Prestataire --> (Gerer ses disponibilites)
  Prestataire --> (Gerer ses zones intervention)
  Prestataire --> (Uploader certifications)
  Prestataire --> (Uploader portfolio photos)
  Prestataire --> (Accepter une reservation)
  Prestataire --> (Rejeter une reservation)
  Prestataire --> (Demarrer un service)
  Prestataire --> (Terminer un service)
  Prestataire --> (Repondre a un devis)
  Prestataire --> (Evaluer un client)
  Prestataire --> (Envoyer un message)
  Prestataire --> (Voir ses gains)
  Prestataire --> (Demander un retrait)
  Prestataire --> (Voir ses factures)
}
@enduml
```

#### Administrateur
```
@startuml
left to right direction
actor Administrateur

rectangle "Panel Administration" {
  Administrateur --> (Voir le dashboard KPIs)
  Administrateur --> (Gerer les utilisateurs)
  Administrateur --> (Bannir un utilisateur)
  Administrateur --> (Approuver KYC)
  Administrateur --> (Rejeter KYC)
  Administrateur --> (Approuver un service)
  Administrateur --> (Suspendre un service)
  Administrateur --> (Gerer les categories)
  Administrateur --> (Traiter les signalements)
  Administrateur --> (Moderer les avis)
  Administrateur --> (Voir les analytics)
  Administrateur --> (Exporter en CSV/PDF)
  Administrateur --> (Gerer le contenu FAQ)
  Administrateur --> (Gerer les pages legales)
  Administrateur --> (Gerer les banners)
  Administrateur --> (Suivre les commissions)
  Administrateur --> (Voir le sentiment des avis)
}
@enduml
```

#### Systeme
```
@startuml
left to right direction
actor Systeme

rectangle "Processus Automatises" {
  Systeme --> (Expirer les devis apres 48h)
  Systeme --> (Fermer fenetres avis apres 10 jours)
  Systeme --> (Publier avis solo)
  Systeme --> (Analyser sentiment des avis)
  Systeme --> (Generer resume IA avis)
  Systeme --> (Calculer recommandations)
  Systeme --> (Envoyer notifications)
  Systeme --> (Envoyer emails transactionnels)
  Systeme --> (Detecter contenu interdit dans messages)
  Systeme --> (Creer rapport auto pour avis signale)
}
@enduml
```

---

## 2. Diagramme de Classes

```
@startuml
' ====== UTILISATEURS ======
class User {
  +id: String
  +email: String
  +passwordHash: String?
  +phone: String?
  +role: Role
  +name: String?
  +avatarUrl: String?
  +emailVerified: Boolean
  +emailVerifiedAt: DateTime?
  +phoneVerified: Boolean
  +phoneVerifiedAt: DateTime?
  +isActive: Boolean
  +isBanned: Boolean
  +bannedAt: DateTime?
  +bannedReason: String?
  +failedLoginAttempts: Int
  +lockedUntil: DateTime?
  +twoFactorEnabled: Boolean
  +twoFactorMethod: String?
  +totpSecret: String?
  +createdAt: DateTime
  +updatedAt: DateTime
  +isDeleted: Boolean
  --
  +register()
  +login()
  +verifyEmail()
  +verifyPhone()
  +resetPassword()
  +enable2FA()
  +disable2FA()
}

class Provider {
  +id: String
  +userId: String
  +displayName: String
  +bio: String?
  +photoUrl: String?
  +phone: String?
  +kycStatus: KYCStatus
  +yearsExperience: Int?
  +languages: String[]
  +rating: Float
  +ratingCount: Int
  +completedMissions: Int
  +responseTimeHours: Float?
  +responseRate: Float?
  +reviewSummary: String?
  +isActive: Boolean
  +isFeatured: Boolean
  --
  +submitKYC()
  +updateProfile()
  +createService()
  +setAvailability()
  +setZones()
}

' ====== SERVICES ======
class Category {
  +id: String
  +name: String
  +nameAr: String?
  +slug: String
  +icon: String?
  +description: String?
  +parentId: String?
  +isActive: Boolean
  +sortOrder: Int
}

class Service {
  +id: String
  +providerId: String
  +categoryId: String
  +title: String
  +description: String
  +pricingType: PricingType
  +fixedPrice: Float?
  +durationMinutes: Int?
  +inclusions: String[]
  +exclusions: String[]
  +conditions: String?
  +photoUrls: String[]
  +status: ServiceStatus
  +isFeatured: Boolean
  +viewCount: Int
  --
  +create()
  +update()
  +toggleStatus()
  +delete()
}

' ====== RESERVATIONS ======
class Booking {
  +id: String
  +clientId: String
  +providerId: String
  +serviceId: String
  +status: BookingStatus
  +scheduledAt: DateTime?
  +completedAt: DateTime?
  +cancelledAt: DateTime?
  +cancelledBy: String?
  +cancelReason: String?
  +totalAmount: Float
  +clientNote: String?
  +providerNote: String?
  --
  +create()
  +accept()
  +reject()
  +start()
  +complete()
  +cancel()
}

class Quote {
  +id: String
  +clientId: String
  +serviceId: String
  +status: QuoteStatus
  +description: String
  +budget: Float?
  +proposedPrice: Float?
  +expiresAt: DateTime
  --
  +create()
  +respond()
  +accept()
  +decline()
  +expire()
}

' ====== PAIEMENTS ======
class Payment {
  +id: String
  +bookingId: String
  +method: PaymentMethod
  +status: PaymentStatus
  +amount: Float
  +commission: Float
  +providerEarning: Float
  +paidAt: DateTime?
  +heldAt: DateTime?
  +releasedAt: DateTime?
  +refundedAt: DateTime?
  +refundAmount: Float?
  +gatewayRef: String?
  +invoiceUrl: String?
  --
  +process()
  +hold()
  +release()
  +refund()
}

' ====== AVIS ======
class Review {
  +id: String
  +bookingId: String
  +authorId: String
  +targetId: String
  +authorRole: String
  +stars: Int
  +qualityRating: Int?
  +punctualityRating: Int?
  +communicationRating: Int?
  +cleanlinessRating: Int?
  +text: String?
  +photoUrls: String[]
  +published: Boolean
  +sentiment: String?
  +flagged: Boolean
  --
  +submit()
  +publish()
  +moderate()
  +analyzeSentiment()
}

' ====== MESSAGERIE ======
class Conversation {
  +id: String
  +bookingId: String
  --
  +create()
  +getMessages()
}

class Message {
  +id: String
  +conversationId: String
  +senderId: String
  +content: String
  +imageUrl: String?
  +isRead: Boolean
  +flagged: Boolean
  --
  +send()
  +markRead()
  +moderate()
}

' ====== NOTIFICATIONS ======
class Notification {
  +id: String
  +userId: String
  +type: NotifType
  +title: String
  +body: String?
  +read: Boolean
  +data: Json?
  --
  +create()
  +markRead()
  +markAllRead()
}

' ====== ADMIN ======
class Report {
  +id: String
  +reporterId: String
  +reportedId: String?
  +type: ReportType
  +reason: String
  +priority: ReportPriority
  +status: ReportStatus
  +slaDeadline: DateTime?
  --
  +create()
  +investigate()
  +resolve()
  +dismiss()
}

' ====== LOCALISATION ======
class Gouvernorat {
  +id: String
  +name: String
  +nameAr: String?
  +code: String?
}

class Delegation {
  +id: String
  +name: String
  +nameAr: String?
  +gouvernoratId: String
}

' ====== RELATIONS ======
User "1" -- "0..1" Provider
Provider "1" -- "*" Service
Provider "1" -- "*" Booking : providerBookings
User "1" -- "*" Booking : clientBookings
Service "1" -- "*" Booking
Booking "1" -- "0..1" Payment
Booking "1" -- "0..2" Review
Booking "1" -- "0..1" Conversation
Booking "1" -- "0..1" Quote
Conversation "1" -- "*" Message
User "1" -- "*" Message : sentMessages
User "1" -- "*" Notification
Provider "*" -- "*" Delegation : zones
Category "1" -- "*" Service
Category "1" -- "*" Category : children
Gouvernorat "1" -- "*" Delegation
User "1" -- "*" Report : reportsMade
@enduml
```

---

## 3. Diagrammes de Sequence

### 3.1 Inscription

```
@startuml
actor Visiteur
participant "Page Register" as UI
participant "registerAction" as Action
participant "Prisma" as DB
participant "sendVerificationEmail" as Email
participant "Resend API" as Resend

Visiteur -> UI: Remplit formulaire 3 etapes
UI -> UI: Validation Zod (email, tel, password)
UI -> Action: registerAction(data)
Action -> Action: bcrypt.hash(password)
Action -> DB: prisma.user.create({email, passwordHash, role, phone})
alt role === PROVIDER
  Action -> DB: prisma.provider.create({userId, displayName})
end
Action -> Email: sendVerificationEmailAction(userId)
Email -> DB: prisma.emailVerification.create({token, expiresAt: 24h})
Email -> Resend: Envoie email avec lien /verify-email?token=xxx
Email --> Action: success
Action --> UI: {success: true, userId}
UI --> Visiteur: Redirection vers login + message "Verifiez votre email"
@enduml
```

### 3.2 Connexion avec 2FA

```
@startuml
actor Utilisateur
participant "Page Login" as UI
participant "NextAuth" as Auth
participant "Prisma" as DB
participant "Middleware" as MW

Utilisateur -> UI: Saisit email + mot de passe
UI -> Auth: signIn("credentials", {email, password})
Auth -> DB: prisma.user.findUnique({email})
Auth -> Auth: Verifie emailVerified === true
Auth -> Auth: Verifie isBanned === false
Auth -> Auth: Verifie failedLoginAttempts < 5
Auth -> Auth: bcrypt.compare(password, passwordHash)

alt Mot de passe incorrect
  Auth -> DB: Incremente failedLoginAttempts
  Auth --> UI: Erreur "Identifiants invalides"
end

Auth -> Auth: Genere token JWT
alt twoFactorEnabled === true
  Auth -> Auth: token.needs2fa = true
  Auth --> UI: Redirection
  UI -> MW: Acces route protegee
  MW -> MW: Detecte needs2fa === true
  MW --> UI: Redirect /auth/2fa

  Utilisateur -> UI: Saisit code TOTP/SMS
  UI -> Auth: verify2faLoginAction(userId, code)
  Auth -> Auth: Verifie code TOTP ou OTP SMS
  Auth -> Auth: token.needs2fa = false
  Auth --> UI: Redirect selon role
end

alt role === CLIENT
  Auth --> UI: Redirect /
else role === PROVIDER
  Auth --> UI: Redirect /provider/dashboard
else role === ADMIN
  Auth --> UI: Redirect /admin
end
@enduml
```

### 3.3 Flux de Reservation

```
@startuml
actor Client
actor Prestataire
participant "Page Service" as ServiceUI
participant "Booking Wizard" as Wizard
participant "createBookingAction" as CreateAction
participant "Prisma" as DB
participant "Notification" as Notif

Client -> ServiceUI: Clique "Reserver"
ServiceUI -> Wizard: Ouvre wizard 3 etapes

== Etape 1: Selection date ==
Wizard -> Wizard: Affiche calendrier disponibilite
Client -> Wizard: Selectionne date + creneau horaire

== Etape 2: Confirmation ==
Wizard -> Wizard: Affiche resume (service, date, prix, politique annulation)
Client -> Wizard: Ajoute note optionnelle + confirme

== Etape 3: Creation ==
Wizard -> CreateAction: createBookingAction({serviceId, scheduledAt, note})
CreateAction -> CreateAction: Verifie disponibilite (jour, horaire, dates bloquees, conflits)
CreateAction -> DB: prisma.booking.create({status: PENDING, totalAmount})
CreateAction -> Notif: sendNotification(BOOKING_REQUEST, providerId)
CreateAction --> Wizard: {success: true, bookingId}
Wizard --> Client: Redirection /bookings/{id}

== Prestataire traite ==
Prestataire -> Prestataire: Recoit notification
alt Accepte
  Prestataire -> DB: acceptBookingAction(bookingId)
  DB -> DB: status: PENDING → ACCEPTED
  DB -> Notif: sendNotification(BOOKING_ACCEPTED, clientId)
else Rejette
  Prestataire -> DB: rejectBookingAction(bookingId, reason)
  DB -> DB: status: PENDING → REJECTED
  DB -> Notif: sendNotification(BOOKING_REJECTED, clientId)
end
@enduml
```

### 3.4 Flux de Paiement

```
@startuml
actor Client
actor Prestataire
participant "Page Checkout" as Checkout
participant "processPaymentAction" as Pay
participant "IPaymentService" as PayService
participant "Prisma" as DB
participant "completeBookingAction" as Complete
participant "Notification" as Notif

Client -> Checkout: Selectionne methode paiement
Client -> Checkout: Clique "Payer"
Checkout -> Pay: processPaymentAction({bookingId, method})
Pay -> DB: prisma.payment.create({amount, method, status: PENDING})

alt Simulated Payment
  Pay -> PayService: simulatedPaymentService.processPayment()
  PayService --> Pay: {success: true}
  Pay -> DB: payment.status = HELD, heldAt = now()
else Konnect Payment
  Pay -> PayService: konnectPaymentService.initiatePayment()
  PayService --> Pay: {redirectUrl}
  Pay --> Checkout: Redirect vers Konnect
  note right: Client complete paiement sur Konnect
  PayService -> Pay: Webhook callback
  Pay -> DB: payment.status = HELD
end

Pay -> Notif: sendNotification(PAYMENT_RECEIVED, providerId)
Pay --> Client: Confirmation paiement

== Apres completion service ==
Prestataire -> Complete: completeBookingAction(bookingId)
Complete -> DB: booking.status = COMPLETED
Complete -> DB: payment.status = RELEASED
Complete -> DB: payment.commission = amount * 0.12
Complete -> DB: payment.providerEarning = amount * 0.88
Complete -> DB: payment.releasedAt = now()
Complete -> Notif: sendNotification(BOOKING_COMPLETED, clientId)
Complete -> Notif: sendNotification(PAYMENT_RECEIVED, providerId)
@enduml
```

### 3.5 Flux d'Avis

```
@startuml
actor Client
actor Prestataire
participant "Page Review" as UI
participant "submitReviewAction" as Submit
participant "analyzeReview" as Sentiment
participant "publication.ts" as Publish
participant "Prisma" as DB
participant "Groq API" as Groq

== Client soumet avis ==
Client -> UI: Note 4 criteres + texte + photos
UI -> Submit: submitReviewAction({bookingId, stars, criteria, text, photos})
Submit -> Submit: Verifie fenetre 10 jours
Submit -> Submit: Verifie pas de doublon (bookingId + authorId)
Submit -> Sentiment: analyzeReview({stars, text})
Sentiment -> Sentiment: Score = 60% stars + 40% keywords
Sentiment --> Submit: {sentiment: "POSITIVE", flags: []}
Submit -> DB: prisma.review.create({...data, sentiment, published: false})

alt Contenu signale (insultes, coordonnees)
  Submit -> DB: prisma.report.create({type: REVIEW, priority, referenceId})
  Submit -> DB: review.flagged = true
end

== Verification publication simultanee ==
Submit -> Publish: checkAndPublish(bookingId)
Publish -> DB: Compte reviews pour ce booking

alt 2 reviews existent (client + provider)
  Publish -> DB: review1.published = true, publishedAt = now()
  Publish -> DB: review2.published = true, publishedAt = now()
  Publish -> DB: Recalcule provider.rating et ratingCount
  Publish -> Groq: regenerateProviderSummary(providerId)
  Groq --> Publish: Resume 2-3 phrases
  Publish -> DB: provider.reviewSummary = summary
else 1 seule review
  Publish -> Publish: Attend la review de l'autre partie
  note right: Apres 10 jours, le cron publie la review solo
end
@enduml
```

### 3.6 Flux de Messagerie

```
@startuml
actor Client
actor Prestataire
participant "ChatView" as Chat
participant "sendMessageAction" as Send
participant "moderation" as Mod
participant "Prisma" as DB
participant "Notification" as Notif

Client -> Chat: Clique "Contacter" sur profil prestataire
Chat -> DB: getOrCreateConversationAction(bookingId)
DB --> Chat: conversation

== Envoi message texte ==
Client -> Chat: Saisit message + clique Envoyer
Chat -> Send: sendMessageAction({conversationId, content})
Send -> Mod: moderateContent(content)

alt Contenu interdit detecte (tel, email)
  Mod --> Send: {blocked: true, reason: "Contact info detected"}
  Send --> Chat: Erreur "Partage de coordonnees interdit"
else Contenu OK
  Mod --> Send: {blocked: false}
  Send -> DB: prisma.message.create({content, senderId})
  Send -> Notif: sendNotification(NEW_MESSAGE, providerId)
  Send --> Chat: Message affiche (optimistic update)
end

== Envoi image ==
Client -> Chat: Clique icone paperclip
Chat -> Chat: Selectionne fichier (jpg/png/webp, max 5MB)
Chat -> Chat: POST /api/messages/upload (FormData)
Chat -> Chat: Recoit imageUrl
Chat -> Send: sendMessageAction({conversationId, content: "", imageUrl})
Send -> DB: prisma.message.create({content, imageUrl, senderId})

== Polling ==
loop Toutes les 15 secondes
  Chat -> DB: getConversationMessagesAction(cursor)
  DB --> Chat: Nouveaux messages
  Chat -> Chat: Affiche bulles + miniatures images
end

== Lecture ==
Prestataire -> Chat: Ouvre la conversation
Chat -> DB: markMessagesAsReadAction(conversationId)
DB -> DB: Tous messages du Client → isRead = true
@enduml
```

---

## 4. Diagrammes d'Activite

### 4.1 Cycle de Vie d'une Reservation

```
@startuml
start
:Client selectionne service;
:Client choisit date et creneau;
:Verification disponibilite;

if (Creneau disponible?) then (oui)
  :Creer Booking [PENDING];
  :Notifier prestataire;

  if (Prestataire repond?) then (accepte)
    :Booking [ACCEPTED];
    :Notifier client;

    :Client effectue paiement;
    if (Paiement reussi?) then (oui)
      :Payment [HELD] (escrow);

      :Prestataire demarre service;
      :Booking [IN_PROGRESS];

      :Prestataire termine service;
      :Booking [COMPLETED];
      :Payment [RELEASED];
      :Commission 12% calculee;
      :Notifier les deux parties;

      :Fenetre avis ouverte (10 jours);

    else (non)
      :Payment [FAILED];
      :Notifier client;
    endif

  else (rejette)
    :Booking [REJECTED];
    :Notifier client avec motif;
  endif

else (non)
  :Afficher erreur disponibilite;
endif

stop

note right
  **Annulation possible** :
  - PENDING/ACCEPTED par client ou prestataire
  - > 48h : remboursement 100%
  - 24-48h : remboursement partiel
  - < 24h : aucun remboursement
end note
@enduml
```

### 4.2 Cycle de Vie du Paiement

```
@startuml
start
:Client selectionne methode paiement;
note right: Carte, D17, Flouci, Cash

if (Methode = Konnect?) then (oui)
  :Redirect vers Konnect;
  :Client complete paiement;
  if (Webhook recu?) then (succes)
    :Payment [HELD];
  else (echec)
    :Payment [FAILED];
    :Redirect /payment-failed;
    stop
  endif
else (Simulation)
  :Payment [HELD] (immediat);
endif

:Fonds retenus en escrow;

if (Service complete?) then (oui)
  :Payment [RELEASED];
  :commission = montant * 12%;
  :providerEarning = montant * 88%;
  :Notification prestataire;

  if (Prestataire demande retrait?) then (oui)
    :Verification solde >= 50 TND;
    :WithdrawalRequest [PENDING];
    :Admin traite la demande;
    if (Approuve?) then (oui)
      :WithdrawalRequest [PAID];
    else (rejete)
      :WithdrawalRequest [REJECTED];
    endif
  endif

else (annulation)
  if (Delai > 48h?) then (oui)
    :Remboursement 100%;
    :Payment [REFUNDED];
  else if (Delai 24-48h?) then (oui)
    :Remboursement partiel;
    :Payment [REFUNDED];
  else (< 24h)
    :Pas de remboursement;
  endif
endif

stop
@enduml
```

### 4.3 Flux KYC

```
@startuml
start
:Prestataire accede au dashboard;

if (kycStatus == NOT_SUBMITTED?) then (oui)
  :Afficher banniere KYC;
  :Prestataire clique "Verifier mon identite";

  :Etape 1: Upload CIN recto;
  :Etape 2: Upload CIN verso;
  :Etape 3: Upload selfie;
  :Etape 4: Upload justificatif domicile;

  :submitKycAction();
  :kycStatus = PENDING;
  :Notifier admin;

else (PENDING)
  :Afficher "En attente de verification";

else if (REJECTED) then (oui)
  :Afficher motif du rejet;
  :Proposer nouvelle soumission;

else (APPROVED)
  :Acces complet aux fonctionnalites;
endif

fork
  :Admin ouvre liste KYC en attente;
  :Admin visualise les 4 documents;

  if (Documents valides?) then (oui)
    :approveKycAction(providerId);
    :kycStatus = APPROVED;
    :kycApprovedAt = now();
    :Creer TrustBadge IDENTITY_VERIFIED;
    :Notifier prestataire (KYC_APPROVED);
  else (non)
    :rejectKycAction(providerId, motif);
    :kycStatus = REJECTED;
    :kycRejectedAt = now();
    :Notifier prestataire (KYC_REJECTED);
  endif
fork again
end fork

stop
@enduml
```

---

## 5. Diagramme de Composants

```
@startuml
package "Frontend (React / Next.js 15)" {
  [Pages Client] as ClientPages
  [Pages Provider] as ProviderPages
  [Pages Admin] as AdminPages
  [Composants UI] as UIComponents
  [ChatbotWidget] as Chatbot
  [Layouts] as Layouts
}

package "Backend (Next.js Server)" {
  [Server Actions] as Actions
  [API Routes] as APIRoutes
  [Middleware Auth+i18n] as Middleware
  [NextAuth.js] as Auth
}

package "Couche Services" {
  [IPaymentService] as PaymentService
  [ISmsService] as SmsService
  [EmailService] as EmailService
  [AI Modules] as AIModules
  [Rate Limiter] as RateLimiter
}

package "Couche Donnees" {
  [Prisma ORM] as Prisma
  database "PostgreSQL" as DB
}

package "Services Externes" {
  cloud "Groq API" as Groq
  cloud "Twilio" as Twilio
  cloud "Konnect" as Konnect
  cloud "Google OAuth" as Google
  cloud "Resend" as Resend
}

' Relations Frontend → Backend
ClientPages --> Actions
ProviderPages --> Actions
AdminPages --> Actions
Chatbot --> APIRoutes
Layouts --> Middleware
UIComponents --> Layouts

' Relations Backend → Services
Actions --> PaymentService
Actions --> EmailService
Actions --> AIModules
APIRoutes --> RateLimiter
APIRoutes --> AIModules
Auth --> Prisma

' Relations Services → Data
Actions --> Prisma
Prisma --> DB

' Relations Services → Externes
PaymentService --> Konnect
SmsService --> Twilio
EmailService --> Resend
AIModules --> Groq
Auth --> Google
@enduml
```

---

## 6. Diagramme de Deploiement

```
@startuml
node "Poste Developpeur" {
  [Next.js Dev Server] as DevServer
  [Prisma Studio] as Studio
}

node "Serveur Production" {
  [Next.js (Node.js 20)] as AppServer
  [Fichiers Uploads] as Uploads
}

database "PostgreSQL 17" as PgDB

cloud "Services Cloud" {
  [Resend] as ResendService
  [Twilio] as TwilioService
  [Groq] as GroqService
  [Konnect] as KonnectService
  [Google Cloud] as GoogleService
}

DevServer --> PgDB : DATABASE_URL
Studio --> PgDB : DATABASE_URL
AppServer --> PgDB : DATABASE_URL
AppServer --> Uploads : /public/uploads/
AppServer --> ResendService : RESEND_API_KEY
AppServer --> TwilioService : TWILIO_*
AppServer --> GroqService : GROQ_API_KEY
AppServer --> KonnectService : KONNECT_*
AppServer --> GoogleService : GOOGLE_*
@enduml
```

---

## 7. Resume des Diagrammes

| Type de Diagramme | Nombre | Contenu |
|-------------------|--------|---------|
| Cas d'utilisation | 5 | Visiteur, Client, Prestataire, Admin, Systeme |
| Classe | 1 | 15 classes principales avec attributs, methodes, relations |
| Sequence | 6 | Inscription, Login+2FA, Booking, Paiement, Avis, Messagerie |
| Activite | 3 | Cycle reservation, Cycle paiement, Flux KYC |
| Composants | 1 | Architecture 4 couches (Frontend, Backend, Services, Data) |
| Deploiement | 1 | Infrastructure dev et production |

**Total : 17 diagrammes globaux** prets a convertir en images via PlantUML (`plantuml -tpng CONCEPTION.md`) ou draw.io (copier-coller le code PlantUML).

---

## 8. Diagrammes par Sprint

Cette section organise les diagrammes UML par sprint, en referencant les diagrammes globaux existants (sections 1-7) et en ajoutant des diagrammes sprint-specifiques supplementaires.

---

### 8.1 Sprint 1 — Fondation, Auth, KYC, Profils, Recherche, Reservation

#### Diagrammes existants applicables :
- **Cas d'utilisation** : Visiteur (§1), Client (§1), Prestataire (§1)
- **Sequence** : Inscription (§3.1), Login+2FA (§3.2), Reservation (§3.3)
- **Activite** : KYC (§4.3), Cycle reservation (§4.1)
- **Classe** : Sous-ensemble User, Provider, Category, Service, Booking, Quote (§2)
- **Deploiement** : Infrastructure complete (§6)

#### 8.1.1 Diagramme de Classes — Sprint 1 (User, Provider, Service, Booking)

```
@startuml
title Sprint 1 — Classes Principales

class User {
  +id: String
  +email: String
  +passwordHash: String?
  +phone: String?
  +role: Role {CLIENT, PROVIDER, ADMIN}
  +name: String?
  +avatarUrl: String?
  +emailVerified: Boolean
  +phoneVerified: Boolean
  +twoFactorEnabled: Boolean
  +isBanned: Boolean
  +failedLoginAttempts: Int
  +lockedUntil: DateTime?
  --
  +register()
  +login()
  +verifyEmail()
  +enable2FA()
}

class Provider {
  +id: String
  +userId: String
  +displayName: String
  +bio: String?
  +kycStatus: KYCStatus
  +rating: Float
  +ratingCount: Int
  +isActive: Boolean
  --
  +submitKYC()
  +updateProfile()
  +createService()
}

class KYCDocument {
  +id: String
  +providerId: String
  +type: KYCDocType {CIN_FRONT, CIN_BACK, SELFIE, PROOF_ADDRESS}
  +fileUrl: String
  +status: KYCStatus
}

class Service {
  +id: String
  +providerId: String
  +categoryId: String
  +title: String
  +pricingType: PricingType {FIXED, SUR_DEVIS}
  +fixedPrice: Float?
  +status: ServiceStatus
  --
  +create()
  +update()
}

class Booking {
  +id: String
  +clientId: String
  +providerId: String
  +serviceId: String
  +status: BookingStatus
  +scheduledAt: DateTime?
  +totalAmount: Float
  --
  +create()
  +accept()
  +reject()
}

class Category {
  +id: String
  +name: String
  +slug: String
  +parentId: String?
}

User "1" -- "0..1" Provider
Provider "1" -- "*" KYCDocument
Provider "1" -- "*" Service
Category "1" -- "*" Service
User "1" -- "*" Booking : client
Provider "1" -- "*" Booking : provider
Service "1" -- "*" Booking
@enduml
```

#### 8.1.2 Diagramme d'Activite — Inscription Multi-etapes

```
@startuml
title Sprint 1 — Flux Inscription 3 Etapes

start
:Visiteur accede a /register;

== Etape 1: Informations ==
:Saisit nom, email, telephone;
:Validation Zod (format email, tel tunisien);
if (Donnees valides?) then (oui)
else (non)
  :Afficher erreurs inline;
  stop
endif

== Etape 2: Role & Mot de passe ==
:Choisit role (Client ou Prestataire);
:Saisit mot de passe (min 8 chars);
:Accepte CGU;

== Etape 3: Confirmation ==
:Resume des informations;
:Clic "Creer mon compte";

:registerAction() cote serveur;
:bcrypt.hash(password, 12);
:prisma.user.create();

if (role === PROVIDER?) then (oui)
  :prisma.provider.create({displayName});
endif

:Generer token verification email;
:Envoyer email via Resend;

:Redirect /login;
:Message "Verifiez votre email";

stop
@enduml
```

#### 8.1.3 Diagramme de Sequence — Recherche de Service

```
@startuml
title Sprint 1 — Recherche et Decouverte

actor Client
participant "Page Categories" as CatPage
participant "Page Recherche" as SearchPage
participant "API /search/services" as SearchAPI
participant "API /search/autocomplete" as AutoAPI
participant "Prisma" as DB

== Navigation par categories ==
Client -> CatPage: Parcourt les categories
CatPage -> DB: getCategories()
DB --> CatPage: Categories avec icones
Client -> CatPage: Clique "Plomberie"
CatPage -> SearchPage: Redirect /services?category=plomberie

== Recherche avec autocompletion ==
Client -> SearchPage: Tape "plom..."
SearchPage -> AutoAPI: GET /search/autocomplete?q=plom
note right: Debounce 300ms
AutoAPI -> DB: Service.findMany({title LIKE '%plom%'})
DB --> AutoAPI: Suggestions (max 5)
AutoAPI --> SearchPage: [{title, category, providerId}]

== Filtres ==
Client -> SearchPage: Selectionne ville "Tunis"
Client -> SearchPage: Coche "Verifie uniquement"
Client -> SearchPage: Prix max 200 TND
Client -> SearchPage: Tri par "Meilleure note"

SearchPage -> SearchAPI: GET /search/services?category=plomberie\n&gouvernorat=tunis&verified=true\n&maxPrice=200&sort=rating
SearchAPI -> DB: Service.findMany({...filters, include: provider})
DB --> SearchAPI: Services pagines (10/page)
SearchAPI --> SearchPage: {services, total, page}

Client -> SearchPage: Clique sur un service
SearchPage -> Client: Redirect /services/{id}
@enduml
```

---

### 8.2 Sprint 2 — Paiement, Avis, Messagerie, Administration

#### Diagrammes existants applicables :
- **Cas d'utilisation** : Client (§1), Prestataire (§1), Administrateur (§1)
- **Sequence** : Paiement (§3.4), Avis (§3.5), Messagerie (§3.6)
- **Activite** : Cycle paiement (§4.2)

#### 8.2.1 Diagramme de Classes — Sprint 2 (Payment, Review, Message)

```
@startuml
title Sprint 2 — Classes Paiement, Avis, Messagerie

class Payment {
  +id: String
  +bookingId: String
  +method: PaymentMethod {CARD, D17, FLOUCI, CASH}
  +status: PaymentStatus {PENDING, HELD, RELEASED, REFUNDED, FAILED}
  +amount: Float
  +commission: Float
  +providerEarning: Float
  +heldAt: DateTime?
  +releasedAt: DateTime?
  +gatewayRef: String?
  --
  +process()
  +hold()
  +release()
  +refund()
}

class Review {
  +id: String
  +bookingId: String
  +authorId: String
  +targetId: String
  +authorRole: String
  +stars: Int {1..5}
  +qualityRating: Int?
  +punctualityRating: Int?
  +communicationRating: Int?
  +cleanlinessRating: Int?
  +text: String?
  +published: Boolean
  +sentiment: String?
  +flagged: Boolean
  --
  +submit()
  +publish()
  +analyzeSentiment()
}

class Conversation {
  +id: String
  +bookingId: String
  --
  +create()
  +getMessages()
}

class Message {
  +id: String
  +conversationId: String
  +senderId: String
  +content: String
  +imageUrl: String?
  +isRead: Boolean
  +flagged: Boolean
  --
  +send()
  +markRead()
  +moderate()
}

class WithdrawalRequest {
  +id: String
  +providerId: String
  +amount: Float
  +status: String {PENDING, PAID, REJECTED}
}

Booking "1" -- "0..1" Payment
Booking "1" -- "0..2" Review
Booking "1" -- "0..1" Conversation
Conversation "1" -- "*" Message
Provider "1" -- "*" WithdrawalRequest
@enduml
```

#### 8.2.2 Diagramme de Sequence — Checkout Complet

```
@startuml
title Sprint 2 — Flux Checkout (Booking → Paiement)

actor Client
participant "Page Booking" as BookingPage
participant "Page Checkout" as CheckoutPage
participant "processPaymentAction" as PayAction
participant "IPaymentService" as PayService
participant "KonnectPaymentService" as Konnect
participant "Prisma" as DB
participant "Notification" as Notif

== Apres acceptation reservation ==
Client -> BookingPage: Voit booking ACCEPTED
Client -> BookingPage: Clique "Payer maintenant"
BookingPage -> CheckoutPage: Redirect /bookings/{id}/checkout

== Selection methode paiement ==
CheckoutPage -> CheckoutPage: Affiche 4 options\n(Carte, D17, Flouci, Cash)
Client -> CheckoutPage: Selectionne "Carte bancaire"
CheckoutPage -> CheckoutPage: Affiche resume\n(service, montant, commission)

== Traitement paiement ==
Client -> CheckoutPage: Clique "Confirmer et Payer"
CheckoutPage -> PayAction: processPaymentAction({bookingId, method: CARD})
PayAction -> DB: prisma.payment.create({status: PENDING})

alt method === CARD
  PayAction -> PayService: initiatePayment(amount, bookingId)
  PayService -> Konnect: POST /api/v2/payments/init-payment
  Konnect --> PayService: {payUrl, paymentRef}
  PayService -> DB: payment.gatewayRef = paymentRef
  PayService --> CheckoutPage: Redirect payUrl
  note right: Client redirige vers Konnect
  Client -> Konnect: Complete le paiement
  Konnect -> PayAction: POST /api/webhooks/konnect
  PayAction -> Konnect: GET /api/v2/payments/{ref} (verification)
  PayAction -> DB: payment.status = HELD, heldAt = now()
else method === CASH
  PayAction -> DB: payment.status = HELD (immediat)
end

PayAction -> Notif: PAYMENT_RECEIVED → prestataire
PayAction -> Notif: BOOKING_CONFIRMED → client
CheckoutPage -> Client: Redirect /bookings/{id}/confirmation
@enduml
```

#### 8.2.3 Diagramme d'Activite — Publication des Avis

```
@startuml
title Sprint 2 — Cycle Publication Avis Double-Aveugle

start
:Booking passe a COMPLETED;
:Fenetre avis ouverte (10 jours);

fork
  :Client accede a /bookings/{id}/review;
  :Remplit 4 criteres + note globale + texte + photos;
  :submitReviewAction();
  :Analyse sentiment (60% note + 40% mots-cles);
  if (Contenu suspect?) then (oui)
    :Creer rapport automatique;
    :review.flagged = true;
  endif
  :review.published = false;
fork again
  :Prestataire accede a /bookings/{id}/review;
  :Remplit note + texte;
  :submitReviewAction();
  :review.published = false;
end fork

:checkAndPublish(bookingId);

if (2 avis soumis?) then (oui)
  :review1.published = true;
  :review2.published = true;
  :Recalcul provider.rating (moyenne ponderee);
  :Recalcul provider.ratingCount;
  :Regenerer reviewSummary via Groq;
else (1 seul avis)
  :Attendre l'autre partie;
  if (10 jours expires?) then (oui)
    :Cron publie l'avis solo;
    :review.published = true;
  endif
endif

stop
@enduml
```

#### 8.2.4 Diagramme d'Activite — Moderation Messages

```
@startuml
title Sprint 2 — Moderation Automatique Messages

start
:Utilisateur saisit message;
:sendMessageAction({conversationId, content});

:moderateContent(content);

if (Email detecte?\nRegex: [a-z]+@[a-z]+) then (oui)
  :Bloquer message;
  :Erreur "Partage d'email interdit";
  stop
endif

if (Telephone detecte?\nRegex: \\d{8} ou +216) then (oui)
  :Bloquer message;
  :Erreur "Partage de numero interdit";
  stop
endif

if (Reseau social detecte?\nWhatsApp, Telegram, Facebook) then (oui)
  :Bloquer message;
  :Erreur "Partage reseaux sociaux interdit";
  stop
endif

if (Chiffres espaces detectes?\n"2 0 1 2 3 4 5 6") then (oui)
  :Bloquer message (anti-evasion);
  stop
endif

:Message autorise;
:prisma.message.create({content, senderId});
:sendNotification(NEW_MESSAGE, destinataireId);
:Affichage optimistic cote client;

stop
@enduml
```

---

### 8.3 Sprint 3 — Bug Fixes, Pages Publiques, Integration, PFE Readiness

#### Diagrammes existants applicables :
- **Composants** : Architecture 4 couches (§5)
- **Deploiement** : Infrastructure (§6)

#### 8.3.1 Diagramme d'Activite — Navigation Complete (Wiring)

```
@startuml
title Sprint 3 — Flux Navigation Integre

start
:Visiteur arrive sur /;

if (Authentifie?) then (non)
  :Homepage publique;
  :Voir categories, temoignages, top prestataires;

  if (Clique "S'inscrire"?) then (oui)
    :Wizard inscription 3 etapes;
    :Verification email;
    :Login;
  else (recherche)
    :Parcourir categories ou rechercher;
    :Voir profil prestataire (lecture seule);
    :Voir avis, badge KYC, portfolio;
    if (Clique "Reserver"?) then (oui)
      :Redirect /login;
    endif
  endif

else (oui)
  if (role === CLIENT?) then (oui)
    :Dashboard client;
    fork
      :Rechercher → Reserver → Checkout;
      :Payer → Suivi → Evaluer;
    fork again
      :Messages → Conversations;
    fork again
      :Notifications → Centre notifications;
    fork again
      :Favoris → Services sauvegardes;
    end fork

  else if (role === PROVIDER?) then (oui)
    if (KYC non soumis?) then (oui)
      :Banniere KYC obligatoire;
      :Soumettre documents KYC;
    endif
    :Dashboard prestataire;
    fork
      :Gerer services → CRUD;
    fork again
      :Reservations → Accepter/Rejeter/Completer;
    fork again
      :Gains → Historique, Retrait;
    fork again
      :Messages → Conversations;
    end fork

  else (ADMIN)
    :Dashboard admin;
    fork
      :KPIs → Analytics → Export;
    fork again
      :KYC en attente → Review → Approve/Reject;
    fork again
      :Signalements → SLA → Traiter;
    fork again
      :Contenu → FAQ/CGU/Banners;
    end fork
  endif
endif

stop
@enduml
```

#### 8.3.2 Diagramme de Sequence — Seed Data & Demo PFE

```
@startuml
title Sprint 3 — Initialisation Donnees Demo

actor Developpeur
participant "npx prisma db seed" as Seed
participant "seed.ts (920+ lignes)" as SeedScript
participant "Prisma" as DB

Developpeur -> Seed: Lancer seed
Seed -> SeedScript: Execute

== Donnees geographiques ==
SeedScript -> DB: 24 gouvernorats tunisiens
SeedScript -> DB: 264 delegations

== Categories ==
SeedScript -> DB: 12 categories principales\n(Plomberie, Electricite, Menage,\nJardinage, Peinture, Climatisation...)
SeedScript -> DB: 36 sous-categories

== Utilisateurs ==
SeedScript -> DB: 1 admin (admin@tawa.tn)
SeedScript -> DB: 5 clients (noms tunisiens)
SeedScript -> DB: 10 prestataires (KYC APPROVED)

== Contenu ==
SeedScript -> DB: 20+ services (prix 30-500 TND)
SeedScript -> DB: 30+ bookings (tous statuts)
SeedScript -> DB: 50+ avis (1-5 etoiles)
SeedScript -> DB: 20+ messages
SeedScript -> DB: FAQ (18 questions)
SeedScript -> DB: Pages legales (CGU, Confidentialite)

SeedScript --> Seed: Seed complete
Seed --> Developpeur: Base de donnees prete pour demo
@enduml
```

---

### 8.4 Sprint 4 — IA, Performances, Securite, Durcissement

#### Diagrammes existants applicables :
- **Cas d'utilisation** : Administrateur (§1), Systeme (§1)
- **Classe** : Report, Notification (§2)

#### 8.4.1 Diagramme de Cas d'Utilisation — Admin & IA

```
@startuml
title Sprint 4 — Cas d'Utilisation Admin & IA

left to right direction

actor Client
actor Prestataire
actor Administrateur
actor "Systeme IA" as IA

rectangle "Fonctionnalites IA (Sprint 4)" {
  Client --> (Utiliser le chatbot IA)
  Client --> (Voir recommandations personnalisees)
  Client --> (Voir resume IA des avis)

  Prestataire --> (Voir son badge avis positifs)

  Administrateur --> (Voir analytics sentiment)
  Administrateur --> (Voir rapports auto-generes par IA)
  Administrateur --> (Bannir avec motif)

  IA --> (Analyser sentiment des avis)
  IA --> (Generer resume prestataire)
  IA --> (Calculer score recommandation)
  IA --> (Detecter contenu interdit)
  IA --> (Repondre aux questions chatbot)
}
@enduml
```

#### 8.4.2 Diagramme de Sequence — Chatbot IA

```
@startuml
title Sprint 4 — Flux Chatbot IA (Groq)

actor Utilisateur
participant "ChatbotWidget" as Widget
participant "API /chat" as ChatAPI
participant "RateLimiter" as Limiter
participant "Groq SDK" as Groq

Utilisateur -> Widget: Clique icone chatbot (coin bas-droit)
Widget -> Widget: Ouvre fenetre chat

Utilisateur -> Widget: Tape "Comment reserver un service ?"
Widget -> ChatAPI: POST /api/chat {message, history[]}

ChatAPI -> Limiter: Verifier rate limit (20 msg/min)
alt Rate limit depasse
  Limiter --> ChatAPI: 429 Too Many Requests
  ChatAPI --> Widget: "Trop de messages, attendez..."
else OK
  ChatAPI -> ChatAPI: Construire system prompt\n(contexte plateforme, regles)
  ChatAPI -> ChatAPI: Inclure 20 derniers messages (historique)
  ChatAPI -> Groq: chat.completions.create({\n  model: "llama-3.3-70b-versatile",\n  max_tokens: 300,\n  temperature: 0.7,\n  timeout: 5000\n})

  alt Reponse OK
    Groq --> ChatAPI: Reponse en FR ou AR
    ChatAPI --> Widget: {response: "Pour reserver..."}
    Widget -> Widget: Afficher bulle reponse IA
  else Timeout / Erreur
    ChatAPI --> Widget: Message fallback generique
  end
end
@enduml
```

#### 8.4.3 Diagramme de Sequence — Recommandations

```
@startuml
title Sprint 4 — Algorithme Recommandations

actor Client
participant "Page Accueil" as Home
participant "getRecommendations()" as Reco
participant "Prisma" as DB

Client -> Home: Accede a / (authentifie)
Home -> Reco: getRecommendations(userId)

== Collecte donnees ==
Reco -> DB: Historique bookings du client\n(categories, villes)
Reco -> DB: Tous les providers actifs\n(avec rating >= 1)

== Calcul scores ==
loop Pour chaque provider
  Reco -> Reco: score = 0
  Reco -> Reco: Meme categorie que bookings passes? → +30
  Reco -> Reco: Meme ville/delegation? → +25
  Reco -> Reco: KYC verifie? → +20
  Reco -> Reco: Rating >= 4.5? → +15 (ou >= 4.0? → +10)
  Reco -> Reco: > 10 missions completees? → +10
  Reco -> Reco: Deja reserve ce provider? → -5
end

== Tri et selection ==
Reco -> Reco: Trier par score decroissant
Reco -> Reco: Prendre top 6

Reco --> Home: [{provider, score, services}]
Home -> Home: Afficher section "Recommandes pour vous"
Home --> Client: Grille 6 prestataires avec note + prix
@enduml
```

#### 8.4.4 Diagramme de Sequence — Gestion Signalements Admin

```
@startuml
title Sprint 4 — Traitement Signalements avec SLA

actor Utilisateur
actor Administrateur
participant "Page Report" as ReportUI
participant "createReportAction" as Create
participant "Admin Reports" as AdminUI
participant "resolveReportAction" as Resolve
participant "Prisma" as DB
participant "Notification" as Notif

== Creation signalement ==
Utilisateur -> ReportUI: Signaler contenu (avis, message, user, service)
ReportUI -> Create: createReportAction({type, targetId, reason})
Create -> Create: Determiner priorite\n(CRITICAL si menace, IMPORTANT si insulte, MINOR sinon)
Create -> DB: prisma.report.create({priority, status: OPEN})
Create -> Create: Calculer SLA deadline\n(CRITICAL <2h, IMPORTANT <24h, MINOR <48h)
Create -> DB: report.slaDeadline = now + delai

== Traitement admin ==
Administrateur -> AdminUI: Voir liste signalements\n(tries par SLA urgence)
AdminUI -> DB: Report.findMany({orderBy: slaDeadline})
AdminUI --> Administrateur: Liste avec badges priorite + temps restant

Administrateur -> AdminUI: Ouvre signalement
AdminUI -> DB: Report details + contenu signale
Administrateur -> AdminUI: Choisit action

alt Resolve (contenu supprime/user banni)
  Administrateur -> Resolve: resolveReportAction(reportId, {action, notes})
  Resolve -> DB: report.status = RESOLVED
  alt action === BAN_USER
    Resolve -> DB: user.isBanned = true, bannedReason = motif
  else action === DELETE_CONTENT
    Resolve -> DB: Soft delete du contenu signale
  end
  Resolve -> Notif: Notifier signaleur (REPORT_RESOLVED)
else Dismiss (faux positif)
  Administrateur -> Resolve: dismissReportAction(reportId)
  Resolve -> DB: report.status = DISMISSED
end
@enduml
```

#### 8.4.5 Diagramme de Classes — Sprint 4 (Report, Notification, ContactMessage)

```
@startuml
title Sprint 4 — Classes Admin, IA, Notifications

class Report {
  +id: String
  +reporterId: String
  +reportedId: String?
  +type: ReportType {USER, SERVICE, REVIEW, MESSAGE}
  +reason: String
  +priority: ReportPriority {CRITICAL, IMPORTANT, MINOR}
  +status: ReportStatus {OPEN, INVESTIGATING, RESOLVED, DISMISSED}
  +slaDeadline: DateTime?
  +adminNotes: String?
  +resolvedAt: DateTime?
  --
  +create()
  +investigate()
  +resolve()
  +dismiss()
}

class Notification {
  +id: String
  +userId: String
  +type: NotifType
  +title: String
  +body: String?
  +read: Boolean
  +data: Json?
  +createdAt: DateTime
  --
  +create()
  +markRead()
  +markAllRead()
}

class NotificationPreference {
  +id: String
  +userId: String
  +notifType: String
  +inApp: Boolean
  +email: Boolean
  +quietStart: String?
  +quietEnd: String?
}

class ContactMessage {
  +id: String
  +name: String
  +email: String
  +subject: String
  +message: String
  +isRead: Boolean
  +createdAt: DateTime
}

class FAQ {
  +id: String
  +question: String
  +answer: String
  +category: String
  +sortOrder: Int
  +isActive: Boolean
}

class Banner {
  +id: String
  +title: String
  +message: String
  +type: String
  +isActive: Boolean
  +startsAt: DateTime?
  +endsAt: DateTime?
}

User "1" -- "*" Notification
User "1" -- "*" NotificationPreference
User "1" -- "*" Report : reporter
@enduml
```

---

### 8.5 Resume des Diagrammes par Sprint

| Sprint | Use Case | Sequence | Activite | Classe | Deploiement | Total |
|--------|----------|----------|----------|--------|-------------|-------|
| Sprint 1 | 3 (§1) | 3 (§3.1, §3.2, §8.1.3) | 2 (§4.3, §8.1.2) | 1 (§8.1.1) | 1 (§6) | 10 |
| Sprint 2 | 3 (§1) | 2 (§3.4, §8.2.2) | 2 (§8.2.3, §8.2.4) | 1 (§8.2.1) | — | 8 |
| Sprint 3 | — | 1 (§8.3.2) | 1 (§8.3.1) | — | 1 (§6) | 3 |
| Sprint 4 | 1 (§8.4.1) | 3 (§8.4.2, §8.4.3, §8.4.4) | — | 1 (§8.4.5) | — | 5 |
| **Total** | **7** | **9** | **5** | **3** | **2** | **26** |

**Grand total : 17 diagrammes globaux (§1-§7) + 14 diagrammes sprint-specifiques (§8) = 31 diagrammes UML.**
