import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { getInvoiceDataAction } from "@/features/payment/actions/invoice-actions";
import { InvoiceTemplate } from "@/features/payment/components/InvoiceTemplate";

// ============================================================
// METADATA
// ============================================================

export const metadata: Metadata = {
  title: "Facture prestataire | Tawa Services",
  description: "Facture de votre mission",
};

// ============================================================
// TYPES
// ============================================================

interface ProviderInvoicePageProps {
  params: Promise<{ paymentId: string; locale: string }>;
}

// ============================================================
// SERVER PAGE COMPONENT
// ============================================================

/**
 * ProviderInvoicePage — Server page for the provider invoice view.
 *
 * - Verifies PROVIDER session
 * - Fetches payment by paymentId to retrieve bookingId
 * - Calls getInvoiceDataAction(bookingId) — action verifies ownership
 * - Renders InvoiceTemplate with viewAs="provider"
 */
export default async function ProviderInvoicePage({
  params,
}: ProviderInvoicePageProps) {
  const { paymentId } = await params;
  const locale = await getLocale();
  const session = await getServerSession(authOptions);

  // Auth guard
  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "PROVIDER") {
    return redirect({ href: "/", locale });
  }

  // Fetch payment to get bookingId
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId, isDeleted: false },
    select: {
      bookingId: true,
      booking: {
        select: {
          service: {
            select: {
              provider: {
                select: { userId: true },
              },
            },
          },
        },
      },
    },
  });

  if (!payment) {
    return notFound();
  }

  // Verify provider owns the booking's service
  if (payment.booking.service.provider.userId !== session.user.id) {
    return notFound();
  }

  // Fetch invoice data — action handles full authorization
  const result = await getInvoiceDataAction(payment.bookingId);

  if (!result.success) {
    return notFound();
  }

  return <InvoiceTemplate {...result.data} viewAs="provider" />;
}
