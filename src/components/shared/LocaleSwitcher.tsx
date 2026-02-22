"use client";

import { useLocale, useTranslations } from "next-intl";
// IMPORTANT: Utiliser usePathname/useRouter de @/i18n/routing (createNavigation helpers),
// PAS de next/navigation — les helpers gerent le prefixe locale automatiquement.
import { usePathname, useRouter, routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("locale");
  const pathname = usePathname();
  const router = useRouter();

  function handleChange(newLocale: string) {
    // useRouter de @/i18n/routing gere le changement de locale nativement —
    // pas besoin de manipuler les segments du chemin manuellement.
    router.replace(pathname, { locale: newLocale });
  }

  // Ne montrer que si plusieurs locales sont disponibles
  if (routing.locales.length <= 1) {
    return null;
  }

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-gray-300 px-2 py-1 text-sm"
      aria-label="Changer de langue"
    >
      {routing.locales.map((loc) => (
        <option key={loc} value={loc}>
          {t(loc)}
        </option>
      ))}
    </select>
  );
}
