// ============================================================
// ENUMERATIONS (alignees sur prisma/schema.prisma)
// ============================================================

export type Role = "CLIENT" | "PROVIDER" | "ADMIN";

export type KYCStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type ServiceStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "SUSPENDED"
  | "DELETED";

export type PricingType = "FIXED" | "SUR_DEVIS";

export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export type QuoteStatus =
  | "PENDING"
  | "RESPONDED"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED";

export type PaymentStatus =
  | "PENDING"
  | "HELD"
  | "RELEASED"
  | "REFUNDED"
  | "FAILED";

export type PaymentMethod = "CARD" | "D17" | "FLOUCI" | "CASH";

export type NotifType =
  | "BOOKING_REQUEST"
  | "BOOKING_ACCEPTED"
  | "BOOKING_REJECTED"
  | "BOOKING_COMPLETED"
  | "BOOKING_CANCELLED"
  | "QUOTE_RECEIVED"
  | "QUOTE_RESPONDED"
  | "PAYMENT_RECEIVED"
  | "REVIEW_RECEIVED"
  | "KYC_APPROVED"
  | "KYC_REJECTED"
  | "NEW_MESSAGE"
  | "SYSTEM";

export type TrustBadgeType =
  | "IDENTITY_VERIFIED"
  | "QUICK_RESPONSE"
  | "TOP_PROVIDER";

// ============================================================
// ENTITES PRINCIPALES
// ============================================================

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  role: Role;
  emailVerified: boolean;
  phoneVerified: boolean;
  name?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
  provider?: Provider | null;
}

export interface Provider {
  id: string;
  userId: string;
  displayName: string;
  bio?: string | null;
  photoUrl?: string | null;
  phone?: string | null;
  kycStatus: KYCStatus;
  yearsExperience?: number | null;
  languages: string[];
  rating: number;
  ratingCount: number;
  completedMissions: number;
  responseTimeHours?: number | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  services?: Service[];
  trustBadges?: TrustBadge[];
  delegations?: ProviderDelegationWithRelations[];
}

export interface TrustBadge {
  id: string;
  providerId: string;
  badgeType: TrustBadgeType;
  awardedAt: Date;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  icon?: string | null;
  description?: string | null;
  parentId?: string | null;
  parent?: Category | null;
  children?: Category[];
  isActive: boolean;
  sortOrder: number;
}

export interface Service {
  id: string;
  providerId: string;
  categoryId: string;
  title: string;
  description: string;
  pricingType: PricingType;
  fixedPrice?: number | null;
  durationMinutes?: number | null;
  inclusions: string[];
  exclusions: string[];
  conditions?: string | null;
  photoUrls: string[];
  status: ServiceStatus;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  provider?: Provider;
  category?: Category;
}

export interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  status: BookingStatus;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  cancelledBy?: string | null;
  cancelReason?: string | null;
  totalAmount: number;
  clientNote?: string | null;
  providerNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
  client?: User;
  provider?: Provider;
  service?: Service;
  payment?: Payment;
}

export interface Payment {
  id: string;
  bookingId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  commission: number;
  providerEarning: number;
  paidAt?: Date | null;
  releasedAt?: Date | null;
  refundedAt?: Date | null;
  invoiceUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  bookingId: string;
  authorId: string;
  targetId: string;
  authorRole: "CLIENT" | "PROVIDER";
  stars: number;
  qualityRating?: number | null;
  punctualityRating?: number | null;
  communicationRating?: number | null;
  cleanlinessRating?: number | null;
  text?: string | null;
  photoUrls: string[];
  published: boolean;
  publishedAt?: Date | null;
  flagged: boolean;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotifType;
  title: string;
  body?: string | null;
  read: boolean;
  readAt?: Date | null;
  data?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Gouvernorat {
  id: string;
  name: string;
  nameAr?: string | null;
  code?: string | null;
  delegations?: Delegation[];
}

export interface Delegation {
  id: string;
  name: string;
  nameAr?: string | null;
  gouvernoratId: string;
  gouvernorat?: Gouvernorat;
}

export interface ProviderDelegationWithRelations {
  id: string;
  providerId: string;
  delegationId: string;
  delegation?: Delegation;
}
