"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMMISSION_RATE } from "@/lib/constants";
import type { ActionResult } from "@/types/api";

// ============================================================
// TYPES
// ============================================================

export type ExportColumn = {
  key: string;
  label: string;
};

export type ExportData = {
  columns: ExportColumn[];
  data: Record<string, unknown>[];
};

export type ExportType =
  | "users"
  | "services"
  | "transactions"
  | "revenue"
  | "reports"
  | "analytics";

export type ExportFilters = {
  startDate?: string;
  endDate?: string;
};

// ============================================================
// HELPERS
// ============================================================

async function requireAdmin(): Promise<ActionResult<{ userId: string; userName: string }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" };
  }
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Acces reserve aux administrateurs" };
  }
  return {
    success: true,
    data: {
      userId: session.user.id,
      userName: session.user.name ?? "Administrateur",
    },
  };
}

function parseDateRange(filters?: ExportFilters): { gte: Date; lte: Date } {
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setMonth(defaultStart.getMonth() - 6);

  const gte = filters?.startDate ? new Date(filters.startDate) : defaultStart;
  const lte = filters?.endDate ? new Date(filters.endDate) : now;

  return { gte, lte };
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-TN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatAmount(amount: number | null | undefined): string {
  if (amount == null) return "";
  return `${amount.toFixed(2)} TND`;
}

// ============================================================
// EXPORT DATA ACTION
// ============================================================

/**
 * Fetch full dataset (no pagination) for export based on type.
 * Returns columns (with French labels) and data rows.
 */
export async function getExportDataAction(
  type: ExportType,
  filters?: ExportFilters,
): Promise<ActionResult<ExportData>> {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult;

  try {
    switch (type) {
      case "users":
        return await exportUsers();

      case "services":
        return await exportServices();

      case "transactions":
        return await exportTransactions(filters);

      case "revenue":
        return await exportRevenue(filters);

      case "reports":
        return await exportReports(filters);

      case "analytics":
        return await exportAnalytics(filters);

      default:
        return { success: false, error: "Type d'export invalide" };
    }
  } catch (error) {
    console.error("[getExportDataAction] Error:", error);
    return { success: false, error: "Une erreur est survenue lors de l'export" };
  }
}

// ============================================================
// EXPORT IMPLEMENTATIONS
// ============================================================

async function exportUsers(): Promise<ActionResult<ExportData>> {
  const columns: ExportColumn[] = [
    { key: "nom", label: "Nom" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "statut", label: "Statut" },
    { key: "telephone", label: "Telephone" },
    { key: "dateInscription", label: "Date d'inscription" },
  ];

  const users = await prisma.user.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      email: true,
      role: true,
      isActive: true,
      isBanned: true,
      phone: true,
      createdAt: true,
    },
  });

  const roleLabels: Record<string, string> = {
    CLIENT: "Client",
    PROVIDER: "Prestataire",
    ADMIN: "Administrateur",
  };

  function getUserStatus(u: { isActive: boolean; isBanned: boolean }): string {
    if (u.isBanned) return "Banni";
    if (!u.isActive) return "Inactif";
    return "Actif";
  }

  const data = users.map((u) => ({
    nom: u.name ?? "",
    email: u.email,
    role: roleLabels[u.role] ?? u.role,
    statut: getUserStatus(u),
    telephone: u.phone ?? "",
    dateInscription: formatDate(u.createdAt),
  }));

  return { success: true, data: { columns, data } };
}

async function exportServices(): Promise<ActionResult<ExportData>> {
  const columns: ExportColumn[] = [
    { key: "titre", label: "Titre" },
    { key: "prestataire", label: "Prestataire" },
    { key: "categorie", label: "Categorie" },
    { key: "prix", label: "Prix" },
    { key: "statut", label: "Statut" },
    { key: "dateCreation", label: "Date de creation" },
  ];

  const services = await prisma.service.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    select: {
      title: true,
      fixedPrice: true,
      pricingType: true,
      status: true,
      createdAt: true,
      provider: { select: { displayName: true } },
      category: { select: { name: true } },
    },
  });

  const statusLabels: Record<string, string> = {
    ACTIVE: "Actif",
    PENDING: "En attente",
    SUSPENDED: "Suspendu",
    INACTIVE: "Inactif",
  };

  const data = services.map((s) => ({
    titre: s.title,
    prestataire: s.provider.displayName,
    categorie: s.category.name,
    prix:
      s.pricingType === "SUR_DEVIS"
        ? "Sur devis"
        : s.fixedPrice != null
          ? formatAmount(s.fixedPrice)
          : "",
    statut: statusLabels[s.status] ?? s.status,
    dateCreation: formatDate(s.createdAt),
  }));

  return { success: true, data: { columns, data } };
}

async function exportTransactions(
  filters?: ExportFilters,
): Promise<ActionResult<ExportData>> {
  const columns: ExportColumn[] = [
    { key: "reference", label: "Reference" },
    { key: "client", label: "Client" },
    { key: "prestataire", label: "Prestataire" },
    { key: "montant", label: "Montant" },
    { key: "commission", label: `Commission (${COMMISSION_RATE * 100}%)` },
    { key: "statut", label: "Statut" },
    { key: "date", label: "Date" },
  ];

  const dateRange = parseDateRange(filters);

  const payments = await prisma.payment.findMany({
    where: {
      isDeleted: false,
      createdAt: dateRange,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      booking: {
        select: {
          id: true,
          client: { select: { name: true } },
          service: {
            select: {
              provider: { select: { displayName: true } },
            },
          },
        },
      },
    },
  });

  const statusLabels: Record<string, string> = {
    PENDING: "En attente",
    HELD: "Retenu",
    RELEASED: "Libere",
    REFUNDED: "Rembourse",
    FAILED: "Echoue",
  };

  const data = payments.map((p) => ({
    reference: p.booking.id.slice(0, 8).toUpperCase(),
    client: p.booking.client.name ?? "",
    prestataire: p.booking.service.provider.displayName,
    montant: formatAmount(p.amount),
    commission: formatAmount(p.amount * COMMISSION_RATE),
    statut: statusLabels[p.status] ?? p.status,
    date: formatDate(p.createdAt),
  }));

  return { success: true, data: { columns, data } };
}

async function exportRevenue(
  filters?: ExportFilters,
): Promise<ActionResult<ExportData>> {
  const columns: ExportColumn[] = [
    { key: "mois", label: "Mois" },
    { key: "revenu", label: "Revenu brut (TND)" },
    { key: "commission", label: `Commission ${COMMISSION_RATE * 100}% (TND)` },
    { key: "net", label: "Net prestataires (TND)" },
    { key: "transactions", label: "Transactions" },
  ];

  const dateRange = parseDateRange(filters);

  const payments = await prisma.payment.findMany({
    where: {
      isDeleted: false,
      status: { in: ["RELEASED", "HELD"] },
      createdAt: dateRange,
    },
    select: {
      amount: true,
      createdAt: true,
    },
  });

  // Group by month
  const monthMap = new Map<
    string,
    { revenu: number; transactions: number }
  >();

  // Initialize all months in range
  const cursor = new Date(dateRange.gte);
  cursor.setDate(1);
  while (cursor <= dateRange.lte) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { revenu: 0, transactions: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const p of payments) {
    const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const current = monthMap.get(key);
    if (current) {
      current.revenu += p.amount;
      current.transactions += 1;
    }
  }

  const monthFormatter = new Intl.DateTimeFormat("fr-TN", {
    month: "long",
    year: "numeric",
  });

  const data = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, values]) => {
      const [year, month] = monthKey.split("-").map(Number);
      const date = new Date(year ?? 2024, (month ?? 1) - 1, 1);
      const commission = values.revenu * COMMISSION_RATE;
      return {
        mois: monthFormatter.format(date),
        revenu: values.revenu.toFixed(2),
        commission: commission.toFixed(2),
        net: (values.revenu - commission).toFixed(2),
        transactions: String(values.transactions),
      };
    });

  return { success: true, data: { columns, data } };
}

async function exportReports(
  filters?: ExportFilters,
): Promise<ActionResult<ExportData>> {
  const columns: ExportColumn[] = [
    { key: "rapporteur", label: "Rapporteur" },
    { key: "type", label: "Type" },
    { key: "priorite", label: "Priorite" },
    { key: "statut", label: "Statut" },
    { key: "motif", label: "Motif" },
    { key: "dateCreation", label: "Date de creation" },
    { key: "dateResolution", label: "Date de resolution" },
  ];

  const dateRange = parseDateRange(filters);

  const reports = await prisma.report.findMany({
    where: {
      isDeleted: false,
      createdAt: dateRange,
    },
    orderBy: { createdAt: "desc" },
    select: {
      type: true,
      reason: true,
      priority: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      reporter: { select: { name: true } },
    },
  });

  const typeLabels: Record<string, string> = {
    USER: "Utilisateur",
    SERVICE: "Service",
    REVIEW: "Avis",
    MESSAGE: "Message",
  };

  const priorityLabels: Record<string, string> = {
    CRITICAL: "Critique",
    IMPORTANT: "Important",
    MINOR: "Mineur",
  };

  const statusLabels: Record<string, string> = {
    OPEN: "Ouvert",
    INVESTIGATING: "En cours",
    RESOLVED: "Resolu",
    DISMISSED: "Rejete",
  };

  const data = reports.map((r) => ({
    rapporteur: r.reporter.name ?? "",
    type: typeLabels[r.type] ?? r.type,
    priorite: priorityLabels[r.priority] ?? r.priority,
    statut: statusLabels[r.status] ?? r.status,
    motif: r.reason,
    dateCreation: formatDate(r.createdAt),
    dateResolution: formatDate(r.resolvedAt),
  }));

  return { success: true, data: { columns, data } };
}

async function exportAnalytics(
  filters?: ExportFilters,
): Promise<ActionResult<ExportData>> {
  const columns: ExportColumn[] = [
    { key: "reference", label: "Reference" },
    { key: "client", label: "Client" },
    { key: "prestataire", label: "Prestataire" },
    { key: "montant", label: "Montant" },
    { key: "commission", label: `Commission (${COMMISSION_RATE * 100}%)` },
    { key: "statut", label: "Statut" },
    { key: "date", label: "Date" },
    { key: "mois", label: "Mois (resume)" },
    { key: "revenuMensuel", label: "Revenu brut mensuel (TND)" },
    { key: "commissionMensuelle", label: `Commission ${COMMISSION_RATE * 100}% mensuelle (TND)` },
    { key: "netMensuel", label: "Net prestataires mensuel (TND)" },
    { key: "transactionsMensuelles", label: "Transactions mensuelles" },
  ];

  const dateRange = parseDateRange(filters);

  const payments = await prisma.payment.findMany({
    where: {
      isDeleted: false,
      createdAt: dateRange,
    },
    orderBy: { createdAt: "desc" },
    select: {
      amount: true,
      status: true,
      createdAt: true,
      booking: {
        select: {
          id: true,
          client: { select: { name: true } },
          service: {
            select: {
              provider: { select: { displayName: true } },
            },
          },
        },
      },
    },
  });

  const statusLabels: Record<string, string> = {
    PENDING: "En attente",
    HELD: "Retenu",
    RELEASED: "Libere",
    REFUNDED: "Rembourse",
    FAILED: "Echoue",
  };

  // Transaction rows
  const transactionRows = payments.map((p) => ({
    reference: p.booking.id.slice(0, 8).toUpperCase(),
    client: p.booking.client.name ?? "",
    prestataire: p.booking.service.provider.displayName,
    montant: formatAmount(p.amount),
    commission: formatAmount(p.amount * COMMISSION_RATE),
    statut: statusLabels[p.status] ?? p.status,
    date: formatDate(p.createdAt),
    mois: "",
    revenuMensuel: "",
    commissionMensuelle: "",
    netMensuel: "",
    transactionsMensuelles: "",
  }));

  // Monthly revenue summary rows
  const monthMap = new Map<string, { revenu: number; transactions: number }>();
  const cursor = new Date(dateRange.gte);
  cursor.setDate(1);
  while (cursor <= dateRange.lte) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { revenu: 0, transactions: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const p of payments.filter((pay) => ["RELEASED", "HELD"].includes(pay.status))) {
    const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const current = monthMap.get(key);
    if (current) {
      current.revenu += p.amount;
      current.transactions += 1;
    }
  }

  const monthFormatter = new Intl.DateTimeFormat("fr-TN", {
    month: "long",
    year: "numeric",
  });

  const revenueRows = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, values]) => {
      const [year, month] = monthKey.split("-").map(Number);
      const date = new Date(year ?? 2024, (month ?? 1) - 1, 1);
      const comm = values.revenu * COMMISSION_RATE;
      return {
        reference: "",
        client: "",
        prestataire: "",
        montant: "",
        commission: "",
        statut: "",
        date: "",
        mois: monthFormatter.format(date),
        revenuMensuel: values.revenu.toFixed(2),
        commissionMensuelle: comm.toFixed(2),
        netMensuel: (values.revenu - comm).toFixed(2),
        transactionsMensuelles: String(values.transactions),
      };
    });

  const data = [...transactionRows, ...revenueRows];

  return { success: true, data: { columns, data } };
}
