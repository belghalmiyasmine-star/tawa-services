"use client";

import { useRef, useState } from "react";
import { Camera, FileUp, Loader2, RefreshCw, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/validations/kyc";

type UploadState = "idle" | "uploading" | "uploaded" | "error";

interface KycDocumentUploadProps {
  docType: string;
  label: string;
  description: string;
  onFileUploaded: (fileUrl: string) => void;
  existingUrl?: string;
  disabled?: boolean;
  isSelfie?: boolean;
}

export function KycDocumentUpload({
  docType,
  label,
  description,
  onFileUploaded,
  existingUrl,
  disabled = false,
  isSelfie = false,
}: KycDocumentUploadProps) {
  const t = useTranslations("kyc");
  const { toast } = useToast();
  const [uploadState, setUploadState] = useState<UploadState>(
    existingUrl ? "uploaded" : "idle",
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingUrl ?? null,
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validateFile(file: File): boolean {
    // Check MIME type
    const isValidMime = ALLOWED_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_MIME_TYPES)[number],
    );
    if (!isValidMime) {
      toast({ variant: "destructive", description: t("invalidFileType") });
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", description: t("fileTooLarge") });
      return false;
    }

    return true;
  }

  async function uploadFile(file: File) {
    if (!validateFile(file)) return;

    setUploadState("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);

      const response = await fetch("/api/kyc/upload", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: { fileUrl: string; docType: string };
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? t("uploadError"));
      }

      const fileUrl = result.data?.fileUrl ?? "";
      setPreviewUrl(fileUrl);
      setUploadState("uploaded");
      onFileUploaded(fileUrl);
    } catch (err) {
      setUploadState("error");
      const message = err instanceof Error ? err.message : t("uploadError");
      toast({ variant: "destructive", description: message });
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void uploadFile(file);
    }
    // Reset input so same file can be re-selected after retake
    event.target.value = "";
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    const file = event.dataTransfer.files[0];
    if (file) {
      void uploadFile(file);
    }
  }

  function handleZoneClick() {
    if (!disabled && uploadState !== "uploading") {
      fileInputRef.current?.click();
    }
  }

  function handleRetake() {
    setUploadState("idle");
    setPreviewUrl(null);
    fileInputRef.current?.click();
  }

  const Icon = isSelfie ? Camera : FileUp;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {uploadState === "uploaded" && previewUrl ? (
        <div className="space-y-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={label}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetake}
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t("retakeButton")}
            </Button>
          )}
        </div>
      ) : (
        <Card
          className={[
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50",
            disabled || uploadState === "uploading"
              ? "cursor-not-allowed opacity-60"
              : "",
          ].join(" ")}
          onClick={handleZoneClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {uploadState === "uploading" ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t("uploadHint")}</p>
            </>
          ) : (
            <>
              {uploadState === "error" ? (
                <UploadCloud className="h-10 w-10 text-destructive" />
              ) : (
                <Icon className="h-10 w-10 text-muted-foreground" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {t("uploadLabel")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("uploadHint")}
                </p>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
