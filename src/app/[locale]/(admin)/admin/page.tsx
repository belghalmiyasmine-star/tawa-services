import { useTranslations } from "next-intl";

// Placeholder — sera remplace par l'implementation complete en Phase 10 (Admin)
export default function AdminDashboardPage() {
  const t = useTranslations("navigation");

  return (
    <div>
      <h1 className="text-3xl font-bold">{t("admin")}</h1>
      <p className="mt-4 text-gray-600">
        Panneau d&apos;administration — Phase 10 (Admin)
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {["Utilisateurs", "KYC", "Services", "Signalements"].map((item) => (
          <div key={item} className="rounded-lg border bg-white p-4">
            <p className="text-sm font-medium text-gray-500">{item}</p>
            <p className="mt-1 text-2xl font-bold">0</p>
          </div>
        ))}
      </div>
    </div>
  );
}
