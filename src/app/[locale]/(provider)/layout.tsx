import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  // No session — redirect to login
  if (!session) {
    return redirect({ href: "/auth/login", locale });
  }

  // Wrong role — redirect to 403
  if (session.user.role !== "PROVIDER" && session.user.role !== "ADMIN") {
    return redirect({ href: "/auth/403", locale });
  }

  return (
    <>
      <Navbar />
      <EmailVerificationBanner />
      <main className="min-h-[calc(100vh-4rem)] pb-16 md:pb-0">{children}</main>
      <Footer />
      <BottomNav role="PROVIDER" />
    </>
  );
}
