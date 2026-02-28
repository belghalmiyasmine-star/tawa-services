import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { getLocale, getTranslations } from "next-intl/server";

import { authOptions } from "@/lib/auth";
import { redirect, Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { SecuritySettings } from "@/features/auth/components/SecuritySettings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return {
    title: t("securityTitle"),
    description: "Gerez la securite de votre compte Tawa Services",
  };
}

export default async function SecurityPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  // Fetch user 2FA settings and recent login records
  const [user, recentLogins] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorMethod: true,
        phone: true,
      },
    }),
    prisma.loginRecord.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        ip: true,
        userAgent: true,
        createdAt: true,
        isNew: true,
      },
    }),
  ]);

  if (!user) {
    return redirect({ href: "/auth/login", locale });
  }

  const t = await getTranslations("notification");

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Settings navigation */}
      <nav className="mb-8 flex gap-4 border-b pb-4">
        <span className="border-b-2 border-primary pb-2 text-sm font-medium text-foreground">
          Securite
        </span>
        <Link
          href="/settings/notifications"
          className="pb-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {t("preferences.title")}
        </Link>
      </nav>

      <SecuritySettings
        twoFactorEnabled={user.twoFactorEnabled}
        twoFactorMethod={user.twoFactorMethod}
        userPhone={user.phone}
        recentLogins={recentLogins}
      />
    </div>
  );
}
