"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { sendOtpAction } from "@/features/auth/actions/send-otp";
import { verifyOtpAction } from "@/features/auth/actions/verify-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OtpVerificationStepProps {
  phone: string;
  userId: string;
  onVerified: () => void;
}

/**
 * Masks a phone number for display.
 * Example: "+21698765432" → "+216 ** *** 432"
 */
function maskPhone(phone: string): string {
  // Remove spaces for processing
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.length < 4) return phone;
  const last3 = cleaned.slice(-3);
  // Keep country code prefix if present (+216)
  if (cleaned.startsWith("+216") && cleaned.length >= 7) {
    return `+216 ** *** ${last3}`;
  }
  // 8-digit local number
  if (cleaned.length === 8) {
    return `** *** ${last3}`;
  }
  return `** *** ${last3}`;
}

const RESEND_COOLDOWN = 60; // seconds
const OTP_LENGTH = 6;

export function OtpVerificationStep({
  phone,
  userId,
  onVerified,
}: OtpVerificationStepProps) {
  const t = useTranslations("auth");

  // 6 individual digit inputs
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, value: string) => {
    // Accept only digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(null);

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace on empty input moves to previous
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newDigits = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i] ?? "";
    }
    setDigits(newDigits);
    // Focus the last filled input or the next empty one
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length !== OTP_LENGTH) {
      setError(t("otpPlaceholder"));
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyOtpAction(userId, code);
      if (result.success) {
        onVerified();
      } else {
        setError(result.error);
        // Clear digits on error
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError(t("otpInvalid"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const result = await sendOtpAction(userId, phone);
      if (result.success) {
        setResendSuccess(true);
        setResendCooldown(RESEND_COOLDOWN);
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        // Clear success message after 3 seconds
        setTimeout(() => setResendSuccess(false), 3000);
      } else {
        setError(result.error);
      }
    } catch {
      setError(t("otpInvalid"));
    } finally {
      setIsResending(false);
    }
  };

  const maskedPhone = maskPhone(phone);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1 text-center">
        <h3 className="text-lg font-semibold">{t("otpTitle")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("otpSubtitle", { phone: maskedPhone })}
        </p>
      </div>

      {/* 6-digit input */}
      <div className="flex justify-center gap-2">
        {digits.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            className="h-12 w-12 text-center text-lg font-semibold"
            aria-label={`Chiffre ${index + 1}`}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-center text-sm font-medium text-destructive">{error}</p>
      )}

      {/* Resend success message */}
      {resendSuccess && (
        <p className="text-center text-sm font-medium text-green-600">{t("otpSent")}</p>
      )}

      {/* Verify button */}
      <Button
        type="button"
        className="w-full"
        onClick={handleVerify}
        disabled={isVerifying || digits.join("").length !== OTP_LENGTH}
      >
        {isVerifying ? "..." : t("verifyCode")}
      </Button>

      {/* Resend button with countdown */}
      <div className="text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending}
        >
          {resendCooldown > 0
            ? t("resendIn", { seconds: resendCooldown })
            : isResending
              ? "..."
              : t("resendCode")}
        </Button>
      </div>
    </div>
  );
}
