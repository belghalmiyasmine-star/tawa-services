"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { MoreHorizontal, Eye, CheckCircle, XCircle, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import { approveServiceAction, suspendServiceAction, toggleFeaturedAction, unsuspendServiceAction } from "../actions/admin-actions";

interface ServiceActionsDropdownProps {
  service: {
    id: string;
    title: string;
    status: string;
    isFeatured: boolean;
  };
}

export function ServiceActionsDropdown({ service }: ServiceActionsDropdownProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin.services");
  const { toast } = useToast();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      const result = await approveServiceAction({ serviceId: service.id });
      if (result.success) {
        toast({ title: t("approved_success") });
        router.refresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspend() {
    setLoading(true);
    try {
      const result = await suspendServiceAction({
        serviceId: service.id,
        reason: suspendReason || undefined,
      });
      if (result.success) {
        toast({ title: t("suspended_success") });
        setSuspendOpen(false);
        setSuspendReason("");
        router.refresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsuspend() {
    setLoading(true);
    try {
      const result = await unsuspendServiceAction({ serviceId: service.id });
      if (result.success) {
        toast({ title: t("unsuspended_success") });
        router.refresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFeatured() {
    setLoading(true);
    try {
      const result = await toggleFeaturedAction(service.id);
      if (result.success) {
        toast({
          title: result.data.isFeatured
            ? "Service mis en avant"
            : "Service retiré de la mise en avant",
        });
        router.refresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a
              href={`/${locale}/services/${service.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {t("viewService")}
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {service.status === "PENDING_APPROVAL" && (
            <DropdownMenuItem
              onClick={handleApprove}
              className="flex cursor-pointer items-center gap-2 text-green-600 focus:text-green-600"
            >
              <CheckCircle className="h-4 w-4" />
              {t("approve")}
            </DropdownMenuItem>
          )}

          {service.status === "ACTIVE" && (
            <DropdownMenuItem
              onClick={() => setSuspendOpen(true)}
              className="flex cursor-pointer items-center gap-2 text-amber-600 focus:text-amber-600"
            >
              <XCircle className="h-4 w-4" />
              {t("suspend")}
            </DropdownMenuItem>
          )}

          {service.status === "SUSPENDED" && (
            <DropdownMenuItem
              onClick={handleUnsuspend}
              className="flex cursor-pointer items-center gap-2 text-green-600 focus:text-green-600"
            >
              <CheckCircle className="h-4 w-4" />
              {t("unsuspend")}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleToggleFeatured}
            className="flex cursor-pointer items-center gap-2"
          >
            <Star
              className={`h-4 w-4 ${service.isFeatured ? "fill-yellow-400 text-yellow-400" : ""}`}
            />
            {service.isFeatured ? "Retirer de la mise en avant" : "Mettre en avant"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Suspend AlertDialog */}
      <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmSuspend")}</AlertDialogTitle>
            <AlertDialogDescription>
              {service.title}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="suspend-reason" className="text-sm font-medium">
              {t("suspendReason")}
            </Label>
            <Textarea
              id="suspend-reason"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Motif de suspension (optionnel)"
              className="mt-1.5"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {t("suspend")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
