import type { Metadata } from "next";

import { FileText } from "lucide-react";

import {
  getFaqsAction,
  getLegalPagesAction,
  getBannersAction,
} from "@/features/admin/actions/content-actions";
import { ContentPageClient } from "@/features/admin/components/ContentPageClient";

export const metadata: Metadata = {
  title: "Contenu | Admin",
};

// ============================================================
// PAGE
// ============================================================

interface SearchParams {
  tab?: string;
}

interface AdminContentPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminContentPage({
  searchParams,
}: AdminContentPageProps) {
  const params = await searchParams;
  const activeTab = params.tab ?? "faq";

  // Fetch all content data in parallel
  const [faqsResult, legalResult, bannersResult] = await Promise.all([
    getFaqsAction(),
    getLegalPagesAction(),
    getBannersAction(),
  ]);

  const faqs = faqsResult.success ? faqsResult.data : [];
  const legalPages = legalResult.success ? legalResult.data : [];
  const banners = bannersResult.success ? bannersResult.data : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Gestion du contenu</h1>
      </div>

      {/* Tabs */}
      <ContentPageClient
        activeTab={activeTab}
        faqs={faqs}
        legalPages={legalPages}
        banners={banners}
      />
    </div>
  );
}
