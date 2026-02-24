import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { CategoryGrid } from "@/features/search/components/CategoryGrid";
import { SearchAutocomplete } from "@/features/search/components/SearchAutocomplete";

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

  try {
    const dbCategories = await prisma.category.findMany({
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
    // DB unavailable — render with empty categories (graceful degradation)
    categories = [];
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t("heroTitle")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">{t("heroSubtitle")}</p>

        {/* Search bar — autocomplete with DB suggestions */}
        <div className="mx-auto mt-8 max-w-lg">
          <SearchAutocomplete />
        </div>

        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/services"
            className="rounded-full bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
          >
            {t("searchButton")}
          </Link>
          <Link
            href="/become-provider"
            className="rounded-full border border-blue-600 px-8 py-3 text-blue-600 hover:bg-blue-50"
          >
            {t("becomeProvider")}
          </Link>
        </div>
      </section>

      {/* DB-driven category grid */}
      <section className="mt-16">
        <h2 className="mb-8 text-2xl font-semibold">{t("featuredCategories")}</h2>
        <CategoryGrid categories={categories} />
      </section>

      {/* How it works */}
      <section className="mt-16">
        <h2 className="mb-8 text-2xl font-semibold">{t("howItWorks")}</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { step: "1", title: t("step1Title"), desc: t("step1Description") },
            { step: "2", title: t("step2Title"), desc: t("step2Description") },
            { step: "3", title: t("step3Title"), desc: t("step3Description") },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                {item.step}
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
