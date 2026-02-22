"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { RegisterFormData } from "@/lib/validations/auth";

interface PasswordStepProps {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
  watch: UseFormWatch<RegisterFormData>;
  setValue: (name: "acceptCGU", value: true | undefined) => void;
  isSubmitting: boolean;
  onBack: () => void;
}

function getPasswordStrength(password: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (!password) return { level: 0, label: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: "Faible" };
  if (score <= 2) return { level: 2, label: "Moyen" };
  return { level: 3, label: "Fort" };
}

const STRENGTH_COLORS = {
  0: "",
  1: "bg-destructive",
  2: "bg-yellow-500",
  3: "bg-green-500",
};

const STRENGTH_WIDTHS = {
  0: "w-0",
  1: "w-1/3",
  2: "w-2/3",
  3: "w-full",
};

export function PasswordStep({
  register,
  errors,
  watch,
  setValue,
  isSubmitting,
  onBack,
}: PasswordStepProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordValue = watch("password") ?? "";
  const acceptCGUValue = watch("acceptCGU");
  const strength = getPasswordStrength(passwordValue);

  return (
    <div className="space-y-5">
      {/* Password field */}
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Password strength bar */}
        {passwordValue.length > 0 && (
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  STRENGTH_COLORS[strength.level],
                  STRENGTH_WIDTHS[strength.level],
                )}
              />
            </div>
            {strength.label && (
              <p
                className={cn(
                  "text-xs",
                  strength.level === 1
                    ? "text-destructive"
                    : strength.level === 2
                      ? "text-yellow-600"
                      : "text-green-600",
                )}
              >
                Force : {strength.label}
              </p>
            )}
          </div>
        )}

        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            className="pr-10"
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={
              showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
            }
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* CGU Checkbox */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Checkbox
            id="acceptCGU"
            checked={acceptCGUValue === true}
            onCheckedChange={(checked) => {
              setValue("acceptCGU", checked === true ? true : undefined);
            }}
            className="mt-0.5"
          />
          <Label htmlFor="acceptCGU" className="text-sm font-normal leading-relaxed cursor-pointer">
            {t("acceptCGU")}
          </Label>
        </div>
        {errors.acceptCGU && (
          <p className="text-sm text-destructive">{errors.acceptCGU.message}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onBack}
          disabled={isSubmitting}
        >
          {tCommon("back")}
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tCommon("loading")}
            </>
          ) : (
            t("registerButton")
          )}
        </Button>
      </div>
    </div>
  );
}
