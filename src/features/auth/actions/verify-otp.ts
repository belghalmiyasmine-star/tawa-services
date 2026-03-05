"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

/**
 * Server action to verify an OTP code for phone verification.
 * Handles: expiry, attempt limits (max 5), and code matching.
 * On success: marks OTP as used and sets user.phoneVerified = true.
 */
export async function verifyOtpAction(
  userId: string,
  code: string,
): Promise<ActionResult<void>> {
  try {
    // Check if phone is already verified
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneVerified: true },
    });
    if (user?.phoneVerified) {
      return { success: false, error: "Votre telephone est deja verifie" };
    }

    // Find the most recent unused OTP for this user that has not expired
    const otp = await prisma.phoneOtp.findFirst({
      where: {
        userId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return { success: false, error: "Code invalide ou expire" };
    }

    // Check attempt limit
    if (otp.attempts >= 5) {
      return {
        success: false,
        error: "Trop de tentatives. Demandez un nouveau code.",
      };
    }

    // Check code match
    if (otp.code !== code) {
      // Increment attempts
      await prisma.phoneOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      return { success: false, error: "Code incorrect" };
    }

    // Code is correct — mark OTP as used and update user.phoneVerified
    const now = new Date();
    await prisma.$transaction([
      prisma.phoneOtp.update({
        where: { id: otp.id },
        data: { usedAt: now },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { phoneVerified: true, phoneVerifiedAt: now },
      }),
    ]);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[verifyOtpAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}
