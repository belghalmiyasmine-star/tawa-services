// ============================================================
// CONSTANTES METIER TAWA SERVICES
// ============================================================

// Commission plateforme (12%)
export const COMMISSION_RATE = 0.12;

// Limites service
export const MAX_SERVICE_PHOTOS = 5;
export const SERVICE_TITLE_MAX_LENGTH = 80;
export const SERVICE_DESCRIPTION_MIN_LENGTH = 150;
export const SERVICE_DESCRIPTION_MAX_LENGTH = 1000;

// Limites review
export const MAX_REVIEW_PHOTOS = 3;
export const REVIEW_SUBMISSION_WINDOW_DAYS = 10;

// Politique d'annulation
export const FULL_REFUND_HOURS_THRESHOLD = 48;
export const PARTIAL_REFUND_HOURS_THRESHOLD = 24;
export const PARTIAL_REFUND_RATE = 0.5; // 50% rembourse entre 24h et 48h

// Paiements
export const MIN_WITHDRAWAL_AMOUNT_TND = 50;

// KYC
export const KYC_ADMIN_RESPONSE_HOURS = 48;

// Devis (quotes)
export const QUOTE_EXPIRY_HOURS = 48;

// Messagerie
export const MESSAGE_HISTORY_MONTHS = 12;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

// Validation
export const PASSWORD_MIN_LENGTH = 8;
export const PHONE_REGEX_TUNISIA = /^(\+216\s?)?[2-9]\d{7}$|^\d{8}$/;

// Gouvernorats de Tunisie (24 gouvernorats)
export const TUNISIA_GOUVERNORATS = [
  "Ariana",
  "Beja",
  "Ben Arous",
  "Bizerte",
  "Gabes",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kebili",
  "Kef",
  "Mahdia",
  "Manouba",
  "Medenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
] as const;

export type TunisiaGouvernorat = (typeof TUNISIA_GOUVERNORATS)[number];

// Methodes de paiement disponibles
export const PAYMENT_METHODS = ["CARD", "D17", "FLOUCI", "CASH"] as const;

// Categories principales placeholder (sera remplace par donnees DB en Phase 5)
export const MAIN_CATEGORIES = [
  { slug: "maison", icon: "Home", label: "Maison & Renovation" },
  { slug: "plomberie", icon: "Wrench", label: "Plomberie" },
  { slug: "electricite", icon: "Zap", label: "Electricite" },
  { slug: "menage", icon: "Sparkles", label: "Menage & Nettoyage" },
  { slug: "cours", icon: "BookOpen", label: "Cours & Soutien scolaire" },
  { slug: "jardinage", icon: "Leaf", label: "Jardinage" },
  { slug: "peinture", icon: "Paintbrush", label: "Peinture & Decoration" },
  { slug: "informatique", icon: "Monitor", label: "Informatique" },
] as const;
