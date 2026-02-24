import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { BookingWizard } from "@/features/booking/components/BookingWizard";

// ============================================================
// TYPES
// ============================================================

interface BookPageProps {
  params: Promise<{
    locale: string;
    serviceId: string;
  }>;
}

// ============================================================
// METADATA
// ============================================================

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { serviceId } = await params;

  const service = await prisma.service.findUnique({
    where: { id: serviceId, isDeleted: false },
    select: { title: true },
  });

  if (!service) {
    return { title: "Reservation | Tawa Services" };
  }

  return {
    title: `Reserver ${service.title} | Tawa Services`,
    description: `Reservez le service "${service.title}" en quelques etapes`,
  };
}

// ============================================================
// PAGE
// ============================================================

/**
 * BookPage — Server component entry point for the direct booking wizard.
 *
 * - Fetches service with provider (availabilities, blockedDates)
 * - Verifies service is ACTIVE and pricingType is FIXED
 * - Requires authentication; redirects to login if not authenticated
 * - Renders BookingWizard with full service + provider data
 */
export default async function BookPage({ params }: BookPageProps) {
  const { serviceId, locale } = await params;

  // Check authentication first
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/services/${serviceId}/book`);
  }

  // Fetch service with provider and availability data
  const service = await prisma.service.findUnique({
    where: { id: serviceId, isDeleted: false },
    include: {
      provider: {
        include: {
          availabilities: true,
          blockedDates: {
            where: {
              // Fetch blocked dates from today onward
              date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            },
            orderBy: { date: "asc" },
          },
        },
      },
    },
  });

  // Service not found
  if (!service) {
    notFound();
  }

  // Service must be active
  if (service.status !== "ACTIVE") {
    notFound();
  }

  // SUR_DEVIS services should use the quote flow
  if (service.pricingType === "SUR_DEVIS") {
    redirect(`/${locale}/services/${serviceId}/quote`);
  }

  // Prepare service data for the wizard (serialize dates to strings for client)
  const serviceData = {
    id: service.id,
    title: service.title,
    fixedPrice: service.fixedPrice,
    durationMinutes: service.durationMinutes,
    pricingType: service.pricingType as "FIXED" | "SUR_DEVIS",
    photoUrls: service.photoUrls,
    provider: {
      id: service.provider.id,
      displayName: service.provider.displayName,
      photoUrl: service.provider.photoUrl,
      availabilities: service.provider.availabilities.map((a) => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isActive: a.isActive,
      })),
      blockedDates: service.provider.blockedDates.map((b) => ({
        date: b.date.toISOString().split("T")[0] ?? "",
      })),
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <BookingWizard service={serviceData} />
    </div>
  );
}
