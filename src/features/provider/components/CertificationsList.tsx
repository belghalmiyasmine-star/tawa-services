"use client";

import { useState } from "react";

import { ExternalLink, FileText, ImageIcon, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
import { useToast } from "@/hooks/use-toast";
import {
  deleteCertificationAction,
  getProviderCertificationsAction,
} from "@/features/provider/actions/manage-certifications";
import { CertificationUploader } from "./CertificationUploader";

// ============================================================
// TYPES
// ============================================================

interface CertificationItem {
  id: string;
  title: string;
  fileUrl: string;
  issuedAt?: Date | null;
  createdAt: Date;
}

interface CertificationsListProps {
  initialCertifications: CertificationItem[];
  providerId: string;
}

// ============================================================
// HELPERS
// ============================================================

function isPdf(fileUrl: string): boolean {
  return fileUrl.toLowerCase().endsWith(".pdf");
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-TN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * CertificationsList — shows provider certifications with view/delete actions.
 * Client component — manages local state, refreshes via getProviderCertificationsAction.
 */
export function CertificationsList({
  initialCertifications,
  providerId,
}: CertificationsListProps) {
  const t = useTranslations("provider");
  const { toast } = useToast();

  const [certifications, setCertifications] =
    useState<CertificationItem[]>(initialCertifications);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Called by CertificationUploader after a successful upload
  const handleUploadSuccess = async () => {
    const result = await getProviderCertificationsAction();
    if (result.success) {
      // Coerce dates: action returns Date objects, but may be serialized as strings
      setCertifications(
        result.data.map((c) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          issuedAt: c.issuedAt ? new Date(c.issuedAt) : null,
        })),
      );
    }
  };

  const handleDelete = async (certId: string) => {
    setDeletingId(certId);
    try {
      const result = await deleteCertificationAction(certId);
      if (!result.success) {
        toast({
          variant: "destructive",
          title: t("certificationDeleteError"),
          description: result.error,
        });
        return;
      }
      // Refresh list
      const refreshed = await getProviderCertificationsAction();
      if (refreshed.success) {
        setCertifications(
          refreshed.data.map((c) => ({
            ...c,
            createdAt: new Date(c.createdAt),
            issuedAt: c.issuedAt ? new Date(c.issuedAt) : null,
          })),
        );
      }
      toast({ title: t("certificationDeleted") });
    } catch {
      toast({
        variant: "destructive",
        title: t("certificationDeleteError"),
        description: "Erreur reseau, veuillez reessayer",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
          {t("certificationSection")}
        </h2>

        {certifications.length === 0 ? (
          <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
            {t("certificationEmpty")}
          </p>
        ) : (
          <div className="mb-6 space-y-2">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Left: icon + title + date */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {isPdf(cert.fileUrl) ? (
                    <FileText className="h-5 w-5 shrink-0 text-red-500" />
                  ) : (
                    <ImageIcon className="h-5 w-5 shrink-0 text-blue-500" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                      {cert.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Ajoute le {formatDate(cert.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Right: view link + delete button */}
                <div className="ml-2 flex items-center gap-2">
                  <a
                    href={cert.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    title={t("certificationView")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t("certificationView")}</span>
                  </a>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === cert.id}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                        title={t("certificationDelete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("certificationDelete")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("certificationDeleteConfirm")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void handleDelete(cert.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t("certificationDelete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload form below the list */}
        <div className="rounded-lg border border-dashed border-gray-200 p-4 dark:border-gray-700">
          <CertificationUploader
            providerId={providerId}
            onUploadSuccess={() => void handleUploadSuccess()}
          />
        </div>
      </div>
    </div>
  );
}
