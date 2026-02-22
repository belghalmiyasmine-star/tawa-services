"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";

import type { Role } from "@/types";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * RoleGuard — Client component that conditionally renders children based on user role.
 *
 * Usage:
 *   <RoleGuard allowedRoles={["ADMIN", "PROVIDER"]}>
 *     <SomeAdminOrProviderUI />
 *   </RoleGuard>
 *
 * - While session is loading: renders a loading skeleton
 * - If user's role is in allowedRoles: renders children
 * - Otherwise (no session or wrong role): renders fallback (default null)
 */
export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { data: session, status } = useSession();

  // Session is being fetched — show a minimal loading indicator
  if (status === "loading") {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-32 rounded bg-muted" />
      </div>
    );
  }

  // No session — user is not authenticated
  if (!session?.user) {
    return <>{fallback}</>;
  }

  // Check if user's role is in the allowed roles list
  if (allowedRoles.includes(session.user.role as Role)) {
    return <>{children}</>;
  }

  // Role not allowed — render fallback
  return <>{fallback}</>;
}
