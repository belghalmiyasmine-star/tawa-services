# Schema de Base de Donnees — Tawa Services

## Vue d'ensemble

- **ORM** : Prisma v7
- **SGBD** : PostgreSQL 15+
- **Strategie d'ID** : CUID (cuid())
- **Soft delete** : `isDeleted` + `deletedAt` sur la majorite des modeles
- **Timestamps** : `createdAt` (auto), `updatedAt` (@updatedAt)

---

## Enumerations

| Enum | Valeurs |
|------|---------|
| `Role` | `CLIENT`, `PROVIDER`, `ADMIN` |
| `KYCStatus` | `NOT_SUBMITTED`, `PENDING`, `APPROVED`, `REJECTED` |
| `ServiceStatus` | `DRAFT`, `PENDING_APPROVAL`, `ACTIVE`, `SUSPENDED`, `DELETED` |
| `PricingType` | `FIXED`, `SUR_DEVIS` |
| `BookingStatus` | `PENDING`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`, `CANCELLED` |
| `QuoteStatus` | `PENDING`, `RESPONDED`, `ACCEPTED`, `DECLINED`, `EXPIRED` |
| `PaymentStatus` | `PENDING`, `HELD`, `RELEASED`, `REFUNDED`, `FAILED` |
| `PaymentMethod` | `CARD`, `D17`, `FLOUCI`, `CASH` |
| `NotifType` | `BOOKING_REQUEST`, `BOOKING_ACCEPTED`, `BOOKING_REJECTED`, `BOOKING_COMPLETED`, `BOOKING_CANCELLED`, `QUOTE_RECEIVED`, `QUOTE_RESPONDED`, `PAYMENT_RECEIVED`, `REVIEW_RECEIVED`, `KYC_APPROVED`, `KYC_REJECTED`, `NEW_MESSAGE`, `SYSTEM` |
| `ReportPriority` | `CRITICAL` (SLA <2h), `IMPORTANT` (SLA <24h), `MINOR` (SLA <48h) |
| `ReportStatus` | `OPEN`, `INVESTIGATING`, `RESOLVED`, `DISMISSED` |
| `ReportType` | `USER`, `SERVICE`, `REVIEW`, `MESSAGE` |

---

## Modeles

### Localisation

#### Gouvernorat
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| name | String | @unique |
| nameAr | String? | |
| code | String? | @unique |
| delegations | Delegation[] | Relation 1:N |
| createdAt | DateTime | @default(now()) |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `gouvernorats`

#### Delegation
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| name | String | |
| nameAr | String? | |
| gouvernoratId | String | FK → Gouvernorat |
| providers | ProviderDelegation[] | Relation M:N via pivot |
| createdAt | DateTime | @default(now()) |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `delegations` — Contrainte unique: `[name, gouvernoratId]`

---

### Utilisateurs & Authentification

#### User
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| email | String | @unique |
| passwordHash | String? | Nullable pour OAuth |
| phone | String? | @unique |
| role | Role | @default(CLIENT) |
| emailVerified | Boolean | @default(false) |
| emailVerifiedAt | DateTime? | Timestamp verification |
| phoneVerified | Boolean | @default(false) |
| phoneVerifiedAt | DateTime? | Timestamp verification |
| name | String? | |
| avatarUrl | String? | |
| isActive | Boolean | @default(true) |
| isBanned | Boolean | @default(false) |
| bannedAt | DateTime? | |
| bannedReason | String? | |
| failedLoginAttempts | Int | @default(0) |
| lockedUntil | DateTime? | Verrouillage progressif |
| twoFactorEnabled | Boolean | @default(false) |
| twoFactorMethod | String? | "TOTP" ou "SMS" |
| totpSecret | String? | Secret TOTP chiffre |
| totpSecretTemp | String? | Secret temporaire pendant configuration |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `users`

**Relations** : provider (1:1), clientBookings (1:N), clientQuotes (1:N), sentMessages (1:N), notifications (1:N), notificationPrefs (1:1), accounts (1:N), sessions (1:N), emailVerifications (1:N), passwordResets (1:N), loginRecords (1:N), reportsMade (1:N), reportsReceived (1:N), favorites (1:N)

#### Account (OAuth)
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| userId | String | FK → User (Cascade) |
| type | String | |
| provider | String | |
| providerAccountId | String | |
| refresh_token | String? | @db.Text |
| access_token | String? | @db.Text |
| expires_at | Int? | |
| token_type | String? | |
| scope | String? | |
| id_token | String? | @db.Text |
| session_state | String? | |

Table: `accounts` — Contrainte unique: `[provider, providerAccountId]`

#### Session
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| sessionToken | String | @unique |
| userId | String | FK → User (Cascade) |
| expires | DateTime | |

Table: `sessions`

#### VerificationToken
| Champ | Type | Contraintes |
|-------|------|-------------|
| identifier | String | |
| token | String | @unique |
| expires | DateTime | |

Table: `verification_tokens` — Contrainte unique: `[identifier, token]`

#### EmailVerification
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| userId | String | FK → User (Cascade) |
| token | String | @unique |
| expiresAt | DateTime | |
| usedAt | DateTime? | |
| createdAt | DateTime | @default(now()) |

Table: `email_verifications`

#### PasswordReset
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| userId | String | FK → User (Cascade) |
| token | String | @unique |
| expiresAt | DateTime | |
| usedAt | DateTime? | |
| createdAt | DateTime | @default(now()) |

Table: `password_resets`

#### PhoneOtp
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| userId | String | Index |
| phone | String | |
| code | String | |
| expiresAt | DateTime | |
| usedAt | DateTime? | |
| attempts | Int | @default(0), max 5 |
| createdAt | DateTime | @default(now()) |

Table: `phone_otps` — Index: `[userId]`, `[phone, code]`

#### LoginRecord
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| userId | String | FK → User (Cascade), Index |
| ip | String? | |
| userAgent | String? | |
| country | String? | |
| city | String? | |
| isNew | Boolean | @default(false) |
| createdAt | DateTime | @default(now()) |

Table: `login_records`

---

### Profil Prestataire

#### Provider
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| userId | String | @unique, FK → User (Cascade) |
| displayName | String | |
| bio | String? | @db.Text |
| photoUrl | String? | |
| phone | String? | |
| kycStatus | KYCStatus | @default(NOT_SUBMITTED) |
| kycSubmittedAt | DateTime? | |
| kycApprovedAt | DateTime? | |
| kycRejectedAt | DateTime? | |
| kycRejectedReason | String? | |
| yearsExperience | Int? | |
| languages | String[] | @default([]) |
| rating | Float | @default(0) |
| ratingCount | Int | @default(0) |
| completedMissions | Int | @default(0) |
| responseTimeHours | Float? | |
| responseRate | Float? | Pourcentage 0-100 |
| reviewSummary | String? | @db.Text, Resume IA cache |
| isActive | Boolean | @default(true) |
| isFeatured | Boolean | @default(false) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `providers`

**Relations** : services (1:N), availabilities (1:N), blockedDates (1:N), certifications (1:N), kycDocuments (1:N), delegations (M:N via pivot), providerBookings (1:N), trustBadges (1:N), portfolioPhotos (1:N)

#### ProviderDelegation (Table pivot)
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| providerId | String | FK → Provider (Cascade) |
| delegationId | String | FK → Delegation |

Table: `provider_delegations` — Contrainte unique: `[providerId, delegationId]`

#### TrustBadge
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| providerId | String | FK → Provider (Cascade) |
| badgeType | String | "IDENTITY_VERIFIED", "QUICK_RESPONSE", "TOP_PROVIDER" |
| awardedAt | DateTime | @default(now()) |
| isActive | Boolean | @default(true) |

Table: `trust_badges` — Contrainte unique: `[providerId, badgeType]`

#### Availability
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| providerId | String | FK → Provider (Cascade) |
| dayOfWeek | Int | 0=Dimanche, 6=Samedi |
| startTime | String | Format "HH:MM" |
| endTime | String | Format "HH:MM" |
| isActive | Boolean | @default(true) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

Table: `availabilities` — Contrainte unique: `[providerId, dayOfWeek]`

#### BlockedDate
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| providerId | String | FK → Provider (Cascade) |
| date | DateTime | @db.Date |
| reason | String? | |
| createdAt | DateTime | @default(now()) |

Table: `blocked_dates` — Contrainte unique: `[providerId, date]`

#### Certification
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| providerId | String | FK → Provider (Cascade) |
| title | String | |
| fileUrl | String | |
| issuedAt | DateTime? | |
| createdAt | DateTime | @default(now()) |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `certifications`

#### PortfolioPhoto
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| providerId | String | FK → Provider (Cascade) |
| photoUrl | String | |
| caption | String? | @db.VarChar(200) |
| sortOrder | Int | @default(0) |
| createdAt | DateTime | @default(now()) |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `portfolio_photos`

---

### KYC

#### KYCDocument
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| providerId | String | FK → Provider (Cascade) |
| docType | String | "CIN_RECTO", "CIN_VERSO", "SELFIE", "PROOF_OF_ADDRESS" |
| fileUrl | String | |
| uploadedAt | DateTime | @default(now()) |
| adminNote | String? | |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `kyc_documents`

---

### Categories & Services

#### Category
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| name | String | |
| nameAr | String? | |
| slug | String | @unique |
| icon | String? | Nom icone lucide-react |
| description | String? | |
| parentId | String? | FK auto-reference |
| parent | Category? | Relation parent |
| children | Category[] | Sous-categories |
| isActive | Boolean | @default(true) |
| sortOrder | Int | @default(0) |
| services | Service[] | Relation 1:N |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `categories`

#### Service
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| providerId | String | FK → Provider (Cascade) |
| categoryId | String | FK → Category |
| title | String | @db.VarChar(80) |
| description | String | @db.Text |
| pricingType | PricingType | FIXED ou SUR_DEVIS |
| fixedPrice | Float? | Requis si FIXED |
| durationMinutes | Int? | |
| inclusions | String[] | @default([]) |
| exclusions | String[] | @default([]) |
| conditions | String? | @db.Text |
| photoUrls | String[] | @default([]) |
| status | ServiceStatus | @default(DRAFT) |
| isFeatured | Boolean | @default(false) |
| viewCount | Int | @default(0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `services`

**Relations** : bookings (1:N), quotes (1:N), favorites (1:N)

---

### Favoris

#### Favorite
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| userId | String | FK → User (Cascade) |
| serviceId | String | FK → Service (Cascade) |
| createdAt | DateTime | @default(now()) |

Table: `favorites` — Contrainte unique: `[userId, serviceId]`

---

### Reservations & Devis

#### Booking
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| clientId | String | FK → User |
| providerId | String | FK → Provider |
| serviceId | String | FK → Service |
| status | BookingStatus | @default(PENDING) |
| scheduledAt | DateTime? | |
| completedAt | DateTime? | |
| cancelledAt | DateTime? | |
| cancelledBy | String? | "CLIENT" ou "PROVIDER" |
| cancelReason | String? | |
| totalAmount | Float | |
| clientNote | String? | @db.Text |
| providerNote | String? | @db.Text |
| quoteId | String? | @unique, FK → Quote |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `bookings`

**Relations** : payment (1:1), reviews (1:N), conversation (1:1), quote (1:1 optionnel)

#### Quote
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| clientId | String | FK → User |
| serviceId | String | FK → Service |
| status | QuoteStatus | @default(PENDING) |
| description | String | @db.Text |
| address | String? | |
| city | String? | |
| preferredDate | DateTime? | |
| budget | Float? | |
| proposedPrice | Float? | |
| proposedDelay | String? | |
| expiresAt | DateTime | 48h apres creation |
| respondedAt | DateTime? | |
| acceptedAt | DateTime? | |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `quotes`

---

### Paiements

#### Payment
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| bookingId | String | @unique, FK → Booking |
| method | PaymentMethod | CARD, D17, FLOUCI, CASH |
| status | PaymentStatus | @default(PENDING) |
| amount | Float | Montant total TND |
| commission | Float | @default(0), 12% |
| providerEarning | Float | @default(0), 88% |
| paidAt | DateTime? | |
| heldAt | DateTime? | Escrow |
| releasedAt | DateTime? | |
| refundedAt | DateTime? | |
| refundAmount | Float? | |
| gatewayRef | String? | Reference Konnect |
| invoiceUrl | String? | |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `payments`

#### WithdrawalRequest
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| providerId | String | |
| paymentId | String | @unique, FK → Payment |
| amount | Float | |
| status | String | @default("PENDING") : PENDING, APPROVED, REJECTED, PAID |
| requestedAt | DateTime | @default(now()) |
| processedAt | DateTime? | |
| adminNote | String? | |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `withdrawal_requests`

---

### Avis

#### Review
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| bookingId | String | FK → Booking |
| authorId | String | ID de l'auteur |
| targetId | String | ID de la cible |
| authorRole | String | "CLIENT" ou "PROVIDER" |
| stars | Int | 1-5 |
| qualityRating | Int? | 1-5 |
| punctualityRating | Int? | 1-5 |
| communicationRating | Int? | 1-5 |
| cleanlinessRating | Int? | 1-5 |
| text | String? | @db.Text |
| photoUrls | String[] | @default([]), max 3 |
| published | Boolean | @default(false) |
| publishedAt | DateTime? | |
| sentiment | String? | POSITIVE, NEUTRAL, NEGATIVE |
| flagged | Boolean | @default(false) |
| flaggedReason | String? | |
| moderatedAt | DateTime? | |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `reviews` — Contrainte unique: `[bookingId, authorId]`

---

### Messagerie

#### Conversation
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| bookingId | String | @unique, FK → Booking |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `conversations`

#### Message
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| conversationId | String | FK → Conversation (Cascade) |
| senderId | String | FK → User |
| content | String | @db.Text |
| imageUrl | String? | URL piece jointe image |
| isRead | Boolean | @default(false) |
| readAt | DateTime? | |
| flagged | Boolean | @default(false) |
| flaggedReason | String? | |
| createdAt | DateTime | @default(now()) |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `messages`

---

### Notifications

#### Notification
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| userId | String | FK → User (Cascade) |
| type | NotifType | |
| title | String | |
| body | String? | |
| read | Boolean | @default(false) |
| readAt | DateTime? | |
| data | Json? | Donnees contextuelles |
| createdAt | DateTime | @default(now()) |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `notifications`

#### NotificationPreference
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| userId | String | @unique, FK → User (Cascade) |
| emailEnabled | Boolean | @default(true) |
| inAppEnabled | Boolean | @default(true) |
| quietHoursStart | String? | Format "HH:MM" |
| quietHoursEnd | String? | Format "HH:MM" |
| disabledTypes | String[] | @default([]) |
| updatedAt | DateTime | @updatedAt |

Table: `notification_preferences`

---

### Administration

#### Report
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| reporterId | String | FK → User |
| reportedId | String? | FK → User (nullable) |
| type | ReportType | USER, SERVICE, REVIEW, MESSAGE |
| reason | String | @db.Text |
| description | String? | @db.Text |
| priority | ReportPriority | @default(MINOR) |
| status | ReportStatus | @default(OPEN) |
| adminNote | String? | @db.Text |
| assignedTo | String? | Admin userId |
| referenceId | String? | ID de l'objet signale |
| slaDeadline | DateTime? | Calcule selon priorite |
| resolvedAt | DateTime? | |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `reports`

#### Faq
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| question | String | @db.Text |
| answer | String | @db.Text |
| category | String? | "general", "booking", "payment", "provider" |
| sortOrder | Int | @default(0) |
| isActive | Boolean | @default(true) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `faqs`

#### LegalPage
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| slug | String | @unique : "cgu", "privacy", "legal-mentions" |
| title | String | |
| content | String | @db.Text |
| updatedBy | String? | Admin userId |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

Table: `legal_pages`

#### ContactMessage
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| name | String | |
| email | String | |
| subject | String | |
| message | String | @db.Text |
| isRead | Boolean | @default(false) |
| createdAt | DateTime | @default(now()) |

Table: `contact_messages`

#### Banner
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | String | @id @default(cuid()) |
| title | String | |
| subtitle | String? | |
| imageUrl | String? | |
| linkUrl | String? | |
| position | String | @default("homepage") : homepage, search, category |
| isActive | Boolean | @default(true) |
| sortOrder | Int | @default(0) |
| startDate | DateTime? | |
| endDate | DateTime? | |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| isDeleted | Boolean | @default(false) |
| deletedAt | DateTime? | |

Table: `banners`

---

## Relations Entite-Association (ERD)

```
User (1) ────────── (0..1) Provider
User (1) ────────── (N)    Account          [OAuth providers]
User (1) ────────── (N)    Session
User (1) ────────── (N)    EmailVerification
User (1) ────────── (N)    PasswordReset
User (1) ────────── (N)    LoginRecord
User (1) ────────── (N)    Notification
User (1) ────────── (0..1) NotificationPreference
User (1) ────────── (N)    Booking          [en tant que client]
User (1) ────────── (N)    Quote            [en tant que client]
User (1) ────────── (N)    Message          [messages envoyes]
User (1) ────────── (N)    Report           [signalements faits]
User (1) ────────── (N)    Report           [signalements recus]
User (1) ────────── (N)    Favorite

Provider (1) ──────── (N)  Service
Provider (1) ──────── (N)  Availability
Provider (1) ──────── (N)  BlockedDate
Provider (1) ──────── (N)  Certification
Provider (1) ──────── (N)  KYCDocument
Provider (1) ──────── (N)  TrustBadge
Provider (1) ──────── (N)  PortfolioPhoto
Provider (1) ──────── (N)  Booking          [en tant que prestataire]
Provider (M) ──────── (N)  Delegation       [via ProviderDelegation]

Gouvernorat (1) ───── (N)  Delegation

Category (1) ──────── (N)  Service
Category (1) ──────── (N)  Category         [sous-categories, auto-reference]

Service (1) ────────── (N) Booking
Service (1) ────────── (N) Quote
Service (1) ────────── (N) Favorite

Booking (1) ────────── (0..1) Payment
Booking (1) ────────── (N)    Review         [max 2 : client + provider]
Booking (1) ────────── (0..1) Conversation
Booking (1) ────────── (0..1) Quote

Conversation (1) ──── (N) Message

Payment (1) ────────── (0..1) WithdrawalRequest
```

---

## Index et Contraintes Cles

| Table | Index / Contrainte |
|-------|-------------------|
| `users` | UNIQUE(email), UNIQUE(phone) |
| `accounts` | UNIQUE(provider, providerAccountId) |
| `sessions` | UNIQUE(sessionToken) |
| `verification_tokens` | UNIQUE(identifier, token), UNIQUE(token) |
| `email_verifications` | UNIQUE(token) |
| `password_resets` | UNIQUE(token) |
| `phone_otps` | INDEX(userId), INDEX(phone, code) |
| `login_records` | INDEX(userId) |
| `providers` | UNIQUE(userId) |
| `provider_delegations` | UNIQUE(providerId, delegationId) |
| `trust_badges` | UNIQUE(providerId, badgeType) |
| `availabilities` | UNIQUE(providerId, dayOfWeek) |
| `blocked_dates` | UNIQUE(providerId, date) |
| `categories` | UNIQUE(slug) |
| `services` | — |
| `favorites` | UNIQUE(userId, serviceId) |
| `bookings` | UNIQUE(quoteId) |
| `quotes` | — |
| `payments` | UNIQUE(bookingId) |
| `withdrawal_requests` | UNIQUE(paymentId) |
| `reviews` | UNIQUE(bookingId, authorId) |
| `conversations` | UNIQUE(bookingId) |
| `notification_preferences` | UNIQUE(userId) |
| `legal_pages` | UNIQUE(slug) |

---

## Nombre Total de Modeles

- **30 modeles** Prisma
- **16 enumerations**
- **Tables PostgreSQL** : 30 (mapping @@map)
