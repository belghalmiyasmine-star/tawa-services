import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import {
  getClientBookingsAction,
  getClientQuotesAction,
} from "@/features/booking/actions/booking-queries";
import { ClientBookingsList } from "@/features/booking/components/ClientBookingsList";

export const metadata: Metadata = {
  title: "Mes reservations | Tawa Services",
};

export default async function ClientBookingsPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "CLIENT") {
    return redirect({ href: "/", locale });
  }

  // Fetch all client bookings and quotes in parallel (no pagination on list view)
  const [bookingsResult, quotesResult] = await Promise.all([
    getClientBookingsAction({ limit: 100 }),
    getClientQuotesAction({ limit: 100 }),
  ]);

  const bookings = bookingsResult.success ? bookingsResult.data.bookings : [];
  const quotes = quotesResult.success ? quotesResult.data.quotes : [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mes reservations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez et gerez toutes vos reservations
        </p>
      </div>

      <ClientBookingsList bookings={bookings} quotes={quotes} />
    </div>
  );
}
