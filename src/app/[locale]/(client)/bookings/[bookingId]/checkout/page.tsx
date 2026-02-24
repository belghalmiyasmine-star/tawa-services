import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { CheckoutPage } from "@/features/payment/components/CheckoutPage";

// ============================================================
// METADATA
// ============================================================

export const metadata: Metadata = {
  title: "Paiement | Tawa Services",
  description: "Finalisez votre paiement en toute securite",
};

// ============================================================
// TYPES
// ============================================================

interface CheckoutPageProps {
  params: Promise<{ bookingId: string; locale: string }>;
}

// ============================================================
// SERVER PAGE COMPONENT
// ============================================================

/**
 * CheckoutServerPage — Server component entry for the checkout flow.
 *
 * - Verifies CLIENT session and booking ownership
 * - If payment is not PENDING, redirects to booking detail (already paid)
 * - Passes booking data to CheckoutPage client component
 */
export default async function CheckoutServerPage({ params }: CheckoutPageProps) {
  const { bookingId } = await params;
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
          fixedPrice: true,
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

  // If payment already processed (not PENDING), redirect to booking detail
  if (booking.payment && booking.payment.status !== "PENDING") {
    return redirect({
      href: `/bookings/${bookingId}` as never,
      locale,
    });
  }

  const servicePrice = booking.service.fixedPrice ?? booking.totalAmount;

  return (
    <CheckoutPage
      bookingId={bookingId}
      amount={booking.totalAmount}
      serviceTitle={booking.service.title}
      servicePrice={servicePrice}
    />
  );
}
