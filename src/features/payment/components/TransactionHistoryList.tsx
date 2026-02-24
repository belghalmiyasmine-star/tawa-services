"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TransactionItem } from "@/features/payment/actions/earnings-queries";

interface TransactionHistoryListProps {
  data: TransactionItem[];
}

function formatAmount(amount: number): string {
  return `${amount.toFixed(2)} TND`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-TN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "RELEASED":
      return "default";
    case "HELD":
      return "secondary";
    case "REFUNDED":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "RELEASED":
      return "Libere";
    case "HELD":
      return "En attente";
    case "REFUNDED":
      return "Rembourse";
    default:
      return status;
  }
}

function getMethodLabel(method: string): string {
  switch (method) {
    case "CARD":
      return "Carte";
    case "D17":
      return "D17";
    case "FLOUCI":
      return "Flouci";
    case "CASH":
      return "Especes";
    default:
      return method;
  }
}

function StatusBadge({ status }: { status: string }) {
  const variant = getStatusBadgeVariant(status);
  const className =
    status === "HELD"
      ? "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
      : status === "RELEASED"
        ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
        : "";

  return (
    <Badge variant={variant} className={className}>
      {getStatusLabel(status)}
    </Badge>
  );
}

export function TransactionHistoryList({ data }: TransactionHistoryListProps) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">
          Aucune transaction pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((tx) => (
        <Card key={tx.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              {/* Left: service + client info */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {tx.serviceTitle}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  Client : {tx.clientName}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={tx.status} />
                  <Badge variant="outline" className="text-xs">
                    {getMethodLabel(tx.method)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(tx.createdAt)}
                  </span>
                </div>
              </div>

              {/* Right: amounts */}
              <div className="shrink-0 text-right">
                <p className="text-sm text-muted-foreground">
                  Montant : {formatAmount(tx.amount)}
                </p>
                <p className="text-sm text-destructive">
                  Commission : -{formatAmount(tx.commission)}
                </p>
                <p className="mt-1 font-semibold text-green-600 dark:text-green-400">
                  {formatAmount(tx.providerEarning)}
                </p>
                {tx.releasedAt && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Libere le {formatDate(tx.releasedAt)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
