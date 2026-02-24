import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { getMonthlyStatementAction } from "@/features/payment/actions/invoice-actions";
import { MonthlyStatementPage } from "@/features/payment/components/MonthlyStatementPage";

// ============================================================
// METADATA
// ============================================================

export const metadata: Metadata = {
  title: "Releve mensuel | Tawa Services",
  description: "Releve mensuel de vos revenus prestataire",
};

// ============================================================
// TYPES
// ============================================================

interface MonthlyStatementRouteProps {
  params: Promise<{ month: string; locale: string }>;
}

// ============================================================
// SERVER PAGE COMPONENT
// ============================================================

/**
 * MonthlyStatementRoute — Server page for the monthly earnings statement.
 *
 * - Validates PROVIDER session
 * - Extracts month from params (format YYYY-MM)
 * - Calls getMonthlyStatementAction(month)
 * - Renders MonthlyStatementPage with data
 */
export default async function MonthlyStatementRoute({
  params,
}: MonthlyStatementRouteProps) {
  const { month } = await params;
  const locale = await getLocale();
  const session = await getServerSession(authOptions);

  // Auth guard
  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "PROVIDER") {
    return redirect({ href: "/", locale });
  }

  // Validate month format
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return notFound();
  }

  // Fetch statement data
  const result = await getMonthlyStatementAction(month);

  if (!result.success) {
    return notFound();
  }

  return <MonthlyStatementPage data={result.data} />;
}
