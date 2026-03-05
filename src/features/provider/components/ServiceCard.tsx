"use client";

import { useState } from "react";
import { Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { useToast } from "@/hooks/use-toast";
import {
  toggleServiceStatusAction,
  deleteServiceAction,
} from "@/features/provider/actions/manage-services";
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
import { Badge } from "@/components/ui/badge";

// ============================================================
// TYPES
// ============================================================

interface ServiceCardCategory {
  name: string;
  parent?: { name: string } | null;
}

interface ServiceCardData {
  id: string;
  title: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "DELETED";
  pricingType: "FIXED" | "SUR_DEVIS";
  fixedPrice: number | null;
  durationMinutes: number | null;
  photoUrls: string[];
  category: ServiceCardCategory;
}

interface ServiceCardProps {
  service: ServiceCardData;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

// ============================================================
// STATUS BADGE
// ============================================================

type StatusVariant = "default" | "secondary" | "destructive" | "outline";

interface StatusConfig {
  label: string;
  variant: StatusVariant;
  className: string;
}

function getStatusConfig(
  status: ServiceCardData["status"],
  t: ReturnType<typeof useTranslations<"service">>,
): StatusConfig {
  switch (status) {
    case "ACTIVE":
      return {
        label: t("statusActive"),
        variant: "default",
        className: "bg-green-500 text-white hover:bg-green-600",
      };
    case "DRAFT":
      return {
        label: t("statusDraft"),
        variant: "secondary",
        className: "",
      };
    case "PENDING_APPROVAL":
      return {
        label: t("statusPendingApproval"),
        variant: "outline",
        className: "border-orange-400 text-orange-600 bg-orange-50",
      };
    case "SUSPENDED":
      return {
        label: t("statusSuspended"),
        variant: "destructive",
        className: "",
      };
    default:
      return {
        label: status,
        variant: "secondary",
        className: "",
      };
  }
}

// ============================================================
// PRICE DISPLAY
// ============================================================

function formatPrice(
  pricingType: ServiceCardData["pricingType"],
  fixedPrice: number | null,
  t: ReturnType<typeof useTranslations<"service">>,
): string {
  if (pricingType === "SUR_DEVIS") return t("onQuote");
  if (fixedPrice !== null) return `${fixedPrice} TND`;
  return t("onQuote");
}

// ============================================================
// COMPONENT
// ============================================================

export function ServiceCard({ service, onToggle, onDelete }: ServiceCardProps) {
  const t = useTranslations("service");
  const { toast } = useToast();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusConfig = getStatusConfig(service.status, t);
  const firstPhoto = service.photoUrls[0] ?? null;
  const categoryDisplay = service.category.parent
    ? `${service.category.parent.name} › ${service.category.name}`
    : service.category.name;

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const result = await toggleServiceStatusAction(service.id);
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.error,
        });
        return;
      }
      onToggle(service.id);
      toast({
        title:
          result.data.newStatus === "ACTIVE"
            ? "Service active"
            : "Service desactive",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du changement de statut",
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteServiceAction(service.id);
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.error,
        });
        return;
      }
      onDelete(service.id);
      toast({ title: t("serviceDeleted") });
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la suppression",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Photo area */}
      <div className="relative aspect-[4/3] bg-muted">
        {firstPhoto ? (
          <img
            src={firstPhoto}
            alt={service.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-muted-foreground/20" />
              <span className="text-xs">{t("photosUpload")}</span>
            </div>
          </div>
        )}

        {/* Status badge overlay (top-right) */}
        <div className="absolute right-2 top-2">
          <Badge
            variant={statusConfig.variant}
            className={statusConfig.className}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title — truncated 2 lines */}
        <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">
          {service.title}
        </h3>

        {/* Category */}
        <p className="mt-1 text-sm text-muted-foreground">{categoryDisplay}</p>

        {/* Price + Duration row */}
        <div className="mt-2 flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            {formatPrice(service.pricingType, service.fixedPrice, t)}
          </span>
          {service.durationMinutes && (
            <span className="text-xs text-muted-foreground">
              · {service.durationMinutes} min
            </span>
          )}
        </div>

        {/* Action row */}
        <div className="mt-4 flex items-center gap-2">
          {/* Edit */}
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={`/provider/services/${service.id}/edit`}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              {t("editService")}
            </Link>
          </Button>

          {/* Toggle visibility */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void handleToggle()}
            disabled={
              isToggling ||
              service.status === "PENDING_APPROVAL" ||
              service.status === "SUSPENDED"
            }
            title={t("toggleActive")}
            className="px-2.5"
          >
            {service.status === "ACTIVE" ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>

          {/* Delete with confirm dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={isDeleting}
                className="px-2.5 text-muted-foreground hover:text-destructive"
                title={t("deleteService")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteService")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteServiceConfirm")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void handleDelete()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("deleteService")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
