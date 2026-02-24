"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { Link, usePathname } from "@/i18n/routing";
import {
  LayoutDashboard,
  Briefcase,
  CalendarCheck,
  UserPen,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getProviderBookingsAction } from "@/features/booking/actions/booking-queries";

const NAV_ITEMS = [
  { href: "/provider/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { href: "/provider/profile/edit", icon: UserPen, labelKey: "editProfile" },
  { href: "/provider/services", icon: Briefcase, labelKey: "myServices" },
  { href: "/provider/bookings", icon: CalendarCheck, labelKey: "reservations" },
  { href: "/provider/kyc", icon: ShieldCheck, labelKey: "kyc" },
];

export function ProviderSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const tLayout = useTranslations("layout");
  const tAuth = useTranslations("auth");

  // Fetch pending bookings count on mount for the badge
  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const result = await getProviderBookingsAction({ status: ["PENDING"], limit: 1 });
        if (result.success) {
          setPendingCount(result.data.total);
        }
      } catch {
        // Silently ignore — badge is non-critical UI
      }
    }
    void fetchPendingCount();
  }, []);

  return (
    <aside
      className={cn(
        "relative hidden h-screen flex-col border-r bg-background transition-all duration-300 md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b px-4", collapsed && "justify-center")}>
        {!collapsed && (
          <Link href="/provider/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <span className="text-xs font-bold text-primary-foreground">T</span>
            </div>
            <span className="font-semibold text-primary">Prestataire</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/provider/dashboard">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <span className="text-xs font-bold text-primary-foreground">T</span>
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3" aria-label={tLayout("sidebarNav")}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const isBookings = item.href === "/provider/bookings";

          return (
            <Link
              key={item.href}
              href={item.href as never}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? t(item.labelKey) : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="flex-1">{t(item.labelKey)}</span>}
              {/* Pending badge — shown only for the bookings link when count > 0 */}
              {isBookings && pendingCount > 0 && (
                <span
                  className={cn(
                    "flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground",
                    collapsed && "absolute right-1 top-1 h-4 min-w-[16px] text-[9px]"
                  )}
                >
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Logout */}
      <div className="p-3 pb-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "w-full text-destructive hover:bg-destructive/10 hover:text-destructive",
            collapsed && "px-2"
          )}
          title={collapsed ? tAuth("logout") : undefined}
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed && <span>{tAuth("logout")}</span>}
        </Button>
      </div>

      {/* Collapse Toggle */}
      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("w-full", collapsed && "px-2")}
          aria-label={collapsed ? tLayout("sidebarExpand") : tLayout("sidebarCollapse")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="mr-2 h-4 w-4" />
              <span>{tLayout("sidebarCollapse")}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
