"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/routing";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

import { updateReportAction } from "../actions/admin-actions";

interface ReportActionsDropdownProps {
  reportId: string;
  status: string;
  onViewDetail: () => void;
}

export function ReportActionsDropdown({
  reportId,
  status,
  onViewDetail,
}: ReportActionsDropdownProps) {
  const t = useTranslations("admin.reports");
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(
    newStatus: "INVESTIGATING" | "RESOLVED" | "DISMISSED",
  ) {
    setLoading(true);
    try {
      const result = await updateReportAction({
        reportId,
        status: newStatus,
      });
      if (result.success) {
        toast({ title: t("updated_success") });
        router.refresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }

  const isClosed = status === "RESOLVED" || status === "DISMISSED";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={loading}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={onViewDetail}>
          Voir les details
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {status === "OPEN" && (
          <DropdownMenuItem
            disabled={loading}
            onClick={() => handleStatusChange("INVESTIGATING")}
          >
            {t("investigate")}
          </DropdownMenuItem>
        )}

        {status === "INVESTIGATING" && (
          <>
            <DropdownMenuItem
              disabled={loading}
              onClick={() => handleStatusChange("RESOLVED")}
            >
              {t("resolve")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={loading}
              onClick={() => handleStatusChange("DISMISSED")}
            >
              {t("dismiss")}
            </DropdownMenuItem>
          </>
        )}

        {isClosed && (
          <DropdownMenuItem disabled className="text-muted-foreground">
            Dossier cloture
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
