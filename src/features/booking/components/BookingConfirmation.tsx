"use client";

import { Calendar, Clock, MapPin, User, DollarSign, Timer } from "lucide-react";
import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// ============================================================
// TYPES
// ============================================================

interface BookingConfirmationProps {
  service: {
    title: string;
    fixedPrice: number | null;
    durationMinutes: number | null;
  };
  provider: {
    displayName: string;
    photoUrl: string | null;
  };
  selectedDate: Date;
  selectedTime: string;
  address: string;
  city: string;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Format date as "Mardi 10 Mars 2026"
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format duration in minutes to human-readable string
 */
function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${m}min`;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * BookingConfirmation — Summary card shown in BookingWizard Step 3.
 * Displays service title, provider info, date/time, address, price, and duration.
 */
export function BookingConfirmation({
  service,
  provider,
  selectedDate,
  selectedTime,
  address,
  city,
}: BookingConfirmationProps) {
  const formattedDate = formatDate(selectedDate);
  const duration = formatDuration(service.durationMinutes);
  const price = service.fixedPrice !== null ? `${service.fixedPrice.toLocaleString("fr-TN")} TND` : "Sur devis";

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Service title */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Service
          </p>
          <p className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">
            {service.title}
          </p>
        </div>

        <Separator />

        {/* Provider */}
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
            {provider.photoUrl ? (
              <Image
                src={provider.photoUrl}
                alt={provider.displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Prestataire</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {provider.displayName}
            </p>
          </div>
        </div>

        <Separator />

        {/* Date and time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="capitalize">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Clock className="h-4 w-4 shrink-0 text-gray-400" />
            <span>{selectedTime}</span>
          </div>
        </div>

        <Separator />

        {/* Address */}
        <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <span>
            {address}, {city}
          </span>
        </div>

        <Separator />

        {/* Price and duration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <DollarSign className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">{price}</span>
          </div>
          {duration && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Timer className="h-3.5 w-3.5" />
              <span>{duration}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
