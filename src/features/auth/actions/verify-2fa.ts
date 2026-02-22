"use server";

import * as OTPAuth from "otpauth";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

/**
 * Verify a 2FA code during login.
 * For TOTP: verify against user.totpSecret using otpauth.
 * For SMS: verify against PhoneOtp record (reuses existing OTP logic).
 */
export async function verify2faLoginAction(
  userId: string,
  code: string,
  method: "TOTP" | "SMS",
): Promise<ActionResult<void>> {
  try {
    if (method === "TOTP") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, totpSecret: true, twoFactorEnabled: true },
      });

      if (!user?.totpSecret || !user.twoFactorEnabled) {
        return { success: false, error: "2FA non configure" };
      }

      const totp = new OTPAuth.TOTP({
        issuer: "Tawa Services",
        label: user.email ?? user.id,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(user.totpSecret),
      });

      const delta = totp.validate({ token: code.replace(/\s/g, ""), window: 1 });

      if (delta === null) {
        return { success: false, error: "Code invalide. Veuillez reessayer." };
      }

      return { success: true, data: undefined };
    }

    // SMS method: reuse existing PhoneOtp verification
    if (method === "SMS") {
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

      if (otp.attempts >= 5) {
        return {
          success: false,
          error: "Trop de tentatives. Demandez un nouveau code.",
        };
      }

      if (otp.code !== code) {
        await prisma.phoneOtp.update({
          where: { id: otp.id },
          data: { attempts: { increment: 1 } },
        });
        return { success: false, error: "Code incorrect" };
      }

      await prisma.phoneOtp.update({
        where: { id: otp.id },
        data: { usedAt: new Date() },
      });

      return { success: true, data: undefined };
    }

    return { success: false, error: "Methode 2FA non reconnue" };
  } catch (error) {
    console.error("[verify2faLoginAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}
