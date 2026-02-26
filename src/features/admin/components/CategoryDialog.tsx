"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "../schemas/category-schemas";
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryTreeItem,
} from "../actions/category-actions";

// ============================================================
// SLUGIFY UTILITY
// ============================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ============================================================
// PROPS
// ============================================================

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  category?: CategoryTreeItem;
  parentCategories: CategoryTreeItem[];
  onSuccess: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export function CategoryDialog({
  open,
  onOpenChange,
  mode,
  category,
  parentCategories,
  onSuccess,
}: CategoryDialogProps) {
  const t = useTranslations("admin.categories");
  const { toast } = useToast();

  // Use the broader updateCategorySchema always (id is optional via the form,
  // but we only call updateCategoryAction when mode === "edit")
  const form = useForm<UpdateCategoryInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(mode === "create" ? (createCategorySchema as any) : updateCategorySchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      icon: "",
      description: "",
      parentId: null,
      isActive: true,
      sortOrder: 0,
      ...(mode === "edit" && category
        ? {
            id: category.id,
            name: category.name,
            slug: category.slug,
            icon: category.icon ?? "",
            description: category.description ?? "",
            parentId: category.parentId ?? null,
            isActive: category.isActive,
            sortOrder: category.sortOrder,
          }
        : {}),
    },
  });

  // Reset form when dialog opens/closes or mode/category changes
  useEffect(() => {
    if (open) {
      const base = {
        name: "",
        slug: "",
        icon: "",
        description: "",
        parentId: null as string | null,
        isActive: true,
        sortOrder: 0,
      };
      if (mode === "edit" && category) {
        form.reset({
          ...base,
          id: category.id,
          name: category.name,
          slug: category.slug,
          icon: category.icon ?? "",
          description: category.description ?? "",
          parentId: category.parentId ?? null,
          isActive: category.isActive,
          sortOrder: category.sortOrder,
        });
      } else {
        form.reset(base as UpdateCategoryInput);
      }
    }
  }, [open, mode, category, form]);

  // Auto-generate slug from name (only in create mode)
  const watchName = form.watch("name");
  useEffect(() => {
    if (mode === "create" && watchName) {
      form.setValue("slug", slugify(watchName));
    }
  }, [watchName, mode, form]);

  async function onSubmit(values: UpdateCategoryInput) {
    try {
      let result;
      if (mode === "create") {
        const { id: _id, ...createData } = values;
        void _id;
        result = await createCategoryAction(createData as CreateCategoryInput);
      } else {
        result = await updateCategoryAction(values);
      }

      if (result.success) {
        toast({
          title:
            mode === "create" ? t("created_success") : t("updated_success"),
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Une erreur est survenue", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("addCategory") : t("editCategory")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("categoryName")}</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Informatique" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("categorySlug")}</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: informatique" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("categoryIcon")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: Laptop (lucide-react icon name)"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("categoryDescription")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description optionnelle..."
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent Category */}
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("parentCategory")}</FormLabel>
                  <Select
                    onValueChange={(v) =>
                      field.onChange(v === "none" ? null : v)
                    }
                    value={field.value ?? "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("noParent")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t("noParent")}</SelectItem>
                      {parentCategories
                        .filter((c) => c.id !== category?.id)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sort Order */}
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sortOrder")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Switch */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="category-active"
                      />
                    </FormControl>
                    <Label htmlFor="category-active">{t("isActive")}</Label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Enregistrement..."
                  : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
