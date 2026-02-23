"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle, ZoomIn, Loader2, AlertCircle } from "lucide-react";

import { approveKycAction, rejectKycAction } from "@/features/kyc/actions/review-kyc";
import type { KycSubmissionDetail } from "@/features/kyc/actions/review-kyc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface KycReviewDetailProps {
  detail: KycSubmissionDetail;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  CIN_RECTO: "CIN Recto",
  CIN_VERSO: "CIN Verso",
  SELFIE: "Selfie avec CIN",
  PROOF_OF_ADDRESS: "Justificatif de domicile",
};

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function DocumentCard({ docType, fileUrl }: { docType: string; fileUrl: string }) {
  const label = DOC_TYPE_LABELS[docType] ?? docType;

  return (
    <Dialog>
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="bg-muted/30 p-2 text-center">
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="relative h-40 w-full">
          <Image
            src={fileUrl}
            alt={label}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <DialogTrigger asChild>
            <button
              className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/30"
              aria-label={`Agrandir ${label}`}
            >
              <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100" />
            </button>
          </DialogTrigger>
        </div>
      </div>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="relative h-[70vh] w-full">
          <Image
            src={fileUrl}
            alt={label}
            fill
            className="object-contain"
            sizes="100vw"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function KycReviewDetail({ detail }: KycReviewDetailProps) {
  const t = useTranslations("kyc");
  const router = useRouter();
  const { toast } = useToast();
  const [isPendingApprove, startApproveTransition] = useTransition();
  const [isPendingReject, startRejectTransition] = useTransition();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectComment, setRejectComment] = useState<string>("");

  // Group documents for face comparison
  const cinRecto = detail.documents.find((d) => d.docType === "CIN_RECTO");
  const selfie = detail.documents.find((d) => d.docType === "SELFIE");

  function handleApprove() {
    startApproveTransition(async () => {
      const result = await approveKycAction(detail.providerId);
      if (result.success) {
        toast({
          title: "Dossier approuve",
          description: "Le prestataire a ete notifie.",
        });
        router.push("/admin/kyc");
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
    if (!rejectReason) {
      toast({
        title: "Raison requise",
        description: "Veuillez selectionner une raison de rejet.",
        variant: "destructive",
      });
      return;
    }

    startRejectTransition(async () => {
      const result = await rejectKycAction({
        providerId: detail.providerId,
        reason: rejectReason,
        comment: rejectComment || undefined,
      });

      if (result.success) {
        setRejectDialogOpen(false);
        toast({
          title: "Dossier rejete",
          description: "Le prestataire a ete notifie.",
        });
        router.push("/admin/kyc");
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Overdue warning */}
      {detail.isOverdue && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">
            Ce dossier est en retard — soumis il y a plus de 48h
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Provider info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("adminProviderInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Nom" value={detail.displayName} />
            <InfoRow label="Email" value={detail.email} />
            {detail.phone && <InfoRow label="Telephone" value={detail.phone} />}
            <InfoRow label="Inscrit le" value={formatDate(detail.registeredAt)} />
            <InfoRow
              label={t("submittedAt")}
              value={detail.submittedAt ? formatDate(detail.submittedAt) : "—"}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Statut</span>
              <Badge
                variant={
                  detail.isOverdue ? "destructive" : "outline"
                }
                className="flex items-center gap-1"
              >
                {detail.isOverdue && <AlertCircle className="h-3 w-3" />}
                En attente
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Right column: Documents grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("adminDocuments")}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Face comparison: CIN Recto + Selfie side by side */}
            {cinRecto && selfie && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Comparaison visage
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <DocumentCard docType="CIN_RECTO" fileUrl={cinRecto.fileUrl} />
                  <DocumentCard docType="SELFIE" fileUrl={selfie.fileUrl} />
                </div>
              </div>
            )}

            {/* Remaining documents */}
            <div className="grid grid-cols-2 gap-2">
              {detail.documents
                .filter((doc) => {
                  // Skip CIN_RECTO and SELFIE if we already showed them in face comparison
                  if (cinRecto && selfie) {
                    return doc.docType !== "CIN_RECTO" && doc.docType !== "SELFIE";
                  }
                  return true;
                })
                .map((doc) => (
                  <DocumentCard
                    key={doc.docType}
                    docType={doc.docType}
                    fileUrl={doc.fileUrl}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 border-t pt-4">
        {/* Reject button + dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" disabled={isPendingApprove || isPendingReject}>
              <XCircle className="mr-2 h-4 w-4" />
              {t("adminRejectButton")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rejeter le dossier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("adminRejectReasonLabel")} <span className="text-red-500">*</span>
                </label>
                <Select value={rejectReason} onValueChange={setRejectReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez une raison..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="illegible">
                      {t("adminRejectReasons.illegible")}
                    </SelectItem>
                    <SelectItem value="nonConforming">
                      {t("adminRejectReasons.nonConforming")}
                    </SelectItem>
                    <SelectItem value="mismatch">
                      {t("adminRejectReasons.mismatch")}
                    </SelectItem>
                    <SelectItem value="other">
                      {t("adminRejectReasons.other")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("adminRejectComment")}
                </label>
                <Textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Details supplementaires (optionnel)..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setRejectDialogOpen(false)}
                  disabled={isPendingReject}
                >
                  {t("cancelButton")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isPendingReject || !rejectReason}
                >
                  {isPendingReject ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    "Confirmer le rejet"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Approve button */}
        <Button
          onClick={handleApprove}
          disabled={isPendingApprove || isPendingReject}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          {isPendingApprove ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t("adminApproveButton")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
