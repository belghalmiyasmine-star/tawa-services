import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { CategoryGrid } from "@/features/search/components/CategoryGrid";
import { SearchAutocomplete } from "@/features/search/components/SearchAutocomplete";
import {
  TestimonialsCarousel,
  type TestimonialItem,
} from "@/features/review/components/TestimonialsCarousel";
import {
  TopProvidersGrid,
  type TopProviderItem,
} from "@/features/provider/components/TopProvidersGrid";

// ============================================================
// HOMEPAGE — Async server component (Phase 5 DB-driven)
// ============================================================

export default async function ClientHomePage() {
  const t = await getTranslations("home");

  // Fetch top-level categories from DB with active service counts
  let categories: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    serviceCount: number;
  }[] = [];

  let testimonials: TestimonialItem[] = [];
  let topProviders: TopProviderItem[] = [];

  try {
    const [dbCategories, dbReviews, dbProviders] = await Promise.all([
      // ── Categories ──
      prisma.category.findMany({
        where: {
          isActive: true,
          isDeleted: false,
          parentId: null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          _count: {
            select: {
              services: {
                where: { status: "ACTIVE", isDeleted: false },
              },
            },
          },
          children: {
            where: { isDeleted: false, isActive: true },
            select: {
              _count: {
                select: {
                  services: {
                    where: { status: "ACTIVE", isDeleted: false },
                  },
                },
              },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
        take: 10,
      }),

      // ── Best reviews (5-star, published, with text) ──
      prisma.review.findMany({
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
              client: {
                select: { name: true, avatarUrl: true },
              },
              provider: {
                select: { displayName: true },
              },
            },
          },
        },
        orderBy: { publishedAt: "desc" },
        take: 8,
      }),

      // ── Top providers by rating (min 1 review, active, not deleted) ──
      prisma.provider.findMany({
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
                select: {
                  gouvernorat: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ rating: "desc" }, { ratingCount: "desc" }],
        take: 6,
      }),
    ]);

    categories = dbCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      serviceCount:
        cat._count.services +
        cat.children.reduce((sum, child) => sum + child._count.services, 0),
    }));

    testimonials = dbReviews.map((r) => ({
      id: r.id,
      stars: r.stars,
      text: r.text!,
      authorName: r.booking.client.name ?? "Client",
      authorAvatar: r.booking.client.avatarUrl,
      providerName: r.booking.provider.displayName,
    }));

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
    // DB unavailable — render with empty data (graceful degradation)
    categories = [];
    testimonials = [];
    topProviders = [];
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
          {t("heroTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:mt-6 md:text-lg">{t("heroSubtitle")}</p>

        {/* Search bar — autocomplete with DB suggestions */}
        <div className="mx-auto mt-8 max-w-lg">
          <SearchAutocomplete />
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Link
            href="/services"
            className="w-full rounded-full bg-primary px-8 py-3 text-center text-primary-foreground hover:bg-primary/90 sm:w-auto"
          >
            {t("searchButton")}
          </Link>
          <Link
            href="/auth/register"
            className="w-full rounded-full border border-primary px-8 py-3 text-center text-primary hover:bg-primary/10 sm:w-auto"
          >
            {t("becomeProvider")}
          </Link>
        </div>
      </section>

      {/* DB-driven category grid */}
      <section className="mt-10 md:mt-16">
        <h2 className="mb-6 text-xl font-semibold md:mb-8 md:text-2xl">{t("featuredCategories")}</h2>
        <CategoryGrid categories={categories} />
      </section>

      {/* Client testimonials carousel */}
      {testimonials.length > 0 && (
        <section className="mt-10 md:mt-16">
          <div className="mb-6 text-center md:mb-8">
            <h2 className="text-xl font-semibold md:text-2xl">{t("clientReviews")}</h2>
            <p className="mt-2 text-muted-foreground">{t("clientReviewsSubtitle")}</p>
          </div>
          <TestimonialsCarousel items={testimonials} />
        </section>
      )}

      {/* Top providers grid */}
      {topProviders.length > 0 && (
        <section className="mt-10 md:mt-16">
          <div className="mb-6 text-center md:mb-8">
            <h2 className="text-xl font-semibold md:text-2xl">{t("topProviders")}</h2>
            <p className="mt-2 text-muted-foreground">{t("topProvidersSubtitle")}</p>
          </div>
          <TopProvidersGrid providers={topProviders} />
        </section>
      )}

      {/* How it works */}
      <section className="mt-10 md:mt-16">
        <h2 className="mb-6 text-xl font-semibold md:mb-8 md:text-2xl">{t("howItWorks")}</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { step: "1", title: t("step1Title"), desc: t("step1Description") },
            { step: "2", title: t("step2Title"), desc: t("step2Description") },
            { step: "3", title: t("step3Title"), desc: t("step3Description") },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                {item.step}
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
