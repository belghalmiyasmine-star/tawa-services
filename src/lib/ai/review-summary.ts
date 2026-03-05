// ============================================================
// AI REVIEW SUMMARY GENERATOR (Groq API)
// ============================================================

import { env } from "@/env";
import { prisma } from "@/lib/prisma";

interface ReviewInput {
  text: string;
  stars: number;
}

/**
 * Generate a 2-3 sentence summary of reviews using Groq API.
 * Returns null if the API call fails or no API key is configured.
 */
export async function generateReviewSummary(
  reviews: ReviewInput[],
): Promise<string | null> {
  if (!env.GROQ_API_KEY || reviews.length === 0) {
    return null;
  }

  // Build the user message with review data
  const reviewsText = reviews
    .map((r, i) => `Avis ${i + 1} (${r.stars}/5): ${r.text}`)
    .join("\n");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "Tu es un assistant qui resume les avis clients en francais. Genere un resume de 2-3 phrases des avis suivants. Mentionne les points forts et les axes d'amelioration. Sois concis et objectif.",
            },
            {
              role: "user",
              content: reviewsText,
            },
          ],
          max_tokens: 200,
          temperature: 0.3,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(
        "[generateReviewSummary] Groq API error:",
        response.status,
        await response.text(),
      );
      return null;
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();
    return summary || null;
  } catch (error) {
    console.error("[generateReviewSummary] Error:", error);
    return null;
  }
}

/**
 * Regenerate and cache the review summary for a provider.
 * Called when new reviews are published.
 */
export async function regenerateProviderSummary(
  providerId: string,
): Promise<void> {
  try {
    // Fetch recent published reviews for this provider
    const reviews = await prisma.review.findMany({
      where: {
        booking: { providerId },
        published: true,
        isDeleted: false,
        flagged: false,
        text: { not: null },
        authorRole: "CLIENT",
      },
      select: { text: true, stars: true },
      orderBy: { publishedAt: "desc" },
      take: 20, // Use last 20 reviews for context
    });

    if (reviews.length < 3) {
      // Not enough reviews for a meaningful summary
      return;
    }

    const summary = await generateReviewSummary(
      reviews.map((r) => ({ text: r.text!, stars: r.stars })),
    );

    if (summary) {
      await prisma.provider.update({
        where: { id: providerId },
        data: { reviewSummary: summary },
      });
    }
  } catch (error) {
    // Non-critical — don't break the flow
    console.error("[regenerateProviderSummary] Error:", error);
  }
}
