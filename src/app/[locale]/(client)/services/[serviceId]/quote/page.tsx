import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Metadata } from "next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuoteRequestForm } from "@/features/booking/components/QuoteRequestForm";

// ============================================================
// TYPES
// ============================================================

interface QuotePageProps {
  params: Promise<{
    locale: string;
    serviceId: string;
  }>;
}

// ============================================================
// METADATA
// ============================================================

export async function generateMetadata({
  params,
}: QuotePageProps): Promise<Metadata> {
  const { serviceId } = await params;

  const service = await prisma.service.findUnique({
    where: { id: serviceId, isDeleted: false, status: "ACTIVE" },
    select: { title: true },
  });

  if (!service) {
    return { title: "Service introuvable | Tawa Services" };
  }

  return {
    title: `Demander un devis — ${service.title} | Tawa Services`,
    description: `Envoyez une demande de devis pour ${service.title}. Decrivez votre besoin et recevez une proposition de prix.`,
  };
}

// ============================================================
// PAGE
// ============================================================

export default async function QuotePage({ params }: QuotePageProps) {
  const { serviceId } = await params;

  // Auth guard — redirect to login if not authenticated
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/services/${serviceId}/quote`);
  }

  // Fetch service with provider
  const service = await prisma.service.findUnique({
    where: { id: serviceId, isDeleted: false, status: "ACTIVE" },
    include: {
      provider: {
        select: {
          displayName: true,
          photoUrl: true,
        },
      },
    },
  });

  if (!service) {
    notFound();
  }

  // Only SUR_DEVIS services can have quote requests
  if (service.pricingType !== "SUR_DEVIS") {
    redirect(`/services/${serviceId}/book`);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Demander un devis
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Decrivez votre besoin et le prestataire vous repondra dans les 48h.
          </p>
        </div>

        <QuoteRequestForm
          service={{
            id: service.id,
            title: service.title,
            fixedPrice: service.fixedPrice,
            pricingType: service.pricingType,
            provider: {
              displayName: service.provider.displayName,
              photoUrl: service.provider.photoUrl,
            },
          }}
        />
      </div>
    </div>
  );
}
