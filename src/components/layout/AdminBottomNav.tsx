"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Flag,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/routing";

const ADMIN_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, labelKey: "home" },
  { href: "/admin/users", icon: Users, labelKey: "users" },
  { href: "/admin/kyc", icon: ShieldCheck, labelKey: "kyc" },
  { href: "/admin/reports", icon: Flag, labelKey: "reports" },
  { href: "/admin/analytics", icon: BarChart3, labelKey: "analytics" },
];

export function AdminBottomNav() {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {ADMIN_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href as never}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              <span className={cn(isActive && "font-medium")}>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
