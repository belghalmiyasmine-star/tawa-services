"use server";

// ============================================================
// QUOTE AUTO-EXPIRATION LOGIC
// ============================================================
//
// Two mechanisms:
//   1. checkAndExpireQuote(quoteId) — lazy check, run before any quote operation
//   2. expireQuotesAction()         — batch sweep, called by cron every 6h
// ============================================================

import { prisma } from "@/lib/prisma";

// ============================================================
// FUNCTION 1: checkAndExpireQuote (lazy expiration check)
// ============================================================

/**
 * Check a single quote and expire it if past its expiresAt.
 *
 * Used as a lazy expiration guard before any quote read/mutation:
 *   const expired = await checkAndExpireQuote(quoteId);
 *   if (expired) return { error: "Quote has expired" };
 *
 * @param quoteId - The ID of the quote to check
 * @returns true if the quote was just expired, false otherwise
 */
export async function checkAndExpireQuote(quoteId: string): Promise<boolean> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, status: true, expiresAt: true },
  });

  if (!quote) {
    return false;
  }

  // Only expire PENDING quotes that have passed their expiry
  if (quote.status === "PENDING" && quote.expiresAt < new Date()) {
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: "EXPIRED" },
    });
    return true;
  }

  return false;
}

// ============================================================
// FUNCTION 2: expireQuotesAction (batch cron sweep)
// ============================================================

/**
 * Batch-expire all PENDING quotes whose expiresAt is in the past.
 *
 * No session check — this is called exclusively by the cron endpoint
 * which handles its own authorization via CRON_SECRET.
 *
 * @returns Object with count of expired quotes
 */
export async function expireQuotesAction(): Promise<{ expired: number }> {
  const now = new Date();

  const result = await prisma.quote.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
      isDeleted: false,
    },
    data: {
      status: "EXPIRED",
    },
  });

  return { expired: result.count };
}
