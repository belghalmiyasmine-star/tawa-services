import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ShieldAlert } from "lucide-react";

import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");

  return {
    title: t("accessDenied"),
  };
}

export default async function ForbiddenPage() {
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("accessDenied")}</h1>
          <p className="text-muted-foreground">{t("accessDeniedMessage")}</p>
        </div>

        {/* Navigation buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">{t("backToDashboard")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/login">{t("backToLogin")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
