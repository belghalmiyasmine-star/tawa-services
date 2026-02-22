"use client";

import Image from "next/image";
import { useState, useTransition } from "react";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { confirm2faAction, setup2faAction } from "@/features/auth/actions/setup-2fa";
import { disable2faAction } from "@/features/auth/actions/disable-2fa";

interface TwoFactorSetupProps {
  isEnabled: boolean;
  method?: string | null;
  userPhone?: string | null;
}

type Step = "idle" | "setup" | "confirm";

export function TwoFactorSetup({ isEnabled, method, userPhone }: TwoFactorSetupProps) {
  const t = useTranslations("auth");
  const [step, setStep] = useState<Step>("idle");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStartTotpSetup = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await setup2faAction("TOTP");
      if (result.success && result.data?.qrCodeUrl) {
        setQrCodeUrl(result.data.qrCodeUrl);
        setManualKey(result.data.secret ?? null);
        setStep("setup");
      } else {
        setError(result.error ?? t("twoFactorSetupError"));
      }
    });
  };

  const handleEnableSms = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await setup2faAction("SMS");
      if (result.success) {
        setSuccess(t("twoFactorEnabled"));
        window.location.reload();
      } else {
        setError(result.error ?? t("twoFactorSetupError"));
      }
    });
  };

  const handleConfirmSetup = () => {
    setError(null);
    if (!confirmCode || confirmCode.length < 6) {
      setError(t("otpInvalid"));
      return;
    }
    startTransition(async () => {
      const result = await confirm2faAction(confirmCode);
      if (result.success) {
        setSuccess(t("twoFactorEnabled"));
        setStep("idle");
        window.location.reload();
      } else {
        setError(result.error ?? t("twoFactorSetupError"));
      }
    });
  };

  const handleDisable2fa = () => {
    setError(null);
    if (!disablePassword) {
      setError(t("currentPassword") + " requis");
      return;
    }
    startTransition(async () => {
      const result = await disable2faAction(disablePassword);
      if (result.success) {
        setSuccess(t("twoFactorDisabled"));
        setDisablePassword("");
        window.location.reload();
      } else {
        setError(result.error ?? t("twoFactorSetupError"));
      }
    });
  };

  // Already enabled — show disable section
  if (isEnabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            {t("twoFactorEnabled")} ({method ?? "TOTP"})
          </span>
        </div>
        <p className="text-muted-foreground text-sm">{t("disableTwoFactorDesc")}</p>
        <div className="space-y-2">
          <Label htmlFor="disablePassword">{t("currentPassword")}</Label>
          <Input
            id="disablePassword"
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        <Button
          variant="destructive"
          onClick={handleDisable2fa}
          disabled={isPending}
        >
          {isPending ? t("loading") : t("disableTwoFactor")}
        </Button>
      </div>
    );
  }

  // Setup flow
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{t("twoFactorDesc")}</p>

      <Tabs defaultValue="totp">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="totp">{t("twoFactorTotp")}</TabsTrigger>
          <TabsTrigger value="sms">{t("twoFactorSms")}</TabsTrigger>
        </TabsList>

        {/* TOTP Tab */}
        <TabsContent value="totp" className="space-y-4">
          {step === "idle" && (
            <div className="space-y-3">
              <p className="text-sm">{t("scanQrCodeDesc")}</p>
              <Button onClick={handleStartTotpSetup} disabled={isPending}>
                {isPending ? t("loading") : t("twoFactorSetup")}
              </Button>
            </div>
          )}

          {step === "setup" && qrCodeUrl && (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">{t("scanQrCode")}</p>
                <div className="inline-block rounded border p-2">
                  <Image
                    src={qrCodeUrl}
                    alt="QR Code 2FA"
                    width={200}
                    height={200}
                    unoptimized
                  />
                </div>
              </div>

              {manualKey && (
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">{t("manualEntryKey")}</p>
                  <code className="bg-muted rounded px-2 py-1 font-mono text-xs break-all">
                    {manualKey}
                  </code>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="confirmCode">{t("confirmSetup")}</Label>
                <Input
                  id="confirmCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="max-w-[200px] font-mono tracking-widest"
                />
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              <div className="flex gap-2">
                <Button onClick={handleConfirmSetup} disabled={isPending}>
                  {isPending ? t("loading") : t("confirmSetup")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("idle");
                    setQrCodeUrl(null);
                    setManualKey(null);
                    setConfirmCode("");
                    setError(null);
                  }}
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          )}

          {error && step === "idle" && (
            <p className="text-destructive text-sm">{error}</p>
          )}
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms" className="space-y-4">
          <p className="text-sm">{t("twoFactorSmsDesc")}</p>
          {userPhone && (
            <p className="text-muted-foreground text-sm">
              {t("otpSubtitle", { phone: userPhone })}
            </p>
          )}
          {error && <p className="text-destructive text-sm">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <Button onClick={handleEnableSms} disabled={isPending}>
            {isPending ? t("loading") : t("twoFactorSetup")}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
