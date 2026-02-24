"use client";

import { cn } from "@/lib/utils";

// ============================================================
// TYPES
// ============================================================

interface TimeSlotPickerProps {
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  durationMinutes: number;
  existingBookings: string[]; // ["HH:MM", ...] — occupied start times
  onTimeSelect: (time: string) => void;
  selectedTime?: string;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Convert "HH:MM" string to total minutes from midnight
 */
function timeToMinutes(time: string): number {
  const parts = time.split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  return h * 60 + m;
}

/**
 * Convert total minutes from midnight to "HH:MM" string
 */
function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Generate time slots from startTime to endTime at 30-minute intervals.
 * A slot is valid if it starts at least durationMinutes before endTime.
 */
function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
): string[] {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const interval = 30; // 30-minute intervals
  const slots: string[] = [];

  // Slot must end by or before endTime
  let current = startMinutes;
  while (current + durationMinutes <= endMinutes) {
    slots.push(minutesToTime(current));
    current += interval;
  }

  return slots;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * TimeSlotPicker — Renders a grid of time slots based on provider availability.
 * Grays out slots that overlap with existing bookings.
 */
export function TimeSlotPicker({
  startTime,
  endTime,
  durationMinutes,
  existingBookings,
  onTimeSelect,
  selectedTime,
}: TimeSlotPickerProps) {
  const slots = generateTimeSlots(startTime, endTime, durationMinutes);

  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Aucun creneau disponible pour ce jour.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        Choisissez un creneau ({durationMinutes} min)
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => {
          const isBooked = existingBookings.includes(slot);
          const isSelected = selectedTime === slot;

          return (
            <button
              key={slot}
              type="button"
              disabled={isBooked}
              onClick={() => !isBooked && onTimeSelect(slot)}
              className={cn(
                "rounded-md border px-2 py-2 text-sm font-medium transition-colors",
                // Selected slot
                isSelected &&
                  "border-primary bg-primary text-primary-foreground",
                // Available not selected
                !isSelected &&
                  !isBooked &&
                  "border-gray-200 bg-white text-gray-900 hover:border-primary hover:bg-primary/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
                // Booked/disabled
                isBooked &&
                  "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-600",
              )}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}
