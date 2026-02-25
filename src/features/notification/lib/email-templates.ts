import type { NotifType } from "@prisma/client";

// ============================================================
// EMAIL TEMPLATES FOR NOTIFICATION TYPES
// ============================================================

const BRAND_COLOR = "#2563eb";
const BRAND_NAME = "Tawa Services";

/**
 * Base HTML wrapper with consistent Tawa Services branding.
 * White card, blue CTA button, gray footer — matches email.ts style.
 */
function wrapHtml(
  title: string,
  body: string,
  ctaLabel: string,
  ctaUrl: string,
  footerNote?: string,
): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 40px 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <h1 style="font-size: 22px; color: #111827; margin-bottom: 8px;">${title}</h1>
    <div style="color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
      ${body}
    </div>
    <a
      href="${ctaUrl}"
      style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 600;"
    >
      ${ctaLabel}
    </a>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;" />
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      ${footerNote ?? `Vous recevez cet email car vous etes inscrit sur ${BRAND_NAME}.`}
    </p>
    <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0 0;">
      &copy; ${new Date().getFullYear()} ${BRAND_NAME}. Tous droits reserves.
    </p>
  </div>
</body>
</html>`;
}

/**
 * Build an HTML email for the given notification type.
 * Returns subject and HTML body.
 *
 * @param type      - NotifType enum value
 * @param data      - Contextual data for the template (bookingId, serviceTitle, etc.)
 * @param locale    - Locale string (e.g. "fr") used to build links
 * @param appUrl    - Base application URL (e.g. "https://tawa-services.com")
 */
export function buildNotificationEmail(
  type: NotifType,
  data: Record<string, string>,
  locale = "fr",
  appUrl = process.env["NEXTAUTH_URL"] ?? "http://localhost:3000",
): { subject: string; html: string } {
  const notifUrl = `${appUrl}/${locale}/notifications`;
  const bookingUrl = data["bookingId"]
    ? `${appUrl}/${locale}/bookings/${data["bookingId"]}`
    : notifUrl;
  const kycUrl = `${appUrl}/${locale}/provider/kyc`;

  switch (type) {
    case "BOOKING_REQUEST": {
      const subject = "Nouvelle demande de reservation - Tawa Services";
      const body = `
        <p>Vous avez recu une nouvelle demande de reservation.</p>
        <p><strong>Service :</strong> ${data["serviceTitle"] ?? "Service"}<br/>
        <strong>Client :</strong> ${data["clientName"] ?? "Client"}<br/>
        <strong>Date souhaitee :</strong> ${data["scheduledAt"] ?? "Non precisee"}</p>
        <p>Connectez-vous pour accepter ou refuser cette demande.</p>
      `;
      return {
        subject,
        html: wrapHtml(
          "Nouvelle demande de reservation",
          body,
          "Voir la demande",
          bookingUrl,
        ),
      };
    }

    case "BOOKING_ACCEPTED": {
      const subject = "Votre reservation a ete acceptee - Tawa Services";
      const body = `
        <p>Bonne nouvelle ! Votre reservation a ete acceptee.</p>
        <p><strong>Service :</strong> ${data["serviceTitle"] ?? "Service"}<br/>
        <strong>Prestataire :</strong> ${data["providerName"] ?? "Prestataire"}<br/>
        <strong>Date :</strong> ${data["scheduledAt"] ?? "Non precisee"}</p>
        <p>Vous pouvez consulter les details de votre reservation ci-dessous.</p>
      `;
      return {
        subject,
        html: wrapHtml(
          "Reservation acceptee",
          body,
          "Voir ma reservation",
          bookingUrl,
        ),
      };
    }

    case "BOOKING_REJECTED": {
      const subject = "Votre reservation a ete refusee - Tawa Services";
      const body = `
        <p>Nous sommes desoles, votre reservation n'a pas pu etre acceptee.</p>
        <p><strong>Service :</strong> ${data["serviceTitle"] ?? "Service"}<br/>
        <strong>Motif :</strong> ${data["reason"] ?? "Non precise"}</p>
        <p>Vous pouvez rechercher d'autres prestataires disponibles sur Tawa Services.</p>
      `;
      return {
        subject,
        html: wrapHtml(
          "Reservation refusee",
          body,
          "Trouver un autre prestataire",
          `${appUrl}/${locale}/services`,
        ),
      };
    }

    case "BOOKING_COMPLETED": {
      const subject = "Service termine - Tawa Services";
      const body = `
        <p>Le service a ete marque comme termine.</p>
        <p><strong>Service :</strong> ${data["serviceTitle"] ?? "Service"}</p>
        <p>Votre avis est important ! Partagez votre experience pour aider les autres utilisateurs.</p>
      `;
      return {
        subject,
        html: wrapHtml(
          "Service termine",
          body,
          "Laisser un avis",
          bookingUrl,
        ),
      };
    }

    case "BOOKING_CANCELLED": {
      const subject = "Reservation annulee - Tawa Services";
      const body = `
        <p>Votre reservation a ete annulee.</p>
        <p><strong>Service :</strong> ${data["serviceTitle"] ?? "Service"}</p>
        ${
          data["refundInfo"]
            ? `<p><strong>Remboursement :</strong> ${data["refundInfo"]}</p>`
            : ""
        }
        <p>Vous pouvez effectuer une nouvelle reservation a tout moment.</p>
      `;
      return {
        subject,
        html: wrapHtml(
          "Reservation annulee",
          body,
          "Voir mes reservations",
          `${appUrl}/${locale}/bookings`,
        ),
      };
    }

    case "PAYMENT_RECEIVED": {
      const subject = "Paiement recu - Tawa Services";
      const body = `
        <p>Votre paiement a bien ete recu.</p>
        <p><strong>Montant :</strong> ${data["amount"] ?? "0"} TND<br/>
        <strong>Service :</strong> ${data["serviceTitle"] ?? "Service"}</p>
        <p>Votre argent sera libere apres confirmation du service termine.</p>
      `;
      return {
        subject,
        html: wrapHtml(
          "Paiement recu",
          body,
          "Voir ma reservation",
          bookingUrl,
        ),
      };
    }

    case "REVIEW_RECEIVED": {
      const subject = "Nouvel avis recu - Tawa Services";
      const body = `
        <p>Vous avez recu un nouvel avis.</p>
        <p><strong>Note :</strong> ${"★".repeat(parseInt(data["stars"] ?? "5", 10))}${"☆".repeat(5 - parseInt(data["stars"] ?? "5", 10))}<br/>
        ${data["preview"] ? `<strong>Apercu :</strong> ${data["preview"].substring(0, 150)}${data["preview"].length > 150 ? "..." : ""}` : ""}</p>
        <p>Consultez votre profil pour voir tous vos avis.</p>
      `;
      return {
        subject,
        html: wrapHtml(
          "Nouvel avis recu",
          body,
          "Voir mes avis",
          `${appUrl}/${locale}/provider/profile`,
        ),
      };
    }

    case "KYC_APPROVED": {
      const subject = "Profil verifie - Tawa Services";
      const body = `
        <p>Felicitations ! Votre profil a ete verifie avec succes.</p>
        <p>Vous pouvez maintenant publier vos services et recevoir des reservations sur Tawa Services.</p>
        <p>Commencez a developper votre activite des maintenant !</p>
      `;
      return {
        subject,
        html: wrapHtml(
          "Profil verifie",
          body,
          "Acceder a mon espace",
          `${appUrl}/${locale}/provider/dashboard`,
        ),
      };
    }

    case "KYC_REJECTED": {
      const subject = "Verification refusee - Tawa Services";
      const body = `
        <p>Votre demande de verification de profil n'a pas ete acceptee.</p>
        ${data["reason"] ? `<p><strong>Motif :</strong> ${data["reason"]}</p>` : ""}
        <p>Vous pouvez soumettre a nouveau vos documents en corrigeant les elements signales.</p>
      `;
      return {
        subject,
        html: wrapHtml(
          "Verification refusee",
          body,
          "Soumettre a nouveau",
          kycUrl,
        ),
      };
    }

    case "NEW_MESSAGE": {
      const preview = data["preview"] ?? "";
      const truncatedPreview =
        preview.length > 100 ? preview.substring(0, 100) + "..." : preview;
      const subject = "Nouveau message - Tawa Services";
      const body = `
        <p>Vous avez recu un nouveau message.</p>
        <p><strong>De :</strong> ${data["senderName"] ?? "Utilisateur"}</p>
        ${truncatedPreview ? `<p style="background: #f3f4f6; padding: 12px; border-radius: 4px; font-style: italic;">"${truncatedPreview}"</p>` : ""}
        <p>Repondez maintenant pour maintenir une bonne communication.</p>
      `;
      return {
        subject,
        html: wrapHtml(
          "Nouveau message",
          body,
          "Voir le message",
          data["conversationUrl"]
            ? `${appUrl}${data["conversationUrl"]}`
            : notifUrl,
        ),
      };
    }

    case "QUOTE_RECEIVED": {
      const subject = "Nouveau devis recu - Tawa Services";
      const body = `
        <p>Vous avez recu une demande de devis.</p>
        <p><strong>Service :</strong> ${data["serviceTitle"] ?? "Service"}</p>
        <p>Repondez rapidement pour augmenter vos chances de decrocher la mission.</p>
      `;
      return {
        subject,
        html: wrapHtml(
          "Nouveau devis",
          body,
          "Voir la demande",
          bookingUrl,
        ),
      };
    }

    case "QUOTE_RESPONDED": {
      const subject = "Reponse a votre devis - Tawa Services";
      const body = `
        <p>Le prestataire a repondu a votre demande de devis.</p>
        <p><strong>Service :</strong> ${data["serviceTitle"] ?? "Service"}<br/>
        ${data["proposedPrice"] ? `<strong>Prix propose :</strong> ${data["proposedPrice"]} TND` : ""}</p>
        <p>Consultez la reponse et acceptez ou refusez le devis.</p>
      `;
      return {
        subject,
        html: wrapHtml(
          "Reponse au devis",
          body,
          "Voir le devis",
          bookingUrl,
        ),
      };
    }

    case "SYSTEM":
    default: {
      const subject =
        data["subject"] ?? `Notification - ${BRAND_NAME}`;
      const body = `
        <p>${data["message"] ?? "Vous avez une nouvelle notification de Tawa Services."}</p>
      `;
      return {
        subject,
        html: wrapHtml(
          data["title"] ?? "Notification",
          body,
          "Voir mes notifications",
          notifUrl,
        ),
      };
    }
  }
}
