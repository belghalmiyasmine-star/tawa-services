import type { NotifType } from "@prisma/client";
import { Resend } from "resend";

import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { buildNotificationEmail } from "./email-templates";

// ============================================================
// TYPES
// ============================================================

export interface NotificationPayload {
  userId: string;
  type: NotifType;
  title: string;
  body?: string;
  /** Extra contextual data stored in the DB (bookingId, providerId, etc.) */
  data?: Record<string, string>;
  /** Data used for building the email template (may differ from DB data) */
  emailData?: Record<string, string>;
}

// ============================================================
// RESEND CLIENT (shared pattern from src/lib/email.ts)
// ============================================================

let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error("RESEND_API_KEY is required in production");
    }
    return null;
  }
  if (!_resend) {
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL =
  process.env["NODE_ENV"] === "production"
    ? "Tawa Services <noreply@tawa-services.com>"
    : "Tawa Services <onboarding@resend.dev>";

// ============================================================
// QUIET HOURS HELPER
// ============================================================

/**
 * Check if the current time (Tunisia GMT+1) is within quiet hours.
 * Tunisia is UTC+1 year-round (no DST).
 *
 * @param quietHoursStart - "HH:MM" string or null
 * @param quietHoursEnd   - "HH:MM" string or null
 */
function isInQuietHours(
  quietHoursStart: string | null,
  quietHoursEnd: string | null,
): boolean {
  if (!quietHoursStart || !quietHoursEnd) return false;

  // Tunisia is UTC+1
  const now = new Date();
  const tunisiaHours = (now.getUTCHours() + 1) % 24;
  const tunisiaMinutes = now.getUTCMinutes();
  const currentMinutes = tunisiaHours * 60 + tunisiaMinutes;

  const startParts = quietHoursStart.split(":");
  const endParts = quietHoursEnd.split(":");
  const startH = Number(startParts[0] ?? 0);
  const startM = Number(startParts[1] ?? 0);
  const endH = Number(endParts[0] ?? 0);
  const endM = Number(endParts[1] ?? 0);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    // Same-day window (e.g., 22:00 to 06:00 doesn't apply here — this is straight range)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight window (e.g., 22:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

// ============================================================
// CORE: sendNotification
// ============================================================

/**
 * Central notification dispatcher.
 *
 * 1. Checks NotificationPreference — if type is disabled or inApp is off, skips DB create.
 * 2. Creates in-app notification in DB.
 * 3. Checks quiet hours — if in quiet hours, skips email.
 * 4. Sends email via Resend if emailEnabled and type is not disabled.
 *
 * Email sending is fire-and-forget (errors are caught/logged, never thrown).
 */
export async function sendNotification(
  payload: NotificationPayload,
): Promise<void> {
  const { userId, type, title, body, data, emailData } = payload;

  try {
    // Step 1: Check notification preferences
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    const isTypeDisabled = prefs?.disabledTypes?.includes(type) ?? false;
    const inAppEnabled = prefs?.inAppEnabled ?? true;

    // If inApp is disabled globally or this type is specifically disabled — skip DB
    if (!inAppEnabled || isTypeDisabled) {
      // Still send email if emailEnabled, type not disabled and not quiet hours
      if (prefs?.emailEnabled !== false && !isTypeDisabled) {
        void sendEmailNotification(userId, type, emailData ?? data ?? {}, prefs);
      }
      return;
    }

    // Step 2: Create in-app notification record
    const notifData = data ?? emailData;
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        ...(notifData !== undefined ? { data: notifData } : {}),
      },
    });

    // Step 3 & 4: Send email if enabled and not in quiet hours
    const emailEnabled = prefs?.emailEnabled ?? true;

    if (emailEnabled && !isTypeDisabled) {
      void sendEmailNotification(userId, type, emailData ?? data ?? {}, prefs);
    }
  } catch (error) {
    // Never throw from sendNotification — log and continue
    console.error("[sendNotification] Error:", error);
  }
}

/**
 * Fire-and-forget email sender.
 * Catches all errors internally — never throws.
 */
async function sendEmailNotification(
  userId: string,
  type: NotifType,
  templateData: Record<string, string>,
  prefs: {
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
  } | null,
): Promise<void> {
  try {
    // Check quiet hours
    if (
      isInQuietHours(
        prefs?.quietHoursStart ?? null,
        prefs?.quietHoursEnd ?? null,
      )
    ) {
      return; // Skip email during quiet hours
    }

    // Fetch user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      console.warn("[sendEmailNotification] No email for user:", userId);
      return;
    }

    // Build email content
    const { subject, html } = buildNotificationEmail(type, templateData);

    // Send via Resend
    const client = getResendClient();
    if (!client) {
      console.warn("[email] RESEND_API_KEY not set. Notification email not sent.");
      console.log(`[email] Would send "${subject}" to ${user.email}`);
      return;
    }

    await client.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject,
      html,
    });
  } catch (error) {
    console.error("[sendEmailNotification] Failed to send email:", error);
  }
}

// ============================================================
// BATCH: sendNotificationBatch
// ============================================================

/**
 * Send multiple notifications in parallel.
 * Useful when an event notifies multiple parties (e.g., booking accepted notifies both client and provider).
 *
 * Errors in individual notifications are caught by sendNotification — this always resolves.
 */
export async function sendNotificationBatch(
  payloads: NotificationPayload[],
): Promise<void> {
  await Promise.all(payloads.map((payload) => sendNotification(payload)));
}
