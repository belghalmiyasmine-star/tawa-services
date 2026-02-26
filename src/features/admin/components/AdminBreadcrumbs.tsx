"use client";

import { usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Home, ChevronRight } from "lucide-react";
import Link from "next/link";

// ============================================================
// SEGMENT LABEL MAP
// ============================================================

// Maps URL path segments to translation keys in admin.breadcrumbs
const SEGMENT_KEYS: Record<string, string> = {
  admin: "home",
  users: "users",
  services: "services",
  categories: "categories",
  reports: "reports",
  analytics: "analytics",
  content: "content",
  notifications: "notifications",
  commission: "commission",
  kyc: "kyc",
  reviews: "reviews",
};

// Map some segments to raw labels when no translation key exists
const SEGMENT_FALLBACK: Record<string, string> = {
  kyc: "KYC",
  reviews: "Avis",
};

// ============================================================
// TYPES
// ============================================================

interface BreadcrumbItem {
  label: string;
  href: string | null;
}

// ============================================================
// COMPONENT
// ============================================================

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations("admin.breadcrumbs");

  // Split pathname into segments, filter empty
  // pathname is locale-stripped by usePathname from i18n/routing
  const segments = pathname.split("/").filter(Boolean);

  // Find the index of "admin" segment
  const adminIndex = segments.findIndex((s) => s === "admin");
  if (adminIndex === -1) return null;

  const adminSegments = segments.slice(adminIndex); // ["admin", "users", "123", ...]

  // Build breadcrumb items
  const breadcrumbs: BreadcrumbItem[] = [];

  let cumulativePath = "";
  adminSegments.forEach((segment, index) => {
    cumulativePath += `/${segment}`;

    // Determine label
    let label: string;
    if (SEGMENT_KEYS[segment]) {
      try {
        label = t(SEGMENT_KEYS[segment] as Parameters<typeof t>[0]);
      } catch {
        label = SEGMENT_FALLBACK[segment] ?? segment;
      }
    } else {
      // Dynamic segment (ID, slug) — skip or show as-is (truncated)
      label = segment.length > 12 ? `${segment.slice(0, 8)}...` : segment;
    }

    const isLast = index === adminSegments.length - 1;

    breadcrumbs.push({
      label,
      href: isLast ? null : cumulativePath,
    });
  });

  // Don't render breadcrumbs on /admin root (single item)
  if (breadcrumbs.length <= 1) return null;

  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-sm text-muted-foreground">
      {/* Home icon link */}
      <Link
        href="/admin"
        className="flex items-center rounded p-1 hover:text-foreground"
        aria-label="Accueil administration"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
          {item.href ? (
            <Link
              href={item.href as never}
              className="rounded px-1 py-0.5 hover:text-foreground"
            >
              {item.label}
            </Link>
          ) : (
            <span className="px-1 py-0.5 font-medium text-foreground">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
