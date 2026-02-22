"use client";

import { useEffect, useState, useTransition } from "react";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendOtpAction } from "@/features/auth/actions/send-otp";
import { verify2faLoginAction } from "@/features/auth/actions/verify-2fa";

interface TwoFactorChallengeProps {
  userId: string;
  method: "TOTP" | "SMS";
  phone?: string;
  callbackUrl?: string;
}

const RESEND_COOLDOWN = 60; // seconds

export function TwoFactorChallenge({
  userId,
  method,
  phone,
  callbackUrl = "/",
}: TwoFactorChallengeProps) {
  const t = useTranslations("auth");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [countdown, setCountdown] = useState(0);

  // Start countdown for SMS resend
  useEffect(() => {
    if (method === "SMS" && countdown === 0) {
      setCountdown(RESEND_COOLDOWN);
    }
  }, [method, countdown]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendSms = () => {
    if (!phone) return;
    setCountdown(RESEND_COOLDOWN);
    startTransition(async () => {
      await sendOtpAction(userId, phone);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code || code.length < 6) {
      setError(t("otpInvalid"));
      return;
    }

    startTransition(async () => {
      const result = await verify2faLoginAction(userId, code, method);

      if (result.success) {
        // 2FA verified — reload to complete the session and redirect
        window.location.href = callbackUrl;
      } else {
        setError(result.error ?? t("otpIncorrect"));
      }
    });
  };

  const maskedPhone = phone
    ? phone.replace(/(\+216\s?)(\d{2})(\d{3})(\d{3})/, "+216 $2 *** $4")
    : undefined;

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("twoFactorChallenge")}</h1>
        <p className="text-muted-foreground text-sm">
          {method === "TOTP"
            ? t("enterAuthCode")
            : t("enterSmsCode", { phone: maskedPhone ?? "***" })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">
            {method === "TOTP" ? t("twoFactorTotp") : t("twoFactorSms")}
          </Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="max-w-[200px] font-mono text-center tracking-[0.5em] text-lg"
            autoFocus
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={isPending || code.length < 6}>
          {isPending ? t("loading") : t("verifyCode")}
        </Button>

        {method === "SMS" && phone && (
          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm"
            onClick={handleResendSms}
            disabled={countdown > 0 || isPending}
          >
            {countdown > 0 ? t("resendIn", { seconds: countdown }) : t("resendCode")}
          </Button>
        )}
      </form>
    </div>
  );
}
