import { getServerSession } from "next-auth";
import { getLocale, getTranslations } from "next-intl/server";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminBreadcrumbs } from "@/features/admin/components/AdminBreadcrumbs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  // No session — redirect to login
  if (!session) {
    return redirect({ href: "/auth/login", locale });
  }

  // Only ADMIN can access admin routes
  if (session.user.role !== "ADMIN") {
    return redirect({ href: "/auth/403", locale });
  }

  const t = await getTranslations("layout");

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Admin header */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-semibold leading-none">{t("adminPanelTitle")}</h1>
            <AdminBreadcrumbs />
          </div>
          {/* Admin user actions — Phase 2 */}
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6">{children}</main>
      </div>
    </div>
  );
}
