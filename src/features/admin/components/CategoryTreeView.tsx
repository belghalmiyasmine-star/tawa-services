"use client";

import { useCallback, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

import { CategoryDialog } from "./CategoryDialog";
import {
  toggleCategoryActiveAction,
  deleteCategoryAction,
  type CategoryTreeItem,
} from "../actions/category-actions";

// ============================================================
// TREE BUILDING
// ============================================================

interface CategoryNode extends CategoryTreeItem {
  children: CategoryNode[];
}

function buildTree(flat: CategoryTreeItem[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  // Create nodes
  flat.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  // Assign children
  flat.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort by sortOrder
  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

// ============================================================
// CATEGORY ROW
// ============================================================

interface CategoryRowProps {
  node: CategoryNode;
  depth: number;
  allCategories: CategoryTreeItem[];
  onRefresh: () => void;
}

function CategoryRow({ node, depth, allCategories, onRefresh }: CategoryRowProps) {
  const t = useTranslations("admin.categories");
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const hasChildren = node.children.length > 0;
  const rootCategories = allCategories.filter((c) => c.parentId === null);

  async function handleToggleActive() {
    setToggling(true);
    try {
      const result = await toggleCategoryActiveAction(node.id);
      if (result.success) {
        onRefresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    const result = await deleteCategoryAction(node.id);
    if (result.success) {
      toast({ title: t("deleted_success") });
      setDeleteOpen(false);
      onRefresh();
    } else {
      toast({ title: result.error, variant: "destructive" });
    }
  }

  return (
    <>
      <div
        className="group flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-muted/50"
        style={{ paddingLeft: `${depth * 2 + 0.75}rem` }}
      >
        {/* Connecting line for children */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 border-l-2 border-muted-foreground/20" />
        )}

        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}

        {/* Icon */}
        {node.icon && (
          <span className="text-base flex-shrink-0">{node.icon}</span>
        )}

        {/* Name */}
        <span className={`flex-1 text-sm font-medium ${depth === 0 ? "font-semibold" : ""}`}>
          {node.name}
        </span>

        {/* Service count badge */}
        <Badge variant="secondary" className="flex-shrink-0 text-xs">
          {node._count.services} {t("servicesCount")}
        </Badge>

        {/* Active/inactive badge */}
        <Badge
          variant={node.isActive ? "default" : "outline"}
          className={`flex-shrink-0 text-xs ${node.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "text-muted-foreground"}`}
        >
          {node.isActive ? "Active" : "Inactive"}
        </Badge>

        {/* Active Switch */}
        <Switch
          checked={node.isActive}
          onCheckedChange={handleToggleActive}
          disabled={toggling}
          className="flex-shrink-0"
        />

        {/* Edit button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0 text-destructive opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Children */}
      {expanded &&
        node.children.map((child) => (
          <div key={child.id} className="relative ml-4 border-l-2 border-muted-foreground/20">
            <CategoryRow
              node={child}
              depth={depth + 1}
              allCategories={allCategories}
              onRefresh={onRefresh}
            />
          </div>
        ))}

      {/* Edit Dialog */}
      <CategoryDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        category={node}
        parentCategories={rootCategories}
        onSuccess={onRefresh}
      />

      {/* Delete AlertDialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteMessage")} — <strong>{node.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("deleteCategory")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

interface CategoryTreeViewProps {
  categories: CategoryTreeItem[];
}

export function CategoryTreeView({ categories }: CategoryTreeViewProps) {
  const t = useTranslations("admin.categories");
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);

  const tree = buildTree(categories);
  const rootCategories = categories.filter((c) => c.parentId === null);

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-4">
      {/* Add button */}
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t("addCategory")}
        </Button>
      </div>

      {/* Tree */}
      {tree.length === 0 ? (
        <div className="rounded-lg border bg-card py-12 text-center text-muted-foreground">
          Aucune categorie. Ajoutez la premiere categorie.
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="divide-y">
            {tree.map((node) => (
              <div key={node.id} className="relative">
                <CategoryRow
                  node={node}
                  depth={0}
                  allCategories={categories}
                  onRefresh={handleRefresh}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <CategoryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="create"
        parentCategories={rootCategories}
        onSuccess={() => {
          setAddOpen(false);
          handleRefresh();
        }}
      />
    </div>
  );
}
