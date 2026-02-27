"use client";

import { Bell, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  markAllNotificationsReadAction,
} from "@/features/notification/actions/notification-actions";
import {
  getNotificationsAction,
  type NotificationItem as NotificationItemType,
} from "@/features/notification/actions/notification-queries";

import { NotificationItem } from "./NotificationItem";

// ============================================================
// COMPONENT
// ============================================================

export function NotificationsList() {
  const tNotif = useTranslations("notification");

  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationItemType[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, startMarkAll] = useTransition();

  // Fetch notifications (reset list on filter change)
  const fetchNotifications = useCallback(
    async (filter: "all" | "unread", cursor?: string) => {
      const isLoadMore = !!cursor;
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await getNotificationsAction({
          filter,
          cursor,
          limit: 20,
        });

        if (result.success) {
          if (isLoadMore) {
            setNotifications((prev) => [...prev, ...result.data.notifications]);
          } else {
            setNotifications(result.data.notifications);
          }
          setNextCursor(result.data.nextCursor);
        }
      } finally {
        if (isLoadMore) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [],
  );

  // Initial fetch
  useEffect(() => {
    void fetchNotifications(activeFilter);
  }, [activeFilter, fetchNotifications]);

  const handleFilterChange = (value: string) => {
    setActiveFilter(value as "all" | "unread");
  };

  const handleMarkAllRead = () => {
    startMarkAll(async () => {
      await markAllNotificationsReadAction();
      await fetchNotifications(activeFilter);
    });
  };

  const handleMarkRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const handleLoadMore = () => {
    if (nextCursor) {
      void fetchNotifications(activeFilter, nextCursor);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with mark all read */}
      <div className="flex items-center justify-between">
        <Tabs value={activeFilter} onValueChange={handleFilterChange}>
          <TabsList>
            <TabsTrigger value="all">{tNotif("filters.all")}</TabsTrigger>
            <TabsTrigger value="unread">{tNotif("filters.unread")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={markingAll || loading}
        >
          {markingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            tNotif("markAllRead")
          )}
        </Button>
      </div>

      {/* Notifications list */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Bell className="h-10 w-10 opacity-40" />
            <p className="text-sm">
              {activeFilter === "unread"
                ? "Aucune notification non lue"
                : tNotif("noNotifications")}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                compact={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load more */}
      {nextCursor && !loading && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              "Charger plus"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
