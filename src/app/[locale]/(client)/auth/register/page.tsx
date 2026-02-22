import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { RegisterWizard } from "@/features/auth/components/RegisterWizard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("registerTitle"),
    description: t("registerTitle"),
  };
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">Tawa Services</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Creez votre compte gratuitement
            </p>
          </div>

          {/* Wizard */}
          <RegisterWizard />

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Deja un compte ?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
