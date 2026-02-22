"use client";

import { useTranslations } from "next-intl";
import {
  Home,
  Search,
  Calendar,
  MessageSquare,
  User,
  LayoutDashboard,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/routing";

type NavItem = {
  href: string;
  icon: React.ElementType;
  labelKey: string;
};

// Navigation client — hrefs sans prefixe locale (gere par createNavigation)
const CLIENT_ITEMS: NavItem[] = [
  { href: "/", icon: Home, labelKey: "home" },
  { href: "/services", icon: Search, labelKey: "search" },
  { href: "/bookings", icon: Calendar, labelKey: "bookings" },
  { href: "/messages", icon: MessageSquare, labelKey: "messages" },
  { href: "/profile", icon: User, labelKey: "profile" },
];

// Navigation provider
const PROVIDER_ITEMS: NavItem[] = [
  { href: "/provider/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { href: "/provider/services", icon: Briefcase, labelKey: "services" },
  { href: "/provider/bookings", icon: Calendar, labelKey: "bookings" },
  { href: "/messages", icon: MessageSquare, labelKey: "messages" },
  { href: "/profile", icon: User, labelKey: "profile" },
];

interface BottomNavProps {
  role?: "CLIENT" | "PROVIDER";
}

export function BottomNav({ role = "CLIENT" }: BottomNavProps) {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const items = role === "PROVIDER" ? PROVIDER_ITEMS : CLIENT_ITEMS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

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
