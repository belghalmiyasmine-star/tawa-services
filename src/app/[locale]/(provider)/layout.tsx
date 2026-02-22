import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // No session — redirect to login
  if (!session) {
    redirect("/auth/login");
  }

  // Wrong role — redirect to 403
  if (session.user.role !== "PROVIDER" && session.user.role !== "ADMIN") {
    redirect("/auth/403");
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
