import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getAdminUsersAction } from "@/features/admin/actions/admin-queries";
import { UsersDataTable } from "@/features/admin/components/UsersDataTable";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Utilisateurs | Admin",
  };
}

type SearchParams = {
  search?: string;
  role?: string;
  status?: string;
  page?: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations("admin.users");
  const params = await searchParams;

  const filters = {
    search: params.search,
    role: params.role as "CLIENT" | "PROVIDER" | "ADMIN" | undefined,
    status: params.status as "active" | "banned" | "inactive" | undefined,
    page: params.page ? Number(params.page) : 1,
    pageSize: 20,
  };

  const result = await getAdminUsersAction(filters);

  const users = result.success ? result.data.items : [];
  const total = result.success ? result.data.total : 0;
  const currentPage = result.success ? result.data.page : 1;
  const pageSize = result.success ? result.data.pageSize : 20;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
        </div>
        <Badge variant="secondary" className="ml-2 text-base">
          {total}
        </Badge>
      </div>

      {/* Error */}
      {!result.success && (
        <div className="rounded-lg border bg-destructive/10 p-4 text-sm text-destructive">
          {result.error}
        </div>
      )}

      {/* Data Table */}
      <UsersDataTable
        users={users}
        total={total}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  );
}
