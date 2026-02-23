"use client";

import { useState, useRef, type DragEvent } from "react";
import Image from "next/image";
import { X, Plus, GripVertical, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { useToast } from "@/hooks/use-toast";
import { MAX_SERVICE_PHOTOS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ServicePhotoUploaderProps {
  serviceId: string | null;
  initialPhotos: string[];
  onPhotosChange: (urls: string[]) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function ServicePhotoUploader({
  serviceId,
  initialPhotos,
  onPhotosChange,
}: ServicePhotoUploaderProps) {
  const t = useTranslations("service");
  const { toast } = useToast();

  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [loadingSlots, setLoadingSlots] = useState<Set<number>>(new Set());
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<number | null>(null);

  // If no serviceId (new service), show disabled state
  if (!serviceId) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Enregistrez d&apos;abord le service pour ajouter des photos
        </p>
      </div>
    );
  }

  const handleFileSelect = async (file: File, slotIndex: number) => {
    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Format invalide",
        description: "Seuls les fichiers JPG, PNG et WebP sont acceptes",
      });
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "Fichier trop volumineux",
        description: "Le fichier ne doit pas depasser 5 Mo",
      });
      return;
    }

    // Check slot count
    if (photos.length >= MAX_SERVICE_PHOTOS) {
      toast({
        variant: "destructive",
        title: "Limite atteinte",
        description: `Maximum ${MAX_SERVICE_PHOTOS} photos par service`,
      });
      return;
    }

    // Mark slot as loading
    setLoadingSlots((prev) => new Set(prev).add(slotIndex));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("serviceId", serviceId);

      const response = await fetch("/api/service/photos", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: { photoUrl: string };
        error?: string;
      };

      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Upload echoue");
      }

      const newPhotos = [...photos, result.data.photoUrl];
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur d'upload",
        description:
          error instanceof Error ? error.message : "Erreur lors de l'upload",
      });
    } finally {
      setLoadingSlots((prev) => {
        const next = new Set(prev);
        next.delete(slotIndex);
        return next;
      });
    }
  };

  const handleSlotClick = (slotIndex: number) => {
    if (photos.length >= MAX_SERVICE_PHOTOS) return;
    activeSlotRef.current = slotIndex;
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const slotIndex = activeSlotRef.current ?? photos.length;
    void handleFileSelect(file, slotIndex);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleDelete = async (photoUrl: string) => {
    try {
      const response = await fetch("/api/service/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, photoUrl }),
      });

      const result = (await response.json()) as { success: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error ?? "Suppression echouee");
      }

      const newPhotos = photos.filter((url) => url !== photoUrl);
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression",
      });
    }
  };

  // Drag-and-drop reorder (HTML5 native events)
  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSlot(index);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDragOverSlot(null);
      setDraggedIndex(null);
      return;
    }

    const newPhotos = [...photos];
    const [moved] = newPhotos.splice(draggedIndex, 1);
    if (moved !== undefined) {
      newPhotos.splice(targetIndex, 0, moved);
    }

    setPhotos(newPhotos);
    onPhotosChange(newPhotos);
    setDragOverSlot(null);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDragOverSlot(null);
    setDraggedIndex(null);
  };

  // Build slots array: filled photos + empty slots up to MAX_SERVICE_PHOTOS
  const emptySlotCount = Math.max(0, MAX_SERVICE_PHOTOS - photos.length);

  return (
    <div className="space-y-3">
      {/* Counter badge */}
      <p className="text-sm text-muted-foreground">
        {photos.length}/{MAX_SERVICE_PHOTOS} photos
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Photo grid: 2 cols mobile, 3 cols desktop */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {/* Filled photo slots */}
        {photos.map((photoUrl, index) => (
          <div
            key={photoUrl}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted",
              dragOverSlot === index && "ring-2 ring-primary",
              draggedIndex === index && "opacity-50",
            )}
          >
            <Image
              src={photoUrl}
              alt={`Photo ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />

            {/* Drag handle */}
            <div className="absolute left-1 top-1 cursor-grab rounded bg-black/40 p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <GripVertical className="h-4 w-4 text-white" />
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => void handleDelete(photoUrl)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
              aria-label="Supprimer la photo"
            >
              <X className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        ))}

        {/* Loading slots */}
        {Array.from(loadingSlots).map((slotIndex) => (
          <div
            key={`loading-${slotIndex}`}
            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-muted"
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ))}

        {/* Empty upload slots */}
        {photos.length < MAX_SERVICE_PHOTOS &&
          Array.from({ length: emptySlotCount - loadingSlots.size }).map(
            (_, i) => (
              <button
                key={`empty-${i}`}
                type="button"
                onClick={() => handleSlotClick(photos.length + i)}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/30 transition-colors hover:bg-muted"
              >
                <Plus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {t("photosUpload")}
                </span>
              </button>
            ),
          )}
      </div>

      <p className="text-xs text-muted-foreground">{t("photosHint")}</p>
    </div>
  );
}
