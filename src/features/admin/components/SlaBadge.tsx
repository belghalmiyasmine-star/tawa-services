"use client";

import { useEffect, useState } from "react";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SlaBadgeProps {
  slaDeadline: Date | string | null;
  status: string;
}

function formatTimeRemaining(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const totalDays = Math.floor(ms / (1000 * 60 * 60 * 24));

  if (totalDays >= 1) {
    const remainingHours = totalHours - totalDays * 24;
    return `${totalDays}j ${remainingHours}h`;
  }

  if (totalHours >= 2) {
    return `${totalHours}h`;
  }

  if (totalHours >= 1) {
    const remainingMinutes = totalMinutes - totalHours * 60;
    return `${totalHours}h ${remainingMinutes}m`;
  }

  return `${totalMinutes}m`;
}

export function SlaBadge({ slaDeadline, status }: SlaBadgeProps) {
  const t = useTranslations("admin.reports");
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!slaDeadline) return;
    if (status === "RESOLVED" || status === "DISMISSED") return;

    const deadline = new Date(slaDeadline).getTime();

    const calculate = () => {
      const now = Date.now();
      setRemaining(deadline - now);
    };

    calculate();

    const interval = setInterval(calculate, 1000 * 60);
    return () => clearInterval(interval);
  }, [slaDeadline, status]);

  // Closed reports
  if (status === "RESOLVED" || status === "DISMISSED") {
    return (
      <Badge variant="secondary" className="text-xs">
        Cloture
      </Badge>
    );
  }

  // No SLA deadline set
  if (!slaDeadline || remaining === null) {
    return null;
  }

  // Expired
  if (remaining <= 0) {
    return (
      <Badge
        variant="destructive"
        className="flex items-center gap-1 text-xs"
      >
        <Clock className="h-3 w-3" />
        {t("slaExpired")}
      </Badge>
    );
  }

  // Less than 30 minutes
  if (remaining < 30 * 60 * 1000) {
    const minutes = Math.floor(remaining / (1000 * 60));
    return (
      <Badge
        variant="destructive"
        className={cn(
          "flex items-center gap-1 text-xs",
          "animate-pulse",
        )}
      >
        <Clock className="h-3 w-3" />
        {minutes}m restantes
      </Badge>
    );
  }

  // Less than 2 hours — amber warning
  if (remaining < 2 * 60 * 60 * 1000) {
    return (
      <Badge className="border-amber-500 bg-amber-100 text-amber-700 text-xs dark:bg-amber-900/30 dark:text-amber-400">
        <Clock className="mr-1 h-3 w-3" />
        {formatTimeRemaining(remaining)}
      </Badge>
    );
  }

  // 2+ hours — green
  return (
    <Badge className="border-green-500 bg-green-100 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">
      <Clock className="mr-1 h-3 w-3" />
      {formatTimeRemaining(remaining)}
    </Badge>
  );
}
