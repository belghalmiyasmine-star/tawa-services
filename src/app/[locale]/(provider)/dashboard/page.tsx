import { useTranslations } from "next-intl";

// Placeholder — sera remplace par l'implementation complete en Phase 4 (Profil & Services)
export default function ProviderDashboardPage() {
  const t = useTranslations("navigation");
  const tPlaceholder = useTranslations("placeholder");

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
      <p className="mt-4 text-muted-foreground">
        {tPlaceholder("providerDashboardDescription")}
      </p>
    </div>
  );
}
