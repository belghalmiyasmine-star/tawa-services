import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  Clock,
  Star,
  ChevronLeft,
} from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";

import { authOptions } from "@/lib/auth";
import { redirect, Link } from "@/i18n/routing";
import { getBookingDetailAction } from "@/features/booking/actions/booking-queries";
import { getReviewWindowAction } from "@/features/review/actions/review-queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusTimeline } from "@/features/booking/components/StatusTimeline";
import { CancelBookingButton } from "@/features/booking/components/CancelBookingButton";
import type { BookingStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Detail de la reservation | Tawa Services",
};

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

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  HELD: "Retenu (escrow)",
  RELEASED: "Libere",
  REFUNDED: "Rembourse",
  FAILED: "Echoue",
};

// ============================================================
// HELPERS
// ============================================================

function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "Non defini";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// ============================================================
// PROPS
// ============================================================

interface Props {
  params: Promise<{ bookingId: string; locale: string }>;
}

// ============================================================
// SERVER PAGE COMPONENT
// ============================================================

export default async function ClientBookingDetailPage({ params }: Props) {
  const { bookingId } = await params;
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "CLIENT") {
    return redirect({ href: "/", locale });
  }

  const result = await getBookingDetailAction(bookingId);

  if (!result.success) {
    return notFound();
  }

  const booking = result.data;

  // Verify this booking belongs to the authenticated client
  if (booking.client.id !== session.user.id) {
    return notFound();
  }

  // Fetch review window status for COMPLETED bookings
  const reviewWindowResult =
    booking.status === "COMPLETED"
      ? await getReviewWindowAction(bookingId)
      : null;
  const reviewWindow = reviewWindowResult?.success
    ? reviewWindowResult.data
    : null;

  const statusConfig = STATUS_CONFIG[booking.status];
  const providerName = booking.provider.displayName;
  const canCancel =
    booking.status === "PENDING" || booking.status === "ACCEPTED";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/bookings"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour a mes reservations
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {booking.service.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Reservation #{booking.id.slice(-8).toUpperCase()}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`flex-shrink-0 text-sm ${statusConfig.className}`}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Suivi de la reservation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline
              booking={{
                status: booking.status,
                createdAt: new Date(booking.createdAt),
                scheduledAt: booking.scheduledAt
                  ? new Date(booking.scheduledAt)
                  : null,
                completedAt: booking.completedAt
                  ? new Date(booking.completedAt)
                  : null,
                cancelledAt: booking.cancelledAt
                  ? new Date(booking.cancelledAt)
                  : null,
                cancelledBy: booking.cancelledBy,
              }}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left column */}
          <div className="space-y-6">
            {/* Service card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Service photo */}
                {booking.service.photoUrls[0] && (
                  <div className="relative h-36 w-full overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={booking.service.photoUrls[0]}
                      alt={booking.service.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <p className="text-sm font-medium text-foreground">
                  {booking.service.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {booking.service.description.slice(0, 200)}
                  {booking.service.description.length > 200 ? "..." : ""}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {booking.service.fixedPrice !== null &&
                    booking.service.fixedPrice !== undefined && (
                      <span className="font-medium text-foreground">
                        {booking.service.fixedPrice.toFixed(2)} TND
                      </span>
                    )}
                  {booking.service.durationMinutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{booking.service.durationMinutes} min</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Provider card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Prestataire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                    {booking.provider.photoUrl ? (
                      <Image
                        src={booking.provider.photoUrl}
                        alt={providerName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-lg font-medium text-muted-foreground">
                          {providerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{providerName}</p>
                    {booking.provider.rating > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{booking.provider.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Link
                  href={`/providers/${booking.provider.id}` as never}
                  className="text-xs text-primary hover:underline"
                >
                  Voir le profil
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Booking details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Details de la reservation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Date prevue
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {formatDateTime(booking.scheduledAt)}
                  </p>
                </div>
                {booking.clientNote && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Instructions
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {booking.clientNote}
                      </p>
                    </div>
                  </>
                )}
                {booking.cancelledAt && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Annule le
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {formatDateTime(booking.cancelledAt)}
                        {booking.cancelledBy && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (
                            {booking.cancelledBy === "CLIENT"
                              ? "par vous"
                              : "par le prestataire"}
                            )
                          </span>
                        )}
                      </p>
                      {booking.cancelReason && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Raison : {booking.cancelReason}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" />
                  Paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="font-semibold text-foreground">
                    {booking.totalAmount.toFixed(2)} TND
                  </p>
                </div>
                {booking.payment && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Methode</p>
                      <p className="text-sm text-foreground">
                        {PAYMENT_METHOD_LABELS[booking.payment.method] ??
                          booking.payment.method}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Statut</p>
                      <Badge variant="outline" className="text-xs">
                        {PAYMENT_STATUS_LABELS[booking.payment.status] ??
                          booking.payment.status}
                      </Badge>
                    </div>

                    {/* Payment action: Pay button (PENDING) */}
                    {booking.payment.status === "PENDING" && (
                      <>
                        <Separator />
                        <Link
                          href={`/bookings/${booking.id}/checkout` as never}
                          className="mt-1 flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          Payer maintenant
                        </Link>
                      </>
                    )}

                    {/* Payment status: HELD */}
                    {booking.payment.status === "HELD" && (
                      <>
                        <Separator />
                        <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                          Paiement retenu (escrow) — sera libere a la fin du service
                        </div>
                      </>
                    )}

                    {/* Payment status: RELEASED — show invoice link */}
                    {booking.payment.status === "RELEASED" && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                            Paiement libere
                          </div>
                          <Link
                            href={`/bookings/${booking.id}/invoice` as never}
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Voir la facture
                          </Link>
                        </div>
                      </>
                    )}

                    {/* Payment status: REFUNDED */}
                    {booking.payment.status === "REFUNDED" && (
                      <>
                        <Separator />
                        <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                          Rembourse
                          {booking.payment.refundAmount !== null &&
                            booking.payment.refundAmount !== undefined && (
                              <span className="ml-1 font-medium">
                                ({booking.payment.refundAmount.toFixed(2)} TND)
                              </span>
                            )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quote section (if quote-based booking) */}
            {booking.quote && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Devis associe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {booking.quote.description.slice(0, 200)}
                    {booking.quote.description.length > 200 ? "..." : ""}
                  </p>
                  {booking.quote.proposedPrice !== null && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Prix propose
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {booking.quote.proposedPrice.toFixed(2)} TND
                      </p>
                    </div>
                  )}
                  {booking.quote.proposedDelay && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Delai d&apos;intervention
                      </p>
                      <p className="text-sm text-foreground">
                        {booking.quote.proposedDelay}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Cancel button — only for PENDING or ACCEPTED bookings */}
        {canCancel && (
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              Actions
            </h2>
            <CancelBookingButton
              bookingId={booking.id}
              scheduledAt={
                booking.scheduledAt ? new Date(booking.scheduledAt) : null
              }
              totalAmount={booking.totalAmount}
            />
          </div>
        )}

        {/* Review CTA — only for COMPLETED bookings within review window */}
        {booking.status === "COMPLETED" && reviewWindow && (
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              Evaluation
            </h2>
            {reviewWindow.hasReviewed ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>Avis soumis</span>
                {!reviewWindow.otherPartyReviewed && (
                  <span className="text-xs">
                    — En attente de l&apos;avis du prestataire pour publication
                  </span>
                )}
              </div>
            ) : reviewWindow.canReview ? (
              <Link
                href={`/bookings/${booking.id}/review` as never}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Star className="h-4 w-4" />
                Laisser un avis
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
