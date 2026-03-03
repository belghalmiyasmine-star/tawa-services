"use client";

import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUnreadNotificationCountAction } from "@/features/notification/actions/notification-queries";

import { NotificationDropdown } from "./NotificationDropdown";

// ============================================================
// CONSTANTS
// ============================================================

const POLL_INTERVAL_MS = 15_000; // 15 seconds

// ============================================================
// COMPONENT
// ============================================================

interface NotificationBellProps {
  /** Role-aware URL for "see all notifications" link */
  allNotificationsUrl?: string;
}

export function NotificationBell({
  allNotificationsUrl = "/notifications",
}: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch the unread count from server — stable callback, no deps
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await getUnreadNotificationCountAction();
      if (result.success) {
        setUnreadCount(result.data.count);
      }
    } catch {
      // Silently ignore — badge is non-critical
    }
  }, []);

  // Initial fetch + polling every 10 seconds
  useEffect(() => {
    void fetchUnreadCount();

    intervalRef.current = setInterval(() => {
      void fetchUnreadCount();
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchUnreadCount]);

  // Refetch unread count when dropdown closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      void fetchUnreadCount();
    }
  };

  // Badge label
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unreadCount > 0 ? ` (${badgeLabel} non lues)` : ""}`}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-0 top-0 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
              {badgeLabel}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          allNotificationsUrl={allNotificationsUrl}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
