// ============================================================
// REVIEW AUTO-MODERATION UTILITIES
// ============================================================

/**
 * Result of contact info detection in review text.
 */
export interface ContactDetectionResult {
  hasContact: boolean;
  matches: string[];
}

/**
 * Result of full content moderation.
 */
export interface ModerationResult {
  flagged: boolean;
  reason: string | null;
  spamScore: number;
}

// ────────────────────────────────────────────────
// REGEX PATTERNS
// ────────────────────────────────────────────────

/** Email address pattern */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/** Tunisian phone number: +216 XX XXX XXX variants */
const PHONE_TN_REGEX =
  /(\+?216[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{3}|\b\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b)/g;

/** Generic phone pattern (0XXXXXXXXX format) */
const PHONE_GENERIC_REGEX = /\b0?\d[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/g;

/** Messaging app mentions */
const MESSAGING_APPS_REGEX = /\b(whatsapp|telegram|viber|signal)\b/gi;

/** Social media platform patterns */
const SOCIAL_MEDIA_REGEX = /\b(facebook\.com|fb\.com|instagram\.com|ig:)\b/gi;

// ────────────────────────────────────────────────
// DETECTION FUNCTIONS
// ────────────────────────────────────────────────

/**
 * Detects contact information in review text.
 * Looks for emails, phone numbers (TN + generic), messaging apps, and social media.
 */
export function detectContactInfo(text: string): ContactDetectionResult {
  const matches: string[] = [];

  // Reset lastIndex for global regexes before use
  const emailMatches = text.match(EMAIL_REGEX) ?? [];
  const phoneTnMatches = text.match(PHONE_TN_REGEX) ?? [];
  const phoneGenericMatches = text.match(PHONE_GENERIC_REGEX) ?? [];
  const messagingMatches = text.match(MESSAGING_APPS_REGEX) ?? [];
  const socialMatches = text.match(SOCIAL_MEDIA_REGEX) ?? [];

  matches.push(...emailMatches, ...phoneTnMatches, ...phoneGenericMatches, ...messagingMatches, ...socialMatches);

  // Deduplicate matches
  const uniqueMatches = [...new Set(matches)];

  return {
    hasContact: uniqueMatches.length > 0,
    matches: uniqueMatches,
  };
}

/**
 * Computes a spam score for the given text (0–100).
 *
 * Scoring breakdown:
 * - ALL CAPS ratio > 50% → +30
 * - Excessive punctuation (multiple !!! or ???) → +20
 * - Repeated characters (e.g. "aaaa") → +15
 * - Very short sentences repeated → +20
 * - Contact info detected → +40
 */
export function computeSpamScore(text: string): number {
  let score = 0;

  if (!text || text.trim().length === 0) return 0;

  // 1. ALL CAPS ratio
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 0) {
    const uppercaseLetters = text.replace(/[^A-Z]/g, "");
    const capsRatio = uppercaseLetters.length / letters.length;
    if (capsRatio > 0.5) {
      score += 30;
    }
  }

  // 2. Excessive punctuation (3+ consecutive ! or ?)
  const excessivePunctuation = /[!?]{3,}/g;
  if (excessivePunctuation.test(text)) {
    score += 20;
  }

  // 3. Repeated characters (same char 4+ times in a row)
  const repeatedChars = /(.)\1{3,}/g;
  if (repeatedChars.test(text)) {
    score += 15;
  }

  // 4. Very short sentences repeated (< 20 chars, duplicated 2+ times)
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && s.length < 20);

  if (sentences.length > 0) {
    const sentenceCounts = new Map<string, number>();
    for (const sentence of sentences) {
      sentenceCounts.set(sentence, (sentenceCounts.get(sentence) ?? 0) + 1);
    }
    const hasRepeatedShortSentence = [...sentenceCounts.values()].some((count) => count >= 2);
    if (hasRepeatedShortSentence) {
      score += 20;
    }
  }

  // 5. Contact info detected → +40
  const { hasContact } = detectContactInfo(text);
  if (hasContact) {
    score += 40;
  }

  return Math.min(score, 100);
}

/**
 * Full moderation check on review text.
 * Returns flagged status, human-readable reason, and spam score.
 */
export function moderateReviewContent(text: string): ModerationResult {
  const { hasContact, matches } = detectContactInfo(text);
  const spamScore = computeSpamScore(text);

  const flagged = hasContact || spamScore > 60;

  let reason: string | null = null;

  if (hasContact && spamScore > 60) {
    reason = `Informations de contact détectées (${matches.join(", ")}) et score spam élevé (${spamScore}/100)`;
  } else if (hasContact) {
    reason = `Informations de contact détectées: ${matches.join(", ")}`;
  } else if (spamScore > 60) {
    reason = `Score de spam élevé: ${spamScore}/100 — contenu potentiellement indésirable`;
  }

  return {
    flagged,
    reason,
    spamScore,
  };
}
