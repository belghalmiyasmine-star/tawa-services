"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { acceptBookingAction } from "@/features/booking/actions/manage-bookings";
import { rejectBookingAction } from "@/features/booking/actions/manage-bookings";
import { startBookingAction } from "@/features/booking/actions/manage-bookings";
import { completeBookingAction } from "@/features/booking/actions/manage-bookings";
import { cancelBookingProviderAction } from "@/features/booking/actions/cancel-booking";
import type { BookingStatus } from "@prisma/client";

interface BookingActionsProps {
  bookingId: string;
  status: BookingStatus;
}

export function BookingActions({ bookingId, status }: BookingActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  function handleRefresh() {
    router.refresh();
  }

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptBookingAction(bookingId);
      if (result.success) {
        toast({
          title: "Reservation acceptee",
          description: "La reservation a ete acceptee avec succes",
        });
        handleRefresh();
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectBookingAction({
        bookingId,
        reason: rejectReason.trim() || undefined,
      });
      if (result.success) {
        setRejectOpen(false);
        setRejectReason("");
        toast({
          title: "Reservation rejetee",
          description: "La reservation a ete rejetee",
        });
        handleRefresh();
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  function handleStart() {
    startTransition(async () => {
      const result = await startBookingAction(bookingId);
      if (result.success) {
        toast({
          title: "Service demarre",
          description: "Le service a ete demarre",
        });
        handleRefresh();
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  function handleComplete() {
    startTransition(async () => {
      const result = await completeBookingAction(bookingId);
      if (result.success) {
        toast({
          title: "Service termine",
          description: "Le service a ete marque comme termine",
        });
        handleRefresh();
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelBookingProviderAction(
        bookingId,
        cancelReason.trim() || undefined,
      );
      if (result.success) {
        setCancelOpen(false);
        setCancelReason("");
        toast({
          title: "Reservation annulee",
          description: "La reservation a ete annulee avec remboursement integral",
        });
        handleRefresh();
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  if (status === "PENDING") {
    return (
      <div className="flex flex-wrap gap-3">
        {/* Accept button */}
        <Button
          onClick={handleAccept}
          disabled={isPending}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          {isPending ? "En cours..." : "Accepter"}
        </Button>

        {/* Reject with reason dialog */}
        <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              Rejeter
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rejeter la reservation</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irreversible. Le client sera notifie du rejet.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Label htmlFor="reject-reason" className="text-sm">
                Raison du rejet (optionnel)
              </Label>
              <Textarea
                id="reject-reason"
                placeholder="Expliquez pourquoi vous rejetez cette reservation..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                disabled={isPending}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isPending ? "Rejet en cours..." : "Confirmer le rejet"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (status === "ACCEPTED") {
    return (
      <div className="flex flex-wrap gap-3">
        {/* Start service button */}
        <Button
          onClick={handleStart}
          disabled={isPending}
        >
          {isPending ? "En cours..." : "Demarrer le service"}
        </Button>

        {/* Cancel with reason dialog */}
        <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
              Annuler
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Annuler la reservation</AlertDialogTitle>
              <AlertDialogDescription>
                L&apos;annulation par le prestataire donne lieu a un remboursement integral au client.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Label htmlFor="cancel-reason" className="text-sm">
                Raison de l&apos;annulation (optionnel)
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="Expliquez pourquoi vous annulez cette reservation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Retour</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={isPending}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isPending ? "Annulation..." : "Confirmer l'annulation"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <Button
        onClick={handleComplete}
        disabled={isPending}
        className="bg-green-600 text-white hover:bg-green-700"
      >
        {isPending ? "En cours..." : "Marquer comme termine"}
      </Button>
    );
  }

  // COMPLETED, REJECTED, CANCELLED — read-only
  return null;
}
