"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/api";
import {
  createBookingSchema,
  rejectBookingSchema,
} from "@/lib/validations/booking";

// ============================================================
// ACTION 1: createBookingAction
// ============================================================

/**
 * Create a direct booking for a fixed-price service.
 *
 * - Validates CLIENT role session
 * - Verifies service exists, is ACTIVE, and is not client's own service
 * - Checks provider availability (day, time slot, blocked dates)
 * - Checks no conflicting booking exists for same service + date
 * - Creates Booking (PENDING) and Payment (PENDING) atomically
 */
export async function createBookingAction(
  data: unknown,
): Promise<ActionResult<{ bookingId: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "CLIENT") {
      return { success: false, error: "Acces reserve aux clients" };
    }

    const userId = session.user.id;

    // Validate input
    const parsed = createBookingSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Donnees invalides";
      return { success: false, error: firstError };
    }

    const {
      serviceId,
      scheduledAt: scheduledAtStr,
      address,
      city,
      clientNote,
      paymentMethod,
    } = parsed.data;

    const scheduledAt = new Date(scheduledAtStr);

    // Fetch service with provider info
    const service = await prisma.service.findFirst({
      where: { id: serviceId, isDeleted: false },
      include: {
        provider: {
          select: { id: true, userId: true, isActive: true },
        },
      },
    });

    if (!service) {
      return { success: false, error: "Service introuvable" };
    }

    if (service.status !== "ACTIVE") {
      return { success: false, error: "Ce service n'est pas disponible" };
    }

    // Prevent client from booking their own service
    if (service.provider.userId === userId) {
      return {
        success: false,
        error: "Vous ne pouvez pas reserver votre propre service",
      };
    }

    // SUR_DEVIS services should go through the quote flow
    if (service.pricingType === "SUR_DEVIS") {
      return {
        success: false,
        error: "Ce service necessite une demande de devis",
      };
    }

    const providerId = service.provider.id;

    // Check provider availability for the requested day/time
    const dayOfWeek = scheduledAt.getDay(); // 0=Sunday..6=Saturday
    const timeStr = `${String(scheduledAt.getHours()).padStart(2, "0")}:${String(scheduledAt.getMinutes()).padStart(2, "0")}`;

    const availability = await prisma.availability.findFirst({
      where: {
        providerId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (
      !availability ||
      timeStr < availability.startTime ||
      timeStr >= availability.endTime
    ) {
      return {
        success: false,
        error: "Le prestataire n'est pas disponible a cette date",
      };
    }

    // Check blocked dates
    const scheduledDate = new Date(
      scheduledAt.getFullYear(),
      scheduledAt.getMonth(),
      scheduledAt.getDate(),
    );

    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        providerId,
        date: scheduledDate,
      },
    });

    if (blockedDate) {
      return {
        success: false,
        error: "Le prestataire n'est pas disponible a cette date",
      };
    }

    // Check for conflicting bookings (same service, same day, PENDING or ACCEPTED)
    const startOfDay = new Date(scheduledDate);
    const endOfDay = new Date(scheduledDate);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        serviceId,
        status: { in: ["PENDING", "ACCEPTED"] },
        scheduledAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
        isDeleted: false,
      },
    });

    if (conflictingBooking) {
      return {
        success: false,
        error: "Ce creneau est deja reserve",
      };
    }

    // Create booking and payment atomically
    const totalAmount = service.fixedPrice ?? 0;

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          clientId: userId,
          providerId,
          serviceId,
          status: "PENDING",
          scheduledAt,
          totalAmount,
          clientNote: clientNote ?? null,
        },
      });

      await tx.payment.create({
        data: {
          bookingId: newBooking.id,
          method: paymentMethod,
          status: "PENDING",
          amount: totalAmount,
        },
      });

      return newBooking;
    });

    return { success: true, data: { bookingId: booking.id } };
  } catch (error) {
    console.error("[createBookingAction] Error:", error);
    return { success: false, error: "Erreur lors de la creation de la reservation" };
  }
}

// ============================================================
// ACTION 2: acceptBookingAction
// ============================================================

/**
 * Provider accepts a pending booking.
 *
 * - Validates PROVIDER role session
 * - Verifies booking belongs to provider (via service.provider.userId)
 * - Verifies status is PENDING
 * - Transitions status to ACCEPTED
 */
export async function acceptBookingAction(
  bookingId: string,
): Promise<ActionResult<{ success: true }>> {
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

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        providerId: provider.id,
        isDeleted: false,
      },
    });

    if (!booking) {
      return { success: false, error: "Reservation introuvable ou acces refuse" };
    }

    if (booking.status !== "PENDING") {
      return {
        success: false,
        error: "Seules les reservations en attente peuvent etre acceptees",
      };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "ACCEPTED" },
    });

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("[acceptBookingAction] Error:", error);
    return { success: false, error: "Erreur lors de l'acceptation" };
  }
}

// ============================================================
// ACTION 3: rejectBookingAction
// ============================================================

/**
 * Provider rejects a pending booking with optional reason.
 *
 * - Validates PROVIDER role session
 * - Verifies booking belongs to provider
 * - Verifies status is PENDING
 * - Transitions status to REJECTED, stores reason in providerNote
 */
export async function rejectBookingAction(
  data: unknown,
): Promise<ActionResult<{ success: true }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Non authentifie" };
    }
    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Acces reserve aux prestataires" };
    }

    const userId = session.user.id;

    const parsed = rejectBookingSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Donnees invalides";
      return { success: false, error: firstError };
    }

    const { bookingId, reason } = parsed.data;

    const provider = await prisma.provider.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!provider) {
      return { success: false, error: "Profil prestataire introuvable" };
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        providerId: provider.id,
        isDeleted: false,
      },
    });

    if (!booking) {
      return { success: false, error: "Reservation introuvable ou acces refuse" };
    }

    if (booking.status !== "PENDING") {
      return {
        success: false,
        error: "Seules les reservations en attente peuvent etre rejetees",
      };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "REJECTED",
        providerNote: reason ?? null,
      },
    });

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("[rejectBookingAction] Error:", error);
    return { success: false, error: "Erreur lors du rejet" };
  }
}

// ============================================================
// ACTION 4: startBookingAction
// ============================================================

/**
 * Provider starts an accepted booking (marks IN_PROGRESS).
 *
 * - Validates PROVIDER role session
 * - Verifies booking belongs to provider
 * - Verifies status is ACCEPTED
 * - Transitions status to IN_PROGRESS
 */
export async function startBookingAction(
  bookingId: string,
): Promise<ActionResult<{ success: true }>> {
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

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        providerId: provider.id,
        isDeleted: false,
      },
    });

    if (!booking) {
      return { success: false, error: "Reservation introuvable ou acces refuse" };
    }

    if (booking.status !== "ACCEPTED") {
      return {
        success: false,
        error: "Seules les reservations acceptees peuvent etre demarrees",
      };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "IN_PROGRESS" },
    });

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("[startBookingAction] Error:", error);
    return { success: false, error: "Erreur lors du demarrage" };
  }
}

// ============================================================
// ACTION 5: completeBookingAction
// ============================================================

/**
 * Provider completes a booking that was in progress.
 *
 * - Validates PROVIDER role session
 * - Verifies booking belongs to provider
 * - Verifies status is IN_PROGRESS
 * - Transitions status to COMPLETED, sets completedAt
 * - Updates Payment status to HELD with heldAt timestamp
 * - Increments provider.completedMissions counter
 */
export async function completeBookingAction(
  bookingId: string,
): Promise<ActionResult<{ success: true }>> {
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

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        providerId: provider.id,
        isDeleted: false,
      },
      include: { payment: true },
    });

    if (!booking) {
      return { success: false, error: "Reservation introuvable ou acces refuse" };
    }

    if (booking.status !== "IN_PROGRESS") {
      return {
        success: false,
        error: "Seules les reservations en cours peuvent etre terminees",
      };
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // Complete the booking
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "COMPLETED",
          completedAt: now,
        },
      });

      // Move payment to HELD (escrow)
      if (booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: "HELD",
            heldAt: now,
          },
        });
      }

      // Increment provider completed missions counter
      await tx.provider.update({
        where: { id: provider.id },
        data: {
          completedMissions: { increment: 1 },
        },
      });
    });

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("[completeBookingAction] Error:", error);
    return { success: false, error: "Erreur lors de la completion" };
  }
}
