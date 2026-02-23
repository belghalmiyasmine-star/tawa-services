"use client";

import { useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// ============================================================
// TYPES
// ============================================================

interface CertificationUploaderProps {
  providerId: string;
  onUploadSuccess: () => void;
}

// ============================================================
// CONSTANTS
// ============================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

// ============================================================
// COMPONENT
// ============================================================

/**
 * CertificationUploader — form to upload a certification or diploma.
 *
 * POSTs to /api/provider/certification (single DB write point).
 * Does NOT call addCertificationAction to avoid duplicate records.
 * After success, calls onUploadSuccess() to trigger parent list refresh.
 */
export function CertificationUploader({
  providerId: _providerId,
  onUploadSuccess,
}: CertificationUploaderProps) {
  const t = useTranslations("provider");
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = title.trim().length >= 2 && file !== null && !isUploading;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      return;
    }
    // Client-side validation: MIME type
    if (!ALLOWED_TYPES.includes(selected.type)) {
      toast({
        variant: "destructive",
        title: "Format invalide",
        description: "Formats acceptes : JPG, PNG, WebP et PDF",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    // Client-side validation: size
    if (selected.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "Fichier trop volumineux",
        description: "Le fichier ne doit pas depasser 10 Mo",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());

      const response = await fetch("/api/provider/certification", {
        method: "POST",
        body: formData,
      });

      const json = (await response.json()) as { success: boolean; error?: string };

      if (!json.success) {
        toast({
          variant: "destructive",
          title: t("certificationUploadError"),
          description: json.error ?? "Une erreur est survenue",
        });
        return;
      }

      // Reset form
      setTitle("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast({
        title: t("certificationAdded"),
        description: title.trim(),
      });

      // Notify parent to refresh the list
      onUploadSuccess();
    } catch {
      toast({
        variant: "destructive",
        title: t("certificationUploadError"),
        description: "Erreur reseau, veuillez reessayer",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cert-title">{t("certificationTitle")}</Label>
        <Input
          id="cert-title"
          type="text"
          placeholder={t("certificationTitlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          minLength={2}
          maxLength={200}
          disabled={isUploading}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cert-file">{t("certificationFile")}</Label>
        <Input
          id="cert-file"
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          disabled={isUploading}
          className="cursor-pointer"
        />
        <p className="text-xs text-gray-400">
          JPG, PNG, WebP ou PDF — 10 Mo maximum
        </p>
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        className="w-full sm:w-auto"
      >
        {isUploading ? t("certificationUploading") : t("certificationAdd")}
      </Button>
    </form>
  );
}
