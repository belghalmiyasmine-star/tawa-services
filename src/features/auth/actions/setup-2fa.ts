"use server";

import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";

/**
 * Generate a TOTP secret and QR code for 2FA setup.
 * Stores the secret temporarily in totpSecretTemp until confirmed.
 */
export async function setup2faAction(
  method: "TOTP" | "SMS",
): Promise<
  ActionResult<{
    qrCodeUrl?: string;
    secret?: string;
    otpauthUri?: string;
  }>
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, twoFactorEnabled: true },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    if (method === "SMS") {
      // For SMS: just store the preference — OTP is sent on each login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorMethod: "SMS",
        },
      });
      return { success: true, data: {} };
    }

    // TOTP: generate a random secret
    const totpSecret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: "Tawa Services",
      label: user.email ?? user.id,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: totpSecret,
    });

    const otpauthUri = totp.toString();
    const secretBase32 = totpSecret.base32;

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(otpauthUri);

    // Store secret temporarily — confirmed on next step
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecretTemp: secretBase32 },
    });

    return {
      success: true,
      data: {
        qrCodeUrl,
        secret: secretBase32,
        otpauthUri,
      },
    };
  } catch (error) {
    console.error("[setup2faAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

/**
 * Confirm 2FA TOTP setup by verifying a valid code against the temp secret.
 * On success: activates 2FA and stores the verified secret.
 */
export async function confirm2faAction(
  code: string,
): Promise<ActionResult<void>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, totpSecretTemp: true },
    });

    if (!user?.totpSecretTemp) {
      return { success: false, error: "Aucune configuration 2FA en cours" };
    }

    // Verify the code against the temporary secret
    const totp = new OTPAuth.TOTP({
      issuer: "Tawa Services",
      label: user.email ?? user.id,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.totpSecretTemp),
    });

    const delta = totp.validate({ token: code.replace(/\s/g, ""), window: 1 });

    if (delta === null) {
      return { success: false, error: "Code invalide. Veuillez reessayer." };
    }

    // Activate 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorMethod: "TOTP",
        totpSecret: user.totpSecretTemp,
        totpSecretTemp: null,
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[confirm2faAction] Error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
