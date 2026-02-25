"use client";

import {
  Bell,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  Shield,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { NotificationItem as NotificationItemType } from "@/features/notification/actions/notification-queries";

// ============================================================
// HELPERS
// ============================================================

/**
 * Returns a relative time string for the given date.
 */
function timeAgo(date: Date, tNotif: ReturnType<typeof useTranslations>): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return tNotif("timeAgo.justNow");
  if (minutes < 60) return tNotif("timeAgo.minutesAgo", { count: minutes });
  if (hours < 24) return tNotif("timeAgo.hoursAgo", { count: hours });
  return tNotif("timeAgo.daysAgo", { count: days });
}

type NotifType = NotificationItemType["type"];

/** Icon + color for each notification type. */
function getTypeConfig(type: NotifType): {
  Icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  iconClass: string;
} {
  switch (type) {
    case "BOOKING_REQUEST":
    case "BOOKING_ACCEPTED":
    case "BOOKING_REJECTED":
    case "BOOKING_COMPLETED":
    case "BOOKING_CANCELLED":
      return {
        Icon: CalendarCheck,
        bgClass: "bg-blue-100 dark:bg-blue-900/40",
        iconClass: "text-blue-600 dark:text-blue-400",
      };
    case "PAYMENT_RECEIVED":
      return {
        Icon: CreditCard,
        bgClass: "bg-green-100 dark:bg-green-900/40",
        iconClass: "text-green-600 dark:text-green-400",
      };
    case "REVIEW_RECEIVED":
      return {
        Icon: Star,
        bgClass: "bg-yellow-100 dark:bg-yellow-900/40",
        iconClass: "text-yellow-600 dark:text-yellow-400",
      };
    case "NEW_MESSAGE":
      return {
        Icon: MessageSquare,
        bgClass: "bg-purple-100 dark:bg-purple-900/40",
        iconClass: "text-purple-600 dark:text-purple-400",
      };
    case "KYC_APPROVED":
    case "KYC_REJECTED":
      return {
        Icon: Shield,
        bgClass: "bg-orange-100 dark:bg-orange-900/40",
        iconClass: "text-orange-600 dark:text-orange-400",
      };
    case "SYSTEM":
    case "QUOTE_RECEIVED":
    case "QUOTE_RESPONDED":
    default:
      return {
        Icon: Bell,
        bgClass: "bg-gray-100 dark:bg-gray-800",
        iconClass: "text-gray-600 dark:text-gray-400",
      };
  }
}

/**
 * Build the navigation URL from notification data fields.
 */
function getNotificationUrl(
  type: NotifType,
  data: Record<string, string> | null,
): string | null {
  if (!data) return null;

  switch (type) {
    case "BOOKING_REQUEST":
    case "BOOKING_ACCEPTED":
    case "BOOKING_REJECTED":
    case "BOOKING_COMPLETED":
    case "BOOKING_CANCELLED":
      return data["bookingId"] ? `/bookings/${data["bookingId"]}` : null;
    case "PAYMENT_RECEIVED":
      return data["bookingId"] ? `/bookings/${data["bookingId"]}` : null;
    case "REVIEW_RECEIVED":
      return data["bookingId"] ? `/bookings/${data["bookingId"]}` : null;
    case "NEW_MESSAGE":
      return data["bookingId"] ? `/bookings/${data["bookingId"]}` : null;
    case "QUOTE_RECEIVED":
    case "QUOTE_RESPONDED":
      return data["bookingId"] ? `/bookings/${data["bookingId"]}` : null;
    case "KYC_APPROVED":
    case "KYC_REJECTED":
      return "/provider/kyc";
    default:
      return null;
  }
}

// ============================================================
// PROPS
// ============================================================

interface NotificationItemProps {
  notification: NotificationItemType;
  onMarkRead?: (id: string) => void;
  compact?: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

export function NotificationItem({
  notification,
  onMarkRead,
  compact = false,
}: NotificationItemProps) {
  const tNotif = useTranslations("notification");
  const { Icon, bgClass, iconClass } = getTypeConfig(notification.type);
  const url = getNotificationUrl(notification.type, notification.data);

  const relativeTime = timeAgo(new Date(notification.createdAt), tNotif);

  const handleClick = () => {
    if (!notification.read && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (url) {
      window.location.href = url;
    }
  };

  const unreadStyles = notification.read
    ? "bg-transparent"
    : "bg-blue-50 dark:bg-blue-950/20 border-l-2 border-blue-500";

  const paddingStyles = compact ? "px-3 py-2" : "px-4 py-3";

  return (
    <div
      role={url ? "button" : undefined}
      tabIndex={url ? 0 : undefined}
      onClick={url ? handleClick : undefined}
      onKeyDown={
        url
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") handleClick();
            }
          : undefined
      }
      className={[
        "flex items-start gap-3 transition-colors",
        paddingStyles,
        unreadStyles,
        url ? "cursor-pointer hover:bg-muted/50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Icon */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bgClass}`}
      >
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug text-sm">{notification.title}</p>
        {notification.body && (
          <p
            className={[
              "text-sm text-muted-foreground",
              compact ? "line-clamp-1" : "line-clamp-2",
            ].join(" ")}
          >
            {notification.body}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{relativeTime}</p>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </div>
  );
}
