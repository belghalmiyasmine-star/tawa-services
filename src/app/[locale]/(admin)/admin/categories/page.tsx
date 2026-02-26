import type { Metadata } from "next";
import { Grid2X2 } from "lucide-react";

import { getCategoriesTreeAction } from "@/features/admin/actions/category-actions";
import { CategoryTreeView } from "@/features/admin/components/CategoryTreeView";
import type { CategoryTreeItem } from "@/features/admin/actions/category-actions";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Categories | Admin",
  };
}

export default async function AdminCategoriesPage() {
  const result = await getCategoriesTreeAction();
  const categories: CategoryTreeItem[] = result.success ? result.data : [];

  return (
    <div>
      <div className="flex items-center gap-3">
        <Grid2X2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Gestion des categories</h1>
      </div>

      <div className="mt-8">
        <CategoryTreeView categories={categories} />
      </div>
    </div>
  );
}
