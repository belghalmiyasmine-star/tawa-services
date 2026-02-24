"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";
import type { BookingStatus, QuoteStatus } from "@prisma/client";

// ============================================================
// TYPES
// ============================================================

export interface BookingListItem {
  id: string;
  status: BookingStatus;
  scheduledAt: Date | null;
  completedAt: Date | null;
  totalAmount: number;
  createdAt: Date;
  service: {
    title: string;
    photoUrl: string | null;
    pricingType: string;
    fixedPrice: number | null;
  };
  provider: {
    displayName: string;
    photoUrl: string | null;
  } | null;
  client: {
    firstName: string | null;
    lastName: string | null;
  } | null;
  payment: {
    method: string;
    status: string;
  } | null;
}

export interface BookingDetail {
  id: string;
  status: BookingStatus;
  scheduledAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  totalAmount: number;
  clientNote: string | null;
  providerNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  service: {
    id: string;
    title: string;
    description: string;
    pricingType: string;
    fixedPrice: number | null;
    durationMinutes: number | null;
    photoUrls: string[];
  };
  provider: {
    id: string;
    displayName: string;
    photoUrl: string | null;
    phone: string | null;
    rating: number;
  };
  client: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  payment: {
    id: string;
    method: string;
    status: string;
    amount: number;
    refundAmount: number | null;
  } | null;
  quote: {
    id: string;
    description: string;
    proposedPrice: number | null;
    proposedDelay: string | null;
    status: QuoteStatus;
  } | null;
}

export interface QuoteListItem {
  id: string;
  status: QuoteStatus;
  description: string;
  address: string | null;
  city: string | null;
  preferredDate: Date | null;
  budget: number | null;
  proposedPrice: number | null;
  proposedDelay: string | null;
  expiresAt: Date;
  respondedAt?: Date | null;
  createdAt: Date;
  service: {
    title: string;
  };
  clientId: string;
  bookingId?: string | null;
}

export interface PaginatedBookings {
  bookings: BookingListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedQuotes {
  quotes: QuoteListItem[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================
// QUERY 1: getClientBookingsAction
// ============================================================

/**
 * Get paginated bookings for the authenticated client.
 *
 * - Optional status filter (array of BookingStatus)
 * - Includes service thumbnail and provider display info
 * - Orders by createdAt desc
 */
export async function getClientBookingsAction(filters?: {
  status?: BookingStatus[];
  page?: number;
  limit?: number;
}): Promise<ActionResult<PaginatedBookings>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "CLIENT") {
      return { success: false, error: "Acces reserve aux clients" };
    }

    const userId = session.user.id;
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      clientId: userId,
      isDeleted: false,
      ...(filters?.status?.length ? { status: { in: filters.status } } : {}),
    };

    const [total, rawBookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          service: {
            select: {
              title: true,
              photoUrls: true,
              pricingType: true,
              fixedPrice: true,
            },
          },
          provider: {
            select: {
              displayName: true,
              photoUrl: true,
            },
          },
          payment: {
            select: {
              method: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const bookings: BookingListItem[] = rawBookings.map((b) => ({
      id: b.id,
      status: b.status,
      scheduledAt: b.scheduledAt,
      completedAt: b.completedAt,
      totalAmount: b.totalAmount,
      createdAt: b.createdAt,
      service: {
        title: b.service.title,
        photoUrl: b.service.photoUrls[0] ?? null,
        pricingType: b.service.pricingType,
        fixedPrice: b.service.fixedPrice,
      },
      provider: b.provider
        ? {
            displayName: b.provider.displayName,
            photoUrl: b.provider.photoUrl,
          }
        : null,
      client: null,
      payment: b.payment
        ? {
            method: b.payment.method,
            status: b.payment.status,
          }
        : null,
    }));

    return {
      success: true,
      data: { bookings, total, page, limit },
    };
  } catch (error) {
    console.error("[getClientBookingsAction] Error:", error);
    return {
      success: false,
      error: "Erreur lors de la recuperation des reservations",
    };
  }
}

// ============================================================
// QUERY 2: getProviderBookingsAction
// ============================================================

/**
 * Get paginated bookings for the authenticated provider.
 *
 * - Optional status filter
 * - Includes service title and client name
 * - Orders by createdAt desc
 */
export async function getProviderBookingsAction(filters?: {
  status?: BookingStatus[];
  page?: number;
  limit?: number;
}): Promise<ActionResult<PaginatedBookings>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Acces reserve aux prestataires" };
    }

    const userId = session.user.id;

    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      providerId: provider.id,
      isDeleted: false,
      ...(filters?.status?.length ? { status: { in: filters.status } } : {}),
    };

    const [total, rawBookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          service: {
            select: {
              title: true,
              photoUrls: true,
              pricingType: true,
              fixedPrice: true,
            },
          },
          client: {
            select: {
              name: true,
            },
          },
          payment: {
            select: {
              method: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const bookings: BookingListItem[] = rawBookings.map((b) => {
      // Parse firstName/lastName from name field (stored as "firstName lastName")
      const nameParts = b.client.name?.split(" ") ?? [];
      const firstName = nameParts[0] ?? null;
      const lastName = nameParts.slice(1).join(" ") || null;

      return {
        id: b.id,
        status: b.status,
        scheduledAt: b.scheduledAt,
        completedAt: b.completedAt,
        totalAmount: b.totalAmount,
        createdAt: b.createdAt,
        service: {
          title: b.service.title,
          photoUrl: b.service.photoUrls[0] ?? null,
          pricingType: b.service.pricingType,
          fixedPrice: b.service.fixedPrice,
        },
        provider: null,
        client: { firstName, lastName },
        payment: b.payment
          ? { method: b.payment.method, status: b.payment.status }
          : null,
      };
    });

    return {
      success: true,
      data: { bookings, total, page, limit },
    };
  } catch (error) {
    console.error("[getProviderBookingsAction] Error:", error);
    return {
      success: false,
      error: "Erreur lors de la recuperation des reservations",
    };
  }
}

// ============================================================
// QUERY 3: getBookingDetailAction
// ============================================================

/**
 * Get full booking detail for a client or provider.
 *
 * - Validates session (CLIENT or PROVIDER role)
 * - Verifies booking belongs to the user
 * - Returns full relations: service, provider, client, payment, quote
 */
export async function getBookingDetailAction(
  bookingId: string,
): Promise<ActionResult<BookingDetail>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }

    const userId = session.user.id;
    const role = session.user.role;

    if (role !== "CLIENT" && role !== "PROVIDER") {
      return { success: false, error: "Acces non autorise" };
    }

    // Fetch booking with all relations
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, isDeleted: false },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            pricingType: true,
            fixedPrice: true,
            durationMinutes: true,
            photoUrls: true,
          },
        },
        provider: {
          select: {
            id: true,
            displayName: true,
            photoUrl: true,
            phone: true,
            rating: true,
            userId: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payment: {
          select: {
            id: true,
            method: true,
            status: true,
            amount: true,
            refundAmount: true,
          },
        },
        quote: {
          select: {
            id: true,
            description: true,
            proposedPrice: true,
            proposedDelay: true,
            status: true,
          },
        },
      },
    });

    if (!booking) {
      return { success: false, error: "Reservation introuvable" };
    }

    // Verify ownership
    const isClient = role === "CLIENT" && booking.clientId === userId;
    const isProvider =
      role === "PROVIDER" && booking.provider.userId === userId;

    if (!isClient && !isProvider) {
      return { success: false, error: "Acces refuse" };
    }

    // Parse name into firstName/lastName
    const nameParts = booking.client.name?.split(" ") ?? [];
    const firstName = nameParts[0] ?? null;
    const lastName = nameParts.slice(1).join(" ") || null;

    const detail: BookingDetail = {
      id: booking.id,
      status: booking.status,
      scheduledAt: booking.scheduledAt,
      completedAt: booking.completedAt,
      cancelledAt: booking.cancelledAt,
      cancelledBy: booking.cancelledBy,
      cancelReason: booking.cancelReason,
      totalAmount: booking.totalAmount,
      clientNote: booking.clientNote,
      providerNote: booking.providerNote,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      service: {
        id: booking.service.id,
        title: booking.service.title,
        description: booking.service.description,
        pricingType: booking.service.pricingType,
        fixedPrice: booking.service.fixedPrice,
        durationMinutes: booking.service.durationMinutes,
        photoUrls: booking.service.photoUrls,
      },
      provider: {
        id: booking.provider.id,
        displayName: booking.provider.displayName,
        photoUrl: booking.provider.photoUrl,
        phone: booking.provider.phone,
        rating: booking.provider.rating,
      },
      client: {
        id: booking.client.id,
        firstName,
        lastName,
        email: booking.client.email,
      },
      payment: booking.payment
        ? {
            id: booking.payment.id,
            method: booking.payment.method,
            status: booking.payment.status,
            amount: booking.payment.amount,
            refundAmount: booking.payment.refundAmount,
          }
        : null,
      quote: booking.quote
        ? {
            id: booking.quote.id,
            description: booking.quote.description,
            proposedPrice: booking.quote.proposedPrice,
            proposedDelay: booking.quote.proposedDelay,
            status: booking.quote.status,
          }
        : null,
    };

    return { success: true, data: detail };
  } catch (error) {
    console.error("[getBookingDetailAction] Error:", error);
    return {
      success: false,
      error: "Erreur lors de la recuperation de la reservation",
    };
  }
}

// ============================================================
// QUERY 4: getClientQuotesAction
// ============================================================

/**
 * Get paginated quotes for the authenticated client.
 *
 * - Optional status filter
 * - Includes service title and booking id (if accepted)
 * - Orders by createdAt desc
 */
export async function getClientQuotesAction(filters?: {
  status?: QuoteStatus[];
  page?: number;
  limit?: number;
}): Promise<ActionResult<PaginatedQuotes>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "CLIENT") {
      return { success: false, error: "Acces reserve aux clients" };
    }

    const userId = session.user.id;
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where = {
      clientId: userId,
      isDeleted: false,
      ...(filters?.status?.length ? { status: { in: filters.status } } : {}),
    };

    const [total, rawQuotes] = await Promise.all([
      prisma.quote.count({ where }),
      prisma.quote.findMany({
        where,
        include: {
          service: {
            select: {
              title: true,
            },
          },
          booking: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const quotes: QuoteListItem[] = rawQuotes.map((q) => ({
      id: q.id,
      status: q.status,
      description: q.description,
      address: q.address,
      city: q.city,
      preferredDate: q.preferredDate,
      budget: q.budget,
      proposedPrice: q.proposedPrice,
      proposedDelay: q.proposedDelay,
      expiresAt: q.expiresAt,
      respondedAt: q.respondedAt,
      createdAt: q.createdAt,
      service: {
        title: q.service.title,
      },
      clientId: q.clientId,
      bookingId: q.booking?.id ?? null,
    }));

    return {
      success: true,
      data: { quotes, total, page, limit },
    };
  } catch (error) {
    console.error("[getClientQuotesAction] Error:", error);
    return {
      success: false,
      error: "Erreur lors de la recuperation des devis",
    };
  }
}

// ============================================================
// QUERY 5: getProviderQuotesAction
// ============================================================

/**
 * Get paginated quotes for the authenticated provider.
 *
 * - Optional status filter
 * - Includes service title and client ID
 * - Orders by createdAt desc
 */
export async function getProviderQuotesAction(filters?: {
  status?: QuoteStatus[];
  page?: number;
  limit?: number;
}): Promise<ActionResult<PaginatedQuotes>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Acces reserve aux prestataires" };
    }

    const userId = session.user.id;

    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      service: {
        providerId: provider.id,
      },
      isDeleted: false,
      ...(filters?.status?.length ? { status: { in: filters.status } } : {}),
    };

    const [total, rawQuotes] = await Promise.all([
      prisma.quote.count({ where }),
      prisma.quote.findMany({
        where,
        include: {
          service: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const quotes: QuoteListItem[] = rawQuotes.map((q) => ({
      id: q.id,
      status: q.status,
      description: q.description,
      address: q.address,
      city: q.city,
      preferredDate: q.preferredDate,
      budget: q.budget,
      proposedPrice: q.proposedPrice,
      proposedDelay: q.proposedDelay,
      expiresAt: q.expiresAt,
      createdAt: q.createdAt,
      service: {
        title: q.service.title,
      },
      clientId: q.clientId,
    }));

    return {
      success: true,
      data: { quotes, total, page, limit },
    };
  } catch (error) {
    console.error("[getProviderQuotesAction] Error:", error);
    return {
      success: false,
      error: "Erreur lors de la recuperation des devis",
    };
  }
}
