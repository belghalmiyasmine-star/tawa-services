"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { resetPasswordAction } from "@/features/auth/actions/reset-password";
import type { ResetPasswordFormData } from "@/lib/validations/auth";
import { resetPasswordSchema } from "@/lib/validations/auth";

interface ResetPasswordFormProps {
  token: string;
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
} as const;

const STRENGTH_WIDTHS = {
  0: "w-0",
  1: "w-1/3",
  2: "w-2/3",
  3: "w-full",
} as const;

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations("auth");
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const passwordValue = watch("password") ?? "";
  const strength = getPasswordStrength(passwordValue);

  async function onSubmit(data: ResetPasswordFormData) {
    setServerError(null);
    const result = await resetPasswordAction(data);

    if (result.success) {
      setSuccess(true);
    } else {
      const errorKey =
        result.error === "Token expire"
          ? t("resetTokenExpired")
          : result.error === "Token deja utilise"
            ? t("resetTokenUsed")
            : result.error;
      setServerError(errorKey);
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-green-600 font-medium">{t("resetSuccess")}</p>
        <Button asChild className="w-full">
          <Link href="/auth/login">{t("backToLogin")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Hidden token field */}
      <input type="hidden" {...register("token")} />

      {/* Server error */}
      {serverError && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* New password field */}
      <div className="space-y-2">
        <Label htmlFor="password">{t("newPassword")}</Label>
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

      {/* Confirm password field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("confirmNewPassword")}</Label>
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

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("loading")}
          </>
        ) : (
          t("resetPassword")
        )}
      </Button>
    </form>
  );
}
