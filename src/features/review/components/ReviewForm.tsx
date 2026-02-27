"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

import { submitReviewAction } from "../actions/review-actions";
import { reviewSubmitSchema } from "../schemas/review";
import { CriteriaRatingGroup } from "./CriteriaRatingGroup";
import { ReviewPhotoUploader } from "./ReviewPhotoUploader";
import { StarRating } from "./StarRating";

// Use the output type (after Zod default transforms) for react-hook-form
type ReviewFormValues = Required<z.infer<typeof reviewSubmitSchema>>;

// ============================================================
// TYPES
// ============================================================

interface ReviewFormProps {
  bookingId: string;
  authorRole: "CLIENT" | "PROVIDER";
  onSuccess?: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export function ReviewForm({
  bookingId,
  // authorRole is not used in the form itself — it is handled server-side
  // in submitReviewAction (which determines author role from session)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  authorRole: _authorRole,
  onSuccess,
}: ReviewFormProps) {
  const t = useTranslations("review");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugErrors, setDebugErrors] = useState<string[]>([]);

  // DEBUG: Confirm client-side JS is mounted (rules out hydration failure)
  useEffect(() => {
    console.log("[ReviewForm] Component mounted. bookingId:", bookingId);
  }, [bookingId]);

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSubmitSchema) as never,
    defaultValues: {
      bookingId,
      stars: 0,
      qualityRating: 0,
      punctualityRating: 0,
      communicationRating: 0,
      cleanlinessRating: 0,
      text: "",
      photoUrls: [],
    },
  });

  const stars = watch("stars");
  const qualityRating = watch("qualityRating");
  const punctualityRating = watch("punctualityRating");
  const communicationRating = watch("communicationRating");
  const cleanlinessRating = watch("cleanlinessRating");
  const text = watch("text");
  const photoUrls = watch("photoUrls");

  // Character counter color
  const textLength = text?.length ?? 0;
  const counterColor =
    textLength < 20
      ? "text-muted-foreground"
      : textLength <= 450
        ? "text-green-600"
        : "text-amber-600";

  const criteria = [
    { key: "qualityRating", label: t("quality"), value: qualityRating },
    {
      key: "punctualityRating",
      label: t("punctuality"),
      value: punctualityRating,
    },
    {
      key: "communicationRating",
      label: t("communication"),
      value: communicationRating,
    },
    {
      key: "cleanlinessRating",
      label: t("cleanliness"),
      value: cleanlinessRating,
    },
  ];

  const onSubmit = async (data: ReviewFormValues) => {
    console.log("[ReviewForm] onSubmit called with data:", JSON.stringify(data, null, 2));
    setIsSubmitting(true);
    try {
      console.log("[ReviewForm] Calling submitReviewAction...");
      const result = await submitReviewAction(data);
      console.log("[ReviewForm] submitReviewAction result:", JSON.stringify(result, null, 2));

      if (!result.success) {
        toast({
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      const review = result.data;

      if (review.flagged) {
        toast({ description: t("contactInfoDetected") });
      } else if (review.published) {
        toast({ description: t("bothPublished") });
      } else {
        toast({ description: t("reviewSubmitted") });
        toast({ description: t("reviewPendingPublication") });
      }

      onSuccess?.();
    } catch (error) {
      console.error("[ReviewForm] Submit error:", error);
      toast({
        description: "Erreur lors de la soumission de l'avis",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onValidationError = (validationErrors: Record<string, unknown>) => {
    const errorFields = Object.keys(validationErrors);
    console.error("[ReviewForm] Validation FAILED — onSubmit was NOT called.");
    console.error("[ReviewForm] Error fields:", errorFields);
    console.error("[ReviewForm] Full errors:", JSON.stringify(validationErrors, null, 2));
    console.log("[ReviewForm] Current form values:", JSON.stringify({
      bookingId,
      stars,
      qualityRating,
      punctualityRating,
      communicationRating,
      cleanlinessRating,
      text,
      photoUrls,
    }, null, 2));
    // Show errors visibly in the UI
    setDebugErrors(errorFields.map(f => {
      const err = validationErrors[f] as { message?: string } | undefined;
      return `${f}: ${err?.message ?? "invalide"}`;
    }));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-6">
      {/* Overall rating */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t("overallRating")}
        </label>
        <StarRating
          value={stars}
          onChange={(v) => setValue("stars", v, { shouldValidate: true })}
          size="lg"
          label={t("overallRating")}
        />
        {errors.stars && (
          <p className="text-sm text-destructive">{errors.stars.message}</p>
        )}
      </div>

      {/* Criteria ratings */}
      <div className="space-y-2">
        <CriteriaRatingGroup
          criteria={criteria}
          onChange={(key, value) =>
            setValue(key as keyof ReviewFormValues, value, {
              shouldValidate: true,
            })
          }
        />
        {(errors.qualityRating ||
          errors.punctualityRating ||
          errors.communicationRating ||
          errors.cleanlinessRating) && (
          <p className="text-sm text-destructive">
            Veuillez noter tous les criteres
          </p>
        )}
      </div>

      {/* Review text */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t("yourReview")}
        </label>
        <Textarea
          placeholder={t("textPlaceholder")}
          value={text}
          onChange={(e) =>
            setValue("text", e.target.value, { shouldValidate: true })
          }
          rows={4}
          maxLength={500}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          {errors.text ? (
            <p className="text-sm text-destructive">{errors.text.message}</p>
          ) : (
            <span />
          )}
          <span className={`text-xs ${counterColor}`}>
            {textLength}/500
          </span>
        </div>
      </div>

      {/* Photo uploader */}
      <ReviewPhotoUploader
        photos={photoUrls ?? []}
        onAdd={(url) =>
          setValue("photoUrls", [...(photoUrls ?? []), url], {
            shouldValidate: true,
          })
        }
        onRemove={(index) =>
          setValue(
            "photoUrls",
            (photoUrls ?? []).filter((_, i) => i !== index),
            { shouldValidate: true },
          )
        }
        maxPhotos={3}
      />

      {/* DEBUG: Visible validation errors */}
      {debugErrors.length > 0 && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          <p className="font-medium">Validation echouee — champs en erreur :</p>
          <ul className="mt-1 list-inside list-disc">
            {debugErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
        onClick={() => {
          console.log("[ReviewForm] Submit button clicked. isSubmitting:", isSubmitting);
          console.log("[ReviewForm] Current watched values:", { stars, qualityRating, punctualityRating, communicationRating, cleanlinessRating, textLength: text?.length, photoUrls: photoUrls?.length });
        }}
      >
        {isSubmitting ? "Envoi en cours..." : t("submitReview")}
      </Button>
    </form>
  );
}
