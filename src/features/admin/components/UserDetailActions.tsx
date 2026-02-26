"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  banUserAction,
  unbanUserAction,
  activateUserAction,
  deactivateUserAction,
  deleteUserAction,
} from "@/features/admin/actions/admin-actions";
import type { AdminUserDetail } from "@/features/admin/actions/admin-queries";

// ============================================================
// PROPS
// ============================================================

type UserDetailActionsProps = {
  user: Pick<
    AdminUserDetail,
    "id" | "name" | "role" | "isActive" | "isBanned"
  >;
};

// ============================================================
// COMPONENT
// ============================================================

export function UserDetailActions({ user }: UserDetailActionsProps) {
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("admin.common");
  const router = useRouter();
  const { toast } = useToast();

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleBan() {
    if (banReason.trim().length < 5) return;
    setIsLoading(true);
    try {
      const result = await banUserAction({ userId: user.id, reason: banReason });
      if (result.success) {
        toast({ title: t("banned_success") });
        router.refresh();
        setBanDialogOpen(false);
        setBanReason("");
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnban() {
    setIsLoading(true);
    try {
      const result = await unbanUserAction({ userId: user.id });
      if (result.success) {
        toast({ title: t("unbanned_success") });
        router.refresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleActivate() {
    setIsLoading(true);
    try {
      const result = await activateUserAction(user.id);
      if (result.success) {
        toast({ title: t("activated_success") });
        router.refresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeactivate() {
    setIsLoading(true);
    try {
      const result = await deactivateUserAction(user.id);
      if (result.success) {
        toast({ title: t("deactivated_success") });
        router.refresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsLoading(true);
    try {
      const result = await deleteUserAction(user.id);
      if (result.success) {
        toast({ title: t("deleted_success") });
        router.push("/admin/users");
        setDeleteDialogOpen(false);
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Ban / Unban */}
          {!user.isBanned ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              onClick={() => setBanDialogOpen(true)}
              disabled={isLoading}
            >
              {t("banUser")}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleUnban}
              disabled={isLoading}
            >
              {t("unbanUser")}
            </Button>
          )}

          {/* Activate / Deactivate */}
          {user.isActive ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleDeactivate}
              disabled={isLoading}
            >
              {t("deactivateUser")}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleActivate}
              disabled={isLoading}
            >
              {t("activateUser")}
            </Button>
          )}

          {/* Delete */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isLoading}
          >
            {t("deleteUser")}
          </Button>
        </CardContent>
      </Card>

      {/* Ban Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmBan")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmBanMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="ban-reason-detail">{t("banReason")}</Label>
            <Textarea
              id="ban-reason-detail"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder={t("banReason")}
              rows={3}
              className="resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBan}
              disabled={isLoading || banReason.trim().length < 5}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {t("banUser")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("deleteUser")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
