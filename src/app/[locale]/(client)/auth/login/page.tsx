import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");

  return {
    title: t("loginTitle"),
    description: t("loginSubtitle"),
  };
}

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t("loginTitle")}</CardTitle>
          <CardDescription>{t("loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OAuth buttons — Google */}
          <OAuthButtons />

          {/* Email/password form */}
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
