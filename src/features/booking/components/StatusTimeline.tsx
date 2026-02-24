// ============================================================
// STATUS TIMELINE
// ============================================================
// Reusable component — used by both client and provider booking detail pages.
//
// Shows booking progression through 4 steps (PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED).
// Handles alternative terminal paths: REJECTED and CANCELLED.
// ============================================================

import type { BookingStatus } from "@prisma/client";

// ============================================================
// TYPES
// ============================================================

export interface StatusTimelineProps {
  booking: {
    status: BookingStatus;
    createdAt: Date;
    scheduledAt?: Date | null;
    completedAt?: Date | null;
    cancelledAt?: Date | null;
    cancelledBy?: string | null;
  };
}

// ============================================================
// CONSTANTS
// ============================================================

const STATUS_ORDER: BookingStatus[] = [
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
];

// ============================================================
// HELPERS
// ============================================================

function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * StatusTimeline — Vertical timeline showing booking status progression.
 *
 * Normal path:      PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED
 * Terminal (cancel): PENDING -> ANNULEE (with cancelledBy info)
 * Terminal (reject): PENDING -> REJETEE
 *
 * Visual design:
 * - Active/completed steps: primary color dot
 * - Current step: animated pulse dot
 * - Future steps: muted gray dot + dashed connector
 * - Cancelled/rejected: red dot at terminal step
 * - Each step shows timestamp when available
 */
export function StatusTimeline({ booking }: StatusTimelineProps) {
  const { status, createdAt, scheduledAt, completedAt, cancelledAt, cancelledBy } = booking;

  const isTerminal = status === "REJECTED" || status === "CANCELLED";

  type TimelineStep = {
    status: BookingStatus;
    label: string;
    sublabel?: string;
    timestamp?: Date | null;
  };

  const steps: TimelineStep[] = isTerminal
    ? [
        {
          status: "PENDING" as BookingStatus,
          label: "Reservation creee",
          timestamp: createdAt,
        },
        {
          status,
          label: status === "REJECTED" ? "Rejetee par le prestataire" : "Reservation annulee",
          sublabel:
            status === "CANCELLED" && cancelledBy
              ? cancelledBy === "CLIENT"
                ? "par le client"
                : "par le prestataire"
              : undefined,
          timestamp: cancelledAt ?? null,
        },
      ]
    : [
        {
          status: "PENDING" as BookingStatus,
          label: "Reservation creee",
          timestamp: createdAt,
        },
        {
          status: "ACCEPTED" as BookingStatus,
          label: "Acceptee par le prestataire",
          timestamp: null,
        },
        {
          status: "IN_PROGRESS" as BookingStatus,
          label: "Service en cours",
          timestamp: scheduledAt ?? null,
        },
        {
          status: "COMPLETED" as BookingStatus,
          label: "Service termine",
          timestamp: completedAt ?? null,
        },
      ];

  const currentStatusIndex = isTerminal
    ? steps.length - 1
    : STATUS_ORDER.indexOf(status);

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const stepStatusIndex = isTerminal
          ? index
          : STATUS_ORDER.indexOf(step.status);

        const isCompleted = !isTerminal && stepStatusIndex < currentStatusIndex;
        const isCurrent = isTerminal
          ? index === steps.length - 1
          : step.status === status;
        const isFuture = !isTerminal && stepStatusIndex > currentStatusIndex;
        const isTerminalStep = isTerminal && isCurrent;

        // Dot styling
        const dotClass = isTerminalStep
          ? status === "CANCELLED"
            ? "h-3 w-3 rounded-full bg-red-500 ring-4 ring-red-100 dark:ring-red-900"
            : "h-3 w-3 rounded-full bg-red-500 ring-4 ring-red-100 dark:ring-red-900"
          : isCurrent
            ? "h-3 w-3 animate-pulse rounded-full bg-primary ring-4 ring-primary/20"
            : isCompleted
              ? "h-3 w-3 rounded-full bg-primary"
              : "h-3 w-3 rounded-full bg-muted-foreground/30";

        // Connector line between steps
        const lineClass = index < steps.length - 1
          ? isCompleted || isCurrent
            ? "w-0.5 flex-1 bg-primary/40"
            : "w-0.5 flex-1 border-l border-dashed border-muted-foreground/30"
          : "";

        return (
          <li key={step.status + String(index)} className="flex gap-3">
            {/* Left: dot + vertical line */}
            <div className="flex flex-col items-center">
              <div className="flex h-5 w-5 items-center justify-center">
                <div className={dotClass} />
              </div>
              {index < steps.length - 1 && (
                <div className={`mt-0 h-8 ${lineClass}`} />
              )}
            </div>

            {/* Right: step content */}
            <div className="pb-2 pt-0.5">
              <p
                className={`text-sm font-medium leading-5 ${
                  isTerminalStep
                    ? "text-red-600 dark:text-red-400"
                    : isCurrent
                      ? "text-primary"
                      : isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                }`}
              >
                {step.label}
                {step.sublabel && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({step.sublabel})
                  </span>
                )}
              </p>
              {step.timestamp && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {index === 2
                    ? formatDateTime(step.timestamp)
                    : formatDate(step.timestamp)}
                </p>
              )}
              {!step.timestamp && index === 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(createdAt)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
