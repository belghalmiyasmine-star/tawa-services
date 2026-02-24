"use client";

import { Calendar, User, MapPin } from "lucide-react";
import Image from "next/image";

import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { BookingStatus } from "@prisma/client";

interface ProviderBookingCardProps {
  booking: {
    id: string;
    status: BookingStatus;
    scheduledAt: Date | null;
    totalAmount: number;
    clientNote: string | null;
    service: {
      title: string;
      photoUrls: string[];
    };
    client: {
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
}

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

function formatScheduledAt(date: Date | null): string {
  if (!date) return "Date non definie";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function ProviderBookingCard({ booking }: ProviderBookingCardProps) {
  const statusConfig = STATUS_CONFIG[booking.status];
  const photoUrl = booking.service.photoUrls[0] ?? null;
  const clientName =
    booking.client
      ? [booking.client.firstName, booking.client.lastName]
          .filter(Boolean)
          .join(" ") || "Client"
      : "Client";

  return (
    <Link href={`/provider/bookings/${booking.id}` as never}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Service thumbnail */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={booking.service.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <MapPin className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* Booking info */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {booking.service.title}
                </h3>
                <Badge
                  variant="outline"
                  className={`flex-shrink-0 text-xs ${statusConfig.className}`}
                >
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Client name */}
              <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{clientName}</span>
              </div>

              {/* Scheduled date */}
              {booking.scheduledAt && (
                <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatScheduledAt(booking.scheduledAt)}</span>
                </div>
              )}

              {/* Amount */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {booking.totalAmount.toFixed(2)} TND
                </span>
              </div>

              {/* Client note */}
              {booking.clientNote && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  &quot;{booking.clientNote}&quot;
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
