"use client";

import { AlertTriangle, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { usePathname } from "@/i18n/routing";

import { sendVerificationEmailAction } from "@/features/auth/actions/send-verification-email";

/**
 * Persistent warning banner shown to users who have not verified their email.
 * - Displayed only when session.user.emailVerified is false.
 * - Provides a "Renvoyer" button to resend the verification email.
 * - Dismissible, but reappears on page navigation (per product decision).
 */
export function EmailVerificationBanner() {
  const { data: session } = useSession();
  const t = useTranslations("auth");
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Reset dismissed state on navigation (persistent per design decision)
  useEffect(() => {
    setDismissed(false);
    setSentSuccess(false);
  }, [pathname]);

  // Only show for authenticated users with unverified email
  if (!session?.user || session.user.emailVerified || dismissed) {
    return null;
  }

  async function handleResend() {
    if (!session?.user?.id || !session.user.email) return;
    setSending(true);
    try {
      // Extract locale from the pathname (first segment after /)
      const locale = pathname.split("/")[1] ?? "fr";
      await sendVerificationEmailAction(session.user.id, session.user.email, locale);
      setSentSuccess(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      role="alert"
      className="relative w-full bg-amber-50 border-b border-amber-200 px-4 py-3"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />

        <p className="flex-1 text-sm text-amber-900">
          {sentSuccess ? (
            <span className="font-medium">{t("resendSuccess")}</span>
          ) : (
            <>
              <span>{t("emailNotVerified")}</span>{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={sending}
                className="underline font-medium hover:no-underline disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? t("loading") : t("resendVerification")}
              </button>
            </>
          )}
        </p>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fermer la banniere"
          className="shrink-0 text-amber-600 hover:text-amber-900 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
