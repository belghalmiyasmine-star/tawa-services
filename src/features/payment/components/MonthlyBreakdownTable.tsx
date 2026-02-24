"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/routing";
import type { MonthlyBreakdown } from "@/features/payment/actions/earnings-queries";

interface MonthlyBreakdownTableProps {
  data: MonthlyBreakdown[];
}

function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  if (!year || !month) return yearMonth;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("fr-TN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatAmount(amount: number): string {
  return `${amount.toFixed(2)} TND`;
}

export function MonthlyBreakdownTable({ data }: MonthlyBreakdownTableProps) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Aucune transaction pour le moment
        </p>
      </div>
    );
  }

  const totals = data.reduce(
    (acc, row) => ({
      missions: acc.missions + row.missions,
      grossRevenue: acc.grossRevenue + row.grossRevenue,
      commission: acc.commission + row.commission,
      netEarnings: acc.netEarnings + row.netEarnings,
    }),
    { missions: 0, grossRevenue: 0, commission: 0, netEarnings: 0 },
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mois</TableHead>
            <TableHead className="text-right">Missions</TableHead>
            <TableHead className="text-right">Revenu brut (TND)</TableHead>
            <TableHead className="text-right">Commission 12% (TND)</TableHead>
            <TableHead className="text-right">Revenu net (TND)</TableHead>
            <TableHead className="text-right">Releve</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.month}>
              <TableCell className="font-medium capitalize">
                {formatMonth(row.month)}
              </TableCell>
              <TableCell className="text-right">{row.missions}</TableCell>
              <TableCell className="text-right">
                {formatAmount(row.grossRevenue)}
              </TableCell>
              <TableCell className="text-right text-destructive">
                -{formatAmount(row.commission)}
              </TableCell>
              <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                {formatAmount(row.netEarnings)}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/provider/earnings/statement/${row.month}` as never}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Voir
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-bold">Total</TableCell>
            <TableCell className="text-right font-bold">
              {totals.missions}
            </TableCell>
            <TableCell className="text-right font-bold">
              {formatAmount(totals.grossRevenue)}
            </TableCell>
            <TableCell className="text-right font-bold text-destructive">
              -{formatAmount(totals.commission)}
            </TableCell>
            <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
              {formatAmount(totals.netEarnings)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
