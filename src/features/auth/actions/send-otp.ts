"use server";

import { prisma } from "@/lib/prisma";
import { smsService } from "@/lib/sms";
import type { ActionResult } from "@/types/api";

/**
 * Server action to generate and send an OTP code to the user's phone.
 * Invalidates any previous OTPs for this user before creating a new one.
 * OTP expires after 5 minutes.
 */
export async function sendOtpAction(
  userId: string,
  phone: string,
): Promise<ActionResult<void>> {
  try {
    // Invalidate any existing unused OTPs for this user
    await prisma.phoneOtp.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Create new OTP record with 5-minute expiry
    await prisma.phoneOtp.create({
      data: {
        userId,
        phone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // Send OTP via SMS service (simulated in dev — logs to console)
    await smsService.sendOtp(phone, code);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[sendOtpAction] Error:", error);
    return {
      success: false,
      error: "Erreur lors de l'envoi du code. Veuillez reessayer.",
    };
  }
}
