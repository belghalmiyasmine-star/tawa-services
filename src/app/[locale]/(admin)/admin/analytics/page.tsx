import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BarChart3 } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Analytique | Admin",
  };
}

export default async function AdminAnalyticsPage() {
  const t = await getTranslations("navigation");
  const tPlaceholder = await getTranslations("placeholder");

  return (
    <div>
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">{t("analytics")}</h1>
      </div>
      <div className="mt-8 rounded-lg border bg-card p-8 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          {tPlaceholder("comingSoon")}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {tPlaceholder("analyticsDescription")}
        </p>
      </div>
    </div>
  );
}
