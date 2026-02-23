import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { OAuthRoleSelection } from "@/features/auth/components/OAuthRoleSelection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");

  return {
    title: t("oauthRoleTitle"),
    description: t("oauthRoleSubtitle"),
  };
}

export default async function OAuthRolePage() {
  const t = await getTranslations("auth");
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  // If not authenticated, redirect to login
  if (!session?.user) {
    return redirect({ href: "/auth/login", locale });
  }

  // If user already has a non-default role that was explicitly set
  // (we check if they have a role and have prior sessions suggesting they're not new),
  // redirect to their dashboard. New OAuth users will always land here first.
  // We use CLIENT as the default/unset role — if role is CLIENT, they may still need selection
  // unless they came through normal registration. We cannot perfectly distinguish these cases
  // without a DB flag, so we simply show the selection page to CLIENT role users.
  // PROVIDER and ADMIN users are definitively assigned and should not see this page.
  if (session.user.role === "PROVIDER") {
    return redirect({ href: "/provider/dashboard", locale });
  }

  if (session.user.role === "ADMIN") {
    return redirect({ href: "/admin", locale });
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t("oauthRoleTitle")}</CardTitle>
          <CardDescription>{t("oauthRoleSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <OAuthRoleSelection />
        </CardContent>
      </Card>
    </div>
  );
}
