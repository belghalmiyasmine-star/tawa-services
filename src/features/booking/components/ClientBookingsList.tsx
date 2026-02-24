"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarX } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientBookingCard } from "./ClientBookingCard";
import { CancelBookingDialog } from "./CancelBookingDialog";
import { QuoteResponseCard } from "./QuoteResponseCard";
import type {
  BookingListItem,
  QuoteListItem,
} from "@/features/booking/actions/booking-queries";
import type { BookingStatus, QuoteStatus } from "@prisma/client";

// ============================================================
// TYPES
// ============================================================

interface ClientBookingsListProps {
  bookings: BookingListItem[];
  quotes: QuoteListItem[];
}

// ============================================================
// CONSTANTS
// ============================================================

const UPCOMING_BOOKING_STATUSES: BookingStatus[] = ["PENDING", "ACCEPTED"];
const IN_PROGRESS_STATUSES: BookingStatus[] = ["IN_PROGRESS"];
const PAST_STATUSES: BookingStatus[] = ["COMPLETED"];
const CANCELLED_STATUSES: BookingStatus[] = ["CANCELLED", "REJECTED"];

const UPCOMING_QUOTE_STATUSES: QuoteStatus[] = ["PENDING", "RESPONDED"];
const CANCELLED_QUOTE_STATUSES: QuoteStatus[] = ["DECLINED", "EXPIRED"];

// ============================================================
// HELPERS
// ============================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <CalendarX className="mb-3 h-10 w-10 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">Aucune reservation</p>
    </div>
  );
}

/** Adapt BookingListItem to ClientBookingCard props */
function toCardBooking(b: BookingListItem): {
  id: string;
  status: BookingStatus;
  scheduledAt: Date | null;
  totalAmount: number;
  service: { title: string; photoUrls: string[] };
  provider: { displayName: string; photoUrl: string | null } | null;
  payment: { method: string; status: string } | null;
} {
  return {
    id: b.id,
    status: b.status,
    scheduledAt: b.scheduledAt,
    totalAmount: b.totalAmount,
    service: {
      title: b.service.title,
      photoUrls: b.service.photoUrl ? [b.service.photoUrl] : [],
    },
    provider: b.provider
      ? {
          displayName: b.provider.displayName,
          photoUrl: b.provider.photoUrl,
        }
      : null,
    payment: b.payment
      ? {
          method: b.payment.method,
          status: b.payment.status,
        }
      : null,
  };
}

/** Adapt QuoteListItem to QuoteResponseCard props */
function toQuoteCardProps(q: QuoteListItem) {
  return {
    id: q.id,
    status: q.status,
    description: q.description,
    proposedPrice: q.proposedPrice,
    proposedDelay: q.proposedDelay,
    expiresAt: new Date(q.expiresAt),
    respondedAt: q.respondedAt ? new Date(q.respondedAt) : null,
    createdAt: new Date(q.createdAt),
    bookingId: q.bookingId ?? null,
    service: { title: q.service.title },
  };
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * ClientBookingsList — Tabbed list of client bookings and quotes.
 *
 * Tab 1 "A venir":    PENDING/ACCEPTED bookings + PENDING/RESPONDED quotes
 * Tab 2 "En cours":   IN_PROGRESS bookings
 * Tab 3 "Passees":    COMPLETED bookings
 * Tab 4 "Annulees":   CANCELLED/REJECTED bookings + DECLINED/EXPIRED quotes
 *
 * Uses URL searchParam ?tab= for persistence.
 */
export function ClientBookingsList({
  bookings,
  quotes,
}: ClientBookingsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get("tab") ?? "upcoming";

  const handleTabChange = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  // Cancel dialog state
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);

  // Filter per tab
  const upcomingBookings = bookings.filter((b) =>
    UPCOMING_BOOKING_STATUSES.includes(b.status),
  );
  const upcomingQuotes = quotes.filter((q) =>
    UPCOMING_QUOTE_STATUSES.includes(q.status),
  );
  const upcomingCount = upcomingBookings.length + upcomingQuotes.length;

  const inProgressBookings = bookings.filter((b) =>
    IN_PROGRESS_STATUSES.includes(b.status),
  );

  const pastBookings = bookings.filter((b) => PAST_STATUSES.includes(b.status));

  const cancelledBookings = bookings.filter((b) =>
    CANCELLED_STATUSES.includes(b.status),
  );
  const cancelledQuotes = quotes.filter((q) =>
    CANCELLED_QUOTE_STATUSES.includes(q.status),
  );

  // Find the booking being cancelled (for the dialog)
  const bookingToCancel = cancelBookingId
    ? bookings.find((b) => b.id === cancelBookingId)
    : null;

  return (
    <>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="upcoming" className="shrink-0">
            A venir{upcomingCount > 0 ? ` (${upcomingCount})` : ""}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="shrink-0">
            En cours
            {inProgressBookings.length > 0
              ? ` (${inProgressBookings.length})`
              : ""}
          </TabsTrigger>
          <TabsTrigger value="past" className="shrink-0">
            Passees
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="shrink-0">
            Annulees
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: A venir */}
        <TabsContent value="upcoming">
          {upcomingBookings.length === 0 && upcomingQuotes.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((b) => (
                <ClientBookingCard
                  key={b.id}
                  booking={toCardBooking(b)}
                  onCancelClick={(id) => setCancelBookingId(id)}
                />
              ))}
              {upcomingQuotes.map((q) => (
                <QuoteResponseCard key={q.id} quote={toQuoteCardProps(q)} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: En cours */}
        <TabsContent value="in_progress">
          {inProgressBookings.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {inProgressBookings.map((b) => (
                <ClientBookingCard key={b.id} booking={toCardBooking(b)} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Passees */}
        <TabsContent value="past">
          {pastBookings.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {pastBookings.map((b) => (
                <ClientBookingCard key={b.id} booking={toCardBooking(b)} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Annulees */}
        <TabsContent value="cancelled">
          {cancelledBookings.length === 0 && cancelledQuotes.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {cancelledBookings.map((b) => (
                <ClientBookingCard key={b.id} booking={toCardBooking(b)} />
              ))}
              {cancelledQuotes.map((q) => (
                <QuoteResponseCard key={q.id} quote={toQuoteCardProps(q)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancellation dialog */}
      {cancelBookingId && bookingToCancel && (
        <CancelBookingDialog
          bookingId={cancelBookingId}
          scheduledAt={
            bookingToCancel.scheduledAt
              ? new Date(bookingToCancel.scheduledAt)
              : null
          }
          totalAmount={bookingToCancel.totalAmount}
          onCancelled={() => {
            setCancelBookingId(null);
            router.refresh();
          }}
          onClose={() => setCancelBookingId(null)}
        />
      )}
    </>
  );
}
