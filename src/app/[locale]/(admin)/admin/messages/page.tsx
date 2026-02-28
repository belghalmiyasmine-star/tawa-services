import type { Metadata } from "next";

import { MessageSquare } from "lucide-react";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Messages | Admin",
};

export default async function AdminMessagesPage() {
  const t = await getTranslations("placeholder");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <MessageSquare className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      {/* Placeholder content */}
      <div className="rounded-lg border bg-card p-12 text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold">{t("comingSoon")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("messagesDescription")}
        </p>
      </div>
    </div>
  );
}
