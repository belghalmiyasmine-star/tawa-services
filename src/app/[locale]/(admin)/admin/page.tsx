import { useTranslations } from "next-intl";

// Placeholder — sera remplace par l'implementation complete en Phase 10 (Admin)
export default function AdminDashboardPage() {
  const t = useTranslations("navigation");
  const tPlaceholder = useTranslations("placeholder");

  const kpiKeys = ["users", "kyc", "services", "reports"] as const;

  return (
    <div>
      <h1 className="text-3xl font-bold">{t("admin")}</h1>
      <p className="mt-4 text-muted-foreground">{tPlaceholder("adminDescription")}</p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpiKeys.map((key) => (
          <div key={key} className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">{t(key)}</p>
            <p className="mt-1 text-2xl font-bold">0</p>
          </div>
        ))}
      </div>
    </div>
  );
}
