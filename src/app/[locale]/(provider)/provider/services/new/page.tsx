import { getServerSession } from "next-auth";
import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";

import { redirect } from "@/i18n/routing";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ServiceForm } from "@/features/provider/components/ServiceForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("service");
  return {
    title: `${t("createPageTitle")} | Tawa Services`,
  };
}

export default async function NewServicePage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  // KYC GUARD — only APPROVED providers can create services
  const provider = await prisma.provider.findUnique({
    where: { userId: session.user.id },
    select: { id: true, kycStatus: true },
  });

  if (!provider) {
    return redirect({ href: "/", locale });
  }

  if (provider.kycStatus !== "APPROVED") {
    return redirect({ href: "/provider/kyc", locale });
  }

  // Fetch all active categories with children
  const categories = await prisma.category.findMany({
    where: { isActive: true, isDeleted: false },
    include: {
      children: {
        where: { isActive: true, isDeleted: false },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const t = await getTranslations("service");

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold text-foreground">
          {t("createPageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          Creez un nouveau service pour etre decouverts par des clients.
        </p>
      </div>

      <ServiceForm
        mode="create"
        categories={categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          parentId: cat.parentId,
          children: cat.children.map((child) => ({
            id: child.id,
            name: child.name,
          })),
        }))}
      />
    </div>
  );
}
