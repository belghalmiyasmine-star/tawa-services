"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import {
  createBannerAction,
  updateBannerAction,
  deleteBannerAction,
  toggleBannerActiveAction,
  type BannerItem,
} from "../actions/content-actions";
import {
  createBannerSchema,
  updateBannerSchema,
  type CreateBannerInput,
  type UpdateBannerInput,
} from "../schemas/content-schemas";

// ============================================================
// HELPERS
// ============================================================

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getPositionLabel(position: string): string {
  switch (position) {
    case "homepage":
      return "Accueil";
    case "search":
      return "Recherche";
    case "category":
      return "Categorie";
    default:
      return position;
  }
}

// ============================================================
// BANNER FORM DIALOG
// ============================================================

type BannerFormDialogProps = {
  open: boolean;
  onClose: () => void;
  banner?: BannerItem | null;
};

function BannerFormDialog({ open, onClose, banner }: BannerFormDialogProps) {
  const t = useTranslations("admin.content");
  const tCommon = useTranslations("admin.common");
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditing = Boolean(banner);
  const schema = isEditing ? updateBannerSchema : createBannerSchema;

  const form = useForm<CreateBannerInput | UpdateBannerInput>({
    resolver: zodResolver(schema) as never,
    defaultValues: banner
      ? {
          id: banner.id,
          title: banner.title,
          subtitle: banner.subtitle ?? "",
          imageUrl: banner.imageUrl ?? "",
          linkUrl: banner.linkUrl ?? "",
          position: banner.position as "homepage" | "search" | "category",
          isActive: banner.isActive,
          sortOrder: banner.sortOrder,
          startDate: banner.startDate
            ? new Date(banner.startDate).toISOString()
            : null,
          endDate: banner.endDate
            ? new Date(banner.endDate).toISOString()
            : null,
        }
      : {
          title: "",
          subtitle: "",
          imageUrl: "",
          linkUrl: "",
          position: "homepage" as const,
          isActive: true,
          sortOrder: 0,
          startDate: null,
          endDate: null,
        },
  });

  function handleClose() {
    form.reset();
    onClose();
  }

  function onSubmit(values: CreateBannerInput | UpdateBannerInput) {
    startTransition(async () => {
      let result;
      if (isEditing) {
        result = await updateBannerAction(values as UpdateBannerInput);
      } else {
        result = await createBannerAction(values as CreateBannerInput);
      }

      if (result.success) {
        toast({ title: t("saved_success") });
        handleClose();
        router.refresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editBanner") : t("addBanner")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bannerTitle")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Titre de la banniere" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bannerSubtitle")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Sous-titre (optionnel)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bannerImage")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="https://... ou /public/uploads/..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bannerLink")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="https://..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("bannerPosition")}</FormLabel>
                  <Select
                    value={field.value as string}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="homepage">Accueil</SelectItem>
                      <SelectItem value="search">Recherche</SelectItem>
                      <SelectItem value="category">Categorie</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordre de tri</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end">
                    <FormLabel>{t("bannerActive")}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value as boolean}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">{t("bannerDates")}</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Debut
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={
                            field.value
                              ? new Date(field.value)
                                  .toISOString()
                                  .slice(0, 16)
                              : ""
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val ? new Date(val).toISOString() : null,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Fin
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={
                            field.value
                              ? new Date(field.value)
                                  .toISOString()
                                  .slice(0, 16)
                              : ""
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val ? new Date(val).toISOString() : null,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enregistrement..." : tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

type BannerManagerProps = {
  banners: BannerItem[];
};

export function BannerManager({ banners }: BannerManagerProps) {
  const t = useTranslations("admin.content");
  const tCommon = useTranslations("admin.common");
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null);

  function handleToggleActive(id: string) {
    startTransition(async () => {
      const result = await toggleBannerActiveAction(id);
      if (result.success) {
        router.refresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    });
  }

  function handleDelete() {
    if (!deletingBannerId) return;
    startTransition(async () => {
      const result = await deleteBannerAction(deletingBannerId);
      setDeletingBannerId(null);
      if (result.success) {
        toast({ title: t("deleted_success") });
        router.refresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Add banner button */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditingBanner(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("addBanner")}
        </Button>
      </div>

      {/* Banner grid */}
      {banners.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">{tCommon("noResults")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {banners.map((banner) => (
            <Card key={banner.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Thumbnail or placeholder */}
                  {banner.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="h-16 w-24 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-24 items-center justify-center rounded bg-muted">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold line-clamp-1">{banner.title}</p>
                      <Switch
                        checked={banner.isActive}
                        onCheckedChange={() => handleToggleActive(banner.id)}
                        disabled={isPending}
                        aria-label={t("bannerActive")}
                      />
                    </div>

                    {banner.subtitle && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {banner.subtitle}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getPositionLabel(banner.position)}
                      </Badge>
                      {!banner.isActive && (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          Inactive
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {banner.startDate && banner.endDate
                        ? `Du ${formatDate(banner.startDate)} au ${formatDate(banner.endDate)}`
                        : "Permanent"}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditingBanner(banner);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingBannerId(banner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create dialog */}
      <BannerFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingBanner(null);
        }}
        banner={editingBanner}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(deletingBannerId)}
        onOpenChange={(v) => !v && setDeletingBannerId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteBanner")}</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible. La banniere sera supprimee
              definitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
