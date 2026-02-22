import { CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyEmailAction } from "@/features/auth/actions/verify-email";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return {
    title: t("verifyEmailTitle"),
  };
}

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const t = await getTranslations("auth");
  const { token } = await searchParams;

  // If no token provided, show error
  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <XCircle className="h-14 w-14 text-destructive" />
            </div>
            <CardTitle className="text-xl">{t("verifyEmailError")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{t("verifyEmailExpired")}</p>
            <Button asChild className="w-full">
              <Link href="/">{t("backToLogin")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Attempt verification server-side
  const result = await verifyEmailAction(token);

  if (result.success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-14 w-14 text-green-500" />
            </div>
            <CardTitle className="text-xl">{t("verifyEmailSuccess")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Vous pouvez maintenant acceder a toutes les fonctionnalites.
            </p>
            <Button asChild className="w-full">
              <Link href="/">{t("backToLogin")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  const isExpired = result.error === "Token expire";
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <XCircle className="h-14 w-14 text-destructive" />
          </div>
          <CardTitle className="text-xl">
            {isExpired ? t("verifyEmailExpired") : t("verifyEmailError")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {isExpired
              ? "Ce lien de verification a expire. Demandez un nouveau lien depuis votre tableau de bord."
              : "Ce lien de verification est invalide ou a deja ete utilise."}
          </p>
          <Button asChild className="w-full">
            <Link href="/">{t("backToLogin")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
