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

function resolveIcon(name: string | null): LucideIcon | null {
  if (!name) return null;
  const Icon = icons[name as keyof typeof icons];
  return Icon ?? null;
}

const iconColors = [
  { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
  { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400" },
  { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400" },
  { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-600 dark:text-rose-400" },
  { bg: "bg-teal-50 dark:bg-teal-900/20", text: "text-teal-600 dark:text-teal-400" },
  { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600 dark:text-indigo-400" },
  { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400" },
  { bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-600 dark:text-cyan-400" },
  { bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-600 dark:text-pink-400" },
];

// ============================================================
// COMPONENT
// ============================================================

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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {categories.map((category, i) => {
        const Icon = resolveIcon(category.icon);
        const colors = iconColors[i % iconColors.length]!;
        return (
          <Link
            key={category.id}
            href={`/services?category=${category.slug}` as never}
            className="card-elegant group flex flex-col items-center gap-3 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]"
          >
            {/* Icon circle */}
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} ${colors.text} transition-transform duration-300 group-hover:scale-105`}
            >
              {Icon ? (
                <Icon className="h-5 w-5" />
              ) : (
                <span className="text-lg">🛠</span>
              )}
            </div>

            {/* Category name */}
            <span className="text-center text-sm font-medium leading-tight text-gray-700 transition-colors duration-300 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
              {category.name}
            </span>

            {/* Service count */}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {category.serviceCount} service{category.serviceCount !== 1 ? "s" : ""}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
