"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserActionsDropdown } from "./UserActionsDropdown";
import type { AdminUserListItem } from "@/features/admin/actions/admin-queries";

// ============================================================
// HELPERS
// ============================================================

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

const ROLE_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  CLIENT: "default",
  PROVIDER: "secondary",
  ADMIN: "outline",
};

// ============================================================
// PROPS
// ============================================================

type UsersDataTableProps = {
  users: AdminUserListItem[];
  total: number;
  currentPage: number;
  pageSize: number;
};

// ============================================================
// COMPONENT
// ============================================================

export function UsersDataTable({
  users,
  total,
  currentPage,
  pageSize,
}: UsersDataTableProps) {
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("admin.common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize from URL
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") ?? "",
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.ceil(total / pageSize);
  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  // Push URL params helper
  const pushParams = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(overrides).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Reset page on filter change
      if (!("page" in overrides)) {
        params.delete("page");
      }

      router.push(
        (`${pathname}?${params.toString()}`) as never,
      );
    },
    [router, pathname, searchParams],
  );

  // Debounced search
  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams({ search: value });
    }, 300);
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Role Filter */}
        <Select
          value={searchParams.get("role") ?? "all"}
          onValueChange={(value) => pushParams({ role: value })}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t("filterByRole")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allRoles")}</SelectItem>
            <SelectItem value="CLIENT">Client</SelectItem>
            <SelectItem value="PROVIDER">Prestataire</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={searchParams.get("status") ?? "all"}
          onValueChange={(value) => pushParams({ status: value })}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t("filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="active">{t("active")}</SelectItem>
            <SelectItem value="banned">{t("banned")}</SelectItem>
            <SelectItem value="inactive">{t("inactive")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("email")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("joinedAt")}</TableHead>
              <TableHead className="w-10">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  {tCommon("noResults")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  {/* Avatar + Name */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? ""} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {user.name ?? "—"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Email — hidden on mobile */}
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {user.email}
                  </TableCell>

                  {/* Role Badge */}
                  <TableCell>
                    <Badge variant={ROLE_BADGE[user.role] ?? "default"}>
                      {user.role === "CLIENT"
                        ? "Client"
                        : user.role === "PROVIDER"
                          ? "Prestataire"
                          : "Admin"}
                    </Badge>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    {user.isBanned ? (
                      <Badge variant="destructive">{t("banned")}</Badge>
                    ) : user.isActive ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100">
                        {t("active")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{t("inactive")}</Badge>
                    )}
                  </TableCell>

                  {/* Join Date — hidden on mobile */}
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {new Intl.DateTimeFormat("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(user.createdAt))}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <UserActionsDropdown
                      user={{
                        id: user.id,
                        name: user.name,
                        role: user.role,
                        isActive: user.isActive,
                        isBanned: user.isBanned,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {tCommon("showing")} {startItem} {tCommon("to")} {endItem}{" "}
            {tCommon("of")} {total} {tCommon("total")}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() =>
                pushParams({ page: String(currentPage - 1) })
              }
            >
              {tCommon("previous")}
            </Button>
            <span className="text-sm">
              {tCommon("page")} {currentPage} {tCommon("of")} {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() =>
                pushParams({ page: String(currentPage + 1) })
              }
            >
              {tCommon("next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
