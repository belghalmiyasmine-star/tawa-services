"use client";

import { useTranslations } from "next-intl";
import type { UseFormRegister, FieldErrors } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RegisterFormData } from "@/lib/validations/auth";

interface PersonalInfoStepProps {
  register: UseFormRegister<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
  onNext: () => void;
  onBack: () => void;
}

export function PersonalInfoStep({ register, errors, onNext, onBack }: PersonalInfoStepProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  return (
    <div className="space-y-5">
      {/* First Name + Last Name */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            placeholder="Mohamed"
            {...register("firstName")}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <Input
            id="lastName"
            autoComplete="family-name"
            placeholder="Ben Ali"
            {...register("lastName")}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="mohamed.benali@example.com"
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
            +216
          </span>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="20 123 456"
            className="pl-14"
            {...register("phone")}
          />
        </div>
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          {tCommon("back")}
        </Button>
        <Button type="button" className="flex-1" onClick={onNext}>
          {tCommon("next")}
        </Button>
      </div>
    </div>
  );
}
