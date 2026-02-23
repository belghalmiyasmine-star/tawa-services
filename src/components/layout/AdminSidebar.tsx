"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { Link, usePathname } from "@/i18n/routing";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Grid2X2,
  Flag,
  BarChart3,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, labelKey: "home" },
  { href: "/admin/users", icon: Users, labelKey: "users" },
  { href: "/admin/kyc", icon: ShieldCheck, labelKey: "kyc" },
  { href: "/admin/categories", icon: Grid2X2, labelKey: "categories" },
  { href: "/admin/reports", icon: Flag, labelKey: "reports" },
  { href: "/admin/analytics", icon: BarChart3, labelKey: "analytics" },
  { href: "/admin/content", icon: FileText, labelKey: "content" },
  { href: "/admin/notifications", icon: Bell, labelKey: "notifications" },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("navigation");
  // "layout" namespace pour les labels generiques de la sidebar (collapse, expand, aria-labels)
  const tLayout = useTranslations("layout");
  const tAuth = useTranslations("auth");

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b px-4", collapsed && "justify-center")}>
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <span className="text-xs font-bold text-primary-foreground">T</span>
            </div>
            <span className="font-semibold text-primary">Admin</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/admin">
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
              {!collapsed && <span>{t(item.labelKey)}</span>}
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
