import { prisma } from "@/lib/prisma";

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

/**
 * Check if the current login looks suspicious (new IP or user-agent).
 * Compares against the last 10 login records for this user.
 * Returns true if the IP or user-agent has never been seen before.
 */
export async function checkSuspiciousLogin(
  userId: string,
  ip: string,
  userAgent: string,
): Promise<boolean> {
  try {
    const previousLogins = await prisma.loginRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { ip: true, userAgent: true },
    });

    // First-time login: not suspicious (no history yet)
    if (previousLogins.length === 0) {
      return false;
    }

    const knownIps = new Set(previousLogins.map((r) => r.ip).filter(Boolean));
    const knownUserAgents = new Set(
      previousLogins.map((r) => r.userAgent).filter(Boolean),
    );

    const isNewIp = ip !== "unknown" && !knownIps.has(ip);
    const isNewUserAgent =
      userAgent !== "unknown" && !knownUserAgents.has(userAgent);

    // Suspicious if both IP AND user-agent are new (avoids false positives from browser updates)
    return isNewIp && isNewUserAgent;
  } catch (error) {
    console.error("[checkSuspiciousLogin] Error:", error);
    return false; // Fail safe: don't block login on detection errors
  }
}

/**
 * Record a new login for a user.
 * TODO: Add IP geolocation via ipapi.co or similar for city/country data.
 */
export async function recordLogin(
  userId: string,
  ip: string,
  userAgent: string,
): Promise<void> {
  try {
    const previousLogins = await prisma.loginRecord.findMany({
      where: { userId },
      take: 1,
      select: { ip: true, userAgent: true },
    });

    const isNew =
      previousLogins.length === 0 ||
      (ip !== "unknown" &&
        userAgent !== "unknown" &&
        !previousLogins.some((r) => r.ip === ip && r.userAgent === userAgent));

    await prisma.loginRecord.create({
      data: {
        userId,
        ip: ip !== "unknown" ? ip : null,
        userAgent: userAgent !== "unknown" ? userAgent : null,
        isNew,
      },
    });
  } catch (error) {
    console.error("[recordLogin] Error:", error);
    // Don't throw — logging should not break the login flow
  }
}

/**
 * Send an email notification when a suspicious login is detected.
 * Uses the existing Resend email service with a dev console fallback.
 */
export async function sendSuspiciousLoginEmail(
  userEmail: string,
  ip: string,
  userAgent: string,
  locale: string,
): Promise<void> {
  const changePasswordUrl = `${APP_URL}/${locale}/auth/forgot-password`;

  // Dynamic import to avoid circular deps
  const { Resend } = await import("resend");
  const { env } = await import("@/env");

  if (!env.RESEND_API_KEY) {
    console.warn("[suspicious-login] RESEND_API_KEY not set — email not sent.");
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const fromEmail =
    process.env.NODE_ENV === "production"
      ? "Tawa Services <noreply@tawa-services.com>"
      : "Tawa Services <onboarding@resend.dev>";

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Nouvelle connexion detectee</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h1 style="font-size: 24px; color: #dc2626; margin-bottom: 8px;">Nouvelle connexion detectee</h1>
        <p style="color: #6b7280; font-size: 16px; margin-bottom: 16px;">
          Une nouvelle connexion a ete detectee sur votre compte <strong>Tawa Services</strong> depuis un nouvel appareil ou une nouvelle adresse IP.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px; background: #f3f4f6; font-weight: 600; color: #374151;">Adresse IP</td>
            <td style="padding: 8px; color: #6b7280;">${ip}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: 600; color: #374151;">Navigateur</td>
            <td style="padding: 8px; color: #6b7280; word-break: break-all;">${userAgent.substring(0, 100)}</td>
          </tr>
        </table>
        <p style="color: #374151; font-size: 15px; margin-bottom: 24px;">
          Si c'etait bien vous, ignorez cet email. Si vous ne reconnaissez pas cette connexion, changez immediatement votre mot de passe.
        </p>
        <a
          href="${changePasswordUrl}"
          style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: 600;"
        >
          Changer mon mot de passe
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          Tawa Services — La plateforme de services locaux en Tunisie
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: userEmail,
      subject: "Nouvelle connexion detectee — Tawa Services",
      html,
    });
  } catch (error) {
    console.error("[sendSuspiciousLoginEmail] Failed to send:", error);
  }
}
