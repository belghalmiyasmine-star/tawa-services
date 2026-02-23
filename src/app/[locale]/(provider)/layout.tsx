import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProviderSidebar } from "@/components/layout/ProviderSidebar";
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

  // KYC guard: Phase 4 service creation pages must check provider.kycStatus === "APPROVED"
  // before allowing access to service creation/listing flows.
  // The guard is page-level (not middleware-level) because:
  // - Provider CAN access dashboard and messaging before KYC approval
  // - Only service listing/creation is blocked for non-approved providers

  return (
    <div className="flex min-h-screen">
      <ProviderSidebar />
      <div className="flex flex-1 flex-col">
        <Navbar />
        <EmailVerificationBanner />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <BottomNav role="PROVIDER" />
      </div>
    </div>
  );
}
