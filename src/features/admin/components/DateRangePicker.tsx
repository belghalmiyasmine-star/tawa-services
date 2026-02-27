"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================
// TYPES
// ============================================================

type Preset = "7d" | "30d" | "90d" | "12m" | "custom";

interface DateRangePickerProps {
  onRangeChange: (startDate: string, endDate: string) => void;
  initialPreset?: Preset;
}

// ============================================================
// HELPERS
// ============================================================

function getPresetDates(preset: Preset): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().split("T")[0] ?? "";

  const start = new Date(now);
  switch (preset) {
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "12m":
      start.setMonth(start.getMonth() - 12);
      break;
    default:
      start.setMonth(start.getMonth() - 6);
  }

  const startDate = start.toISOString().split("T")[0] ?? "";
  return { startDate, endDate };
}

// ============================================================
// COMPONENT
// ============================================================

export function DateRangePicker({
  onRangeChange,
  initialPreset = "30d",
}: DateRangePickerProps) {
  const t = useTranslations("admin.analytics");

  const [activePreset, setActivePreset] = useState<Preset>(initialPreset);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const presets: { key: Preset; label: string }[] = [
    { key: "7d", label: t("last7Days") },
    { key: "30d", label: t("last30Days") },
    { key: "90d", label: t("last90Days") },
    { key: "12m", label: t("last12Months") },
  ];

  function handlePresetClick(preset: Preset) {
    setActivePreset(preset);
    const { startDate, endDate } = getPresetDates(preset);
    onRangeChange(startDate, endDate);
  }

  function handleCustomChange(newStart: string, newEnd: string) {
    if (newStart && newEnd && newStart <= newEnd) {
      setActivePreset("custom");
      onRangeChange(newStart, newEnd);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((preset) => (
        <Button
          key={preset.key}
          variant={activePreset === preset.key ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(preset.key)}
          className="text-xs"
        >
          {preset.label}
        </Button>
      ))}

      <div className="flex items-center gap-1">
        <input
          type="date"
          value={customStart}
          onChange={(e) => {
            const val = e.target.value;
            setCustomStart(val);
            handleCustomChange(val, customEnd);
          }}
          className={cn(
            "rounded-md border border-input bg-background px-2 py-1 text-xs",
            "text-foreground focus:outline-none focus:ring-1 focus:ring-ring",
            activePreset === "custom" && customStart ? "border-primary" : "",
          )}
        />
        <span className="text-xs text-muted-foreground">—</span>
        <input
          type="date"
          value={customEnd}
          onChange={(e) => {
            const val = e.target.value;
            setCustomEnd(val);
            handleCustomChange(customStart, val);
          }}
          className={cn(
            "rounded-md border border-input bg-background px-2 py-1 text-xs",
            "text-foreground focus:outline-none focus:ring-1 focus:ring-ring",
            activePreset === "custom" && customEnd ? "border-primary" : "",
          )}
        />
      </div>
    </div>
  );
}
