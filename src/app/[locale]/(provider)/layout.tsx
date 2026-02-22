import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
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
