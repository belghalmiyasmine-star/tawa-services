import type { Metadata } from "next";

import {
  getAnalyticsDataAction,
  getGeographicBreakdownAction,
  getTopCategoriesAction,
  getSentimentStatsAction,
} from "@/features/admin/actions/analytics-queries";
import { AnalyticsPageClient } from "@/features/admin/components/AnalyticsPageClient";

export const metadata: Metadata = {
  title: "Analytique | Admin",
};

// ============================================================
// HELPERS
// ============================================================

function getDefaultDates(): { startDate: string; endDate: string } {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return {
    startDate: sixMonthsAgo.toISOString().split("T")[0] ?? "",
    endDate: now.toISOString().split("T")[0] ?? "",
  };
}

// ============================================================
// PAGE
// ============================================================

interface SearchParams {
  startDate?: string;
  endDate?: string;
}

interface AdminAnalyticsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: AdminAnalyticsPageProps) {
  const params = await searchParams;

  const defaults = getDefaultDates();
  const startDate = params.startDate ?? defaults.startDate;
  const endDate = params.endDate ?? defaults.endDate;

  // Fetch all analytics data in parallel
  const [analyticsResult, geoResult, categoriesResult, sentimentResult] = await Promise.all([
    getAnalyticsDataAction(startDate, endDate),
    getGeographicBreakdownAction(startDate, endDate),
    getTopCategoriesAction(startDate, endDate),
    getSentimentStatsAction(startDate, endDate),
  ]);

  const analyticsData = analyticsResult.success ? analyticsResult.data : null;
  const geoData = geoResult.success ? geoResult.data : [];
  const topCategories = categoriesResult.success ? categoriesResult.data : [];
  const sentimentStats = sentimentResult.success ? sentimentResult.data : null;

  return (
    <AnalyticsPageClient
      analyticsData={analyticsData}
      geoData={geoData}
      topCategories={topCategories}
      sentimentStats={sentimentStats}
      startDate={startDate}
      endDate={endDate}
    />
  );
}
