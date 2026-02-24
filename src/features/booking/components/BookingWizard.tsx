"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";

import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AvailabilityCalendar } from "@/features/booking/components/AvailabilityCalendar";
import { TimeSlotPicker } from "@/features/booking/components/TimeSlotPicker";
import { BookingConfirmation } from "@/features/booking/components/BookingConfirmation";
import { PaymentMethodSelector } from "@/features/booking/components/PaymentMethodSelector";
import { createBookingAction } from "@/features/booking/actions/manage-bookings";
import type { PaymentMethod } from "@/types";

// ============================================================
// TYPES
// ============================================================

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface ServiceData {
  id: string;
  title: string;
  fixedPrice: number | null;
  durationMinutes: number | null;
  pricingType: "FIXED" | "SUR_DEVIS";
  photoUrls: string[];
  provider: {
    id: string;
    displayName: string;
    photoUrl: string | null;
    availabilities: AvailabilitySlot[];
    blockedDates: Array<{ date: Date | string }>;
  };
}

interface BookingWizardProps {
  service: ServiceData;
}

// ============================================================
// STEP INDICATOR
// ============================================================

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: "Date & Heure" },
    { num: 2, label: "Adresse" },
    { num: 3, label: "Confirmation" },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center">
          {/* Circle */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                currentStep === step.num
                  ? "bg-primary text-primary-foreground"
                  : currentStep > step.num
                  ? "bg-primary/20 text-primary"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600",
              )}
            >
              {step.num}
            </div>
            <span
              className={cn(
                "mt-1 text-xs",
                currentStep === step.num
                  ? "font-medium text-gray-900 dark:text-gray-100"
                  : "text-gray-400 dark:text-gray-600",
              )}
            >
              {step.label}
            </span>
          </div>
          {/* Connector line */}
          {i < steps.length - 1 && (
            <div
              className={cn(
                "mx-2 mb-4 h-0.5 w-12 transition-colors",
                currentStep > step.num ? "bg-primary/40" : "bg-gray-200 dark:bg-gray-700",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// SERVICE SUMMARY CARD
// ============================================================

function ServiceSummaryCard({ service }: { service: ServiceData }) {
  const priceLabel =
    service.fixedPrice !== null
      ? `${service.fixedPrice.toLocaleString("fr-TN")} TND`
      : "Sur devis";

  const durationLabel = service.durationMinutes
    ? service.durationMinutes < 60
      ? `${service.durationMinutes} min`
      : `${Math.floor(service.durationMinutes / 60)}h${service.durationMinutes % 60 > 0 ? `${service.durationMinutes % 60}min` : ""}`
    : null;

  return (
    <div className="mb-4 rounded-lg bg-muted/50 p-3">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{service.title}</p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        {service.provider.displayName}
        {durationLabel ? ` · ${durationLabel}` : ""}
        {" · "}
        <span className="font-medium text-gray-700 dark:text-gray-300">{priceLabel}</span>
      </p>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * BookingWizard — 3-step wizard for direct booking of fixed-price services.
 *
 * Step 1: Date & time selection (AvailabilityCalendar + TimeSlotPicker)
 * Step 2: Address & details (address, city, clientNote)
 * Step 3: Confirmation + payment method (BookingConfirmation + PaymentMethodSelector)
 */
export function BookingWizard({ service }: BookingWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: date & time
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);

  // Step 2: address
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [clientNote, setClientNote] = useState("");
  const [addressErrors, setAddressErrors] = useState<{ address?: string; city?: string }>({});

  // Step 3: payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);

  // Get availability slot for the selected day
  function getSlotForDate(date: Date): AvailabilitySlot | undefined {
    const dayOfWeek = date.getDay();
    return service.provider.availabilities.find(
      (s) => s.dayOfWeek === dayOfWeek && s.isActive,
    );
  }

  // Get existing bookings for selected date as HH:MM strings
  function getBookingsForDate(date: Date): string[] {
    const dateStr = toDateString(date);
    // This is provided by the API in the calendar component; here we use empty array
    // (conflicts are also checked server-side in createBookingAction)
    return [];
  }

  function toDateString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // Handle date selection (resets time when date changes)
  function handleDateSelect(date: Date) {
    setSelectedDate(date);
    setSelectedTime(undefined);
  }

  // Validate Step 2 address form
  function validateAddress(): boolean {
    const errors: { address?: string; city?: string } = {};
    if (!address.trim() || address.trim().length < 5) {
      errors.address = "L'adresse doit contenir au moins 5 caracteres";
    }
    if (!city.trim() || city.trim().length < 2) {
      errors.city = "La ville doit contenir au moins 2 caracteres";
    }
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Build scheduledAt ISO string from selected date + time
  function buildScheduledAt(): string {
    if (!selectedDate || !selectedTime) return "";
    const [h, m] = selectedTime.split(":").map(Number);
    const dt = new Date(selectedDate);
    dt.setHours(h ?? 0, m ?? 0, 0, 0);
    return dt.toISOString();
  }

  // Handle final confirmation
  function handleConfirm() {
    if (!selectedDate || !selectedTime || !paymentMethod) return;

    startTransition(async () => {
      const result = await createBookingAction({
        serviceId: service.id,
        scheduledAt: buildScheduledAt(),
        address: address.trim(),
        city: city.trim(),
        clientNote: clientNote.trim() || undefined,
        paymentMethod,
      });

      if (result.success) {
        toast({
          title: "Reservation creee",
          description: "Votre reservation a ete soumise avec succes.",
        });
        router.push(`/bookings/${result.data.bookingId}/checkout` as never);
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  // Determine slot for selected date (for TimeSlotPicker)
  const selectedSlot = selectedDate ? getSlotForDate(selectedDate) : undefined;
  const existingBookingsForDate = selectedDate ? getBookingsForDate(selectedDate) : [];

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <StepIndicator currentStep={step} />

      {/* ============================= STEP 1 ============================= */}
      {step === 1 && (
        <div className="space-y-4">
          <ServiceSummaryCard service={service} />

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Choisissez une date
          </h2>

          <AvailabilityCalendar
            providerId={service.provider.id}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
          />

          {/* Time slot picker shown after date is selected */}
          {selectedDate && selectedSlot && (
            <div className="mt-4">
              <h3 className="mb-2 text-base font-medium text-gray-900 dark:text-gray-100">
                Choisissez un creneau
              </h3>
              <TimeSlotPicker
                startTime={selectedSlot.startTime}
                endTime={selectedSlot.endTime}
                durationMinutes={service.durationMinutes ?? 60}
                existingBookings={existingBookingsForDate}
                onTimeSelect={setSelectedTime}
                selectedTime={selectedTime}
              />
            </div>
          )}

          {selectedDate && !selectedSlot && (
            <p className="text-sm text-amber-600">
              Le prestataire n&apos;est pas disponible ce jour.
            </p>
          )}

          <div className="mt-6">
            <Button
              className="w-full"
              disabled={!selectedDate || !selectedTime}
              onClick={() => setStep(2)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* ============================= STEP 2 ============================= */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Adresse d&apos;intervention
          </h2>

          <div className="space-y-1">
            <Label htmlFor="address">
              Adresse <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              placeholder="Ex: 12 Rue de la Republique, Appt 3"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (addressErrors.address) setAddressErrors((prev) => ({ ...prev, address: undefined }));
              }}
              className={cn(addressErrors.address && "border-red-500")}
            />
            {addressErrors.address && (
              <p className="text-xs text-red-500">{addressErrors.address}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="city">
              Ville <span className="text-red-500">*</span>
            </Label>
            <Input
              id="city"
              placeholder="Ex: Tunis, Sfax, Sousse..."
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (addressErrors.city) setAddressErrors((prev) => ({ ...prev, city: undefined }));
              }}
              className={cn(addressErrors.city && "border-red-500")}
            />
            {addressErrors.city && (
              <p className="text-xs text-red-500">{addressErrors.city}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="clientNote">Instructions (optionnel)</Label>
            <Textarea
              id="clientNote"
              placeholder="Instructions particulieres pour le prestataire..."
              value={clientNote}
              onChange={(e) => setClientNote(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <p className="text-right text-xs text-gray-400">{clientNote.length}/1000</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep(1)}
            >
              Retour
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (validateAddress()) {
                  setStep(3);
                }
              }}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* ============================= STEP 3 ============================= */}
      {step === 3 && selectedDate && selectedTime && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Confirmer la reservation
          </h2>

          {/* Demo mode banner */}
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Mode demonstration — aucun paiement reel ne sera effectue</span>
          </div>

          {/* Booking summary */}
          <BookingConfirmation
            service={service}
            provider={service.provider}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            address={address}
            city={city}
          />

          {/* Payment method selector */}
          <PaymentMethodSelector
            onSelect={setPaymentMethod}
            selected={paymentMethod}
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep(2)}
              disabled={isPending}
            >
              Retour
            </Button>
            <Button
              className="flex-1"
              disabled={!paymentMethod || isPending}
              onClick={handleConfirm}
            >
              {isPending ? "En cours..." : "Confirmer la reservation"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
