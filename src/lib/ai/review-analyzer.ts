// ============================================================
// AI REVIEW SENTIMENT ANALYSIS + AUTO-FLAGGING
// ============================================================
// Keyword-based detection (no API needed)

export type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";
export type Severity = "CRITICAL" | "IMPORTANT" | "MINOR" | null;

export interface AnalysisResult {
  flagged: boolean;
  reasons: string[];
  sentiment: Sentiment;
  severity: Severity;
}

// ────────────────────────────────────────────────
// KEYWORD LISTS
// ────────────────────────────────────────────────

const FRENCH_INSULTS = [
  "con",
  "merde",
  "putain",
  "nul",
  "arnaque",
  "voleur",
  "menteur",
  "escroc",
  "connard",
  "enculé",
  "encule",
  "salaud",
  "ordure",
  "crétin",
  "cretin",
  "idiot",
  "imbécile",
  "imbecile",
  "dégueulasse",
  "degueulasse",
];

const ARABIC_INSULTS = [
  "كلب",
  "حمار",
  "زنديق",
  "قحبة",
  "نيك",
  "خول",
  "زبي",
  "عاهرة",
  "منيوك",
  "كلبة",
  "حقير",
  "وسخ",
  "بهيم",
  "تفو",
  "يلعن",
  // Common Tunisian dialect
  "ماو",
  "بوزبال",
  "نعل",
  "زطلة",
  "كحبة",
  "زقفة",
];

const THREAT_KEYWORDS_FR = [
  "je vais te tuer",
  "je vais te frapper",
  "je te menace",
  "tu vas le regretter",
  "tu vas payer",
  "je sais ou tu habites",
  "je sais où tu habites",
  "violence",
  "mort",
  "détruire",
  "detruire",
];

const THREAT_KEYWORDS_AR = [
  "نقتلك",
  "نضربك",
  "نحرقك",
  "موت",
  "دم",
];

const POSITIVE_WORDS_FR = [
  "excellent",
  "parfait",
  "rapide",
  "professionnel",
  "merci",
  "bravo",
  "super",
  "génial",
  "genial",
  "formidable",
  "impeccable",
  "satisfait",
  "recommande",
  "top",
  "magnifique",
  "efficace",
  "ponctuel",
  "propre",
  "qualité",
  "qualite",
];

const POSITIVE_WORDS_AR = [
  "ممتاز",
  "بركة",
  "ماشاء الله",
  "عظيم",
  "رائع",
  "جيد",
  "شكرا",
  "يعطيك الصحة",
];

const NEGATIVE_WORDS_FR = [
  "mauvais",
  "lent",
  "nul",
  "déçu",
  "decu",
  "horrible",
  "catastrophe",
  "arnaque",
  "incompétent",
  "incompetent",
  "retard",
  "sale",
  "pire",
  "jamais",
  "éviter",
  "eviter",
  "problème",
  "probleme",
];

const NEGATIVE_WORDS_AR = [
  "سيء",
  "خايب",
  "ماعجبنيش",
  "بطيء",
  "غالي",
];

// Contact info patterns
const PHONE_REGEX = /(\+?216[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{3}|\b\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b)/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const SOCIAL_REGEX = /\b(facebook|fb|instagram|insta|snapchat|whatsapp|telegram|viber)(\.com)?\b/gi;

// ────────────────────────────────────────────────
// DETECTION HELPERS
// ────────────────────────────────────────────────

function containsWord(text: string, words: string[]): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const word of words) {
    // For Arabic words, check direct inclusion
    if (/[\u0600-\u06FF]/.test(word)) {
      if (text.includes(word)) found.push(word);
    } else {
      // For Latin words, check word boundaries
      const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
      if (regex.test(lower)) found.push(word);
    }
  }
  return found;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(text: string, words: string[]): number {
  return containsWord(text, words).length;
}

// ────────────────────────────────────────────────
// MAIN ANALYSIS FUNCTION
// ────────────────────────────────────────────────

/**
 * Analyze a review for sentiment, insults, threats, and spam.
 * Pure keyword-based — no API calls needed.
 */
export function analyzeReview(text: string, stars: number): AnalysisResult {
  const reasons: string[] = [];
  let severity: Severity = null;

  if (!text || text.trim().length === 0) {
    return {
      flagged: false,
      reasons: [],
      sentiment: stars >= 4 ? "POSITIVE" : stars >= 3 ? "NEUTRAL" : "NEGATIVE",
      severity: null,
    };
  }

  // 1. Detect threats (CRITICAL)
  const threatsFr = containsWord(text, THREAT_KEYWORDS_FR);
  const threatsAr = containsWord(text, THREAT_KEYWORDS_AR);
  if (threatsFr.length > 0 || threatsAr.length > 0) {
    reasons.push("Menaces/violence detectees");
    severity = "CRITICAL";
  }

  // 2. Detect insults (IMPORTANT)
  const insultsFr = containsWord(text, FRENCH_INSULTS);
  const insultsAr = containsWord(text, ARABIC_INSULTS);
  if (insultsFr.length > 0 || insultsAr.length > 0) {
    reasons.push("Langage inapproprie detecte");
    if (!severity || severity !== "CRITICAL") {
      severity = "IMPORTANT";
    }
  }

  // 3. Detect contact info (MINOR)
  const hasPhone = PHONE_REGEX.test(text);
  PHONE_REGEX.lastIndex = 0;
  const hasEmail = EMAIL_REGEX.test(text);
  EMAIL_REGEX.lastIndex = 0;
  const hasSocial = SOCIAL_REGEX.test(text);
  SOCIAL_REGEX.lastIndex = 0;

  if (hasPhone || hasEmail || hasSocial) {
    reasons.push("Informations de contact detectees");
    if (!severity) {
      severity = "MINOR";
    }
  }

  // 4. Compute sentiment
  // Stars weight 60% + keyword analysis 40%
  const positiveCount = countMatches(text, [...POSITIVE_WORDS_FR, ...POSITIVE_WORDS_AR]);
  const negativeCount = countMatches(text, [...NEGATIVE_WORDS_FR, ...NEGATIVE_WORDS_AR]);

  // Stars-based score: 5 stars = 1.0, 1 star = 0.0
  const starsScore = (stars - 1) / 4; // 0.0 to 1.0

  // Keyword-based score: net positive ratio
  const totalKeywords = positiveCount + negativeCount;
  let keywordScore = 0.5; // neutral default
  if (totalKeywords > 0) {
    keywordScore = positiveCount / totalKeywords;
  }

  // Combined score: 60% stars + 40% keywords
  const combinedScore = starsScore * 0.6 + keywordScore * 0.4;

  let sentiment: Sentiment;
  if (combinedScore >= 0.6) {
    sentiment = "POSITIVE";
  } else if (combinedScore >= 0.4) {
    sentiment = "NEUTRAL";
  } else {
    sentiment = "NEGATIVE";
  }

  const flagged = reasons.length > 0;

  return {
    flagged,
    reasons,
    sentiment,
    severity: flagged ? severity : null,
  };
}
