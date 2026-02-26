import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getAdminServicesAction } from "@/features/admin/actions/admin-queries";
import { ServicesDataTable } from "@/features/admin/components/ServicesDataTable";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Services | Admin",
  };
}

interface AdminServicesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    categoryId?: string;
    page?: string;
  }>;
}

export default async function AdminServicesPage({ searchParams }: AdminServicesPageProps) {
  const params = await searchParams;

  const page = Number(params.page ?? 1);
  const pageSize = 20;

  const [servicesResult, categories] = await Promise.all([
    getAdminServicesAction({
      search: params.search,
      status: params.status as
        | "DRAFT"
        | "PENDING_APPROVAL"
        | "ACTIVE"
        | "SUSPENDED"
        | "DELETED"
        | undefined,
      categoryId: params.categoryId,
      page,
      pageSize,
    }),
    prisma.category.findMany({
      where: { isDeleted: false, parentId: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const services = servicesResult.success ? servicesResult.data.items : [];
  const total = servicesResult.success ? servicesResult.data.total : 0;

  return (
    <div>
      <div className="flex items-center gap-3">
        <Briefcase className="h-8 w-8 text-primary" />
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Gestion des services</h1>
          <Badge variant="secondary">{total}</Badge>
        </div>
      </div>

      <div className="mt-8">
        <ServicesDataTable
          services={services}
          total={total}
          currentPage={page}
          pageSize={pageSize}
          categories={categories}
        />
      </div>
    </div>
  );
}
