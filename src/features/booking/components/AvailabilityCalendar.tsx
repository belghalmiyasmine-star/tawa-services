"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================================
// TYPES
// ============================================================

interface WeeklySlot {
  dayOfWeek: number; // 0=Sunday..6=Saturday
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  isActive: boolean;
}

interface AvailabilityData {
  weeklySchedule: WeeklySlot[];
  blockedDates: string[]; // "YYYY-MM-DD"
  existingBookings: { date: string; time: string }[];
}

interface AvailabilityCalendarProps {
  providerId: string;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

// ============================================================
// HELPERS
// ============================================================

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toMonthString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Returns the number of days in the given month */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns the day-of-week of the 1st of the month (0=Sun..6=Sat) */
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// Day headers — week starts on Monday for FR locale
const DAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// ============================================================
// COMPONENT
// ============================================================

/**
 * AvailabilityCalendar — Month calendar grid that fetches provider availability
 * and visually disables unavailable dates (inactive days, blocked dates, past dates).
 */
export function AvailabilityCalendar({
  providerId,
  onDateSelect,
  selectedDate,
}: AvailabilityCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch availability data when month changes
  const fetchAvailability = useCallback(
    async (month: Date) => {
      setLoading(true);
      setError(null);
      try {
        const monthStr = toMonthString(month);
        const res = await fetch(
          `/api/provider/availability?providerId=${encodeURIComponent(providerId)}&month=${monthStr}`,
        );
        if (!res.ok) {
          throw new Error("Impossible de charger les disponibilites");
        }
        const data = (await res.json()) as AvailabilityData;
        setAvailability(data);
      } catch {
        setError("Erreur lors du chargement des disponibilites");
      } finally {
        setLoading(false);
      }
    },
    [providerId],
  );

  useEffect(() => {
    void fetchAvailability(currentMonth);
  }, [currentMonth, fetchAvailability]);

  // Navigation
  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  // Don't allow navigating to past months
  const isPrevMonthDisabled = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const todayMonth = new Date(today);
    todayMonth.setDate(1);
    return prevMonth < todayMonth;
  };

  // Check if a date is available (clickable)
  const isDateAvailable = (date: Date): boolean => {
    if (!availability) return false;

    // Past dates are disabled
    if (date < today) return false;

    // Convert date to YYYY-MM-DD for comparison
    const dateStr = toDateString(date);

    // Check if in blocked dates
    if (availability.blockedDates.includes(dateStr)) return false;

    // Check if provider has active availability for this day of week
    const dayOfWeek = date.getDay(); // 0=Sunday..6=Saturday
    const slot = availability.weeklySchedule.find((s) => s.dayOfWeek === dayOfWeek);
    if (!slot || !slot.isActive) return false;

    return true;
  };

  const isSelectedDate = (date: Date): boolean => {
    if (!selectedDate) return false;
    return toDateString(date) === toDateString(selectedDate);
  };

  const isToday = (date: Date): boolean => {
    return toDateString(date) === toDateString(today);
  };

  // Build calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month); // 0=Sunday

  // Convert Sunday-first to Monday-first (shift: Sun becomes 6, Mon becomes 0...)
  const startOffset = (firstDayOfMonth + 6) % 7;

  // Build all day cells (including leading/trailing empty cells)
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push(null);
    } else {
      cells.push(new Date(year, month, dayNum));
    }
  }

  // Month label in French
  const monthLabel = currentMonth.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full">
      {/* Month navigation header */}
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={goToPrevMonth}
          disabled={isPrevMonthDisabled()}
          aria-label="Mois precedent"
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm font-semibold capitalize text-gray-900 dark:text-gray-100">
          {monthLabel}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          aria-label="Mois suivant"
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex h-40 items-center justify-center">
          <span className="text-sm text-gray-400">Chargement...</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex h-40 items-center justify-center">
          <span className="text-sm text-red-500">{error}</span>
        </div>
      )}

      {/* Calendar grid */}
      {!loading && !error && (
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }

            const available = isDateAvailable(date);
            const selected = isSelectedDate(date);
            const todayDate = isToday(date);

            return (
              <button
                key={toDateString(date)}
                type="button"
                disabled={!available}
                onClick={() => available && onDateSelect(date)}
                className={cn(
                  "aspect-square rounded-full text-sm transition-colors",
                  "flex items-center justify-center",
                  // Available + not selected
                  available && !selected && "text-gray-900 hover:bg-primary/10 dark:text-gray-100",
                  // Available + selected
                  selected && "bg-primary text-primary-foreground font-semibold",
                  // Today indicator (available)
                  todayDate && !selected && "ring-1 ring-primary",
                  // Disabled
                  !available && "cursor-not-allowed text-gray-300 dark:text-gray-600",
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {!loading && !error && (
        <div className="mt-3 flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-primary" />
            Disponible
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-700" />
            Indisponible
          </span>
        </div>
      )}
    </div>
  );
}
