import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["fr", "ar", "en"],
  defaultLocale: "fr",
});

// Navigation helpers type-safe qui gerent le prefixe locale automatiquement.
// Utiliser ces exports PARTOUT dans l'application a la place de next/navigation:
//   import { Link, useRouter, redirect } from "@/i18n/routing";
export const { Link, useRouter, redirect, usePathname } = createNavigation(routing);
