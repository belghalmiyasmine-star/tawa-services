"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProviderBookingCard } from "./ProviderBookingCard";
import { ProviderQuoteCard } from "./ProviderQuoteCard";
import type { BookingListItem, QuoteListItem } from "@/features/booking/actions/booking-queries";
import type { BookingStatus, QuoteStatus } from "@prisma/client";

interface ProviderBookingsListProps {
  bookings: BookingListItem[];
  quotes: QuoteListItem[];
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

const PENDING_STATUSES: BookingStatus[] = ["PENDING"];
const ACCEPTED_STATUSES: BookingStatus[] = ["ACCEPTED"];
const IN_PROGRESS_STATUSES: BookingStatus[] = ["IN_PROGRESS"];
const HISTORY_STATUSES: BookingStatus[] = ["COMPLETED", "REJECTED", "CANCELLED"];
const PENDING_QUOTE_STATUSES: QuoteStatus[] = ["PENDING"];
const HISTORY_QUOTE_STATUSES: QuoteStatus[] = ["ACCEPTED", "DECLINED", "EXPIRED"];

export function ProviderBookingsList({
  bookings,
  quotes,
}: ProviderBookingsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get("tab") ?? "new";

  const handleTabChange = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  // Filter bookings and quotes per tab
  const pendingBookings = bookings.filter((b) =>
    PENDING_STATUSES.includes(b.status),
  );
  const pendingQuotes = quotes.filter((q) =>
    PENDING_QUOTE_STATUSES.includes(q.status),
  );
  const newCount = pendingBookings.length + pendingQuotes.length;

  const acceptedBookings = bookings.filter((b) =>
    ACCEPTED_STATUSES.includes(b.status),
  );

  const inProgressBookings = bookings.filter((b) =>
    IN_PROGRESS_STATUSES.includes(b.status),
  );

  const historyBookings = bookings
    .filter((b) => HISTORY_STATUSES.includes(b.status))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const historyQuotes = quotes.filter((q) =>
    HISTORY_QUOTE_STATUSES.includes(q.status),
  );

  // Adapt BookingListItem for ProviderBookingCard (it expects service.photoUrls, not service.photoUrl)
  function toCardBooking(b: BookingListItem) {
    return {
      id: b.id,
      status: b.status,
      scheduledAt: b.scheduledAt,
      totalAmount: b.totalAmount,
      clientNote: null, // Not available in list view
      service: {
        title: b.service.title,
        photoUrls: b.service.photoUrl ? [b.service.photoUrl] : [],
      },
      client: b.client ?? null,
      reviewStatus: b.reviewStatus,
    };
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="mb-4 w-full justify-start overflow-x-auto">
        <TabsTrigger value="new" className="shrink-0">
          Nouvelles demandes{newCount > 0 ? ` (${newCount})` : ""}
        </TabsTrigger>
        <TabsTrigger value="accepted" className="shrink-0">
          Acceptees
          {acceptedBookings.length > 0 ? ` (${acceptedBookings.length})` : ""}
        </TabsTrigger>
        <TabsTrigger value="in_progress" className="shrink-0">
          En cours
          {inProgressBookings.length > 0
            ? ` (${inProgressBookings.length})`
            : ""}
        </TabsTrigger>
        <TabsTrigger value="history" className="shrink-0">
          Historique
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Nouvelles demandes (PENDING bookings + PENDING quotes) */}
      <TabsContent value="new">
        {pendingBookings.length === 0 && pendingQuotes.length === 0 ? (
          <EmptyState message="Aucune reservation dans cette categorie" />
        ) : (
          <div className="space-y-3">
            {pendingBookings.map((b) => (
              <ProviderBookingCard key={b.id} booking={toCardBooking(b)} />
            ))}
            {pendingQuotes.map((q) => (
              <ProviderQuoteCard key={q.id} quote={q} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Tab 2: Acceptees */}
      <TabsContent value="accepted">
        {acceptedBookings.length === 0 ? (
          <EmptyState message="Aucune reservation dans cette categorie" />
        ) : (
          <div className="space-y-3">
            {acceptedBookings.map((b) => (
              <ProviderBookingCard key={b.id} booking={toCardBooking(b)} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Tab 3: En cours */}
      <TabsContent value="in_progress">
        {inProgressBookings.length === 0 ? (
          <EmptyState message="Aucune reservation dans cette categorie" />
        ) : (
          <div className="space-y-3">
            {inProgressBookings.map((b) => (
              <ProviderBookingCard key={b.id} booking={toCardBooking(b)} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Tab 4: Historique */}
      <TabsContent value="history">
        {historyBookings.length === 0 && historyQuotes.length === 0 ? (
          <EmptyState message="Aucune reservation dans cette categorie" />
        ) : (
          <div className="space-y-3">
            {historyBookings.map((b) => (
              <ProviderBookingCard key={b.id} booking={toCardBooking(b)} />
            ))}
            {historyQuotes.map((q) => (
              <ProviderQuoteCard key={q.id} quote={q} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
