"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { updateAvailabilityAction } from "@/features/provider/actions/manage-availability";

// ============================================================
// TYPES
// ============================================================

interface AvailabilitySlot {
  dayOfWeek: number; // 0=Sunday, 1=Monday ... 6=Saturday
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isActive: boolean;
}

interface AvailabilityEditorProps {
  initialSlots: AvailabilitySlot[];
}

// Day translation keys ordered by dayOfWeek index (0=Sunday, 6=Saturday)
const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

// ============================================================
// COMPONENT
// ============================================================

export function AvailabilityEditor({ initialSlots }: AvailabilityEditorProps) {
  const t = useTranslations("provider");
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Ensure we have exactly 7 slots (0-6)
  const [slots, setSlots] = useState<AvailabilitySlot[]>(() => {
    const normalized = Array.from({ length: 7 }, (_, day) => {
      const found = initialSlots.find((s) => s.dayOfWeek === day);
      if (found) return found;
      const isWorkday = day >= 1 && day <= 5;
      return { dayOfWeek: day, startTime: "08:00", endTime: "18:00", isActive: isWorkday };
    });
    return normalized;
  });

  const updateSlot = (day: number, partial: Partial<AvailabilitySlot>) => {
    setSlots((prev) =>
      prev.map((s) => (s.dayOfWeek === day ? { ...s, ...partial } : s)),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateAvailabilityAction({ slots });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({ title: t("availabilitySaved") });
    } catch (err) {
      console.error("[AvailabilityEditor] Error:", err);
      toast({
        title: "Erreur",
        description: t("availabilityError"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 7-day schedule */}
      <div className="divide-y rounded-lg border">
        {slots.map((slot) => {
          const dayKey = DAY_KEYS[slot.dayOfWeek];
          // dayKey will always be defined since dayOfWeek is 0-6
          const dayLabel = t(dayKey!);

          return (
            <div
              key={slot.dayOfWeek}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
            >
              {/* Toggle + day label */}
              <div className="flex items-center gap-3 sm:w-36">
                <Switch
                  checked={slot.isActive}
                  onCheckedChange={(checked) =>
                    updateSlot(slot.dayOfWeek, { isActive: checked })
                  }
                  aria-label={`Activer ${dayLabel}`}
                />
                <span
                  className={`text-sm font-medium ${
                    slot.isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {dayLabel}
                </span>
              </div>

              {/* Time inputs */}
              <div className="flex items-center gap-2 sm:flex-1">
                <div className="flex items-center gap-1">
                  <label
                    htmlFor={`start-${slot.dayOfWeek}`}
                    className="text-xs text-muted-foreground"
                  >
                    {t("startTime")}
                  </label>
                  <input
                    id={`start-${slot.dayOfWeek}`}
                    type="time"
                    value={slot.startTime}
                    onChange={(e) =>
                      updateSlot(slot.dayOfWeek, { startTime: e.target.value })
                    }
                    disabled={!slot.isActive}
                    className="rounded-md border px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <span className="text-muted-foreground">—</span>

                <div className="flex items-center gap-1">
                  <label
                    htmlFor={`end-${slot.dayOfWeek}`}
                    className="text-xs text-muted-foreground"
                  >
                    {t("endTime")}
                  </label>
                  <input
                    id={`end-${slot.dayOfWeek}`}
                    type="time"
                    value={slot.endTime}
                    onChange={(e) =>
                      updateSlot(slot.dayOfWeek, { endTime: e.target.value })
                    }
                    disabled={!slot.isActive}
                    className="rounded-md border px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Enregistrement...
          </span>
        ) : (
          t("saveAvailability")
        )}
      </Button>
    </div>
  );
}
