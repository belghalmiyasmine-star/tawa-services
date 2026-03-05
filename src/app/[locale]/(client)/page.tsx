import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryGrid } from "@/features/search/components/CategoryGrid";
import { getRecommendations } from "@/lib/ai/recommendation";
import { HeroSection } from "@/features/home/components/HeroSection";
import { CtaSection } from "@/features/home/components/CtaSection";
import { SectionFadeIn } from "@/features/home/components/SectionFadeIn";

// ============================================================
// HOMEPAGE — Async server component with streaming sections
// ============================================================

// ────────────────────────────────────────────────
// ASYNC DATA COMPONENTS (stream independently via Suspense)
// ────────────────────────────────────────────────

async function CategoriesSection() {
  const t = await getTranslations("home");

  let categories: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    serviceCount: number;
  }[] = [];

  try {
    const dbCategories = await prisma.category.findMany({
      where: { isActive: true, isDeleted: false, parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        _count: {
          select: {
            services: { where: { status: "ACTIVE", isDeleted: false } },
          },
        },
        children: {
          where: { isDeleted: false, isActive: true },
          select: {
            _count: {
              select: {
                services: { where: { status: "ACTIVE", isDeleted: false } },
              },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
      take: 10,
    });

    categories = dbCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      serviceCount:
        cat._count.services +
        cat.children.reduce((sum, child) => sum + child._count.services, 0),
    }));
  } catch {
    categories = [];
  }

  return (
    <section>
      <h2 className="mb-8 text-center text-2xl font-bold tracking-tight md:mb-10 md:text-3xl">{t("featuredCategories")}</h2>
      <CategoryGrid categories={categories} />
    </section>
  );
}

async function TestimonialsSection() {
  const t = await getTranslations("home");

  // Lazy import — only loaded when this section streams in
  const { TestimonialsCarousel } = await import(
    "@/features/review/components/TestimonialsCarousel"
  );

  let testimonials: {
    id: string;
    stars: number;
    text: string;
    authorName: string;
    authorAvatar: string | null;
    providerName: string;
  }[] = [];

  try {
    const dbReviews = await prisma.review.findMany({
      where: {
        stars: 5,
        published: true,
        isDeleted: false,
        flagged: false,
        text: { not: null },
        authorRole: "CLIENT",
      },
      select: {
        id: true,
        stars: true,
        text: true,
        booking: {
          select: {
            client: { select: { name: true, avatarUrl: true } },
            provider: { select: { displayName: true } },
          },
        },
      },
      orderBy: { publishedAt: "desc" },
      take: 8,
    });

    testimonials = dbReviews.map((r) => ({
      id: r.id,
      stars: r.stars,
      text: r.text!,
      authorName: r.booking.client.name ?? "Client",
      authorAvatar: r.booking.client.avatarUrl,
      providerName: r.booking.provider.displayName,
    }));
  } catch {
    testimonials = [];
  }

  if (testimonials.length === 0) return null;

  return (
    <section className="mt-14 md:mt-20">
      <div className="mb-8 text-center md:mb-10">
        <h2 className="text-2xl font-bold md:text-3xl">{t("clientReviews")}</h2>
        <p className="mt-3 text-base text-muted-foreground">{t("clientReviewsSubtitle")}</p>
      </div>
      <TestimonialsCarousel items={testimonials} />
    </section>
  );
}

async function TopProvidersSection() {
  const t = await getTranslations("home");

  // Lazy import — only loaded when this section streams in
  const { TopProvidersGrid } = await import(
    "@/features/provider/components/TopProvidersGrid"
  );

  let topProviders: {
    id: string;
    displayName: string;
    photoUrl: string | null;
    rating: number;
    ratingCount: number;
    completedMissions: number;
    city: string | null;
    isVerified: boolean;
  }[] = [];

  try {
    const dbProviders = await prisma.provider.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        ratingCount: { gte: 1 },
      },
      select: {
        id: true,
        displayName: true,
        photoUrl: true,
        rating: true,
        ratingCount: true,
        completedMissions: true,
        kycStatus: true,
        delegations: {
          take: 1,
          select: {
            delegation: {
              select: { gouvernorat: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: [{ rating: "desc" }, { ratingCount: "desc" }],
      take: 6,
    });

    topProviders = dbProviders.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      photoUrl: p.photoUrl,
      rating: p.rating,
      ratingCount: p.ratingCount,
      completedMissions: p.completedMissions,
      city: p.delegations[0]?.delegation.gouvernorat.name ?? null,
      isVerified: p.kycStatus === "APPROVED",
    }));
  } catch {
    topProviders = [];
  }

  if (topProviders.length === 0) return null;

  return (
    <section className="mt-14 md:mt-20">
      <div className="mb-8 text-center md:mb-10">
        <h2 className="text-2xl font-bold md:text-3xl">{t("topProviders")}</h2>
        <p className="mt-3 text-base text-muted-foreground">{t("topProvidersSubtitle")}</p>
      </div>
      <TopProvidersGrid providers={topProviders} />
    </section>
  );
}

// ────────────────────────────────────────────────
// SKELETON FALLBACKS
// ────────────────────────────────────────────────

function CategoriesSkeleton() {
  return (
    <section className="mt-10 md:mt-16">
      <Skeleton className="mb-6 h-8 w-48 md:mb-8" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 rounded-xl border p-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    </section>
  );
}

function TestimonialsSkeleton() {
  return (
    <section className="mt-10 md:mt-16">
      <div className="mb-6 flex flex-col items-center gap-2 md:mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-xl border p-6">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-4" />
              ))}
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="flex items-center gap-3 border-t pt-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-1 h-3 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

async function RecommendationsSection() {
  const t = await getTranslations("home");
  const session = await getServerSession(authOptions);

  // Only show for logged-in clients
  if (!session?.user?.id || session.user.role !== "CLIENT") return null;

  const { TopProvidersGrid } = await import(
    "@/features/provider/components/TopProvidersGrid"
  );

  let recommendedProviders: {
    id: string;
    displayName: string;
    photoUrl: string | null;
    rating: number;
    ratingCount: number;
    completedMissions: number;
    city: string | null;
    isVerified: boolean;
  }[] = [];

  try {
    const recommendedIds = await getRecommendations(session.user.id, 6);

    if (recommendedIds.length === 0) return null;

    const dbProviders = await prisma.provider.findMany({
      where: {
        id: { in: recommendedIds },
        isDeleted: false,
        isActive: true,
      },
      select: {
        id: true,
        displayName: true,
        photoUrl: true,
        rating: true,
        ratingCount: true,
        completedMissions: true,
        kycStatus: true,
        delegations: {
          take: 1,
          select: {
            delegation: {
              select: { gouvernorat: { select: { name: true } } },
            },
          },
        },
      },
    });

    // Preserve the recommended order
    const providerMap = new Map(dbProviders.map((p) => [p.id, p]));
    recommendedProviders = recommendedIds
      .map((id) => providerMap.get(id))
      .filter(Boolean)
      .map((p) => ({
        id: p!.id,
        displayName: p!.displayName,
        photoUrl: p!.photoUrl,
        rating: p!.rating,
        ratingCount: p!.ratingCount,
        completedMissions: p!.completedMissions,
        city: p!.delegations[0]?.delegation.gouvernorat.name ?? null,
        isVerified: p!.kycStatus === "APPROVED",
      }));
  } catch {
    recommendedProviders = [];
  }

  if (recommendedProviders.length === 0) return null;

  return (
    <section className="mt-14 md:mt-20">
      <div className="mb-8 text-center md:mb-10">
        <h2 className="text-2xl font-bold md:text-3xl">
          {t("recommendedForYou") ?? "Recommande pour vous"}
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          {t("recommendedSubtitle") ?? "Des prestataires selectionnes selon vos preferences"}
        </p>
      </div>
      <TopProvidersGrid providers={recommendedProviders} />
    </section>
  );
}

function RecommendationsSkeleton() {
  return (
    <section className="mt-10 md:mt-16">
      <div className="mb-6 flex flex-col items-center gap-2 md:mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 rounded-xl border p-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}

function TopProvidersSkeleton() {
  return (
    <section className="mt-10 md:mt-16">
      <div className="mb-6 flex flex-col items-center gap-2 md:mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 rounded-xl border p-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────
// PAGE COMPONENT
// ────────────────────────────────────────────────

const getHeroStats = unstable_cache(
  async () => {
    try {
      const [providerCount, serviceCount, ratingAgg] = await Promise.all([
        prisma.provider.count({
          where: { isDeleted: false, isActive: true, kycStatus: "APPROVED" },
        }),
        prisma.service.count({
          where: { isDeleted: false, status: "ACTIVE" },
        }),
        prisma.provider.aggregate({
          _avg: { rating: true },
          where: { isDeleted: false, isActive: true, ratingCount: { gte: 1 } },
        }),
      ]);

      return {
        providerCount,
        serviceCount,
        avgRating: ratingAgg._avg.rating ?? 0,
      };
    } catch {
      return { providerCount: 0, serviceCount: 0, avgRating: 0 };
    }
  },
  ["hero-stats"],
  { revalidate: 60 },
);

export default async function ClientHomePage() {
  const t = await getTranslations("home");
  const heroStats = await getHeroStats();

  return (
    <>
      <HeroSection stats={heroStats} />

      <div className="container mx-auto max-w-7xl px-4 py-12 md:py-16">
        {/* Categories */}
        <SectionFadeIn>
          <Suspense fallback={<CategoriesSkeleton />}>
            <CategoriesSection />
          </Suspense>
        </SectionFadeIn>

        {/* Recommendations */}
        <SectionFadeIn delay="0.1s">
          <Suspense fallback={<RecommendationsSkeleton />}>
            <RecommendationsSection />
          </Suspense>
        </SectionFadeIn>

        {/* Testimonials */}
        <SectionFadeIn delay="0.1s">
          <Suspense fallback={<TestimonialsSkeleton />}>
            <TestimonialsSection />
          </Suspense>
        </SectionFadeIn>

        {/* Top Providers */}
        <SectionFadeIn delay="0.1s">
          <Suspense fallback={<TopProvidersSkeleton />}>
            <TopProvidersSection />
          </Suspense>
        </SectionFadeIn>

        {/* How it works */}
        <SectionFadeIn delay="0.1s">
          <section className="mt-14 md:mt-20">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-primary">En 3 etapes</p>
            <h2 className="mb-8 text-center text-2xl font-bold tracking-tight md:mb-10 md:text-3xl">{t("howItWorks")}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { step: "1", title: t("step1Title"), desc: t("step1Description") },
                { step: "2", title: t("step2Title"), desc: t("step2Description") },
                { step: "3", title: t("step3Title"), desc: t("step3Description") },
              ].map((item) => (
                <div key={item.step} className="card-elegant rounded-2xl p-7">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {item.step}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </SectionFadeIn>
      </div>

      {/* Full-width CTA */}
      <CtaSection />
    </>
  );
}
