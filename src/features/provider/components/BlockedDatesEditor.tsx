"use client";

import { useState } from "react";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateBlockedDatesAction } from "@/features/provider/actions/manage-availability";

// ============================================================
// TYPES
// ============================================================

interface BlockedDateEntry {
  date: string; // ISO datetime string
  reason?: string;
}

interface BlockedDatesEditorProps {
  initialDates: BlockedDateEntry[];
}

// ============================================================
// HELPERS
// ============================================================

/** Format ISO datetime to YYYY-MM-DD for the date input value */
function toInputDate(isoDate: string): string {
  return isoDate.slice(0, 10);
}

/** Format ISO datetime for display */
function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("fr-TN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Convert input date (YYYY-MM-DD) to ISO datetime at midnight UTC */
function toIsoDatetime(inputDate: string): string {
  return new Date(`${inputDate}T00:00:00.000Z`).toISOString();
}

/** Get today's date as YYYY-MM-DD for min attribute */
function todayInputDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// COMPONENT
// ============================================================

export function BlockedDatesEditor({ initialDates }: BlockedDatesEditorProps) {
  const t = useTranslations("provider");
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Normalize initial dates
  const [entries, setEntries] = useState<BlockedDateEntry[]>(
    initialDates.sort((a, b) => a.date.localeCompare(b.date)),
  );

  // New date input state
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");

  const addEntry = () => {
    if (!newDate) return;

    const isoDate = toIsoDatetime(newDate);

    // Prevent past dates
    if (new Date(isoDate) < new Date()) {
      toast({
        title: "Date invalide",
        description: "Impossible de bloquer une date dans le passe",
        variant: "destructive",
      });
      return;
    }

    // Prevent duplicates
    if (entries.some((e) => toInputDate(e.date) === newDate)) {
      toast({
        title: "Date deja bloquee",
        description: "Cette date est deja dans la liste",
        variant: "destructive",
      });
      return;
    }

    const entry: BlockedDateEntry = {
      date: isoDate,
      reason: newReason.trim() || undefined,
    };

    // Insert sorted by date
    setEntries((prev) =>
      [...prev, entry].sort((a, b) => a.date.localeCompare(b.date)),
    );
    setNewDate("");
    setNewReason("");
  };

  const removeEntry = (isoDate: string) => {
    setEntries((prev) => prev.filter((e) => e.date !== isoDate));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateBlockedDatesAction({ dates: entries });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({ title: t("blockedDatesSaved") });
    } catch (err) {
      console.error("[BlockedDatesEditor] Error:", err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre a jour les dates",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add new date row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium" htmlFor="new-blocked-date">
            {t("addBlockedDate")}
          </label>
          <input
            id="new-blocked-date"
            type="date"
            value={newDate}
            min={todayInputDate()}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium" htmlFor="new-blocked-reason">
            {t("blockedDateReason")}
          </label>
          <Input
            id="new-blocked-reason"
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            maxLength={200}
            placeholder={t("blockedDateReasonPlaceholder")}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addEntry}
          disabled={!newDate}
          className="shrink-0"
        >
          <Plus className="mr-1 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* List of blocked dates */}
      {entries.length > 0 ? (
        <div className="divide-y rounded-lg border">
          {entries.map((entry) => (
            <div
              key={entry.date}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex-1 space-y-0.5">
                <p className="text-sm font-medium">{formatDisplayDate(entry.date)}</p>
                {entry.reason && (
                  <p className="text-xs text-muted-foreground">{entry.reason}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeEntry(entry.date)}
                className="rounded-md p-1.5 hover:bg-destructive/10 hover:text-destructive"
                aria-label="Supprimer cette date"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucune date bloquee pour le moment.
        </p>
      )}

      {/* Save button */}
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Enregistrement...
          </span>
        ) : (
          t("saveBlockedDates")
        )}
      </Button>
    </div>
  );
}
