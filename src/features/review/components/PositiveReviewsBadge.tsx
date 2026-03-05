import { prisma } from "@/lib/prisma";

interface PositiveReviewsBadgeProps {
  providerId: string;
}

/**
 * Server component that shows the percentage of positive reviews for a provider.
 * Uses the sentiment field from the Review model.
 */
export async function PositiveReviewsBadge({ providerId }: PositiveReviewsBadgeProps) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { userId: true },
  });

  if (!provider) return null;

  const [totalCount, positiveCount] = await Promise.all([
    prisma.review.count({
      where: {
        targetId: provider.userId,
        published: true,
        isDeleted: false,
        flagged: false,
        sentiment: { not: null },
      },
    }),
    prisma.review.count({
      where: {
        targetId: provider.userId,
        published: true,
        isDeleted: false,
        flagged: false,
        sentiment: "POSITIVE",
      },
    }),
  ]);

  if (totalCount === 0) return null;

  const percentage = Math.round((positiveCount / totalCount) * 100);

  // Color based on percentage
  let colorClass: string;
  if (percentage >= 80) {
    colorClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  } else if (percentage >= 60) {
    colorClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  } else {
    colorClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}>
      {percentage}% avis positifs
    </span>
  );
}
