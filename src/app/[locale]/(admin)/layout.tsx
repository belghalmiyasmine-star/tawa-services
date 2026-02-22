import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // No session — redirect to login
  if (!session) {
    redirect("/auth/login");
  }

  // Only ADMIN can access admin routes
  if (session.user.role !== "ADMIN") {
    redirect("/auth/403");
  }

  const t = await getTranslations("layout");

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Admin header */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <h1 className="text-lg font-semibold">{t("adminPanelTitle")}</h1>
          {/* Admin user actions — Phase 2 */}
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6">{children}</main>
      </div>
    </div>
  );
}
