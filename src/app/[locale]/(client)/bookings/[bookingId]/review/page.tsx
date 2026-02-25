import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Star, ArrowLeft, Clock, CheckCircle2, AlertCircle } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { redirect, Link } from "@/i18n/routing";
import { getBookingDetailAction } from "@/features/booking/actions/booking-queries";
import { getReviewWindowAction } from "@/features/review/actions/review-queries";
import { ReviewForm } from "@/features/review/components/ReviewForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Evaluer le prestataire | Tawa Services",
};

// ============================================================
// PROPS
// ============================================================

interface Props {
  params: Promise<{ bookingId: string; locale: string }>;
}

// ============================================================
// SERVER PAGE COMPONENT
// ============================================================

export default async function ClientReviewPage({ params }: Props) {
  const { bookingId } = await params;
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  // Auth guard
  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "CLIENT") {
    return redirect({ href: "/", locale });
  }

  // Fetch booking detail
  const bookingResult = await getBookingDetailAction(bookingId);
  if (!bookingResult.success) {
    return notFound();
  }

  const booking = bookingResult.data;

  // Verify this booking belongs to the authenticated client
  if (booking.client.id !== session.user.id) {
    return notFound();
  }

  // Booking must be COMPLETED to access review page
  if (booking.status !== "COMPLETED") {
    return redirect({
      href: `/bookings/${bookingId}` as never,
      locale,
    });
  }

  // Check review eligibility
  const windowResult = await getReviewWindowAction(bookingId);
  const windowStatus = windowResult.success ? windowResult.data : null;

  const providerName = booking.provider.displayName;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Back link */}
      <Link
        href={`/bookings/${bookingId}` as never}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour a la reservation
      </Link>

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Evaluer le prestataire
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {booking.service.title} — {providerName}
            </p>
          </div>
        </div>
      </div>

      {/* Review window remaining time */}
      {windowStatus?.canReview && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock className="h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-amber-700">
            {windowStatus.daysRemaining} jour(s) restant(s) pour laisser un avis
          </p>
        </div>
      )}

      {/* Already reviewed */}
      {windowStatus && !windowStatus.canReview && windowStatus.hasReviewed && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Vous avez deja laisse un avis
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Votre evaluation pour cette reservation a ete soumise.
              </p>
              {!windowStatus.otherPartyReviewed && (
                <p className="mt-2 text-sm text-muted-foreground">
                  En attente de l&apos;avis du prestataire pour publication.
                </p>
              )}
            </div>
            <Button variant="outline" asChild>
              <Link href={`/bookings/${bookingId}` as never}>
                Retour a la reservation
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Window expired */}
      {windowStatus && !windowStatus.canReview && !windowStatus.hasReviewed && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                La periode d&apos;evaluation est terminee
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                La periode de 10 jours pour evaluer cette reservation est ecoulee.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/bookings/${bookingId}` as never}>
                Retour a la reservation
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review form */}
      {windowStatus?.canReview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-amber-500" />
              Votre evaluation de {providerName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm
              bookingId={bookingId}
              authorRole="CLIENT"
              onSuccess={undefined}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
