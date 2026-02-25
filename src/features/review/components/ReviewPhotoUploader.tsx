"use client";

import { Loader2, X, Camera } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ReviewPhotoUploaderProps {
  photos: string[];
  onAdd: (url: string) => void;
  onRemove: (index: number) => void;
  maxPhotos?: number;
}

export function ReviewPhotoUploader({
  photos,
  onAdd,
  onRemove,
  maxPhotos = 3,
}: ReviewPhotoUploaderProps) {
  const t = useTranslations("review");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = "";

    if (photos.length >= maxPhotos) {
      toast({
        description: t("maxPhotosReached"),
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/review/photos", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Upload failed");
      }

      const data = (await response.json()) as { url: string };
      onAdd(data.url);
      toast({ description: t("photoUploaded") });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur d'upload";
      toast({ description: message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{t("photosLabel")}</p>
      <div className="flex flex-wrap items-center gap-2">
        {photos.map((url, index) => (
          <div key={url} className="relative h-20 w-20">
            <Image
              src={url}
              alt={`Photo ${index + 1}`}
              fill
              className="rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-20 w-20 flex-col gap-1"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Camera className="h-5 w-5" />
                <span className="text-xs">{t("addPhotos")}</span>
              </>
            )}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
