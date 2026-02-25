"use client";

import { Bell, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  markAllNotificationsReadAction,
} from "@/features/notification/actions/notification-actions";
import {
  getNotificationsAction,
  type NotificationItem as NotificationItemType,
} from "@/features/notification/actions/notification-queries";
import { Link } from "@/i18n/routing";

import { NotificationItem } from "./NotificationItem";

// ============================================================
// PROPS
// ============================================================

interface NotificationDropdownProps {
  onClose: () => void;
  /** Role-aware link for "see all" — defaults to /notifications */
  allNotificationsUrl?: string;
}

// ============================================================
// COMPONENT
// ============================================================

export function NotificationDropdown({
  onClose,
  allNotificationsUrl = "/notifications",
}: NotificationDropdownProps) {
  const tNotif = useTranslations("notification");

  const [notifications, setNotifications] = useState<NotificationItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, startMarkAll] = useTransition();

  // Fetch recent notifications (latest 5)
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getNotificationsAction({ limit: 5 });
      if (result.success) {
        setNotifications(result.data.notifications);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = () => {
    startMarkAll(async () => {
      await markAllNotificationsReadAction();
      await fetchNotifications();
    });
  };

  const handleMarkRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold text-sm">{tNotif("title")}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleMarkAllRead}
          disabled={markingAll || loading}
        >
          {markingAll ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            tNotif("markAllRead")
          )}
        </Button>
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <Bell className="h-8 w-8 opacity-40" />
            <p className="text-sm">{tNotif("noNotifications")}</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        <Link
          href={allNotificationsUrl as never}
          className="block text-center text-sm font-medium text-primary hover:underline"
          onClick={onClose}
        >
          Voir toutes les notifications
        </Link>
      </div>
    </div>
  );
}
