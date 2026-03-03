"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Home,
  Search,
  CalendarCheck,
  MessageSquare,
  User,
  LayoutDashboard,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/routing";
import { getUnreadCountAction } from "@/features/messaging/actions/conversation-queries";

type NavItem = {
  href: string;
  icon: React.ElementType;
  labelKey: string;
};

// Navigation client — hrefs sans prefixe locale (gere par createNavigation)
const CLIENT_ITEMS: NavItem[] = [
  { href: "/", icon: Home, labelKey: "home" },
  { href: "/services", icon: Search, labelKey: "search" },
  { href: "/bookings", icon: CalendarCheck, labelKey: "bookings" },
  { href: "/messages", icon: MessageSquare, labelKey: "messages" },
  { href: "/dashboard", icon: User, labelKey: "profile" },
];

// Navigation provider
const PROVIDER_ITEMS: NavItem[] = [
  { href: "/provider/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { href: "/provider/services", icon: Briefcase, labelKey: "services" },
  { href: "/provider/bookings", icon: CalendarCheck, labelKey: "bookings" },
  { href: "/provider/messages", icon: MessageSquare, labelKey: "messages" },
  { href: "/provider/profile/edit", icon: User, labelKey: "profile" },
];

interface BottomNavProps {
  role?: "CLIENT" | "PROVIDER";
}

export function BottomNav({ role = "CLIENT" }: BottomNavProps) {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const items = role === "PROVIDER" ? PROVIDER_ITEMS : CLIENT_ITEMS;

  // Unread message count for badge on messages link
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await getUnreadCountAction();
      if (result.success) {
        setUnreadMessages(result.data.total);
      }
    } catch {
      // Badge is non-critical — silently ignore errors
    }
  }, []);

  useEffect(() => {
    void fetchUnreadCount();
    const interval = setInterval(() => void fetchUnreadCount(), 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isMessages = item.labelKey === "messages";
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
              {/* Icon with unread badge for messages */}
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                {isMessages && unreadMessages > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </div>
              <span className={cn(isActive && "font-medium")}>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
