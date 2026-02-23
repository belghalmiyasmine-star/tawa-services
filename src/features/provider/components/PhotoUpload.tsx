"use client";

import { useRef, useState } from "react";

import { Camera, UserCircle } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { useToast } from "@/hooks/use-toast";

// ============================================================
// TYPES
// ============================================================

interface PhotoUploadProps {
  currentPhotoUrl?: string | null;
  onUploadComplete: (url: string) => void;
}

// ============================================================
// COMPONENT
// ============================================================

export function PhotoUpload({ currentPhotoUrl, onUploadComplete }: PhotoUploadProps) {
  const t = useTranslations("provider");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl ?? null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type client-side
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Format invalide",
        description: t("photoHint"),
        variant: "destructive",
      });
      return;
    }

    // Validate size client-side (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Fichier trop volumineux",
        description: t("photoHint"),
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/provider/photo", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: { photoUrl: string };
        error?: string;
      };

      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Erreur lors de l'upload");
      }

      setPreviewUrl(result.data.photoUrl);
      onUploadComplete(result.data.photoUrl);

      toast({
        title: "Photo mise a jour",
        description: t("profileSaved"),
      });
    } catch (err) {
      console.error("[PhotoUpload] Error:", err);
      toast({
        title: "Erreur",
        description: t("profileError"),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Photo circle with hover overlay */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="group relative h-32 w-32 cursor-pointer rounded-full border-2 border-dashed border-gray-200 bg-gray-50 hover:border-primary disabled:cursor-not-allowed"
        aria-label={t("photoUpload")}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Photo de profil"
            fill
            className="rounded-full object-cover"
            sizes="128px"
          />
        ) : (
          <UserCircle className="h-full w-full p-2 text-gray-300" />
        )}

        {/* Hover overlay with camera icon */}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {isUploading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>
      </button>

      <p className="text-xs text-muted-foreground">{t("photoHint")}</p>

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
