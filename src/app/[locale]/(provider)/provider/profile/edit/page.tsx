import { redirect } from "next/navigation";

import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AvailabilityEditor } from "@/features/provider/components/AvailabilityEditor";
import { BlockedDatesEditor } from "@/features/provider/components/BlockedDatesEditor";
import { PortfolioUploader } from "@/features/provider/components/PortfolioUploader";
import { ProfileEditForm } from "@/features/provider/components/ProfileEditForm";
import { ZoneSelector } from "@/features/provider/components/ZoneSelector";

// ============================================================
// METADATA
// ============================================================

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("provider");
  return {
    title: `${t("editProfile")} | Tawa Services`,
  };
}

// ============================================================
// PAGE
// ============================================================

export default async function ProviderProfileEditPage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("provider");

  // Layout handles auth, but safety-check here
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const userId = session.user.id;

  // Fetch provider with zones
  const provider = await prisma.provider.findUnique({
    where: { userId },
    include: {
      delegations: {
        include: {
          delegation: {
            include: {
              gouvernorat: true,
            },
          },
        },
      },
    },
  });

  // If no provider record exists, redirect to KYC
  if (!provider) {
    redirect("/provider/kyc");
  }

  // Fetch gouvernorats with delegations (for zone selector)
  const gouvernorats = await prisma.gouvernorat.findMany({
    where: { isDeleted: false },
    include: {
      delegations: {
        where: { isDeleted: false },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // Fetch availability slots
  const availabilities = await prisma.availability.findMany({
    where: { providerId: provider.id },
    orderBy: { dayOfWeek: "asc" },
  });

  // Build default availability: 7 slots (Mon=1..Sun=0 in JS, but dayOfWeek 0-6)
  // dayOfWeek: 0=Sunday, 1=Monday ... 6=Saturday
  const defaultSlots = Array.from({ length: 7 }, (_, day) => {
    const existing = availabilities.find((a) => a.dayOfWeek === day);
    if (existing) {
      return {
        dayOfWeek: existing.dayOfWeek,
        startTime: existing.startTime,
        endTime: existing.endTime,
        isActive: existing.isActive,
      };
    }
    // Default: Mon-Fri (1-5) active 08:00-18:00, Sat(6) and Sun(0) inactive
    const isWorkday = day >= 1 && day <= 5;
    return {
      dayOfWeek: day,
      startTime: "08:00",
      endTime: "18:00",
      isActive: isWorkday,
    };
  });

  // Fetch blocked dates
  const blockedDates = await prisma.blockedDate.findMany({
    where: { providerId: provider.id },
    orderBy: { date: "asc" },
  });

  // Fetch portfolio photos
  const portfolioPhotos = await prisma.portfolioPhoto.findMany({
    where: { providerId: provider.id, isDeleted: false },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      photoUrl: true,
      caption: true,
      sortOrder: true,
    },
  });

  // Extract initial delegation IDs
  const initialDelegationIds = provider.delegations.map((d) => d.delegationId);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("editProfile")}</h1>

      <Tabs defaultValue="informations" className="w-full">
        <TabsList className="mb-6 w-full sm:w-auto">
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="disponibilites">Disponibilites</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>

        {/* Tab 1: Personal info + photo */}
        <TabsContent value="informations">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <ProfileEditForm
              defaultValues={{
                displayName: provider.displayName ?? "",
                bio: provider.bio ?? "",
                phone: provider.phone ?? "",
                yearsExperience: provider.yearsExperience ?? 0,
                languages: provider.languages ?? [],
                photoUrl: provider.photoUrl,
              }}
            />
          </div>
        </TabsContent>

        {/* Tab 2: Intervention zones */}
        <TabsContent value="zones">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <ZoneSelector
              initialDelegationIds={initialDelegationIds}
              gouvernorats={gouvernorats}
            />
          </div>
        </TabsContent>

        {/* Tab 3: Availability + blocked dates */}
        <TabsContent value="disponibilites">
          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">{t("availabilitySection")}</h2>
              <AvailabilityEditor initialSlots={defaultSlots} />
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">{t("blockedDates")}</h2>
              <BlockedDatesEditor
                initialDates={blockedDates.map((d) => ({
                  date: d.date.toISOString(),
                  reason: d.reason ?? undefined,
                }))}
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Portfolio */}
        <TabsContent value="portfolio">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <PortfolioUploader
              initialPhotos={portfolioPhotos}
              providerId={provider.id}
            />
          </div>
        </TabsContent>

        {/* Tab 5: Certifications (implemented in Plan 05) */}
        <TabsContent value="certifications">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <p className="text-muted-foreground">
              La gestion des certifications sera disponible dans la prochaine version.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
