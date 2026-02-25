import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Calendar, MapPin, User, CreditCard, FileText, Clock, Printer, Star } from "lucide-react";
import type { Metadata } from "next";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { getBookingDetailAction } from "@/features/booking/actions/booking-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/routing";
import { BookingActions } from "@/features/booking/components/BookingActions";
import { getReviewWindowAction } from "@/features/review/actions/review-queries";
import { ContactButton } from "@/features/messaging/components/ContactButton";
import type { BookingStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Detail de la reservation | Tawa Services",
};

interface Props {
  params: Promise<{ bookingId: string; locale: string }>;
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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: "Carte bancaire",
  D17: "D17 (Poste tunisienne)",
  FLOUCI: "Flouci",
  CASH: "Especes (paiement a la prestation)",
};

function formatDateTime(date: Date | null): string {
  if (!date) return "Non defini";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDate(date: Date | null): string {
  if (!date) return "Non defini";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

// ============================================================
// STATUS TIMELINE
// ============================================================

const STATUS_ORDER: BookingStatus[] = [
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
];

interface StatusTimelineProps {
  currentStatus: BookingStatus;
  createdAt: Date;
}

function StatusTimeline({ currentStatus, createdAt }: StatusTimelineProps) {
  const isTerminal =
    currentStatus === "REJECTED" || currentStatus === "CANCELLED";

  const steps = isTerminal
    ? [
        { status: "PENDING" as BookingStatus, label: "Demande envoyee" },
        { status: currentStatus, label: currentStatus === "REJECTED" ? "Reservation rejetee" : "Reservation annulee" },
      ]
    : [
        { status: "PENDING" as BookingStatus, label: "Demande envoyee" },
        { status: "ACCEPTED" as BookingStatus, label: "Reservation acceptee" },
        { status: "IN_PROGRESS" as BookingStatus, label: "Service en cours" },
        { status: "COMPLETED" as BookingStatus, label: "Service termine" },
      ];

  const currentIndex = isTerminal
    ? steps.length - 1
    : STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isActive = isTerminal ? index <= currentIndex : STATUS_ORDER.indexOf(step.status) <= STATUS_ORDER.indexOf(currentStatus);
        const isCurrent = isTerminal ? index === currentIndex : step.status === currentStatus;

        return (
          <div key={step.status} className="flex items-start gap-3">
            {/* Timeline dot and line */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors ${
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-muted bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mt-1 h-6 w-0.5 ${isActive ? "bg-primary/40" : "bg-muted"}`}
                />
              )}
            </div>

            {/* Step content */}
            <div className="pb-2 pt-1">
              <p
                className={`text-sm font-medium ${
                  isCurrent
                    ? "text-primary"
                    : isActive
                      ? "text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
              {index === 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(createdAt)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default async function ProviderBookingDetailPage({ params }: Props) {
  const { bookingId } = await params;
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "PROVIDER") {
    return redirect({ href: "/", locale });
  }

  const result = await getBookingDetailAction(bookingId);

  if (!result.success) {
    return notFound();
  }

  const booking = result.data;

  // Fetch review window status for completed bookings
  const reviewWindowResult =
    booking.status === "COMPLETED"
      ? await getReviewWindowAction(bookingId)
      : null;
  const reviewWindow = reviewWindowResult?.success
    ? reviewWindowResult.data
    : null;
  const statusConfig = STATUS_CONFIG[booking.status];
  const clientName = [booking.client.firstName, booking.client.lastName]
    .filter(Boolean)
    .join(" ") || "Client";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/provider/bookings"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Retour aux reservations
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Client info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Informations client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-foreground">{clientName}</p>
                <p className="text-sm text-muted-foreground">{booking.client.email}</p>
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
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Planning
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
              {booking.completedAt && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Termine le
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {formatDateTime(booking.completedAt)}
                  </p>
                </div>
              )}
              {booking.cancelledAt && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Annule le
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {formatDateTime(booking.cancelledAt)}
                    {booking.cancelledBy && (
                      <span className="ml-1 text-muted-foreground">
                        (par {booking.cancelledBy === "CLIENT" ? "le client" : "le prestataire"})
                      </span>
                    )}
                  </p>
                  {booking.cancelReason && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Raison: {booking.cancelReason}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {booking.service.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {booking.service.description.slice(0, 150)}
                {booking.service.description.length > 150 ? "..." : ""}
              </p>
              {booking.service.durationMinutes && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Duree: {booking.service.durationMinutes} min</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
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
                      {booking.payment.status}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Invoice link for completed bookings */}
          {booking.status === "COMPLETED" &&
            booking.payment &&
            (booking.payment.status === "RELEASED" ||
              booking.payment.status === "HELD") && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Facture
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={
                        `/provider/earnings/invoice/${booking.payment.id}` as never
                      }
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Voir la facture
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={
                        `/provider/earnings/invoice/${booking.payment.id}` as never
                      }
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimer
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* Quote info (if quote-based) */}
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
                {booking.quote.proposedPrice && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Prix propose</p>
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

          {/* Status timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Suivi de la reservation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline
                currentStatus={booking.status}
                createdAt={booking.createdAt}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action buttons */}
      {(booking.status === "PENDING" ||
        booking.status === "ACCEPTED" ||
        booking.status === "IN_PROGRESS") && (
        <div className="mt-6 rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <ContactButton
              bookingId={booking.id}
              label="Contacter le client"
              basePath="/provider/messages"
            />
            <BookingActions bookingId={booking.id} status={booking.status} />
          </div>
        </div>
      )}

      {/* Review CTA for completed bookings */}
      {booking.status === "COMPLETED" && reviewWindow && (
        <div className="mt-6 rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Evaluation
          </h2>
          {reviewWindow.hasReviewed ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>Avis soumis</span>
              {!reviewWindow.otherPartyReviewed && (
                <span className="text-xs">
                  — En attente de l&apos;avis du client pour publication
                </span>
              )}
            </div>
          ) : reviewWindow.canReview ? (
            <Button asChild>
              <Link href={`/provider/bookings/${booking.id}/review` as never}>
                <Star className="mr-2 h-4 w-4" />
                Evaluer le client
              </Link>
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
