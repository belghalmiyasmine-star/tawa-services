"use client";

import { Calendar, MapPin, User, CreditCard } from "lucide-react";
import Image from "next/image";

import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BookingStatus } from "@prisma/client";

// ============================================================
// TYPES
// ============================================================

export interface ClientBookingCardProps {
  booking: {
    id: string;
    status: BookingStatus;
    scheduledAt: Date | null;
    totalAmount: number;
    service: {
      title: string;
      photoUrls: string[];
    };
    provider: {
      displayName: string;
      photoUrl: string | null;
    } | null;
    payment: {
      method: string;
      status: string;
    } | null;
  };
  /** Called when "Annuler" is clicked — parent opens CancelBookingDialog */
  onCancelClick?: (bookingId: string) => void;
}

// ============================================================
// CONSTANTS
// ============================================================

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "En attente",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  ACCEPTED: {
    label: "Acceptee",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  IN_PROGRESS: {
    label: "En cours",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  COMPLETED: {
    label: "Terminee",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  REJECTED: {
    label: "Rejetee",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  CANCELLED: {
    label: "Annulee",
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: "Carte bancaire",
  D17: "D17 (Poste tunisienne)",
  FLOUCI: "Flouci",
  CASH: "Especes (paiement a la prestation)",
};

// ============================================================
// HELPERS
// ============================================================

function formatScheduledAt(date: Date | null): string {
  if (!date) return "Date non definie";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * ClientBookingCard — Displays a single booking as a card for the client's bookings list.
 *
 * - Shows service thumbnail, title, provider name/avatar
 * - Shows scheduled date, status badge, amount, payment method
 * - Shows "Annuler" button if status is PENDING or ACCEPTED
 * - Links to /bookings/[bookingId] detail page
 */
export function ClientBookingCard({
  booking,
  onCancelClick,
}: ClientBookingCardProps) {
  const statusConfig = STATUS_CONFIG[booking.status];
  const photoUrl = booking.service.photoUrls[0] ?? null;
  const canCancel =
    booking.status === "PENDING" || booking.status === "ACCEPTED";

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex gap-0">
          {/* Service thumbnail */}
          <div className="relative h-auto w-20 flex-shrink-0 overflow-hidden rounded-l-lg bg-muted sm:w-24">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={booking.service.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[80px] w-full items-center justify-center text-muted-foreground">
                <MapPin className="h-6 w-6" />
              </div>
            )}
          </div>

          {/* Booking info */}
          <div className="min-w-0 flex-1 p-3">
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <Link
                href={`/bookings/${booking.id}` as never}
                className="truncate text-sm font-semibold text-foreground hover:underline"
              >
                {booking.service.title}
              </Link>
              <Badge
                variant="outline"
                className={`flex-shrink-0 text-xs ${statusConfig.className}`}
              >
                {statusConfig.label}
              </Badge>
            </div>

            {/* Provider */}
            {booking.provider && (
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                {booking.provider.photoUrl ? (
                  <div className="relative h-4 w-4 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                    <Image
                      src={booking.provider.photoUrl}
                      alt={booking.provider.displayName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <User className="h-3 w-3 flex-shrink-0" />
                )}
                <span className="truncate">{booking.provider.displayName}</span>
              </div>
            )}

            {/* Scheduled date */}
            {booking.scheduledAt && (
              <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>{formatScheduledAt(booking.scheduledAt)}</span>
              </div>
            )}

            {/* Bottom row: amount + payment method + cancel button */}
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {booking.totalAmount.toFixed(2)} TND
                </span>
                {booking.payment && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CreditCard className="h-3 w-3" />
                    <span>
                      {PAYMENT_METHOD_LABELS[booking.payment.method] ??
                        booking.payment.method}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Payment action links */}
                {booking.payment?.status === "PENDING" && (
                  <Link
                    href={`/bookings/${booking.id}/checkout` as never}
                    className="h-auto rounded px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Payer
                  </Link>
                )}
                {booking.payment?.status === "RELEASED" && (
                  <Link
                    href={`/bookings/${booking.id}/invoice` as never}
                    className="h-auto rounded px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Facture
                  </Link>
                )}

                {canCancel && onCancelClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      onCancelClick(booking.id);
                    }}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
