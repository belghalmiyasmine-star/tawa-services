import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { getLocale, getTranslations } from "next-intl/server";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { NotificationsList } from "@/features/notification/components/NotificationsList";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notification");
  return {
    title: `${t("title")} | Tawa Services`,
  };
}

export default async function ProviderNotificationsPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "PROVIDER" && session.user.role !== "ADMIN") {
    return redirect({ href: "/", locale });
  }

  const t = await getTranslations("notification");

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez toutes vos notifications
        </p>
      </div>

      <NotificationsList />
    </div>
  );
}
