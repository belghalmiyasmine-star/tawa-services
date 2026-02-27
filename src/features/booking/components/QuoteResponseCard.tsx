"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { CheckCircle2, AlertCircle, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { declineQuoteAction } from "@/features/booking/actions/manage-quotes";
import { QuoteAcceptFlow } from "@/features/booking/components/QuoteAcceptFlow";
import type { QuoteStatus } from "@/types";

// ============================================================
// TYPES
// ============================================================

interface QuoteResponseCardProps {
  quote: {
    id: string;
    status: QuoteStatus;
    description: string;
    proposedPrice: number | null;
    proposedDelay: string | null;
    expiresAt: Date;
    respondedAt: Date | null;
    createdAt: Date;
    bookingId?: string | null;
    service: {
      title: string;
    };
  };
  onStatusChange?: () => void;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Compute time remaining in hours and minutes from now to a future date.
 * Returns null if the date is in the past.
 */
function computeTimeRemaining(expiresAt: Date): {
  hours: number;
  minutes: number;
} | null {
  const now = Date.now();
  const diff = expiresAt.getTime() - now;
  if (diff <= 0) return null;
  const totalMinutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

/**
 * Format a proposed price as "XX.XX TND"
 */
function formatPrice(price: number): string {
  return `${price.toLocaleString("fr-TN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} TND`;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * QuoteResponseCard — Renders the current state of a quote with appropriate UI per status.
 *
 * - PENDING: countdown timer, amber border
 * - RESPONDED: proposed price + accept/decline buttons, green border
 * - ACCEPTED: accepted badge + link to booking, green border
 * - DECLINED: declined badge, gray border
 * - EXPIRED: expired message, red border
 */
export function QuoteResponseCard({
  quote,
  onStatusChange,
}: QuoteResponseCardProps) {
  const t = useTranslations("booking");
  const { toast } = useToast();
  const [isDeclining, setIsDeclining] = useState(false);
  const [showAcceptFlow, setShowAcceptFlow] = useState(false);

  // Countdown timer (updates every 60 seconds)
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
  } | null>(() => computeTimeRemaining(new Date(quote.expiresAt)));

  useEffect(() => {
    if (quote.status !== "PENDING") return;

    const interval = setInterval(() => {
      setTimeRemaining(computeTimeRemaining(new Date(quote.expiresAt)));
    }, 60_000);

    return () => clearInterval(interval);
  }, [quote.status, quote.expiresAt]);

  async function handleDecline() {
    setIsDeclining(true);
    try {
      const result = await declineQuoteAction(quote.id);
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.error,
        });
        return;
      }
      toast({
        title: "Devis decline",
        description: "Vous avez decline ce devis.",
      });
      onStatusChange?.();
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
      });
    } finally {
      setIsDeclining(false);
    }
  }

  function handleAccepted(bookingId: string) {
    setShowAcceptFlow(false);
    toast({
      title: t("bookingAccepted"),
      description: "Votre reservation a ete creee avec succes.",
    });
    onStatusChange?.();
    void bookingId; // will be used for navigation inside QuoteAcceptFlow
  }

  // Border color per status
  const borderClass = {
    PENDING: "border-amber-300 dark:border-amber-600",
    RESPONDED: "border-green-400 dark:border-green-600",
    ACCEPTED: "border-green-400 dark:border-green-600",
    DECLINED: "border-gray-300 dark:border-gray-600",
    EXPIRED: "border-red-400 dark:border-red-600",
  }[quote.status];

  return (
    <>
      <Card className={`border-2 ${borderClass}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {quote.service.title}
            </p>
            <QuoteStatusBadge status={quote.status} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description snippet */}
          <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {quote.description}
          </p>

          {/* Status-specific content */}
          {quote.status === "PENDING" && (
            <PendingState timeRemaining={timeRemaining} />
          )}

          {quote.status === "RESPONDED" && quote.proposedPrice !== null && (
            <RespondedState
              proposedPrice={formatPrice(quote.proposedPrice)}
              proposedDelay={quote.proposedDelay}
              onAccept={() => setShowAcceptFlow(true)}
              onDecline={handleDecline}
              isDeclining={isDeclining}
            />
          )}

          {quote.status === "ACCEPTED" && (
            <AcceptedState
              proposedPrice={
                quote.proposedPrice !== null
                  ? formatPrice(quote.proposedPrice)
                  : null
              }
              bookingId={quote.bookingId}
            />
          )}

          {quote.status === "DECLINED" && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vous avez decline ce devis.
            </p>
          )}

          {quote.status === "EXPIRED" && (
            <ExpiredState />
          )}
        </CardContent>
      </Card>

      {/* QuoteAcceptFlow dialog/sheet */}
      {showAcceptFlow && quote.proposedPrice !== null && (
        <QuoteAcceptFlow
          quoteId={quote.id}
          proposedPrice={quote.proposedPrice}
          onAccepted={handleAccepted}
          onClose={() => setShowAcceptFlow(false)}
        />
      )}
    </>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const variants: Record<
    QuoteStatus,
    { label: string; variant: "secondary" | "default" | "destructive" | "outline" }
  > = {
    PENDING: { label: "En attente", variant: "secondary" },
    RESPONDED: { label: "Repondu", variant: "default" },
    ACCEPTED: { label: "Accepte", variant: "default" },
    DECLINED: { label: "Decline", variant: "outline" },
    EXPIRED: { label: "Expire", variant: "destructive" },
  };

  const { label, variant } = variants[status] ?? {
    label: status,
    variant: "secondary",
  };

  return <Badge variant={variant}>{label}</Badge>;
}

function PendingState({
  timeRemaining,
}: {
  timeRemaining: { hours: number; minutes: number } | null;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 dark:bg-amber-950">
      <Timer className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="text-sm text-amber-800 dark:text-amber-200">
        {timeRemaining === null ? (
          "Le devis a expire"
        ) : (
          <>
            En attente de reponse du prestataire —{" "}
            <span className="font-medium">
              expire dans {timeRemaining.hours}h {timeRemaining.minutes}min
            </span>
          </>
        )}
      </p>
    </div>
  );
}

function RespondedState({
  proposedPrice,
  proposedDelay,
  onAccept,
  onDecline,
  isDeclining,
}: {
  proposedPrice: string;
  proposedDelay: string | null;
  onAccept: () => void;
  onDecline: () => void;
  isDeclining: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-md bg-green-50 px-3 py-2 dark:bg-green-950">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Le prestataire a repondu a votre demande
          </p>
        </div>
        <div className="mt-2 space-y-1 pl-6">
          <p className="text-sm text-green-800 dark:text-green-200">
            <span className="font-semibold">Prix propose :</span> {proposedPrice}
          </p>
          {proposedDelay && (
            <p className="text-sm text-green-800 dark:text-green-200">
              <span className="font-semibold">Delai :</span> {proposedDelay}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onAccept} className="flex-1">
          Accepter le devis
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="flex-1"
              disabled={isDeclining}
            >
              {isDeclining ? "En cours..." : "Decliner"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Decliner le devis ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irreversible. Vous ne pourrez plus accepter ce
                devis apres l&apos;avoir decline.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDecline}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirmer le refus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function AcceptedState({
  proposedPrice,
  bookingId,
}: {
  proposedPrice: string | null;
  bookingId?: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <p className="text-sm font-medium text-green-800 dark:text-green-200">
          Devis accepte
          {proposedPrice ? ` — ${proposedPrice}` : ""}
        </p>
      </div>
      {bookingId && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/bookings/${bookingId}` as never}>
            Voir la reservation
          </Link>
        </Button>
      )}
    </div>
  );
}

function ExpiredState() {
  return (
    <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 dark:bg-red-950">
      <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
      <p className="text-sm text-red-800 dark:text-red-200">
        Devis expire — le prestataire n&apos;a pas repondu dans les 48h.
      </p>
    </div>
  );
}
