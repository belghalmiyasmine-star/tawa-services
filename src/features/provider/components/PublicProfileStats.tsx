import { BarChart3, CheckCircle2, Clock, MessageSquare, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

// ============================================================
// TYPES
// ============================================================

interface PublicProfileStatsProps {
  provider: {
    completedMissions: number;
    rating: number;
    ratingCount: number;
    responseRate: number | null;
    responseTimeHours: number | null;
  };
}

// ============================================================
// HELPERS
// ============================================================

function formatResponseTime(hours: number | null): string {
  if (hours === null) return "N/A";
  if (hours < 1) return "< 1h";
  return `${Math.round(hours)}h`;
}

function formatResponseRate(rate: number | null): string {
  if (rate === null) return "N/A";
  return `${Math.round(rate)}%`;
}

// ============================================================
// STAT CARD SUB-COMPONENT
// ============================================================

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="text-gray-400 dark:text-gray-500">{icon}</div>
      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </span>
      <span className="text-center text-sm text-gray-500 dark:text-gray-400">
        {label}
      </span>
    </div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * PublicProfileStats — 5 stat cards in a responsive grid.
 * Server component — no "use client".
 */
export async function PublicProfileStats({ provider }: PublicProfileStatsProps) {
  const t = await getTranslations("provider");

  const stats = [
    {
      icon: <CheckCircle2 className="h-6 w-6" />,
      value: String(provider.completedMissions),
      label: t("completedMissions"),
    },
    {
      icon: <Star className="h-6 w-6" />,
      value: `${provider.rating.toFixed(1)}/5`,
      label: t("averageRating"),
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      value: String(provider.ratingCount),
      label: t("ratingCount"),
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      value: formatResponseRate(provider.responseRate),
      label: t("responseRate"),
    },
    {
      icon: <Clock className="h-6 w-6" />,
      value: formatResponseTime(provider.responseTimeHours),
      label: t("responseTime"),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          value={stat.value}
          label={stat.label}
        />
      ))}
    </div>
  );
}
