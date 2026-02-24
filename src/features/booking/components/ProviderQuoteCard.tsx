"use client";

import { useState, useTransition } from "react";
import { Clock, Calendar, MapPin, DollarSign } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { respondQuoteAction } from "@/features/booking/actions/manage-quotes";
import type { QuoteStatus } from "@prisma/client";

interface ProviderQuoteCardProps {
  quote: {
    id: string;
    status: QuoteStatus;
    description: string;
    preferredDate: Date | null;
    address: string | null;
    city: string | null;
    budget: number | null;
    expiresAt: Date;
    service: {
      title: string;
    };
  };
}

const QUOTE_STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "En attente",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  RESPONDED: {
    label: "Repondu",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  ACCEPTED: {
    label: "Accepte",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  DECLINED: {
    label: "Decline",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  EXPIRED: {
    label: "Expire",
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function getHoursRemaining(expiresAt: Date): number {
  const now = new Date();
  const diff = new Date(expiresAt).getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
}

export function ProviderQuoteCard({ quote }: ProviderQuoteCardProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposedDelay, setProposedDelay] = useState("");
  const [responded, setResponded] = useState(false);

  const statusConfig = QUOTE_STATUS_CONFIG[quote.status];
  const hoursRemaining = getHoursRemaining(quote.expiresAt);
  const isExpired = hoursRemaining === 0;
  const isPendingStatus = quote.status === "PENDING" && !isExpired;
  const isRespondedStatus = quote.status === "RESPONDED" || responded;

  const truncatedDescription =
    quote.description.length > 200
      ? quote.description.slice(0, 200) + "..."
      : quote.description;

  function handleRespond() {
    const price = parseFloat(proposedPrice);
    if (!price || price <= 0) {
      toast({
        title: "Erreur",
        description: "Le prix propose doit etre superieur a 0",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await respondQuoteAction({
        quoteId: quote.id,
        proposedPrice: price,
        proposedDelay: proposedDelay.trim() || undefined,
      });

      if (result.success) {
        setResponded(true);
        toast({
          title: "Reponse envoyee",
          description: "Votre reponse au devis a ete envoyee au client",
        });
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Card className="border-l-4 border-l-primary/30">
      <CardContent className="p-4">
        {/* Header: service title + status */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground">{quote.service.title}</h3>
          <div className="flex flex-shrink-0 flex-col items-end gap-1">
            <Badge
              variant="outline"
              className={`text-xs ${statusConfig.className}`}
            >
              {statusConfig.label}
            </Badge>
            {isPendingStatus && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <Clock className="h-3 w-3" />
                Expire dans {hoursRemaining}h
              </span>
            )}
            {isExpired && quote.status === "PENDING" && (
              <span className="text-xs text-muted-foreground">Expire</span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="mb-3 text-sm text-muted-foreground">
          {truncatedDescription}
        </p>

        {/* Details grid */}
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {quote.preferredDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span>{formatDate(quote.preferredDate)}</span>
            </div>
          )}
          {(quote.address ?? quote.city) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span>
                {[quote.address, quote.city].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
          {quote.budget && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3 flex-shrink-0" />
              <span>Budget: {quote.budget.toFixed(2)} TND</span>
            </div>
          )}
        </div>

        {/* Respond form (PENDING only) */}
        {isPendingStatus && !responded && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="mb-3 text-sm font-medium text-foreground">
              Repondre a cette demande
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor={`price-${quote.id}`} className="text-xs">
                  Prix propose (TND) *
                </Label>
                <Input
                  id={`price-${quote.id}`}
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Ex: 150"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor={`delay-${quote.id}`} className="text-xs">
                  Delai d&apos;intervention (optionnel)
                </Label>
                <Input
                  id={`delay-${quote.id}`}
                  type="text"
                  placeholder="Ex: 2-3 jours"
                  value={proposedDelay}
                  onChange={(e) => setProposedDelay(e.target.value)}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <Button
                onClick={handleRespond}
                disabled={isPending || !proposedPrice}
                size="sm"
                className="w-full"
              >
                {isPending ? "Envoi en cours..." : "Repondre"}
              </Button>
            </div>
          </div>
        )}

        {/* Responded state */}
        {isRespondedStatus && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
            <p className="text-sm text-blue-700">
              En attente de reponse du client
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
