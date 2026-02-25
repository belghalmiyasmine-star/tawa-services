import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/env";
import { checkAndCloseExpiredWindows } from "@/features/review/lib/publication";

// ============================================================
// CRON ENDPOINT: GET /api/cron/reviews
// ============================================================
//
// Called by Vercel Cron daily at 2 AM (see vercel.json).
// Finds COMPLETED bookings whose 10-day review window expired
// in the last 24 hours and publishes any outstanding solo reviews
// (bookings where only one party submitted a review).
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
      "[cron/reviews] CRON_SECRET not set — running in unauthenticated development mode",
    );
  }

  try {
    const { processed, published } = await checkAndCloseExpiredWindows();

    return NextResponse.json({
      ok: true,
      processed,
      published,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/reviews] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
