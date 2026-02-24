import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { getInvoiceDataAction } from "@/features/payment/actions/invoice-actions";
import { InvoiceTemplate } from "@/features/payment/components/InvoiceTemplate";

// ============================================================
// METADATA
// ============================================================

export const metadata: Metadata = {
  title: "Facture | Tawa Services",
  description: "Facture de votre reservation",
};

// ============================================================
// TYPES
// ============================================================

interface ClientInvoicePageProps {
  params: Promise<{ bookingId: string; locale: string }>;
}

// ============================================================
// SERVER PAGE COMPONENT
// ============================================================

/**
 * ClientInvoicePage — Server page for the client invoice view.
 *
 * - Verifies CLIENT session
 * - Fetches invoice data via getInvoiceDataAction (action handles authorization)
 * - Renders InvoiceTemplate with viewAs="client"
 */
export default async function ClientInvoicePage({
  params,
}: ClientInvoicePageProps) {
  const { bookingId } = await params;
  const locale = await getLocale();
  const session = await getServerSession(authOptions);

  // Auth guard
  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "CLIENT") {
    return redirect({ href: "/", locale });
  }

  // Fetch invoice data — action verifies ownership
  const result = await getInvoiceDataAction(bookingId);

  if (!result.success) {
    return notFound();
  }

  return <InvoiceTemplate {...result.data} viewAs="client" />;
}
