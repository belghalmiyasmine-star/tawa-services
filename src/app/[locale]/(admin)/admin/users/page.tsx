import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Users } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Utilisateurs | Admin",
  };
}

export default async function AdminUsersPage() {
  const t = await getTranslations("navigation");
  const tPlaceholder = await getTranslations("placeholder");

  return (
    <div>
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">{t("users")}</h1>
      </div>
      <div className="mt-8 rounded-lg border bg-card p-8 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          {tPlaceholder("comingSoon")}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {tPlaceholder("usersDescription")}
        </p>
      </div>
    </div>
  );
}
