"use client";

import { Briefcase, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Role = "CLIENT" | "PROVIDER";

interface RoleStepProps {
  selectedRole: Role | null;
  onSelectRole: (role: Role) => void;
  onNext: () => void;
}

const ROLE_OPTIONS: Array<{
  role: Role;
  Icon: React.ElementType;
  labelKey: "roleClient" | "roleProvider";
}> = [
  { role: "CLIENT", Icon: Search, labelKey: "roleClient" },
  { role: "PROVIDER", Icon: Briefcase, labelKey: "roleProvider" },
];

export function RoleStep({ selectedRole, onSelectRole, onNext }: RoleStepProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {ROLE_OPTIONS.map(({ role, Icon, labelKey }) => (
          <button
            key={role}
            type="button"
            onClick={() => onSelectRole(role)}
            className="rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card
              className={cn(
                "cursor-pointer border-2 transition-colors hover:border-primary/60",
                selectedRole === role ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full",
                    selectedRole === role
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <p className="text-base font-semibold">{t(labelKey)}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <Button type="button" className="w-full" disabled={!selectedRole} onClick={onNext}>
        {tCommon("next")}
      </Button>
    </div>
  );
}
