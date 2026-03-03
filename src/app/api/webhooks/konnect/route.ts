import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

// ============================================================
// KONNECT WEBHOOK
// ============================================================

/**
 * POST /api/webhooks/konnect
 *
 * Called by Konnect after a payment is completed.
 * Updates the payment status from PENDING to HELD (escrow).
 *
 * Konnect sends: { payment_ref: string, ... }
 * We match on payment.gatewayRef to find the right record.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[Konnect Webhook] Received:", JSON.stringify(body));

    const paymentRef = body.payment_ref as string | undefined;

    if (!paymentRef) {
      console.error("[Konnect Webhook] Missing payment_ref in body");
      return NextResponse.json(
        { error: "Missing payment_ref" },
        { status: 400 },
      );
    }

    // Find payment by gateway reference
    const payment = await prisma.payment.findFirst({
      where: { gatewayRef: paymentRef },
    });

    if (!payment) {
      console.error(
        `[Konnect Webhook] No payment found for ref: ${paymentRef}`,
      );
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 },
      );
    }

    // Only update if still PENDING (avoid duplicate webhook processing)
    if (payment.status !== "PENDING") {
      console.log(
        `[Konnect Webhook] Payment ${payment.id} already in status ${payment.status}, skipping`,
      );
      return NextResponse.json({ status: "already_processed" });
    }

    // Verify payment status with Konnect API
    const konnectApiUrl =
      process.env.KONNECT_API_URL || "https://api.konnect.network";
    const konnectApiKey = process.env.KONNECT_API_KEY;

    if (!konnectApiKey) {
      console.error("[Konnect Webhook] KONNECT_API_KEY not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const verifyResponse = await fetch(
      `${konnectApiUrl}/api/v2/payments/${paymentRef}`,
      {
        headers: {
          "x-api-key": konnectApiKey,
        },
      },
    );

    if (!verifyResponse.ok) {
      console.error(
        `[Konnect Webhook] Verification failed (${verifyResponse.status})`,
      );
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 502 },
      );
    }

    const paymentData = await verifyResponse.json();
    const konnectStatus = paymentData.payment?.status as string | undefined;

    if (konnectStatus !== "completed") {
      console.log(
        `[Konnect Webhook] Payment ${paymentRef} status is ${konnectStatus}, not completed`,
      );
      return NextResponse.json({ status: "not_completed" });
    }

    // Payment confirmed — transition to HELD (escrow)
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "HELD",
        heldAt: new Date(),
        paidAt: new Date(),
      },
    });

    console.log(
      `[Konnect Webhook] Payment ${payment.id} for booking ${payment.bookingId} marked as HELD`,
    );

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Konnect Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
