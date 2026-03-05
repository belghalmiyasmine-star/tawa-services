import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tawa.tn";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["fr", "ar", "en"];
  const staticPages = [
    "",
    "/services",
    "/faq",
    "/contact",
    "/legal/cgu",
    "/legal/privacy",
    "/comment-ca-marche",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "daily" : "weekly",
        priority: page === "" ? 1.0 : 0.7,
      });
    }
  }

  return entries;
}
