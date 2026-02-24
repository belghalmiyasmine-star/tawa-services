import { Link } from "@/i18n/routing";

// ============================================================
// TYPES
// ============================================================

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  serviceCount: number;
}

interface CategoryGridProps {
  categories: Category[];
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * CategoryGrid — Server component displaying categories as clickable cards.
 * Responsive: 2-col mobile, 3-col sm, 4-col md, 5-col lg.
 * Each card links to /services/[slug] for category-filtered results.
 */
export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucune categorie disponible
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/services/${category.slug}` as never}
          className="group flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
        >
          {/* Emoji icon */}
          <span className="text-3xl" role="img" aria-label={category.name}>
            {category.icon ?? "🛠"}
          </span>

          {/* Category name */}
          <span className="text-center text-sm font-medium leading-tight text-gray-800 group-hover:text-teal-600 dark:text-gray-200 dark:group-hover:text-teal-400">
            {category.name}
          </span>

          {/* Service count */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {category.serviceCount} service{category.serviceCount !== 1 ? "s" : ""}
          </span>
        </Link>
      ))}
    </div>
  );
}
