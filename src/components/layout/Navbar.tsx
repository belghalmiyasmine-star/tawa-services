"use client";

import { useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { Bell, ChevronDown, LogOut, Menu, Settings, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { SearchAutocomplete } from "@/features/search/components/SearchAutocomplete";
import { Link } from "@/i18n/routing";

// ============================================================
// TYPES
// ============================================================

interface NavCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

// ============================================================
// HELPERS
// ============================================================

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

// ============================================================
// COMPONENT
// ============================================================

export function Navbar() {
  const { data: session, status } = useSession();
  const t = useTranslations("navigation");
  const tAuth = useTranslations("auth");

  // DB-driven categories fetched from /api/search/categories on mount
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const res = await fetch("/api/search/categories", { cache: "no-store" });
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { categories: NavCategory[] };
          // Show top-level categories only (parentId not exposed in NavCategory, API already filters)
          setCategories(data.categories.slice(0, 8));
        }
      } catch {
        // Network error — keep empty categories, no visible error needed
      } finally {
        if (!cancelled) setCategoriesLoaded(true);
      }
    }

    void fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 hidden w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">T</span>
          </div>
          <span className="text-lg font-bold text-primary">Tawa Services</span>
        </Link>

        {/* Categories Dropdown — DB-driven */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1">
              <Menu className="h-4 w-4" />
              <span>{t("categories")}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {!categoriesLoaded ? (
              // Skeleton while loading
              <div className="space-y-1 p-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 animate-pulse rounded bg-gray-100 dark:bg-gray-700"
                  />
                ))}
              </div>
            ) : categories.length > 0 ? (
              <>
                {categories.map((cat) => (
                  <DropdownMenuItem key={cat.id} asChild>
                    <Link
                      href={`/services/${cat.slug}` as never}
                      className="flex items-center gap-2"
                    >
                      {cat.icon && <span>{cat.icon}</span>}
                      <span>{cat.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/services" className="flex items-center gap-2 font-medium">
                    <span>{t("allCategories")}</span>
                  </Link>
                </DropdownMenuItem>
              </>
            ) : (
              // Fallback when no categories (empty DB)
              <DropdownMenuItem asChild>
                <Link href="/services" className="flex items-center gap-2">
                  <span>{t("allCategories")}</span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Bar — autocomplete with live suggestions */}
        <div className="hidden w-72 md:block lg:w-96">
          <SearchAutocomplete />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          {/* Notifications placeholder — Phase 9 */}
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          {/* Auth / User menu */}
          {status === "authenticated" && session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                      {getInitials(session.user.name, session.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[120px] truncate text-sm font-medium lg:inline">
                    {session.user.name ?? session.user.email}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    href={session.user.role === "PROVIDER" ? "/provider/dashboard" : "/"}
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    <span>{t("dashboard")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/security" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>{t("settings")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{tAuth("logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">{tAuth("login")}</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/auth/register">{tAuth("register")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
