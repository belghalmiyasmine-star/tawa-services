import { notFound } from "next/navigation";

import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import type { Metadata } from "next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { PublicProfileAbout } from "@/features/provider/components/PublicProfileAbout";
import { PublicProfileHeader } from "@/features/provider/components/PublicProfileHeader";
import { PublicProfileStats } from "@/features/provider/components/PublicProfileStats";
import { PublicServiceCard } from "@/features/provider/components/PublicServiceCard";
import { ReviewsList } from "@/features/review/components/ReviewsList";
import { getProviderReviewsAction } from "@/features/review/actions/review-queries";
import { ContactProviderButton } from "@/features/messaging/components/ContactProviderButton";

// ============================================================
// TYPES
// ============================================================

interface ProviderPageProps {
  params: Promise<{
    locale: string;
    providerId: string;
  }>;
}

// ============================================================
// METADATA
// ============================================================

export async function generateMetadata({
  params,
}: ProviderPageProps): Promise<Metadata> {
  const { providerId } = await params;

  const provider = await prisma.provider.findUnique({
    where: { id: providerId, isDeleted: false, isActive: true },
    select: { displayName: true, bio: true },
  });

  if (!provider) {
    return {
      title: "Prestataire introuvable | Tawa Services",
    };
  }

  const description = provider.bio
    ? provider.bio.slice(0, 160)
    : `Profil prestataire de ${provider.displayName} sur Tawa Services`;

  return {
    title: `${provider.displayName} | Tawa Services`,
    description,
    openGraph: {
      title: `${provider.displayName} | Tawa Services`,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${provider.displayName} | Tawa Services`,
      description,
    },
  };
}

// ============================================================
// PAGE
// ============================================================

export default async function PublicProviderProfilePage({
  params,
}: ProviderPageProps) {
  const { providerId } = await params;
  const t = await getTranslations("provider");

  // Fetch initial reviews for SSR (avoids loading flash on Avis tab)
  const reviewsResult = await getProviderReviewsAction(providerId, {
    page: 1,
    limit: 5,
    sort: "recent",
  });
  const initialReviewData = reviewsResult.success ? reviewsResult.data : undefined;

  // Fetch provider with all related data
  const provider = await prisma.provider.findUnique({
    where: { id: providerId, isDeleted: false, isActive: true },
    include: {
      user: { select: { name: true, email: true } },
      trustBadges: { where: { isActive: true } },
      delegations: {
        include: {
          delegation: {
            include: { gouvernorat: true },
          },
        },
      },
      certifications: { where: { isDeleted: false } },
      portfolioPhotos: {
        where: { isDeleted: false },
        orderBy: { sortOrder: "asc" },
      },
      services: {
        where: { status: "ACTIVE", isDeleted: false },
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
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // 404 if provider not found or not active
  if (!provider) {
    notFound();
  }

  // Look up user favorites for heart icons
  let favoritedServiceIds = new Set<string>();
  const session = await getServerSession(authOptions);
  if (session?.user?.id && provider.services.length > 0) {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
        serviceId: { in: provider.services.map((s) => s.id) },
      },
      select: { serviceId: true },
    });
    favoritedServiceIds = new Set(favorites.map((f) => f.serviceId));
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      {/* Hero header */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <PublicProfileHeader
          provider={{
            displayName: provider.displayName,
            photoUrl: provider.photoUrl,
            kycStatus: provider.kycStatus,
            rating: provider.rating,
            ratingCount: provider.ratingCount,
            createdAt: provider.createdAt,
            delegations: provider.delegations,
          }}
          badges={provider.trustBadges}
        />
        {session?.user?.id && session.user.role === "CLIENT" && (
          <div className="border-t border-gray-100 px-6 pb-4 pt-3 dark:border-gray-700">
            <ContactProviderButton
              providerId={provider.id}
              label={t("contact")}
            />
          </div>
        )}
      </div>

      {/* Stats section */}
      <div className="mt-4">
        <PublicProfileStats
          provider={{
            completedMissions: provider.completedMissions,
            rating: provider.rating,
            ratingCount: provider.ratingCount,
            responseRate: provider.responseRate,
            responseTimeHours: provider.responseTimeHours,
          }}
        />
      </div>

      {/* Tabs: Services | Avis | A propos */}
      <div className="mt-6">
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="services">{t("tabServices")}</TabsTrigger>
            <TabsTrigger value="avis">{t("tabReviews")}</TabsTrigger>
            <TabsTrigger value="apropos">{t("tabAbout")}</TabsTrigger>
          </TabsList>

          {/* Services tab */}
          <TabsContent value="services" className="mt-4">
            {provider.services.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {provider.services.map((service) => (
                  <PublicServiceCard
                    key={service.id}
                    service={service}
                    isFavorited={session?.user?.id ? favoritedServiceIds.has(service.id) : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl">📋</span>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Aucun service publie
                </p>
              </div>
            )}
          </TabsContent>

          {/* Avis tab — real reviews with breakdown, criteria chart, sorting, pagination */}
          <TabsContent value="avis" className="mt-4">
            <ReviewsList
              providerId={provider.id}
              initialData={initialReviewData}
            />
          </TabsContent>

          {/* A propos tab */}
          <TabsContent value="apropos" className="mt-4">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <PublicProfileAbout
                provider={{
                  bio: provider.bio,
                  yearsExperience: provider.yearsExperience,
                  languages: provider.languages,
                  delegations: provider.delegations,
                  certifications: provider.certifications,
                  portfolioPhotos: provider.portfolioPhotos,
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
