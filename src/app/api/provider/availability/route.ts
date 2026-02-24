import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// ============================================================
// GET /api/provider/availability
// Public endpoint returning provider availability for a month
// ============================================================

/**
 * GET /api/provider/availability?providerId=xxx&month=YYYY-MM
 *
 * Returns:
 * - weeklySchedule: provider's active availability slots per day of week
 * - blockedDates: specific dates blocked by provider in the given month
 * - existingBookings: already-booked slots (PENDING/ACCEPTED) in the given month
 *
 * No authentication required — public calendar data for booking flow.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const providerId = searchParams.get("providerId");
    const month = searchParams.get("month"); // YYYY-MM format

    // Validate required params
    if (!providerId || !month) {
      return NextResponse.json(
        { error: "providerId and month are required" },
        { status: 400 },
      );
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json(
        { error: "month must be in YYYY-MM format" },
        { status: 400 },
      );
    }

    // Parse month to get start/end dates
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr ?? "0", 10);
    const monthNum = parseInt(monthStr ?? "0", 10) - 1; // 0-indexed

    if (isNaN(year) || isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
      return NextResponse.json(
        { error: "Invalid month format" },
        { status: 400 },
      );
    }

    // Start/end of the requested month
    const monthStart = new Date(year, monthNum, 1);
    const monthEnd = new Date(year, monthNum + 1, 1);

    // 1. Fetch provider's weekly availability schedule
    const availabilities = await prisma.availability.findMany({
      where: { providerId },
      select: {
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        isActive: true,
      },
      orderBy: { dayOfWeek: "asc" },
    });

    // 2. Fetch blocked dates for the given month
    const blockedDateRecords = await prisma.blockedDate.findMany({
      where: {
        providerId,
        date: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
      select: { date: true },
    });

    // 3. Fetch existing bookings for provider in that month (PENDING or ACCEPTED)
    const bookings = await prisma.booking.findMany({
      where: {
        providerId,
        isDeleted: false,
        status: { in: ["PENDING", "ACCEPTED"] },
        scheduledAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
      select: { scheduledAt: true },
    });

    // Format blocked dates as YYYY-MM-DD strings
    const blockedDates = blockedDateRecords.map((b) => {
      const d = b.date;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    });

    // Format existing bookings as { date: YYYY-MM-DD, time: HH:MM }
    const existingBookings = bookings
      .filter((b) => b.scheduledAt !== null)
      .map((b) => {
        const dt = b.scheduledAt as Date;
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, "0");
        const day = String(dt.getDate()).padStart(2, "0");
        const h = String(dt.getHours()).padStart(2, "0");
        const min = String(dt.getMinutes()).padStart(2, "0");
        return {
          date: `${y}-${m}-${day}`,
          time: `${h}:${min}`,
        };
      });

    // Map availability to the expected format
    const weeklySchedule = availabilities.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      isActive: a.isActive,
    }));

    return NextResponse.json({
      weeklySchedule,
      blockedDates,
      existingBookings,
    });
  } catch (error) {
    console.error("[GET /api/provider/availability] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
