"use server";

import bcryptjs from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { registerSchema } from "@/lib/validations/auth";
import type { ActionResult } from "@/types/api";

/**
 * Server action for user registration.
 * Validates input, checks email/phone uniqueness, hashes password,
 * creates User record and Provider record (if role is PROVIDER).
 */
export async function registerAction(
  data: unknown,
  locale: string = "fr",
): Promise<ActionResult<{ userId: string }>> {
  // 1. Parse and validate input
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    const firstError =
      parsed.error.errors[0]?.message ?? "Donnees invalides";
    return { success: false, error: firstError };
  }

  const { firstName, lastName, email, phone, password, role } = parsed.data;

  try {
    // 2. Check email uniqueness
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingByEmail) {
      return { success: false, error: "Cet email est deja utilise" };
    }

    // 3. Check phone uniqueness
    const existingByPhone = await prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (existingByPhone) {
      return { success: false, error: "Ce numero est deja utilise" };
    }

    // 4. Hash password with bcrypt (12 rounds)
    const passwordHash = await bcryptjs.hash(password, 12);

    // 5. Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        phone,
        name: `${firstName} ${lastName}`,
        role,
      },
      select: { id: true, role: true },
    });

    // 6. If role is PROVIDER, create Provider record
    if (role === "PROVIDER") {
      await prisma.provider.create({
        data: {
          userId: user.id,
          displayName: `${firstName} ${lastName}`,
        },
      });
    }

    // 7. Send email verification link
    try {
      const token = crypto.randomUUID();
      await prisma.emailVerification.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      await sendVerificationEmail(email, token, locale);
    } catch (emailError) {
      // Non-blocking: user can still resend from the banner
      console.error("[registerAction] Email verification send failed:", emailError);
    }

    return { success: true, data: { userId: user.id } };
  } catch (error) {
    console.error("[registerAction] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez reessayer.",
    };
  }
}
