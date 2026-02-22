import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

// Slugs et icones — les labels sont dans fr.json["categories"]
// sera remplace par donnees DB en Phase 5
const CATEGORY_ITEMS = [
  { slug: "plomberie", icon: "🔧" },
  { slug: "electricite", icon: "⚡" },
  { slug: "menage", icon: "🧹" },
  { slug: "cours", icon: "📚" },
  { slug: "jardinage", icon: "🌱" },
  { slug: "peinture", icon: "🎨" },
  { slug: "informatique", icon: "💻" },
  { slug: "demenagement", icon: "📦" },
] as const;

export default function ClientHomePage() {
  const t = useTranslations("home");
  const tCat = useTranslations("categories");

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t("heroTitle")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">{t("heroSubtitle")}</p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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

      {/* Categories placeholder — labels depuis fr.json["categories"] via tCat(slug) */}
      <section className="mt-16">
        <h2 className="mb-8 text-2xl font-semibold">{t("featuredCategories")}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {CATEGORY_ITEMS.map((cat) => (
            <div
              key={cat.slug}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="mb-2 text-3xl">{cat.icon}</span>
              <span className="text-sm font-medium">{tCat(cat.slug)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works placeholder */}
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
