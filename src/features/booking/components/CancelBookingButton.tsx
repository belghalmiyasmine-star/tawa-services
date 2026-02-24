"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CancelBookingDialog } from "./CancelBookingDialog";

// ============================================================
// TYPES
// ============================================================

export interface CancelBookingButtonProps {
  bookingId: string;
  /** null for quote-based bookings with no scheduled date yet */
  scheduledAt: Date | null;
  totalAmount: number;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * CancelBookingButton — Client component that owns the cancel dialog state.
 *
 * Used in server components (booking detail pages) that need a cancel action button.
 * After successful cancellation, refreshes the page to reflect the new booking status.
 */
export function CancelBookingButton({
  bookingId,
  scheduledAt,
  totalAmount,
}: CancelBookingButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleCancelled() {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Annuler la reservation
      </Button>

      {open && (
        <CancelBookingDialog
          bookingId={bookingId}
          scheduledAt={scheduledAt}
          totalAmount={totalAmount}
          onCancelled={handleCancelled}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
