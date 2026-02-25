import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { getLocale, getTranslations } from "next-intl/server";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { NotificationPreferencesForm } from "@/features/notification/components/NotificationPreferencesForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notification");
  return {
    title: `${t("preferences.title")} | Tawa Services`,
  };
}

export default async function ClientNotificationPreferencesPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  const t = await getTranslations("notification");

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <a
        href="/settings/security"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Retour aux parametres
      </a>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {t("preferences.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerez comment et quand vous recevez des notifications
        </p>
      </div>

      <NotificationPreferencesForm />
    </div>
  );
}
