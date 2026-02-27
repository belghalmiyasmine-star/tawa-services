// ============================================================
// MESSAGE AUTO-MODERATION UTILITIES
// ============================================================
//
// These patterns are intentionally duplicated from
// src/features/review/lib/moderation.ts — messaging moderation
// may evolve independently of review moderation over time,
// and the two modules have different blocking semantics.
// ============================================================

// ────────────────────────────────────────────────
// REGEX PATTERNS
// ────────────────────────────────────────────────

/** Email address pattern */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** Tunisian phone number: +216 XX XXX XXX variants (including parentheses and slash separators) */
const PHONE_TN_REGEX =
  /(\+?216[\s./()-]?\d{2}[\s./()-]?\d{3}[\s./()-]?\d{3}|\b\d{2}[\s./()-]?\d{3}[\s./()-]?\d{3}\b)/g;

/** Spaced-out digits anti-evasion: 8 individual digits separated by spaces/dots/dashes */
const SPACED_DIGITS_REGEX = /\b\d[\s.,-]\d[\s.,-]\d[\s.,-]\d[\s.,-]\d[\s.,-]\d[\s.,-]\d[\s.,-]\d\b/g;

/** Obfuscated email evasion: "user at gmail dot com" / "user chez gmail point com" */
const EMAIL_OBFUSCATED_REGEX = /\b\w+\s*(at|chez)\s*\w+\s*(dot|point)\s*\w+\b/gi;

/** Generic phone pattern (0XXXXXXXXX format) */
const PHONE_GENERIC_REGEX = /\b0?\d[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/g;

/** Messaging app mentions */
const MESSAGING_APPS_REGEX = /\b(whatsapp|telegram|viber|signal)\b/gi;

/** Social media platform patterns */
const SOCIAL_MEDIA_REGEX = /\b(facebook\.com|fb\.com|instagram\.com|ig:)\b/gi;

// ────────────────────────────────────────────────
// EXPORTED TYPES
// ────────────────────────────────────────────────

/**
 * Result type returned by moderateMessageContent.
 * - blocked: true if the message was rejected
 * - reason: machine-readable reason string (null if not blocked)
 * - sanitizedContent: the message text to persist (null if blocked)
 */
export type ModerationAction = {
  blocked: boolean;
  reason: string | null;
  sanitizedContent: string | null;
};

// ────────────────────────────────────────────────
// DETECTION FUNCTION
// ────────────────────────────────────────────────

/**
 * Detects contact information in message text.
 * Looks for emails, phone numbers (TN + generic), messaging apps, and social media.
 */
export function detectMessageContactInfo(text: string): {
  hasContact: boolean;
  matches: string[];
} {
  const emailMatches = text.match(EMAIL_REGEX) ?? [];
  const phoneTnMatches = text.match(PHONE_TN_REGEX) ?? [];
  const phoneGenericMatches = text.match(PHONE_GENERIC_REGEX) ?? [];
  const messagingMatches = text.match(MESSAGING_APPS_REGEX) ?? [];
  const socialMatches = text.match(SOCIAL_MEDIA_REGEX) ?? [];
  const spacedDigitsMatches = text.match(SPACED_DIGITS_REGEX) ?? [];
  const emailObfuscatedMatches = text.match(EMAIL_OBFUSCATED_REGEX) ?? [];

  const allMatches = [
    ...emailMatches,
    ...phoneTnMatches,
    ...phoneGenericMatches,
    ...messagingMatches,
    ...socialMatches,
    ...spacedDigitsMatches,
    ...emailObfuscatedMatches,
  ];

  // Deduplicate matches
  const uniqueMatches = [...new Set(allMatches)];

  return {
    hasContact: uniqueMatches.length > 0,
    matches: uniqueMatches,
  };
}

// ────────────────────────────────────────────────
// MODERATION FUNCTION
// ────────────────────────────────────────────────

/**
 * Moderates a message based on its content and the booking status.
 *
 * Policy:
 * - If booking is NOT yet confirmed (PENDING, REJECTED, CANCELLED) AND
 *   the message contains contact info → BLOCK.
 * - If booking IS confirmed (ACCEPTED, IN_PROGRESS, COMPLETED) →
 *   allow the message through even if it contains contact info.
 * - If no contact info detected → allow regardless of booking status.
 *
 * @param text - The message content to moderate.
 * @param bookingStatus - The current status of the associated booking.
 * @returns ModerationAction with blocked flag, reason, and sanitized content.
 */
export function moderateMessageContent(
  text: string,
  bookingStatus: string,
): ModerationAction {
  const { hasContact } = detectMessageContactInfo(text);

  // Booking statuses where contact sharing is permitted (booking confirmed)
  const ALLOWED_STATUSES = new Set(["ACCEPTED", "IN_PROGRESS", "COMPLETED"]);

  const isBookingConfirmed = ALLOWED_STATUSES.has(bookingStatus);

  if (!isBookingConfirmed && hasContact) {
    // Contact info detected before booking confirmation — block the message
    return {
      blocked: true,
      reason: "contact_info_blocked_pre_booking",
      sanitizedContent: null,
    };
  }

  // Either booking is confirmed or no contact info detected — allow the message
  return {
    blocked: false,
    reason: null,
    sanitizedContent: text,
  };
}
