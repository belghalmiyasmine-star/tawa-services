"use server";

import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

/**
 * Server action to generate and send an email verification link.
 * Creates an EmailVerification record (24h expiry) and sends the email.
 */
export async function sendVerificationEmailAction(
  userId: string,
  userEmail: string,
  locale: string = "fr",
): Promise<ActionResult<void>> {
  try {
    // Generate unique token
    const token = crypto.randomUUID();

    // Create EmailVerification record (24 hours expiry)
    await prisma.emailVerification.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send the verification email
    await sendVerificationEmail(userEmail, token, locale);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[sendVerificationEmailAction] Error:", error);
    return {
      success: false,
      error: "Impossible d'envoyer l'email de verification. Veuillez reessayer.",
    };
  }
}
