import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import {
  getProviderBookingsAction,
  getProviderQuotesAction,
} from "@/features/booking/actions/booking-queries";
import { ProviderBookingsList } from "@/features/booking/components/ProviderBookingsList";

export const metadata: Metadata = {
  title: "Mes reservations | Tawa Services",
};

export default async function ProviderBookingsPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "PROVIDER") {
    return redirect({ href: "/", locale });
  }

  // Verify provider record exists
  const provider = await prisma.provider.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!provider) {
    return redirect({ href: "/", locale });
  }

  // Fetch all bookings and relevant quotes in parallel
  const [bookingsResult, quotesResult] = await Promise.all([
    getProviderBookingsAction(),
    getProviderQuotesAction({
      status: ["PENDING", "RESPONDED"],
    }),
  ]);

  const bookings = bookingsResult.success ? bookingsResult.data.bookings : [];
  const quotes = quotesResult.success ? quotesResult.data.quotes : [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mes reservations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerez vos reservations et demandes de devis
        </p>
      </div>

      <ProviderBookingsList bookings={bookings} quotes={quotes} />
    </div>
  );
}
