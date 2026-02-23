"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KycDocumentUpload } from "@/features/kyc/components/KycDocumentUpload";
import { submitKycAction } from "@/features/kyc/actions/submit-kyc";
import type { KycDocType } from "@/lib/validations/kyc";

interface WizardStep {
  step: number;
  docType: KycDocType;
  translationKey: "step1" | "step2" | "step3" | "step4";
  isSelfie?: boolean;
}

const WIZARD_STEPS: WizardStep[] = [
  { step: 1, docType: "CIN_RECTO", translationKey: "step1" },
  { step: 2, docType: "CIN_VERSO", translationKey: "step2" },
  { step: 3, docType: "SELFIE", translationKey: "step3", isSelfie: true },
  { step: 4, docType: "PROOF_OF_ADDRESS", translationKey: "step4" },
];

const REVIEW_STEP = 5;
const TOTAL_STEPS = 5; // 4 upload steps + 1 review step

interface KycWizardProps {
  providerId: string;
  onComplete: () => void;
}

export function KycWizard({ providerId: _providerId, onComplete }: KycWizardProps) {
  const t = useTranslations("kyc");
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<
    Partial<Record<KycDocType, string>>
  >({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleFileUploaded(docType: KycDocType, fileUrl: string) {
    setUploadedFiles((prev) => ({ ...prev, [docType]: fileUrl }));
  }

  function handleNext() {
    setCurrentStep((prev) => prev + 1);
  }

  function handlePrevious() {
    setCurrentStep((prev) => prev - 1);
  }

  function isCurrentStepComplete(): boolean {
    if (currentStep === REVIEW_STEP) return true;
    const wizardStep = WIZARD_STEPS.find((s) => s.step === currentStep);
    if (!wizardStep) return false;
    return Boolean(uploadedFiles[wizardStep.docType]);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setShowConfirmDialog(false);

    try {
      const documents = WIZARD_STEPS.map((step) => ({
        docType: step.docType,
        fileUrl: uploadedFiles[step.docType] ?? "",
      }));

      const result = await submitKycAction(documents);

      if (result.success) {
        toast({ description: t("submitSuccess") });
        onComplete();
      } else {
        toast({ variant: "destructive", description: result.error ?? t("submitError") });
      }
    } catch {
      toast({ variant: "destructive", description: t("submitError") });
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentWizardStep = WIZARD_STEPS.find((s) => s.step === currentStep);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Progress stepper */}
      <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} t={t} />

      {/* Step content */}
      {currentStep < REVIEW_STEP && currentWizardStep ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {t(`${currentWizardStep.translationKey}Title` as Parameters<typeof t>[0])}
            </h2>
          </div>
          <KycDocumentUpload
            docType={currentWizardStep.docType}
            label={t(`${currentWizardStep.translationKey}Title` as Parameters<typeof t>[0])}
            description={t(`${currentWizardStep.translationKey}Description` as Parameters<typeof t>[0])}
            onFileUploaded={(fileUrl) =>
              handleFileUploaded(currentWizardStep.docType, fileUrl)
            }
            existingUrl={uploadedFiles[currentWizardStep.docType]}
            isSelfie={currentWizardStep.isSelfie}
          />
        </div>
      ) : currentStep === REVIEW_STEP ? (
        <ReviewScreen uploadedFiles={uploadedFiles} steps={WIZARD_STEPS} t={t} />
      ) : null}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          {t("previousStep")}
        </Button>

        {currentStep < REVIEW_STEP ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!isCurrentStepComplete()}
          >
            {t("nextStep")}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setShowConfirmDialog(true)}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("submitButton")}
          </Button>
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("submitConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("submitConfirmDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              {t("cancelButton")}
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("submitConfirmButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Step indicator component
interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  t: ReturnType<typeof useTranslations<"kyc">>;
}

function StepIndicator({ currentStep, totalSteps, t }: StepIndicatorProps) {
  const stepLabels = [
    t("step1Title"),
    t("step2Title"),
    t("step3Title"),
    t("step4Title"),
    t("reviewTitle"),
  ];

  return (
    <div className="w-full">
      {/* Mobile: compact progress bar */}
      <div className="block sm:hidden">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {stepLabels[currentStep - 1]}
          </span>
          <span className="text-muted-foreground">
            {currentStep}/{totalSteps}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: full step indicator */}
      <div className="hidden sm:block">
        <ol className="flex items-center">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <li
              key={step}
              className={[
                "flex items-center",
                step < totalSteps ? "flex-1" : "",
              ].join(" ")}
            >
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                    step < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step === currentStep
                        ? "border-2 border-primary bg-background text-primary"
                        : "border-2 border-border bg-background text-muted-foreground",
                  ].join(" ")}
                >
                  {step < currentStep ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step
                  )}
                </div>
              </div>
              {step < totalSteps && (
                <div
                  className={[
                    "mx-1 h-0.5 flex-1 transition-colors",
                    step < currentStep ? "bg-primary" : "bg-border",
                  ].join(" ")}
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// Review screen component
interface ReviewScreenProps {
  uploadedFiles: Partial<Record<KycDocType, string>>;
  steps: WizardStep[];
  t: ReturnType<typeof useTranslations<"kyc">>;
}

function ReviewScreen({ uploadedFiles, steps, t }: ReviewScreenProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t("reviewTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("reviewDescription")}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {steps.map((step) => {
          const fileUrl = uploadedFiles[step.docType];
          const titleKey = `${step.translationKey}Title` as Parameters<typeof t>[0];
          return (
            <div key={step.docType} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t(titleKey)}
              </p>
              {fileUrl ? (
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-muted">
                  <Image
                    src={fileUrl}
                    alt={t(titleKey)}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 200px"
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted">
                  <span className="text-xs text-muted-foreground">
                    {t("uploadLabel")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
