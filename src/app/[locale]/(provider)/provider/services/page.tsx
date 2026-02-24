import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ServicesGrid } from "@/features/provider/components/ServicesGrid";
import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("service");
  return {
    title: `${t("myServicesTitle")} | Tawa Services`,
  };
}

export default async function MyServicesPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();
  const t = await getTranslations("service");

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  // Fetch provider with their services
  const provider = await prisma.provider.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!provider) {
    return redirect({ href: "/", locale });
  }

  const services = await prisma.service.findMany({
    where: {
      providerId: provider.id,
      isDeleted: false,
    },
    include: {
      category: {
        select: {
          name: true,
          parent: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("myServicesTitle")}
          </h1>
          {services.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("serviceCount", { count: services.length })}
            </p>
          )}
        </div>

        <Link href="/provider/services/new" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          {t("createService")}
        </Link>
      </div>

      {/* Services grid or empty state */}
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("myServicesEmpty")}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Creez votre premier service pour etre decouverts par des clients.
          </p>
          <Link href="/provider/services/new" className="mt-6 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            {t("myServicesCreate")}
          </Link>
        </div>
      ) : (
        <ServicesGrid initialServices={services} />
      )}
    </div>
  );
}
