import { Navbar } from "@/components/layout/Navbar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <MobileHeader />
      <EmailVerificationBanner />
      <main className="min-h-[calc(100vh-4rem)] pb-20 md:pb-0">{children}</main>
      <Footer />
      <BottomNav role="CLIENT" />
    </>
  );
}
