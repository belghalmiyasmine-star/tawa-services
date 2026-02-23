import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { redirect } from "@/i18n/routing";
import { TwoFactorChallenge } from "@/features/auth/components/TwoFactorChallenge";

interface TwoFaPageProps {
  searchParams: Promise<{
    userId?: string;
    method?: string;
    phone?: string;
    callbackUrl?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return {
    title: t("twoFactorChallenge"),
  };
}

export default async function TwoFaPage({ searchParams }: TwoFaPageProps) {
  const params = await searchParams;
  const { userId, method, phone, callbackUrl } = params;
  const locale = await getLocale();

  // Validate required params
  if (!userId || (method !== "TOTP" && method !== "SMS")) {
    return redirect({ href: "/auth/login", locale });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <TwoFactorChallenge
        userId={userId}
        method={method}
        phone={phone}
        callbackUrl={callbackUrl ?? "/"}
      />
    </div>
  );
}
