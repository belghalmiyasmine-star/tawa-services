"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { InvoiceData } from "@/features/payment/actions/invoice-actions";

// ============================================================
// TYPES
// ============================================================

interface InvoiceTemplateProps extends InvoiceData {
  viewAs: "client" | "provider";
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
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

function getMethodLabel(method: string): string {
  switch (method) {
    case "CARD":
      return "Carte bancaire";
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

// ============================================================
// COMPONENT
// ============================================================

/**
 * InvoiceTemplate — Printable invoice component.
 *
 * - Renders a professional invoice layout
 * - viewAs="client": shows total amount paid
 * - viewAs="provider": shows gross, commission deduction, and net amount
 * - Print button triggers window.print(), hidden via @media print CSS
 * - @media print styles: hide nav, footer, buttons — clean white layout
 */
export function InvoiceTemplate({
  invoiceNumber,
  date,
  clientName,
  clientEmail,
  providerName,
  providerDisplayName,
  serviceTitle,
  serviceDescription,
  amount,
  commission,
  netAmount,
  paymentMethod,
  referenceNumber,
  bookingId,
  scheduledAt,
  viewAs,
}: InvoiceTemplateProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print styles injected inline */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-printable,
          #invoice-printable * {
            visibility: visible;
          }
          #invoice-printable {
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

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Print action bar — hidden when printing */}
        <div className="no-print mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Facture</h1>
            <p className="text-sm text-muted-foreground">
              {invoiceNumber}
            </p>
          </div>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        </div>

        {/* Invoice document */}
        <div
          id="invoice-printable"
          className="rounded-lg border bg-white p-8 shadow-sm dark:bg-card"
        >
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                TAWA SERVICES
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Plateforme de services locaux en Tunisie
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold uppercase tracking-widest text-foreground">
                FACTURE
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                N° {invoiceNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                Date : {formatDate(date)}
              </p>
            </div>
          </div>

          {/* Divider */}
          <hr className="mb-8 border-border" />

          {/* Parties */}
          <div className="mb-8 grid grid-cols-2 gap-8">
            {/* Client info */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Facture a
              </p>
              <p className="font-semibold text-foreground">{clientName}</p>
              <p className="text-sm text-muted-foreground">{clientEmail}</p>
            </div>

            {/* Provider info */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prestataire
              </p>
              <p className="font-semibold text-foreground">{providerDisplayName}</p>
              <p className="text-sm text-muted-foreground">{providerName}</p>
            </div>
          </div>

          {/* Service details */}
          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Detail du service
            </p>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      Description
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">
                      Qte
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">
                      Prix unitaire
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground">
                        {serviceTitle}
                      </p>
                      {serviceDescription && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {serviceDescription}
                        </p>
                      )}
                      {scheduledAt && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Date du service : {formatDate(scheduledAt)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center text-foreground">
                      1
                    </td>
                    <td className="px-4 py-4 text-right text-foreground">
                      {formatAmount(amount)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-foreground">
                      {formatAmount(amount)}
                    </td>
                  </tr>

                  {/* Provider view: show commission deduction */}
                  {viewAs === "provider" && (
                    <tr className="border-t border-border bg-muted/20">
                      <td
                        colSpan={3}
                        className="px-4 py-3 text-sm text-muted-foreground"
                      >
                        Commission plateforme (12%)
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-destructive">
                        -{formatAmount(commission)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-muted/50">
                  <tr className="border-t border-border">
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-right font-bold text-foreground"
                    >
                      {viewAs === "provider" ? "Montant net percu" : "Total TTC"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-lg font-bold ${
                        viewAs === "provider"
                          ? "text-green-600 dark:text-green-400"
                          : "text-foreground"
                      }`}
                    >
                      {viewAs === "provider"
                        ? formatAmount(netAmount)
                        : formatAmount(amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment details */}
          <div className="mb-8 grid grid-cols-2 gap-4 rounded-md bg-muted/30 px-4 py-3 text-sm">
            <div>
              <span className="text-muted-foreground">
                Mode de paiement :{" "}
              </span>
              <span className="font-medium text-foreground">
                {getMethodLabel(paymentMethod)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">
                Reference :{" "}
              </span>
              <span className="font-mono text-xs font-medium text-foreground">
                {referenceNumber.slice(-12).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">
                Reservation ID :{" "}
              </span>
              <span className="font-mono text-xs font-medium text-foreground">
                {bookingId.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Mode demonstration — document de simulation
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tawa Services — Plateforme de services locaux en Tunisie
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Les documents financiers sont conserves pendant 5 ans
              conformement a la reglementation.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
