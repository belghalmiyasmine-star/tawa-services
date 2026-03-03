import { Resend } from "resend";

import { env } from "@/env";

// Initialize Resend client only if API key is available
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is required in production");
    }
    // Dev fallback: log warning and return null (will use console logging)
    return null;
  }
  if (!resend) {
    resend = new Resend(env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL =
  process.env.NODE_ENV === "production"
    ? "Tawa Services <noreply@tawa-services.com>"
    : "Tawa Services <onboarding@resend.dev>";

const APP_URL = (env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/**
 * Send a verification email with a magic link.
 * Falls back to console logging in development if RESEND_API_KEY is not set.
 */
export async function sendVerificationEmail(
  to: string,
  token: string,
  locale: string,
): Promise<void> {
  const verificationUrl = `${APP_URL}/${locale}/auth/verify-email?token=${token}`;

  const client = getResendClient();

  if (!client) {
    // Dev fallback: log the URL to console
    console.warn("[email] RESEND_API_KEY not set. Email not sent.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Verifiez votre email</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h1 style="font-size: 24px; color: #111827; margin-bottom: 8px;">Verifiez votre email</h1>
        <p style="color: #6b7280; font-size: 16px; margin-bottom: 24px;">
          Merci de vous etre inscrit sur <strong>Tawa Services</strong>. Cliquez sur le bouton ci-dessous pour verifier votre adresse email.
        </p>
        <a
          href="${verificationUrl}"
          style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: 600;"
        >
          Verifier mon email
        </a>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
          Ce lien est valable pendant 24 heures. Si vous n'avez pas cree de compte, ignorez cet email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
          <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
        </p>
      </div>
    </body>
    </html>
  `;

  await client.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Verifiez votre email - Tawa Services",
    html,
  });
}

/**
 * Send a password reset email with a magic link.
 * Falls back to console logging in development if RESEND_API_KEY is not set.
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string,
  locale: string,
): Promise<void> {
  const resetUrl = `${APP_URL}/${locale}/auth/reset-password?token=${token}`;

  const client = getResendClient();

  if (!client) {
    // Dev fallback: log the URL to console
    console.warn("[email] RESEND_API_KEY not set. Email not sent.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reinitialisation de mot de passe</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h1 style="font-size: 24px; color: #111827; margin-bottom: 8px;">Reinitialisation de mot de passe</h1>
        <p style="color: #6b7280; font-size: 16px; margin-bottom: 24px;">
          Vous avez demande la reinitialisation de votre mot de passe <strong>Tawa Services</strong>. Ce lien expire dans <strong>1 heure</strong>.
        </p>
        <a
          href="${resetUrl}"
          style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: 600;"
        >
          Reinitialiser mon mot de passe
        </a>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
          Si vous n'avez pas fait cette demande, ignorez cet email. Votre mot de passe ne sera pas modifie.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
          <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
    </body>
    </html>
  `;

  await client.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reinitialisation de mot de passe - Tawa Services",
    html,
  });
}
