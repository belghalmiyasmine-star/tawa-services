"use client";

import { useSession } from "next-auth/react";

import { Link } from "@/i18n/routing";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { NotificationBell } from "@/features/notification/components/NotificationBell";

export function MobileHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <span className="text-xs font-bold text-primary-foreground">T</span>
        </div>
        <span className="text-base font-bold text-primary">Tawa</span>
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        {status === "authenticated" && session?.user && (
          <NotificationBell
            allNotificationsUrl={
              session.user.role === "PROVIDER"
                ? "/provider/notifications"
                : "/notifications"
            }
          />
        )}
      </div>
    </header>
  );
}
