import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { PaymentConfirmation } from "@/features/payment/components/PaymentConfirmation";
import type { PaymentMethod } from "@/types";

// ============================================================
// METADATA
// ============================================================

export const metadata: Metadata = {
  title: "Paiement confirme | Tawa Services",
  description: "Votre paiement a ete confirme avec succes",
};

// ============================================================
// TYPES
// ============================================================

interface ConfirmationPageProps {
  params: Promise<{ bookingId: string; locale: string }>;
  searchParams: Promise<{ ref?: string }>;
}

// ============================================================
// SERVER PAGE COMPONENT
// ============================================================

/**
 * ConfirmationServerPage — Server component for payment confirmation.
 *
 * - Accepts searchParams.ref (reference number from processPaymentAction)
 * - Verifies CLIENT session and booking ownership
 * - If payment is still PENDING (not processed), redirects to checkout
 * - Passes data to PaymentConfirmation client component
 */
export default async function ConfirmationServerPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  const { bookingId } = await params;
  const { ref } = await searchParams;
  const locale = await getLocale();
  const session = await getServerSession(authOptions);

  // Auth guard
  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "CLIENT") {
    return redirect({ href: "/", locale });
  }

  // Fetch booking with payment and service
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      isDeleted: false,
    },
    include: {
      payment: true,
      service: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!booking) {
    return notFound();
  }

  // Verify ownership
  if (booking.clientId !== session.user.id) {
    return notFound();
  }

  // If no payment or still PENDING, redirect to checkout
  if (!booking.payment || booking.payment.status === "PENDING") {
    return redirect({
      href: `/bookings/${bookingId}/checkout` as never,
      locale,
    });
  }

  // Use the ref from query params if provided; otherwise fall back to "N/A"
  const referenceNumber = ref ?? "TAWA-REF-UNKNOWN";

  return (
    <PaymentConfirmation
      referenceNumber={referenceNumber}
      amount={booking.totalAmount}
      serviceTitle={booking.service.title}
      paymentMethod={booking.payment.method as PaymentMethod}
      bookingId={bookingId}
    />
  );
}
