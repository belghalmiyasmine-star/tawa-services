"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Star, Search } from "lucide-react";

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
import { Button } from "@/components/ui/button";

import { ServiceActionsDropdown } from "./ServiceActionsDropdown";
import type { AdminServiceListItem } from "../actions/admin-queries";

interface Category {
  id: string;
  name: string;
}

interface ServicesDataTableProps {
  services: AdminServiceListItem[];
  total: number;
  currentPage: number;
  pageSize: number;
  categories: Category[];
}

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Brouillon" },
  { value: "PENDING_APPROVAL", label: "En attente" },
  { value: "ACTIVE", label: "Actif" },
  { value: "SUSPENDED", label: "Suspendu" },
  { value: "DELETED", label: "Supprime" },
];

function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    PENDING_APPROVAL: "bg-amber-100 text-amber-700",
    ACTIVE: "bg-green-100 text-green-700",
    SUSPENDED: "bg-red-100 text-red-700",
    DELETED: "bg-gray-100 text-gray-400 line-through",
  };
  const labelMap: Record<string, string> = {
    DRAFT: "Brouillon",
    PENDING_APPROVAL: "En attente",
    ACTIVE: "Actif",
    SUSPENDED: "Suspendu",
    DELETED: "Supprime",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantMap[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {labelMap[status] ?? status}
    </span>
  );
}

export function ServicesDataTable({
  services,
  total,
  currentPage,
  pageSize,
  categories,
}: ServicesDataTableProps) {
  const router = useRouter();
  const t = useTranslations("admin.services");

  const totalPages = Math.ceil(total / pageSize);

  // Search with 300ms debounce
  const [searchValue, setSearchValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push((`/admin/services?${params.toString()}`) as never);
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleStatusFilter(value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value && value !== "all") {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push((`/admin/services?${params.toString()}`) as never);
  }

  function handleCategoryFilter(value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value && value !== "all") {
      params.set("categoryId", value);
    } else {
      params.delete("categoryId");
    }
    params.set("page", "1");
    router.push((`/admin/services?${params.toString()}`) as never);
  }

  function handlePage(page: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(page));
    router.push((`/admin/services?${params.toString()}`) as never);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select onValueChange={handleStatusFilter} defaultValue="all">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={handleCategoryFilter} defaultValue="all">
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t("filterByCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCategories")}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("serviceName")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("category")}</TableHead>
              <TableHead>{t("price")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("featured")}</TableHead>
              <TableHead className="w-12">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Aucun service trouve
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <p className="max-w-[200px] truncate font-medium">
                        {service.title.length > 40
                          ? `${service.title.slice(0, 40)}...`
                          : service.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{service.providerName}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {service.categoryName}
                  </TableCell>
                  <TableCell>
                    {service.price !== null
                      ? `${service.price.toLocaleString("fr-TN")} TND`
                      : "Sur devis"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={service.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {service.isFeatured ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <Star className="h-4 w-4 text-muted-foreground/30" />
                    )}
                  </TableCell>
                  <TableCell>
                    <ServiceActionsDropdown
                      service={{
                        id: service.id,
                        title: service.title,
                        status: service.status,
                        isFeatured: service.isFeatured,
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages} ({total} services)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Precedent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
