"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateProfileAction } from "@/features/provider/actions/update-profile";
import { PhotoUpload } from "@/features/provider/components/PhotoUpload";
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from "@/lib/validations/provider";

// ============================================================
// TYPES
// ============================================================

interface ProfileEditFormProps {
  defaultValues: UpdateProfileFormData & {
    photoUrl?: string | null;
  };
}

const LANGUAGES = [
  { id: "francais", label: "Francais" },
  { id: "arabe", label: "Arabe" },
  { id: "anglais", label: "Anglais" },
  { id: "amazigh", label: "Amazigh" },
  { id: "espagnol", label: "Espagnol" },
  { id: "italien", label: "Italien" },
  { id: "allemand", label: "Allemand" },
] as const;

// ============================================================
// COMPONENT
// ============================================================

export function ProfileEditForm({ defaultValues }: ProfileEditFormProps) {
  const t = useTranslations("provider");
  const { toast } = useToast();
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    defaultValues.photoUrl ?? null,
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: defaultValues.displayName ?? "",
      bio: defaultValues.bio ?? "",
      phone: defaultValues.phone ?? "",
      yearsExperience: defaultValues.yearsExperience ?? 0,
      languages: defaultValues.languages ?? [],
    },
  });

  const selectedLanguages = watch("languages") ?? [];
  const bio = watch("bio") ?? "";

  const toggleLanguage = (lang: string) => {
    const current = selectedLanguages;
    if (current.includes(lang)) {
      setValue(
        "languages",
        current.filter((l) => l !== lang),
        { shouldValidate: true },
      );
    } else {
      setValue("languages", [...current, lang], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: UpdateProfileFormData) => {
    const result = await updateProfileAction(data);

    if (!result.success) {
      toast({
        title: "Erreur",
        description: result.error ?? t("profileError"),
        variant: "destructive",
      });
      return;
    }

    toast({ title: t("profileSaved") });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Photo upload at the top */}
      <div className="flex justify-center">
        <PhotoUpload
          currentPhotoUrl={photoUrl}
          onUploadComplete={(url) => setPhotoUrl(url)}
        />
      </div>

      {/* Two-column grid on desktop, single column on mobile */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Display Name — full width */}
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="displayName">{t("displayName")} *</Label>
          <Input
            id="displayName"
            placeholder={t("displayNamePlaceholder")}
            {...register("displayName")}
          />
          {errors.displayName && (
            <p className="text-xs text-destructive">{errors.displayName.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input
            id="phone"
            type="tel"
            placeholder={t("phonePlaceholder")}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>

        {/* Years of experience */}
        <div className="space-y-1">
          <Label htmlFor="yearsExperience">{t("yearsExperience")}</Label>
          <Input
            id="yearsExperience"
            type="number"
            min={0}
            max={50}
            placeholder={t("yearsExperiencePlaceholder")}
            {...register("yearsExperience", { valueAsNumber: true })}
          />
          {errors.yearsExperience && (
            <p className="text-xs text-destructive">
              {errors.yearsExperience.message}
            </p>
          )}
        </div>

        {/* Bio — full width */}
        <div className="space-y-1 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="bio">{t("bio")}</Label>
            <span className="text-xs text-muted-foreground">
              {bio.length}/2000
            </span>
          </div>
          <Textarea
            id="bio"
            placeholder={t("bioPlaceholder")}
            rows={5}
            maxLength={2000}
            {...register("bio")}
          />
          {errors.bio && (
            <p className="text-xs text-destructive">{errors.bio.message}</p>
          )}
        </div>
      </div>

      {/* Languages — checkboxes */}
      <div className="space-y-2">
        <Label>{t("languages")}</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {LANGUAGES.map((lang) => (
            <label
              key={lang.id}
              className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedLanguages.includes(lang.id)}
                onCheckedChange={() => toggleLanguage(lang.id)}
              />
              <span className="text-sm">{lang.label}</span>
            </label>
          ))}
        </div>
        {errors.languages && (
          <p className="text-xs text-destructive">{errors.languages.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Enregistrement...
          </span>
        ) : (
          t("saveProfile")
        )}
      </Button>
    </form>
  );
}
