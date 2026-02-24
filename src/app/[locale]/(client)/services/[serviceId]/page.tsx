import { notFound } from "next/navigation";

import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ServiceImageGallery } from "@/features/search/components/ServiceImageGallery";
import { ProviderMiniCard } from "@/features/search/components/ProviderMiniCard";
import { ServiceDetailClient } from "@/features/search/components/ServiceDetailClient";
import { PublicServiceCard } from "@/features/provider/components/PublicServiceCard";

// ============================================================
// TYPES
// ============================================================

interface ServicePageProps {
  params: Promise<{
    locale: string;
    serviceId: string;
  }>;
}

// ============================================================
// HELPERS
// ============================================================

function formatPrice(pricingType: "FIXED" | "SUR_DEVIS", fixedPrice: number | null, surDevisLabel: string): string {
  if (pricingType === "SUR_DEVIS" || fixedPrice === null) return surDevisLabel;
  return `${fixedPrice.toLocaleString("fr-TN")} TND`;
}

function formatDuration(minutes: number | null): string | null {
  if (minutes === null) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (rem === 0) return `${hours}h`;
  return `${hours}h${rem}min`;
}

// ============================================================
// METADATA
// ============================================================

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { serviceId } = await params;

  const service = await prisma.service.findUnique({
    where: { id: serviceId, isDeleted: false, status: "ACTIVE" },
    select: { title: true, description: true },
  });

  if (!service) {
    return { title: "Service introuvable | Tawa Services" };
  }

  const description = service.description.slice(0, 160);

  return {
    title: `${service.title} | Tawa Services`,
    description,
    openGraph: {
      title: `${service.title} | Tawa Services`,
      description,
      type: "article",
    },
  };
}

// ============================================================
// PAGE
// ============================================================

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { serviceId } = await params;
  const t = await getTranslations("search");

  // Fetch service with all related data
  const service = await prisma.service.findUnique({
    where: { id: serviceId, isDeleted: false, status: "ACTIVE" },
    include: {
      category: { include: { parent: true } },
      provider: {
        include: {
          user: { select: { name: true, email: true } },
          trustBadges: { where: { isActive: true } },
          delegations: {
            include: {
              delegation: { include: { gouvernorat: true } },
            },
          },
          certifications: { where: { isDeleted: false } },
        },
      },
    },
  });

  if (!service) {
    notFound();
  }

  // Fire-and-forget view count increment (does not block render)
  void prisma.service.update({
    where: { id: serviceId },
    data: { viewCount: { increment: 1 } },
  });

  // Fetch similar services in the same category (exclude current)
  const similarServices = await prisma.service.findMany({
    where: {
      categoryId: service.categoryId,
      id: { not: serviceId },
      isDeleted: false,
      status: "ACTIVE",
    },
    include: {
      category: { include: { parent: true } },
      provider: {
        select: {
          displayName: true,
          photoUrl: true,
          rating: true,
          ratingCount: true,
          delegations: {
            include: {
              delegation: { include: { gouvernorat: true } },
            },
            take: 1,
          },
        },
      },
    },
    take: 4,
    orderBy: { viewCount: "desc" },
  });

  const categoryLabel = service.category.parent
    ? service.category.name
    : service.category.name;

  const priceLabel = formatPrice(
    service.pricingType,
    service.fixedPrice,
    t("priceSurDevis"),
  );

  const duration = formatDuration(service.durationMinutes);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      {/* Image Gallery */}
      <div className="mb-6">
        <ServiceImageGallery photos={service.photoUrls} title={service.title} />
      </div>

      {/* Main content: 2-col on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — service details */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Category badge */}
          <div>
            <Badge variant="secondary" className="text-xs font-normal">
              {categoryLabel}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
            {service.title}
          </h1>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {priceLabel}
            </span>
            {duration && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                · {duration}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {service.description}
            </p>
          </div>

          {/* Inclusions */}
          {service.inclusions.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t("inclusions")}
              </h2>
              <ul className="flex flex-col gap-1.5">
                {service.inclusions.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Exclusions */}
          {service.exclusions.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t("exclusions")}
              </h2>
              <ul className="flex flex-col gap-1.5">
                {service.exclusions.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conditions */}
          {service.conditions && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t("conditions")}
              </h2>
              <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                {service.conditions}
              </p>
            </div>
          )}
        </div>

        {/* Right column — sticky provider card + action buttons */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          <div className="sticky top-20 flex flex-col gap-4">
            {/* Provider mini-card */}
            <ProviderMiniCard
              provider={{
                id: service.provider.id,
                displayName: service.provider.displayName,
                photoUrl: service.provider.photoUrl,
                rating: service.provider.rating,
                ratingCount: service.provider.ratingCount,
                kycStatus: service.provider.kycStatus,
                delegations: service.provider.delegations,
                trustBadges: service.provider.trustBadges,
              }}
            />

            {/* Action buttons */}
            <ServiceDetailClient
              serviceId={service.id}
              pricingType={service.pricingType}
              providerId={service.provider.id}
            />
          </div>
        </div>
      </div>

      {/* Similar services */}
      {similarServices.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("similarServices")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similarServices.map((similarService) => (
              <PublicServiceCard
                key={similarService.id}
                service={similarService}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
