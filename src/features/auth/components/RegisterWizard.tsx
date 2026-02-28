"use client";

import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "@/i18n/routing";
import { registerAction } from "@/features/auth/actions/register";
import { sendOtpAction } from "@/features/auth/actions/send-otp";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { useToast } from "@/hooks/use-toast";

import { OtpVerificationStep } from "./OtpVerificationStep";
import { PersonalInfoStep } from "./PersonalInfoStep";
import { PasswordStep } from "./PasswordStep";
import { RoleStep } from "./RoleStep";

const STEP_LABELS: Record<1 | 2 | 3 | 4, "step1Title" | "step2Title" | "step3Title" | "step4Title"> = {
  1: "step1Title",
  2: "step2Title",
  3: "step3Title",
  4: "step4Title",
};

type Role = "CLIENT" | "PROVIDER";

export function RegisterWizard() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP step state — set after successful registration
  const [otpUserId, setOtpUserId] = useState<string | null>(null);
  const [otpPhone, setOtpPhone] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: undefined,
    },
    mode: "onTouched",
  });

  // Step 1 → Step 2
  const handleRoleNext = () => {
    if (!selectedRole) return;
    setValue("role", selectedRole);
    setCurrentStep(2);
  };

  // Step 2 → Step 3: validate personal info fields before advancing
  const handlePersonalInfoNext = async () => {
    const valid = await trigger(["firstName", "lastName", "email", "phone"]);
    if (valid) setCurrentStep(3);
  };

  // Step 3 → Step 2
  const handlePasswordBack = () => setCurrentStep(2);

  // Step 2 → Step 1
  const handlePersonalInfoBack = () => setCurrentStep(1);

  // Called after successful registration — transitions to OTP step 4
  const handleRegistrationSuccess = async (userId: string, phone: string) => {
    setOtpUserId(userId);
    setOtpPhone(phone);

    // Trigger OTP send before showing step 4
    const sendResult = await sendOtpAction(userId, phone);
    if (!sendResult.success) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer le code SMS. Veuillez reessayer.",
      });
      return;
    }

    setCurrentStep(4);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const result = await registerAction(data, locale);

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Erreur d'inscription",
          description: result.error,
        });
        return;
      }

      // Transition to OTP step 4 instead of auto-login
      await handleRegistrationSuccess(result.data.userId, data.phone ?? "");
    } catch {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue est survenue. Veuillez reessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Called when OTP is successfully verified
  const handleOtpVerified = async () => {
    const formData = watch();

    // Auto-sign-in after phone verification
    const signInResult = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (signInResult?.error) {
      // Phone verified but auto-login failed — redirect to login page
      toast({
        title: "Compte verifie !",
        description: "Veuillez vous connecter avec vos identifiants.",
      });
      router.push("/auth/login");
      return;
    }

    // Redirect to role-specific dashboard
    // CLIENT → home page (dedicated dashboard added in Phase 4+)
    // PROVIDER → provider dashboard (placeholder from Phase 1)
    if (formData.role === "PROVIDER") {
      router.push("/provider/dashboard");
    } else {
      router.push("/");
    }
  };

  const totalSteps = 4;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {([1, 2, 3, 4] as const).map((step) => (
            <div
              key={step}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  step < currentStep
                    ? "bg-primary text-primary-foreground"
                    : step === currentStep
                      ? "border-2 border-primary text-primary"
                      : "border-2 border-muted bg-muted/30 text-muted-foreground"
                }`}
              >
                {step}
              </div>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {t(STEP_LABELS[step])}
              </span>
            </div>
          ))}
        </div>
        <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step title */}
      {currentStep !== 4 && (
        <h2 className="text-xl font-semibold">{t(STEP_LABELS[currentStep])}</h2>
      )}

      {/* Step content */}
      {currentStep === 4 && otpUserId ? (
        <OtpVerificationStep
          phone={otpPhone}
          userId={otpUserId}
          onVerified={handleOtpVerified}
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          {currentStep === 1 && (
            <RoleStep
              selectedRole={selectedRole}
              onSelectRole={(role) => setSelectedRole(role)}
              onNext={handleRoleNext}
            />
          )}
          {currentStep === 2 && (
            <PersonalInfoStep
              register={register}
              errors={errors}
              onNext={handlePersonalInfoNext}
              onBack={handlePersonalInfoBack}
            />
          )}
          {currentStep === 3 && (
            <PasswordStep
              register={register}
              errors={errors}
              watch={watch}
              setValue={(name, value) => setValue(name, value as true)}
              isSubmitting={isSubmitting}
              onBack={handlePasswordBack}
            />
          )}
        </form>
      )}
    </div>
  );
}
