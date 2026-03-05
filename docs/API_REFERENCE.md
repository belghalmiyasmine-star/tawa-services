# Reference API — Tawa Services

## Routes REST (17 endpoints)

### Authentification

| Methode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | - | Handler NextAuth.js (login, logout, session, callback OAuth) |

### Chatbot IA

| Methode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/chat` | Non (rate limit 20/min par session) | Envoi message au chatbot Groq. Body: `{ message: string, history: Message[], sessionId: string }` |

### Taches Planifiees (CRON)

| Methode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/cron/expire-quotes` | CRON_SECRET header | Expire les devis PENDING depasses. Execution: toutes les 6h |
| GET | `/api/cron/reviews` | CRON_SECRET header | Ferme les fenetres d'avis expirees (10 jours), publie les avis solo. Execution: quotidienne 2h |

### Upload Fichiers

| Methode | Endpoint | Auth | Params | Description |
|---------|----------|------|--------|-------------|
| POST | `/api/kyc/upload` | PROVIDER | FormData: file (image, max 5MB) | Upload document KYC |
| POST | `/api/messages/upload` | Authentifie | FormData: file (jpg/png/webp, max 5MB) | Upload image pour chat |
| POST | `/api/provider/certification` | PROVIDER | FormData: file (image/pdf, max 10MB), title | Upload certification |
| POST | `/api/provider/photo` | PROVIDER | FormData: file (image, max 5MB) | Upload/mise a jour photo profil |
| POST | `/api/provider/portfolio` | PROVIDER | FormData: file (image, max 5MB), caption? | Ajout photo portfolio (max 10) |
| DELETE | `/api/provider/portfolio` | PROVIDER | Query: photoId | Suppression photo portfolio |
| POST | `/api/review/photos` | Authentifie | FormData: file (image, max 5MB) | Upload photo avis (max 3) |
| POST | `/api/service/photos` | PROVIDER | FormData: file (image, max 5MB), serviceId | Ajout photo service (max 10) |
| DELETE | `/api/service/photos` | PROVIDER | Query: photoUrl, serviceId | Suppression photo service |

### Recherche

| Methode | Endpoint | Auth | Params | Description |
|---------|----------|------|--------|-------------|
| GET | `/api/search/autocomplete` | Public | Query: q (min 2 chars) | Suggestions: top 3 categories + top 5 services |
| GET | `/api/search/categories` | Public | - | Toutes les categories actives avec counts services (take: 50) |
| GET | `/api/search/services` | Public | Query: category, city, delegation, minPrice, maxPrice, verified, sort, page, limit | Recherche services paginee avec filtres |

### Provider

| Methode | Endpoint | Auth | Params | Description |
|---------|----------|------|--------|-------------|
| GET | `/api/provider/availability` | Public | Query: providerId, month, year | Disponibilites hebdomadaires + dates bloquees + reservations existantes |

### Admin

| Methode | Endpoint | Auth | Params | Description |
|---------|----------|------|--------|-------------|
| GET | `/api/admin/export` | ADMIN | Query: type (users/services/transactions/revenue/reports/analytics), format (csv/pdf), startDate?, endDate? | Export donnees en CSV ou PDF |

### Webhooks

| Methode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/webhooks/konnect` | Webhook signature | Callback Konnect: met a jour Payment PENDING → HELD |

---

## Server Actions (88 actions)

### Authentification (12 actions)

| Action | Fichier | Parametres | Retour | Auth | Description |
|--------|---------|-----------|--------|------|-------------|
| `registerAction` | `auth/actions/register.ts` | `{ name, email, password, phone, role }` | `{ success, userId?, error? }` | Non | Inscription avec hash bcrypt, creation Provider si role=PROVIDER |
| `forgotPasswordAction` | `auth/actions/forgot-password.ts` | `{ email }` | `{ success }` | Non | Genere token 1h, envoie email reset |
| `resetPasswordAction` | `auth/actions/reset-password.ts` | `{ token, password }` | `{ success, error? }` | Non | Reinitialise mot de passe via token |
| `changePasswordAction` | `auth/actions/change-password.ts` | `{ currentPassword, newPassword }` | `{ success, error? }` | Authentifie | Change mot de passe avec verification ancien |
| `verifyEmailAction` | `auth/actions/verify-email.ts` | `{ token }` | `{ success, error? }` | Non | Verification email (atomique: marque verifie + token utilise) |
| `verifyOtpAction` | `auth/actions/verify-otp.ts` | `{ userId, phone, code }` | `{ success, error? }` | Non | Verification OTP telephone (5 tentatives max) |
| `sendOtpAction` | `auth/actions/send-otp.ts` | `{ userId, phone }` | `{ success }` | Non | Genere et envoie OTP SMS (expire 5 min) |
| `sendVerificationEmailAction` | `auth/actions/send-verification-email.ts` | `{ userId }` | `{ success }` | Non | Envoie email verification (expire 24h) |
| `setOAuthRoleAction` | `auth/actions/set-oauth-role.ts` | `{ userId, role }` | `{ success }` | Authentifie | Definit role pour utilisateur OAuth premiere connexion |
| `setup2faAction` | `auth/actions/setup-2fa.ts` | `{ method }` | `{ secret?, qrCode?, success }` | Authentifie | Configure 2FA TOTP (genere QR code) ou SMS |
| `confirm2faAction` | `auth/actions/setup-2fa.ts` | `{ code }` | `{ success }` | Authentifie | Confirme configuration TOTP avec code de verification |
| `disable2faAction` | `auth/actions/disable-2fa.ts` | `{ password }` | `{ success }` | Authentifie | Desactive 2FA avec verification mot de passe |
| `verify2faLoginAction` | `auth/actions/verify-2fa.ts` | `{ userId, code, method }` | `{ success }` | Non | Verifie code 2FA pendant connexion |

### Reservations (11 actions)

| Action | Fichier | Parametres | Auth | Description |
|--------|---------|-----------|------|-------------|
| `createBookingAction` | `booking/actions/manage-bookings.ts` | `{ serviceId, scheduledAt, clientNote? }` | CLIENT | Cree reservation avec verification disponibilite |
| `acceptBookingAction` | `booking/actions/manage-bookings.ts` | `{ bookingId }` | PROVIDER | Accepte reservation PENDING |
| `rejectBookingAction` | `booking/actions/manage-bookings.ts` | `{ bookingId, reason? }` | PROVIDER | Rejette reservation PENDING |
| `startBookingAction` | `booking/actions/manage-bookings.ts` | `{ bookingId }` | PROVIDER | Demarre reservation ACCEPTED → IN_PROGRESS |
| `completeBookingAction` | `booking/actions/manage-bookings.ts` | `{ bookingId }` | PROVIDER | Termine reservation + libere paiement (12% commission) |
| `cancelBookingAction` | `booking/actions/cancel-booking.ts` | `{ bookingId, reason? }` | CLIENT | Annule reservation (remboursement selon politique) |
| `cancelBookingProviderAction` | `booking/actions/cancel-booking.ts` | `{ bookingId, reason? }` | PROVIDER | Annule reservation (remboursement 100% client) |
| `createQuoteAction` | `booking/actions/manage-quotes.ts` | `{ serviceId, description, address?, budget?, preferredDate? }` | CLIENT | Demande devis (expire 48h) |
| `respondQuoteAction` | `booking/actions/manage-quotes.ts` | `{ quoteId, proposedPrice, proposedDelay? }` | PROVIDER | Repond au devis avec prix propose |
| `acceptQuoteAction` | `booking/actions/manage-quotes.ts` | `{ quoteId, scheduledAt }` | CLIENT | Accepte devis et cree reservation |
| `declineQuoteAction` | `booking/actions/manage-quotes.ts` | `{ quoteId }` | CLIENT | Decline devis |

### Requetes Reservations (5 actions)

| Action | Fichier | Auth | Description |
|--------|---------|------|-------------|
| `getClientBookingsAction` | `booking/actions/booking-queries.ts` | CLIENT | Reservations client paginees avec filtre statut |
| `getProviderBookingsAction` | `booking/actions/booking-queries.ts` | PROVIDER | Reservations prestataire paginees avec filtre statut |
| `getBookingDetailAction` | `booking/actions/booking-queries.ts` | CLIENT/PROVIDER | Detail complet reservation + service + paiement |
| `getClientQuotesAction` | `booking/actions/booking-queries.ts` | CLIENT | Devis client avec filtre statut |
| `getProviderQuotesAction` | `booking/actions/booking-queries.ts` | PROVIDER | Devis prestataire avec filtre statut |

### Paiements (6 actions)

| Action | Fichier | Auth | Description |
|--------|---------|------|-------------|
| `processPaymentAction` | `payment/actions/payment-actions.ts` | CLIENT | Initie paiement (PENDING → HELD) |
| `releasePaymentAction` | `payment/actions/payment-actions.ts` | Systeme | Libere paiement avec commission 12% |
| `getPaymentByBookingAction` | `payment/actions/payment-actions.ts` | CLIENT/PROVIDER | Detail paiement par booking |
| `getProviderEarningsAction` | `payment/actions/earnings-queries.ts` | PROVIDER | Resume gains (disponible, en attente, total, commission) |
| `getMonthlyBreakdownAction` | `payment/actions/earnings-queries.ts` | PROVIDER | Ventilation mensuelle des gains |
| `getTransactionHistoryAction` | `payment/actions/earnings-queries.ts` | PROVIDER | Historique transactions (HELD, RELEASED, REFUNDED) |

### Factures (2 actions)

| Action | Fichier | Auth | Description |
|--------|---------|------|-------------|
| `getInvoiceDataAction` | `payment/actions/invoice-actions.ts` | CLIENT/PROVIDER | Donnees facture pour un booking |
| `getMonthlyStatementAction` | `payment/actions/invoice-actions.ts` | PROVIDER | Releve mensuel avec liste transactions |

### Retraits (2 actions)

| Action | Fichier | Auth | Description |
|--------|---------|------|-------------|
| `requestWithdrawalAction` | `payment/actions/withdrawal-actions.ts` | PROVIDER | Demande retrait (min 50 TND) |
| `getWithdrawalRequestsAction` | `payment/actions/withdrawal-actions.ts` | PROVIDER | Liste demandes de retrait |

### Avis (7 actions)

| Action | Fichier | Auth | Description |
|--------|---------|------|-------------|
| `submitReviewAction` | `review/actions/review-actions.ts` | CLIENT/PROVIDER | Soumet avis avec analyse sentiment automatique |
| `moderateReviewAction` | `review/actions/review-actions.ts` | ADMIN | Approuve/rejette avis signale |
| `getBookingReviewsAction` | `review/actions/review-queries.ts` | Authentifie | Avis d'un booking (publies ou par l'auteur) |
| `getProviderReviewsAction` | `review/actions/review-queries.ts` | Public | Avis publies d'un prestataire avec moyennes |
| `getProviderRatingDistribution` | `review/actions/review-queries.ts` | Public | Distribution des etoiles (1-5) |
| `getReviewWindowAction` | `review/actions/review-queries.ts` | Authentifie | Statut fenetre d'avis (peut evaluer, en attente, publie, ferme) |
| `getFlaggedReviewsAction` | `review/actions/review-queries.ts` | ADMIN | Avis signales en attente de moderation |

### Messagerie (6 actions)

| Action | Fichier | Auth | Description |
|--------|---------|------|-------------|
| `sendMessageAction` | `messaging/actions/message-actions.ts` | Authentifie | Envoie message avec moderation contenu |
| `markMessagesAsReadAction` | `messaging/actions/message-actions.ts` | Authentifie | Marque messages comme lus |
| `getConversationsAction` | `messaging/actions/conversation-queries.ts` | Authentifie | Liste conversations triees par dernier message |
| `getConversationMessagesAction` | `messaging/actions/conversation-queries.ts` | Authentifie | Messages pagines par curseur |
| `getUnreadCountAction` | `messaging/actions/conversation-queries.ts` | Authentifie | Nombre total messages non lus |
| `getOrCreateConversationAction` | `messaging/actions/conversation-queries.ts` | Authentifie | Obtient ou cree conversation pour un booking |

### Notifications (5 actions)

| Action | Fichier | Auth | Description |
|--------|---------|------|-------------|
| `markNotificationReadAction` | `notification/actions/notification-actions.ts` | Authentifie | Marque notification comme lue |
| `markAllNotificationsReadAction` | `notification/actions/notification-actions.ts` | Authentifie | Marque toutes les notifications comme lues |
| `updateNotificationPreferencesAction` | `notification/actions/notification-actions.ts` | Authentifie | Met a jour preferences (email, in-app, heures silence) |
| `getNotificationsAction` | `notification/actions/notification-queries.ts` | Authentifie | Notifications paginees (toutes/non lues) |
| `getUnreadNotificationCountAction` | `notification/actions/notification-queries.ts` | Authentifie | Nombre notifications non lues |

### KYC (4 actions)

| Action | Fichier | Auth | Description |
|--------|---------|------|-------------|
| `submitKycAction` | `kyc/actions/submit-kyc.ts` | PROVIDER | Soumet documents KYC (atomique) |
| `approveKycAction` | `kyc/actions/review-kyc.ts` | ADMIN | Approuve KYC + badge IDENTITY_VERIFIED |
| `rejectKycAction` | `kyc/actions/review-kyc.ts` | ADMIN | Rejette KYC avec motif |
| `getKycSubmissions` | `kyc/actions/review-kyc.ts` | ADMIN | Liste soumissions KYC en attente |

### Prestataire (11 actions)

| Action | Fichier | Auth | Description |
|--------|---------|------|-------------|
| `updateProfileAction` | `provider/actions/update-profile.ts` | PROVIDER | Met a jour profil (nom, bio, tel, experience, langues) |
| `updateZonesAction` | `provider/actions/manage-zones.ts` | PROVIDER | Met a jour zones d'intervention |
| `createServiceAction` | `provider/actions/manage-services.ts` | PROVIDER (KYC requis) | Cree service |
| `updateServiceAction` | `provider/actions/manage-services.ts` | PROVIDER | Met a jour service |
| `toggleServiceStatusAction` | `provider/actions/manage-services.ts` | PROVIDER | Active/desactive service |
| `deleteServiceAction` | `provider/actions/manage-services.ts` | PROVIDER | Supprime service (soft) |
| `getProviderServicesAction` | `provider/actions/manage-services.ts` | PROVIDER | Liste services du prestataire |
| `updateAvailabilityAction` | `provider/actions/manage-availability.ts` | PROVIDER | Met a jour planning hebdomadaire |
| `updateBlockedDatesAction` | `provider/actions/manage-availability.ts` | PROVIDER | Met a jour dates bloquees |
| `addCertificationAction` | `provider/actions/manage-certifications.ts` | PROVIDER | Ajoute certification |
| `deleteCertificationAction` | `provider/actions/manage-certifications.ts` | PROVIDER | Supprime certification |

### Admin (20+ actions)

| Action | Fichier | Auth | Description |
|--------|---------|------|-------------|
| `getAdminUsersAction` | `admin/actions/admin-queries.ts` | ADMIN | Utilisateurs pagines avec filtres |
| `getAdminServicesAction` | `admin/actions/admin-queries.ts` | ADMIN | Services pagines avec filtres |
| `getAdminReportsAction` | `admin/actions/admin-queries.ts` | ADMIN | Signalements tries par priorite |
| `getAdminStatsAction` | `admin/actions/admin-queries.ts` | ADMIN | Statistiques dashboard (KPIs) |
| `getUserDetailAction` | `admin/actions/admin-queries.ts` | ADMIN | Detail utilisateur complet |
| `getReportDetailAction` | `admin/actions/admin-queries.ts` | ADMIN | Detail signalement avec contexte |
| `getAnalyticsDataAction` | `admin/actions/analytics-queries.ts` | ADMIN | KPIs analytiques avec periode |
| `getSentimentStatsAction` | `admin/actions/analytics-queries.ts` | ADMIN | Stats sentiment avis avec tendance |
| `banUserAction` | `admin/actions/admin-actions.ts` | ADMIN | Bannir utilisateur avec motif |
| `unbanUserAction` | `admin/actions/admin-actions.ts` | ADMIN | Debannir utilisateur |
| `approveServiceAction` | `admin/actions/admin-actions.ts` | ADMIN | Approuver service (PENDING → ACTIVE) |
| `suspendServiceAction` | `admin/actions/admin-actions.ts` | ADMIN | Suspendre service |
| `updateReportAction` | `admin/actions/admin-actions.ts` | ADMIN | Mettre a jour statut signalement |
| `getCommissionOverviewAction` | `admin/actions/commission-queries.ts` | ADMIN | Vue d'ensemble commissions |
| `createCategoryAction` | `admin/actions/category-actions.ts` | ADMIN | Creer categorie |
| `updateCategoryAction` | `admin/actions/category-actions.ts` | ADMIN | Modifier categorie |
| `deleteCategoryAction` | `admin/actions/category-actions.ts` | ADMIN | Supprimer categorie |

### Divers (3 actions)

| Action | Fichier | Auth | Description |
|--------|---------|------|-------------|
| `toggleFavoriteAction` | `favorite/actions/toggle-favorite.ts` | Authentifie | Toggle favori service |
| `expireQuotesAction` | `booking/actions/expire-quotes.ts` | CRON | Expire devis en lot |
| `submitContactFormAction` | `contact/contact-action.ts` | Non | Soumet formulaire contact |
