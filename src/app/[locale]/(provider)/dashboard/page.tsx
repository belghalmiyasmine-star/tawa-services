import { useTranslations } from "next-intl";

// Placeholder — sera remplace par l'implementation complete en Phase 4 (Profil & Services)
export default function ProviderDashboardPage() {
  const t = useTranslations("navigation");

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
      <p className="mt-4 text-gray-600">
        Tableau de bord prestataire — Phase 4 (Profil &amp; Services)
      </p>
    </div>
  );
}
