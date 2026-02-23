import { Briefcase, ExternalLink, FileText, Globe, ImageIcon, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PortfolioGallery } from "./PortfolioGallery";

// ============================================================
// TYPES
// ============================================================

interface PublicProfileAboutProps {
  provider: {
    bio: string | null;
    yearsExperience: number | null;
    languages: string[];
    delegations: Array<{
      delegation: {
        name: string;
        gouvernorat: {
          name: string;
        };
      };
    }>;
    certifications: Array<{
      id: string;
      title: string;
      fileUrl: string;
      issuedAt: Date | null;
      createdAt: Date;
    }>;
    portfolioPhotos: Array<{
      id: string;
      photoUrl: string;
      caption: string | null;
    }>;
  };
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Group delegations by gouvernorat name.
 */
function groupByGouvernorat(
  delegations: Array<{ delegation: { name: string; gouvernorat: { name: string } } }>,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const d of delegations) {
    const gov = d.delegation.gouvernorat.name;
    if (!map.has(gov)) {
      map.set(gov, []);
    }
    map.get(gov)!.push(d.delegation.name);
  }
  return map;
}

/**
 * Determine if a fileUrl points to a PDF (by extension).
 */
function isPdf(fileUrl: string): boolean {
  return fileUrl.toLowerCase().endsWith(".pdf");
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * PublicProfileAbout — A propos tab content.
 * Server component — no "use client".
 */
export async function PublicProfileAbout({ provider }: PublicProfileAboutProps) {
  const t = await getTranslations("provider");

  const zonesByGov = groupByGouvernorat(provider.delegations);

  return (
    <div className="space-y-6">
      {/* Bio */}
      <div>
        <h3 className="mb-2 text-base font-semibold text-gray-800 dark:text-gray-200">
          {t("bio")}
        </h3>
        {provider.bio ? (
          <p
            className="whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300"
          >
            {provider.bio}
          </p>
        ) : (
          <p className="text-sm italic text-gray-400 dark:text-gray-500">
            Ce prestataire n&apos;a pas encore renseigne sa description.
          </p>
        )}
      </div>

      {/* Experience */}
      {provider.yearsExperience !== null && provider.yearsExperience !== undefined && provider.yearsExperience > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Briefcase className="h-4 w-4 shrink-0 text-gray-400" />
          <span>
            {provider.yearsExperience} an{provider.yearsExperience > 1 ? "s" : ""}{" "}
            d&apos;experience
          </span>
        </div>
      )}

      {/* Languages */}
      {provider.languages.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <span>{provider.languages.join(", ")}</span>
        </div>
      )}

      {/* Intervention zones */}
      {zonesByGov.size > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              {t("zonesSection")}
            </h3>
          </div>
          <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
            {Array.from(zonesByGov.entries()).map(([gov, delegations]) => (
              <div key={gov}>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {gov}:
                </span>{" "}
                <span>{delegations.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio gallery */}
      <PortfolioGallery photos={provider.portfolioPhotos} />

      {/* Certifications */}
      {provider.certifications.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold text-gray-800 dark:text-gray-200">
            Certifications &amp; Diplomes
          </h3>
          <div className="space-y-2">
            {provider.certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center gap-2 text-sm">
                  {isPdf(cert.fileUrl) ? (
                    <FileText className="h-4 w-4 shrink-0 text-red-500" />
                  ) : (
                    <ImageIcon className="h-4 w-4 shrink-0 text-blue-500" />
                  )}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {cert.title}
                  </span>
                </div>
                <a
                  href={cert.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Voir</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
