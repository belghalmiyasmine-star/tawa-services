"use client";

import { useTranslations } from "next-intl";
import { Search, Menu, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/routing";

// Categories placeholder — sera remplace par donnees DB en Phase 5.
// Les labels proviennent de fr.json sous le namespace "categories".
const CATEGORIES = [
  { slug: "plomberie", icon: "🔧", labelKey: "plomberie" },
  { slug: "electricite", icon: "⚡", labelKey: "electricite" },
  { slug: "menage", icon: "🧹", labelKey: "menage" },
  { slug: "cours", icon: "📚", labelKey: "cours" },
  { slug: "jardinage", icon: "🌱", labelKey: "jardinage" },
  { slug: "peinture", icon: "🎨", labelKey: "peinture" },
];

export function Navbar() {
  const t = useTranslations("navigation");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  // Labels categories depuis fr.json["categories"] — aucun label hardcode
  const tCat = useTranslations("categories");

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

        {/* Categories Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1">
              <Menu className="h-4 w-4" />
              <span>{t("categories")}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {CATEGORIES.map((cat) => (
              <DropdownMenuItem key={cat.slug} asChild>
                <Link href={`/services/${cat.slug}` as never} className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{tCat(cat.labelKey)}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Bar */}
        <div className="hidden w-72 md:block lg:w-96">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={tCommon("search")} className="rounded-full pl-9" />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          {/* Notifications placeholder — Phase 9 */}
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          {/* Auth placeholder — Phase 2 */}
          <Button variant="ghost" asChild>
            <Link href="/auth/login">{tAuth("login")}</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/auth/register">{tAuth("register")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
