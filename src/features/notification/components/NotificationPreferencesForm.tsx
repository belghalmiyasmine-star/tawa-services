"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  updateNotificationPreferencesAction,
} from "@/features/notification/actions/notification-actions";
import {
  getNotificationPreferencesAction,
} from "@/features/notification/actions/notification-queries";

// ============================================================
// CONSTANTS
// ============================================================

const NOTIF_TYPES = [
  "BOOKING_REQUEST",
  "BOOKING_ACCEPTED",
  "BOOKING_REJECTED",
  "BOOKING_COMPLETED",
  "BOOKING_CANCELLED",
  "QUOTE_RECEIVED",
  "QUOTE_RESPONDED",
  "PAYMENT_RECEIVED",
  "REVIEW_RECEIVED",
  "KYC_APPROVED",
  "KYC_REJECTED",
  "NEW_MESSAGE",
  "SYSTEM",
] as const;

type NotifTypeKey = (typeof NOTIF_TYPES)[number];

// ============================================================
// FORM SCHEMA
// ============================================================

const preferencesSchema = z
  .object({
    emailEnabled: z.boolean(),
    inAppEnabled: z.boolean(),
    quietHoursEnabled: z.boolean(),
    quietHoursStart: z.string().optional(),
    quietHoursEnd: z.string().optional(),
    disabledTypes: z.array(z.string()),
  })
  .refine(
    (data) => {
      if (!data.quietHoursEnabled) return true;
      const timeRegex = /^\d{2}:\d{2}$/;
      return (
        timeRegex.test(data.quietHoursStart ?? "") &&
        timeRegex.test(data.quietHoursEnd ?? "")
      );
    },
    {
      message: "Les heures de silence doivent etre au format HH:MM",
      path: ["quietHoursStart"],
    },
  );

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

// ============================================================
// COMPONENT
// ============================================================

export function NotificationPreferencesForm() {
  const tNotif = useTranslations("notification");
  const { toast } = useToast();
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, startSave] = useTransition();

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema) as never,
    defaultValues: {
      emailEnabled: true,
      inAppEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      disabledTypes: [],
    },
  });

  const { watch, setValue, handleSubmit } = form;
  const emailEnabled = watch("emailEnabled");
  const inAppEnabled = watch("inAppEnabled");
  const quietHoursEnabled = watch("quietHoursEnabled");
  const quietHoursStart = watch("quietHoursStart");
  const quietHoursEnd = watch("quietHoursEnd");
  const disabledTypes = watch("disabledTypes");

  // Load existing preferences on mount
  useEffect(() => {
    async function loadPrefs() {
      try {
        const result = await getNotificationPreferencesAction();
        if (result.success) {
          const prefs = result.data;
          setValue("emailEnabled", prefs.emailEnabled);
          setValue("inAppEnabled", prefs.inAppEnabled);
          setValue(
            "quietHoursEnabled",
            !!(prefs.quietHoursStart && prefs.quietHoursEnd),
          );
          setValue("quietHoursStart", prefs.quietHoursStart ?? "22:00");
          setValue("quietHoursEnd", prefs.quietHoursEnd ?? "08:00");
          setValue("disabledTypes", prefs.disabledTypes);
        }
      } finally {
        setInitialLoading(false);
      }
    }
    void loadPrefs();
  }, [setValue]);

  const isTypeDisabled = (type: NotifTypeKey) => disabledTypes.includes(type);

  const toggleType = (type: NotifTypeKey) => {
    const current = disabledTypes;
    if (current.includes(type)) {
      setValue(
        "disabledTypes",
        current.filter((t) => t !== type),
        { shouldValidate: false },
      );
    } else {
      setValue("disabledTypes", [...current, type], { shouldValidate: false });
    }
  };

  const onSubmit = (values: PreferencesFormValues) => {
    startSave(async () => {
      const result = await updateNotificationPreferencesAction({
        emailEnabled: values.emailEnabled,
        inAppEnabled: values.inAppEnabled,
        quietHoursStart:
          values.quietHoursEnabled && values.quietHoursStart
            ? values.quietHoursStart
            : null,
        quietHoursEnd:
          values.quietHoursEnabled && values.quietHoursEnd
            ? values.quietHoursEnd
            : null,
        disabledTypes: values.disabledTypes,
      });

      if (result.success) {
        toast({
          title: tNotif("preferences.saved"),
          description: "Vos preferences de notification ont ete mises a jour.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result.error ?? "Impossible de sauvegarder les preferences.",
        });
      }
    });
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Section: In-app notifications master toggle */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{tNotif("preferences.inAppEnabled")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Recevoir des notifications dans l&apos;application
            </p>
          </div>
          <Switch
            checked={inAppEnabled}
            onCheckedChange={(v) => setValue("inAppEnabled", v)}
            aria-label={tNotif("preferences.inAppEnabled")}
          />
        </div>
      </div>

      {/* Section: Email notifications master toggle */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{tNotif("preferences.emailEnabled")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Recevoir des notifications par email
            </p>
          </div>
          <Switch
            checked={emailEnabled}
            onCheckedChange={(v) => setValue("emailEnabled", v)}
            aria-label={tNotif("preferences.emailEnabled")}
          />
        </div>
      </div>

      {/* Section: Per-type toggles */}
      <div className="rounded-lg border bg-card">
        <div className="border-b px-6 py-4">
          <h3 className="font-semibold">Types de notification</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Activez ou desactivez des types de notification specifiques
          </p>
        </div>
        <div className="divide-y">
          {NOTIF_TYPES.map((type) => {
            const disabled = isTypeDisabled(type);
            return (
              <div
                key={type}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {tNotif(`types.${type}` as Parameters<typeof tNotif>[0])}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  {/* In-app toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">In-app</span>
                    <Switch
                      checked={!disabled && inAppEnabled}
                      onCheckedChange={() => toggleType(type)}
                      disabled={!inAppEnabled}
                      aria-label={`In-app notifications for ${type}`}
                    />
                  </div>
                  {/* Email toggle (mirrors in-app — both controlled by disabledTypes) */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Email</span>
                    <Switch
                      checked={!disabled && emailEnabled}
                      onCheckedChange={() => toggleType(type)}
                      disabled={!emailEnabled}
                      aria-label={`Email notifications for ${type}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section: Quiet hours */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{tNotif("preferences.quietHours")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pendant les heures de silence, les notifications email sont suspendues.
            </p>
          </div>
          <Switch
            checked={quietHoursEnabled}
            onCheckedChange={(v) => setValue("quietHoursEnabled", v)}
            aria-label="Activer les heures de silence"
          />
        </div>

        {quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="quietHoursStart">
                {tNotif("preferences.quietHoursStart")}
              </Label>
              <Input
                id="quietHoursStart"
                type="time"
                value={quietHoursStart}
                onChange={(e) => setValue("quietHoursStart", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quietHoursEnd">
                {tNotif("preferences.quietHoursEnd")}
              </Label>
              <Input
                id="quietHoursEnd"
                type="time"
                value={quietHoursEnd}
                onChange={(e) => setValue("quietHoursEnd", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="min-w-[180px]">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            tNotif("preferences.save")
          )}
        </Button>
      </div>
    </form>
  );
}
