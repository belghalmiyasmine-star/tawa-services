"use server";

// TODO: Import from @/lib/validations/service once Plan 04-01 is complete
// For now, inline Zod schemas matching the same shape

import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";
import {
  SERVICE_TITLE_MAX_LENGTH,
  SERVICE_DESCRIPTION_MIN_LENGTH,
  SERVICE_DESCRIPTION_MAX_LENGTH,
} from "@/lib/constants";

// ============================================================
// INLINE SCHEMAS (temporary — import from service.ts in Plan 04-01)
// ============================================================

const createServiceSchema = z.object({
  categoryId: z.string().min(1, "La catégorie est requise"),
  title: z
    .string()
    .min(3, "Le titre doit comporter au moins 3 caractères")
    .max(SERVICE_TITLE_MAX_LENGTH, `Le titre ne doit pas dépasser ${SERVICE_TITLE_MAX_LENGTH} caractères`),
  description: z
    .string()
    .min(SERVICE_DESCRIPTION_MIN_LENGTH, `La description doit comporter au moins ${SERVICE_DESCRIPTION_MIN_LENGTH} caractères`)
    .max(SERVICE_DESCRIPTION_MAX_LENGTH, `La description ne doit pas dépasser ${SERVICE_DESCRIPTION_MAX_LENGTH} caractères`),
  pricingType: z.enum(["FIXED", "HOURLY", "SUR_DEVIS"]),
  fixedPrice: z.number().positive("Le tarif doit être positif").optional().nullable(),
  durationMinutes: z.number().int().positive("La durée doit être positive").optional().nullable(),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  conditions: z.string().optional().nullable(),
});

const updateServiceSchema = createServiceSchema.extend({
  id: z.string().min(1, "L'identifiant du service est requis"),
});

export type CreateServiceFormData = z.infer<typeof createServiceSchema>;
export type UpdateServiceFormData = z.infer<typeof updateServiceSchema>;

// ============================================================
// TYPES
// ============================================================

interface ServiceWithCategory {
  id: string;
  providerId: string;
  categoryId: string;
  title: string;
  description: string;
  pricingType: string;
  fixedPrice: number | null;
  durationMinutes: number | null;
  inclusions: string[];
  exclusions: string[];
  conditions: string | null;
  photoUrls: string[];
  status: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: {
    name: string;
    slug: string;
    icon: string | null;
    parentId: string | null;
    parent: { name: string } | null;
  };
}

// ============================================================
// KYC GUARD HELPER
// ============================================================

async function checkKycApproved(userId: string): Promise<string | null> {
  const provider = await prisma.provider.findUnique({
    where: { userId },
    select: { id: true, kycStatus: true },
  });

  if (!provider) {
    return "PROVIDER_NOT_FOUND";
  }

  if (provider.kycStatus !== "APPROVED") {
    return "KYC_NOT_APPROVED";
  }

  return null; // No error — KYC is approved
}

// ============================================================
// ACTION 1: createServiceAction
// ============================================================

export async function createServiceAction(
  formData: CreateServiceFormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Accès réservé aux prestataires" };
    }

    const userId = session.user.id;

    // KYC guard
    const kycError = await checkKycApproved(userId);
    if (kycError) {
      return { success: false, error: kycError };
    }

    // Parse and validate input
    const parsed = createServiceSchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Données invalides";
      return { success: false, error: firstError };
    }

    const data = parsed.data;

    // Fetch provider id
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    // Map HOURLY -> FIXED in DB (hourly rate stored as fixedPrice)
    const dbPricingType = data.pricingType === "SUR_DEVIS" ? "SUR_DEVIS" : "FIXED";

    const service = await prisma.service.create({
      data: {
        providerId: provider.id,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        pricingType: dbPricingType,
        fixedPrice: data.fixedPrice ?? null,
        durationMinutes: data.durationMinutes ?? null,
        inclusions: data.inclusions,
        exclusions: data.exclusions,
        conditions: data.conditions ?? null,
        status: "DRAFT",
      },
    });

    return { success: true, data: { id: service.id } };
  } catch (error) {
    console.error("[createServiceAction] Error:", error);
    return { success: false, error: "Erreur lors de la création du service" };
  }
}

// ============================================================
// ACTION 2: updateServiceAction
// ============================================================

export async function updateServiceAction(
  formData: UpdateServiceFormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Accès réservé aux prestataires" };
    }

    const userId = session.user.id;

    // KYC guard
    const kycError = await checkKycApproved(userId);
    if (kycError) {
      return { success: false, error: kycError };
    }

    // Parse and validate input
    const parsed = updateServiceSchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Données invalides";
      return { success: false, error: firstError };
    }

    const data = parsed.data;

    // Fetch provider id
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    // Verify service belongs to this provider
    const existingService = await prisma.service.findFirst({
      where: { id: data.id, providerId: provider.id, isDeleted: false },
    });
    if (!existingService) {
      return { success: false, error: "Service introuvable ou accès refusé" };
    }

    // Map HOURLY -> FIXED in DB
    const dbPricingType = data.pricingType === "SUR_DEVIS" ? "SUR_DEVIS" : "FIXED";

    await prisma.service.update({
      where: { id: data.id },
      data: {
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        pricingType: dbPricingType,
        fixedPrice: data.fixedPrice ?? null,
        durationMinutes: data.durationMinutes ?? null,
        inclusions: data.inclusions,
        exclusions: data.exclusions,
        conditions: data.conditions ?? null,
      },
    });

    return { success: true, data: { id: data.id } };
  } catch (error) {
    console.error("[updateServiceAction] Error:", error);
    return { success: false, error: "Erreur lors de la mise à jour du service" };
  }
}

// ============================================================
// ACTION 3: toggleServiceStatusAction
// ============================================================

export async function toggleServiceStatusAction(
  serviceId: string,
): Promise<ActionResult<{ id: string; newStatus: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Accès réservé aux prestataires" };
    }

    const userId = session.user.id;

    // Fetch provider id
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    // Verify ownership
    const service = await prisma.service.findFirst({
      where: { id: serviceId, providerId: provider.id, isDeleted: false },
    });
    if (!service) {
      return { success: false, error: "Service introuvable ou accès refusé" };
    }

    // Toggle: ACTIVE -> DRAFT, DRAFT -> ACTIVE (skip PENDING_APPROVAL for MVP)
    const newStatus = service.status === "ACTIVE" ? "DRAFT" : "ACTIVE";

    await prisma.service.update({
      where: { id: serviceId },
      data: { status: newStatus },
    });

    return { success: true, data: { id: serviceId, newStatus } };
  } catch (error) {
    console.error("[toggleServiceStatusAction] Error:", error);
    return { success: false, error: "Erreur lors du changement de statut" };
  }
}

// ============================================================
// ACTION 4: deleteServiceAction (soft delete)
// ============================================================

export async function deleteServiceAction(
  serviceId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Accès réservé aux prestataires" };
    }

    const userId = session.user.id;

    // Fetch provider id
    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    // Verify ownership
    const service = await prisma.service.findFirst({
      where: { id: serviceId, providerId: provider.id, isDeleted: false },
    });
    if (!service) {
      return { success: false, error: "Service introuvable ou accès refusé" };
    }

    // Soft delete
    await prisma.service.update({
      where: { id: serviceId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: "DELETED",
      },
    });

    return { success: true, data: { id: serviceId } };
  } catch (error) {
    console.error("[deleteServiceAction] Error:", error);
    return { success: false, error: "Erreur lors de la suppression du service" };
  }
}

// ============================================================
// ACTION 5: getProviderServicesAction
// ============================================================

export async function getProviderServicesAction(): Promise<
  ActionResult<ServiceWithCategory[]>
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Accès réservé aux prestataires" };
    }

    const userId = session.user.id;

    const services = await prisma.service.findMany({
      where: {
        provider: { userId },
        isDeleted: false,
      },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
            icon: true,
            parentId: true,
            parent: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: services };
  } catch (error) {
    console.error("[getProviderServicesAction] Error:", error);
    return { success: false, error: "Erreur lors de la récupération des services" };
  }
}
