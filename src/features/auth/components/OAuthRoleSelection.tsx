"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, Search } from "lucide-react";
import { useSession } from "next-auth/react";

import { setOAuthRoleAction } from "@/features/auth/actions/set-oauth-role";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RoleOption = "CLIENT" | "PROVIDER";

interface RoleCard {
  role: RoleOption;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function OAuthRoleSelection() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { update } = useSession();

  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleCards: RoleCard[] = [
    {
      role: "CLIENT",
      icon: <Search className="h-8 w-8" />,
      title: t("oauthRoleClient"),
      description: t("oauthRoleClientDesc"),
    },
    {
      role: "PROVIDER",
      icon: <Briefcase className="h-8 w-8" />,
      title: t("oauthRoleProvider"),
      description: t("oauthRoleProviderDesc"),
    },
  ];

  const handleConfirm = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await setOAuthRoleAction(selectedRole);

      if (!result.success) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Update the session to reflect the new role
      await update({ role: selectedRole });

      // Redirect to role-specific dashboard
      router.push(result.data.redirectTo as "/provider/dashboard" | "/dashboard");
    } catch {
      setError("Une erreur est survenue. Veuillez reessayer.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Role selection cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {roleCards.map(({ role, icon, title, description }) => (
          <button
            key={role}
            type="button"
            onClick={() => setSelectedRole(role)}
            className={cn(
              "flex flex-col items-center gap-3 rounded-lg border-2 p-6 text-center transition-all",
              "hover:border-primary hover:bg-primary/5",
              selectedRole === role
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-background",
            )}
          >
            <div
              className={cn(
                "rounded-full p-3 transition-colors",
                selectedRole === role
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {icon}
            </div>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Confirm button */}
      <Button
        type="button"
        className="w-full"
        disabled={!selectedRole || isSubmitting}
        onClick={handleConfirm}
      >
        {isSubmitting ? t("loading") : t("oauthRoleConfirm")}
      </Button>
    </div>
  );
}
