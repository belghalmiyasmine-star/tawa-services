"use client";

import { Link } from "@/i18n/routing";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export function AdminMobileHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
      <Link href="/admin" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <span className="text-xs font-bold text-primary-foreground">T</span>
        </div>
        <span className="text-base font-bold text-primary">Admin</span>
      </Link>
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
