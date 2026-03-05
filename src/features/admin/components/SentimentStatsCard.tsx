"use client";

import { SmilePlus, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SentimentStats } from "../actions/analytics-queries";

interface SentimentStatsCardProps {
  stats: SentimentStats | null;
}

export function SentimentStatsCard({ stats }: SentimentStatsCardProps) {
  const hasData = stats && stats.totalWithSentiment > 0;

  const trend =
    hasData && stats.previousPositivePercentage !== null
      ? stats.positivePercentage - stats.previousPositivePercentage
      : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <SmilePlus className="h-4 w-4 text-primary" />
          Sentiment des avis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground">
            Aucune donnee de sentiment disponible pour cette periode.
          </p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.positivePercentage}%
              </span>
              <span className="text-sm text-muted-foreground">avis positifs</span>
              {trend !== null && trend !== 0 && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    trend > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {trend > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {trend > 0 ? "+" : ""}
                  {trend}%
                </span>
              )}
            </div>

            {/* Breakdown bar */}
            <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              {stats.positive > 0 && (
                <div
                  className="bg-green-500"
                  style={{
                    width: `${(stats.positive / stats.totalWithSentiment) * 100}%`,
                  }}
                />
              )}
              {stats.neutral > 0 && (
                <div
                  className="bg-yellow-400"
                  style={{
                    width: `${(stats.neutral / stats.totalWithSentiment) * 100}%`,
                  }}
                />
              )}
              {stats.negative > 0 && (
                <div
                  className="bg-red-500"
                  style={{
                    width: `${(stats.negative / stats.totalWithSentiment) * 100}%`,
                  }}
                />
              )}
            </div>

            {/* Legend */}
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                Positifs ({stats.positive})
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
                Neutres ({stats.neutral})
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                Negatifs ({stats.negative})
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
