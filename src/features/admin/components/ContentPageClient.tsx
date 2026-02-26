"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "@/i18n/routing";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { FaqEditor } from "./FaqEditor";
import { LegalPageEditor } from "./LegalPageEditor";
import { BannerManager } from "./BannerManager";
import type { FaqItem, LegalPageItem, BannerItem } from "../actions/content-actions";

// ============================================================
// TYPES
// ============================================================

type TabValue = "faq" | "legal" | "banners";

type ContentPageClientProps = {
  activeTab: string;
  faqs: FaqItem[];
  legalPages: LegalPageItem[];
  banners: BannerItem[];
};

// ============================================================
// COMPONENT
// ============================================================

export function ContentPageClient({
  activeTab,
  faqs,
  legalPages,
  banners,
}: ContentPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const validTab = (["faq", "legal", "banners"] as string[]).includes(activeTab)
    ? (activeTab as TabValue)
    : "faq";

  const handleTabChange = useCallback(
    (value: string) => {
      router.push(`${pathname}?tab=${value}` as never);
    },
    [router, pathname],
  );

  return (
    <Tabs value={validTab} onValueChange={handleTabChange}>
      <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
        <TabsTrigger value="faq">FAQ</TabsTrigger>
        <TabsTrigger value="legal">Pages legales</TabsTrigger>
        <TabsTrigger value="banners">Bannieres</TabsTrigger>
      </TabsList>

      <TabsContent value="faq" className="mt-6">
        <FaqEditor faqs={faqs} />
      </TabsContent>

      <TabsContent value="legal" className="mt-6">
        <LegalPageEditor pages={legalPages} />
      </TabsContent>

      <TabsContent value="banners" className="mt-6">
        <BannerManager banners={banners} />
      </TabsContent>
    </Tabs>
  );
}
