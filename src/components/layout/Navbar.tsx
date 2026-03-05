"use client";

import { useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { CalendarCheck, ChevronDown, LogOut, Menu, MessageSquare, Settings, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { NotificationBell } from "@/features/notification/components/NotificationBell";
import { SearchAutocomplete } from "@/features/search/components/SearchAutocomplete";
import { Logo } from "@/components/shared/Logo";
import { Link } from "@/i18n/routing";
import { getUnreadCountAction } from "@/features/messaging/actions/conversation-queries";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// ============================================================
// TYPES
// ============================================================

interface NavCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
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
  const tBooking = useTranslations("booking");

  // Logout confirmation dialog
  const [logoutOpen, setLogoutOpen] = useState(false);

  // DB-driven categories fetched from /api/search/categories on mount
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  // Unread message count for badge on messages icon
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const res = await fetch("/api/search/categories", { cache: "no-store" });
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { categories: NavCategory[] };
          // Show only root (top-level) categories — same as search filter sidebar
          setCategories(data.categories.filter((c) => !c.parentId).slice(0, 8));
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

  const fetchUnreadMessages = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const result = await getUnreadCountAction();
      if (result.success) {
        setUnreadMessages(result.data.total);
      }
    } catch {
      // Badge is non-critical — silently ignore errors
    }
  }, [status]);

  useEffect(() => {
    void fetchUnreadMessages();
    const interval = setInterval(() => void fetchUnreadMessages(), 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadMessages]);

  return (
    <header className="sticky top-0 z-50 hidden w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Categories Dropdown & Search Bar — only for non-provider users */}
        {session?.user?.role !== "PROVIDER" && (
          <>
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
                          href={`/services?category=${cat.slug}` as never}
                          className="flex items-center gap-2"
                        >
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
          </>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {/* Messages icon with unread badge — for authenticated users */}
          {status === "authenticated" && session?.user ? (
            <Button variant="ghost" size="sm" asChild className="relative px-2">
              <Link
                href={(session.user.role === "PROVIDER" ? "/provider/messages" : "/messages") as never}
              >
                <MessageSquare className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </Link>
            </Button>
          ) : null}
          {/* NotificationBell — shows red unread badge, opens dropdown */}
          {status === "authenticated" && session?.user ? (
            <NotificationBell
              allNotificationsUrl={
                session.user.role === "PROVIDER"
                  ? "/provider/notifications"
                  : "/notifications"
              }
            />
          ) : null}
          {/* Mes reservations — visible only for authenticated CLIENT users */}
          {status === "authenticated" && session?.user?.role === "CLIENT" && (
            <Button variant="ghost" asChild className="flex items-center gap-2">
              <Link href="/bookings" className="flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4" />
                <span className="hidden text-sm lg:inline">{tBooking("myBookings")}</span>
              </Link>
            </Button>
          )}
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
                    href={session.user.role === "PROVIDER" ? "/provider/dashboard" : "/dashboard"}
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    <span>{t("dashboard")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={(session.user.role === "PROVIDER" ? "/provider/messages" : "/messages") as never}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>{t("messages")}</span>
                    {unreadMessages > 0 && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                      </span>
                    )}
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
                  onClick={() => setLogoutOpen(true)}
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

      {/* Logout confirmation dialog */}
      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title={tAuth("logout")}
        description="Voulez-vous vraiment vous déconnecter ?"
        onConfirm={() => signOut({ callbackUrl: "/" })}
        variant="destructive"
      />
    </header>
  );
}
