import { getServerSession } from "next-auth";
import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";

import { redirect } from "@/i18n/routing";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ServiceForm } from "@/features/provider/components/ServiceForm";

interface Props {
  params: Promise<{ serviceId: string; locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("service");
  return {
    title: `${t("editPageTitle")} | Tawa Services`,
  };
}

export default async function EditServicePage({ params }: Props) {
  const { serviceId } = await params;
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  // KYC GUARD — only APPROVED providers can edit services
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

  // Fetch the service with ownership check
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      providerId: provider.id,
      isDeleted: false,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      },
    },
  });

  // If service not found or doesn't belong to this provider, redirect to list
  if (!service) {
    return redirect({ href: "/provider/services", locale });
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

  // Map pricingType: DB only has FIXED/SUR_DEVIS, UI also has HOURLY
  // We stored HOURLY as FIXED in DB — here we restore as FIXED for the form
  // (no way to distinguish HOURLY from FIXED in DB for now)
  const uiPricingType =
    service.pricingType === "SUR_DEVIS" ? "SUR_DEVIS" : "FIXED";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold text-foreground">
          {t("editPageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{service.title}</p>
      </div>

      <ServiceForm
        mode="edit"
        serviceId={service.id}
        categories={categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          parentId: cat.parentId,
          children: cat.children.map((child) => ({
            id: child.id,
            name: child.name,
          })),
        }))}
        initialData={{
          id: service.id,
          title: service.title,
          description: service.description,
          categoryId: service.categoryId,
          pricingType: uiPricingType,
          fixedPrice: service.fixedPrice,
          durationMinutes: service.durationMinutes,
          inclusions: service.inclusions,
          exclusions: service.exclusions,
          conditions: service.conditions,
          photoUrls: service.photoUrls,
        }}
      />
    </div>
  );
}
