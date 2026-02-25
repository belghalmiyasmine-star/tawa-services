// ============================================================
// TYPES
// ============================================================

interface CriteriaChartProps {
  averages: {
    quality: number;
    punctuality: number;
    communication: number;
    cleanliness: number;
  };
}

// ============================================================
// CRITERIA CONFIG
// ============================================================

const CRITERIA = [
  {
    key: "quality" as const,
    label: "Qualite",
    color: "bg-blue-500",
    trackColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    key: "punctuality" as const,
    label: "Ponctualite",
    color: "bg-green-500",
    trackColor: "bg-green-100 dark:bg-green-900/20",
  },
  {
    key: "communication" as const,
    label: "Communication",
    color: "bg-purple-500",
    trackColor: "bg-purple-100 dark:bg-purple-900/20",
  },
  {
    key: "cleanliness" as const,
    label: "Proprete",
    color: "bg-amber-500",
    trackColor: "bg-amber-100 dark:bg-amber-900/20",
  },
];

// ============================================================
// COMPONENT
// ============================================================

/**
 * CSS-based horizontal bar chart for review criteria averages.
 * No chart library dependency — lightweight, PFE-appropriate.
 */
export function CriteriaChart({ averages }: CriteriaChartProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Criteres d&apos;evaluation
      </h3>

      <div className="flex flex-col gap-3">
        {CRITERIA.map(({ key, label, color, trackColor }) => {
          const value = averages[key];
          const percent = (value / 5) * 100;

          return (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {value > 0 ? `${value.toFixed(1)}/5` : "—"}
                </span>
              </div>
              <div
                className={`h-2 w-full overflow-hidden rounded-full ${trackColor}`}
              >
                <div
                  className={`h-full rounded-full ${color} transition-all duration-500`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
