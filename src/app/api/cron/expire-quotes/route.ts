import { type NextRequest, NextResponse } from "next/server";

import { expireQuotesAction } from "@/features/booking/actions/expire-quotes";
import { env } from "@/env";

// ============================================================
// CRON ENDPOINT: GET /api/cron/expire-quotes
// ============================================================
//
// Called by Vercel Cron every 6 hours (see vercel.json).
// Secondary sweep for PENDING quotes that nobody queries —
// the primary mechanism is the lazy check (checkAndExpireQuote).
//
// Auth: Bearer token matching CRON_SECRET env var.
// In development (CRON_SECRET not set), the request is allowed
// with a warning logged to console.
// ============================================================

export async function GET(request: NextRequest) {
  const cronSecret = env.CRON_SECRET;

  if (cronSecret) {
    // Production: validate CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const expectedToken = `Bearer ${cronSecret}`;

    if (authHeader !== expectedToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }
  } else {
    // Development fallback: no CRON_SECRET set — allow but warn
    console.warn(
      "[cron/expire-quotes] CRON_SECRET not set — running in unauthenticated development mode",
    );
  }

  try {
    const { expired } = await expireQuotesAction();

    return NextResponse.json({
      expired,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/expire-quotes] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
