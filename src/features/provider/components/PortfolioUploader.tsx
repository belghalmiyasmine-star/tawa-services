"use client";

import { useRef, useState } from "react";

import { Loader2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { useToast } from "@/hooks/use-toast";
import { updatePortfolioPhotoCaptionAction } from "@/features/provider/actions/manage-portfolio";

// ============================================================
// TYPES
// ============================================================

interface PortfolioPhoto {
  id: string;
  photoUrl: string;
  caption: string | null;
  sortOrder: number;
}

interface PortfolioUploaderProps {
  initialPhotos: PortfolioPhoto[];
  providerId: string;
}

const MAX_PHOTOS = 10;

// ============================================================
// COMPONENT
// ============================================================

export function PortfolioUploader({ initialPhotos, providerId }: PortfolioUploaderProps) {
  const t = useTranslations("provider");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<PortfolioPhoto[]>(initialPhotos);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddClick = () => {
    if (photos.length >= MAX_PHOTOS) {
      toast({
        title: "Limite atteinte",
        description: t("portfolioMax"),
        variant: "destructive",
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Format invalide",
        description: "JPG, PNG ou WebP uniquement",
        variant: "destructive",
      });
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "5 Mo maximum",
        variant: "destructive",
      });
      return;
    }

    const slotIndex = photos.length;
    setUploadingSlot(slotIndex);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/provider/portfolio", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: PortfolioPhoto;
        error?: string;
      };

      if (!result.success || !result.data) {
        throw new Error(result.error ?? t("portfolioUploadError"));
      }

      setPhotos((prev) => [...prev, result.data!]);

      toast({ title: t("portfolioUploaded") });
    } catch (err) {
      console.error("[PortfolioUploader] Upload error:", err);
      toast({
        title: "Erreur",
        description: t("portfolioUploadError"),
        variant: "destructive",
      });
    } finally {
      setUploadingSlot(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (photoId: string) => {
    setDeletingId(photoId);
    try {
      const response = await fetch("/api/provider/portfolio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!result.success) {
        throw new Error(result.error ?? "Erreur lors de la suppression");
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast({ title: t("portfolioDeleted") });
    } catch (err) {
      console.error("[PortfolioUploader] Delete error:", err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la photo",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCaptionBlur = async (photoId: string, caption: string) => {
    try {
      const result = await updatePortfolioPhotoCaptionAction({ photoId, caption });
      if (!result.success) {
        console.error("[PortfolioUploader] Caption update failed:", result.error);
        return;
      }
      toast({ title: t("portfolioCaptionSaved") });
    } catch (err) {
      console.error("[PortfolioUploader] Caption error:", err);
    }
  };

  const handleCaptionChange = (photoId: string, caption: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, caption } : p)),
    );
  };

  // Build grid slots: filled photos + 1 upload slot (if < MAX_PHOTOS)
  const showUploadSlot = photos.length < MAX_PHOTOS;

  return (
    <div className="space-y-4">
      {/* Header with counter */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{t("portfolioTitle")}</h3>
        <span className="text-sm text-muted-foreground">
          {t("portfolioCount", { count: photos.length })}
        </span>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* Existing photos */}
        {photos.map((photo, index) => (
          <div key={photo.id} className="flex flex-col gap-1">
            {/* Photo card */}
            <div className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
              <Image
                src={photo.photoUrl}
                alt={photo.caption ?? `Photo ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
              {/* Delete overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {deletingId === photo.id ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    className="rounded-full bg-destructive p-2 text-white hover:bg-destructive/80"
                    aria-label={t("portfolioDelete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {/* Caption field */}
            <input
              type="text"
              value={photo.caption ?? ""}
              onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
              onBlur={(e) => handleCaptionBlur(photo.id, e.target.value)}
              maxLength={200}
              placeholder={t("portfolioCaptionPlaceholder")}
              className="w-full rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        ))}

        {/* Upload slot */}
        {showUploadSlot && (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={handleAddClick}
              className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 hover:border-primary hover:bg-muted/50"
            >
              {uploadingSlot === photos.length ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                  <span className="text-xs text-muted-foreground group-hover:text-primary">
                    {t("portfolioUpload")}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Empty placeholder slots for visual (up to 10 total shown) */}
        {Array.from({ length: Math.max(0, MAX_PHOTOS - photos.length - (showUploadSlot ? 1 : 0)) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/15 bg-muted/10"
          />
        ))}
      </div>

      {photos.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">{t("portfolioEmpty")}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
