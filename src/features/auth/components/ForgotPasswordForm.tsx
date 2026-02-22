"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/routing";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/features/auth/actions/forgot-password";
import type { ForgotPasswordFormData } from "@/lib/validations/auth";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const pathname = usePathname();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    // Extract locale from pathname
    const locale = pathname.split("/")[1] ?? "fr";
    await forgotPasswordAction(data, locale);
    // Always show success message (don't reveal if email exists)
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">{t("resetSent")}</p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">{t("backToLogin")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Email field */}
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="votre@email.com"
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("loading")}
          </>
        ) : (
          t("sendResetLink")
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/auth/login" className="underline hover:no-underline">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
