import { Link } from "@/i18n/routing";
import { icons, type LucideIcon } from "lucide-react";

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
// HELPERS
// ============================================================

/**
 * Resolve a lucide-react icon name (e.g. "Wrench", "Zap") to the actual component.
 * Returns null if the name doesn't match any known icon.
 */
function resolveIcon(name: string | null): LucideIcon | null {
  if (!name) return null;
  const Icon = icons[name as keyof typeof icons];
  return Icon ?? null;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * CategoryGrid — Server component displaying categories as clickable cards.
 * Responsive: 2-col mobile, 3-col sm, 4-col md, 5-col lg.
 * Each card links to /services?category=[slug] for category-filtered results.
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
      {categories.map((category) => {
        const Icon = resolveIcon(category.icon);
        return (
          <Link
            key={category.id}
            href={`/services?category=${category.slug}` as never}
            className="group flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400">
              {Icon ? (
                <Icon className="h-6 w-6" />
              ) : (
                <span className="text-xl">🛠</span>
              )}
            </div>

            {/* Category name */}
            <span className="text-center text-sm font-medium leading-tight text-gray-800 group-hover:text-teal-600 dark:text-gray-200 dark:group-hover:text-teal-400">
              {category.name}
            </span>

            {/* Service count */}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {category.serviceCount} service{category.serviceCount !== 1 ? "s" : ""}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
