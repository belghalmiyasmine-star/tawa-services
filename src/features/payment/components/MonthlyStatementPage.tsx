"use client";

import { Printer, TrendingUp, Receipt, Percent, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MonthlyStatementData } from "@/features/payment/actions/invoice-actions";

// ============================================================
// TYPES
// ============================================================

interface MonthlyStatementPageProps {
  data: MonthlyStatementData;
}

// ============================================================
// HELPERS
// ============================================================

function formatAmount(amount: number): string {
  return `${amount.toFixed(2)} TND`;
}

function formatDate(isoDate: string): string {
  if (!isoDate) return "";
  try {
    return new Intl.DateTimeFormat("fr-TN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

function formatMonthFr(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  if (!year || !month) return yearMonth;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("fr-TN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

// ============================================================
// SUMMARY CARD
// ============================================================

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  className?: string;
}

function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`rounded-full p-2 ${className ?? "bg-muted"}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * MonthlyStatementPage — Printable monthly earnings statement.
 *
 * - Displays period summary (missions, gross, commission, net)
 * - Shows transaction table with date, service, client, amounts
 * - Print button triggers window.print(), hidden via @media print
 * - @media print: hide nav, footer, print button — clean white layout
 */
export function MonthlyStatementPage({ data }: MonthlyStatementPageProps) {
  const { period, providerDisplayName, providerName, summary, transactions } =
    data;

  const handlePrint = () => {
    window.print();
  };

  const monthLabel = formatMonthFr(period);

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #statement-printable,
          #statement-printable * {
            visibility: visible;
          }
          #statement-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
            padding: 2rem;
          }
          .no-print {
            display: none !important;
          }
          nav, footer, header {
            display: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Action bar */}
        <div className="no-print mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Releve mensuel
            </h1>
            <p className="mt-1 capitalize text-sm text-muted-foreground">
              {monthLabel}
            </p>
          </div>
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        </div>

        {/* Printable content */}
        <div id="statement-printable" className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between rounded-lg border bg-white p-6 dark:bg-card">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground">
                TAWA SERVICES
              </h2>
              <p className="text-sm text-muted-foreground">
                Releve mensuel — Prestataire
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold capitalize text-foreground">
                {monthLabel}
              </p>
              <p className="text-sm text-muted-foreground">{providerDisplayName}</p>
              <p className="text-xs text-muted-foreground">{providerName}</p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Missions realisees"
              value={String(summary.totalMissions)}
              icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
              className="bg-blue-50 dark:bg-blue-950/30"
            />
            <StatCard
              label="Revenu brut"
              value={formatAmount(summary.grossRevenue)}
              icon={<TrendingUp className="h-5 w-5 text-green-600" />}
              className="bg-green-50 dark:bg-green-950/30"
            />
            <StatCard
              label="Commission (12%)"
              value={`-${formatAmount(summary.totalCommission)}`}
              icon={<Percent className="h-5 w-5 text-red-600" />}
              className="bg-red-50 dark:bg-red-950/30"
            />
            <StatCard
              label="Revenu net"
              value={formatAmount(summary.netEarnings)}
              icon={<Receipt className="h-5 w-5 text-purple-600" />}
              className="bg-purple-50 dark:bg-purple-950/30"
            />
          </div>

          {/* Transaction table */}
          {transactions.length === 0 ? (
            <div className="rounded-lg border bg-white py-12 text-center dark:bg-card">
              <p className="text-sm text-muted-foreground">
                Aucune transaction pour cette periode
              </p>
            </div>
          ) : (
            <div className="rounded-lg border bg-white dark:bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {tx.serviceTitle}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.clientName}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatAmount(tx.amount)}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        -{formatAmount(tx.commission)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                        {formatAmount(tx.netAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatAmount(summary.grossRevenue)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      -{formatAmount(summary.totalCommission)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                      {formatAmount(summary.netEarnings)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
            <p>Mode demonstration — document de simulation</p>
            <p className="mt-1">
              Les documents financiers sont conserves pendant 5 ans
              conformement a la reglementation.
            </p>
            <p className="mt-1">
              Tawa Services — Plateforme de services locaux en Tunisie
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
