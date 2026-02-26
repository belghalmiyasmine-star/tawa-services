import type { Metadata } from "next";
import { Bell } from "lucide-react";

import { getSystemNotificationHistoryAction } from "@/features/admin/actions/system-notification-actions";
import { SystemNotificationForm } from "@/features/admin/components/SystemNotificationForm";

export const metadata: Metadata = {
  title: "Notifications | Admin",
};

export default async function AdminNotificationsPage() {
  const historyResult = await getSystemNotificationHistoryAction(1, 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Notifications systeme</h1>
          <p className="text-muted-foreground">
            Envoyez des notifications a tous les utilisateurs ou segments specifiques
          </p>
        </div>
      </div>

      {/* Notification Form + History */}
      <SystemNotificationForm
        history={historyResult.success ? historyResult.data.items : []}
      />
    </div>
  );
}
