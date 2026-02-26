"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import {
  createFaqAction,
  updateFaqAction,
  deleteFaqAction,
  type FaqItem,
} from "../actions/content-actions";
import {
  createFaqSchema,
  updateFaqSchema,
  type CreateFaqInput,
  type UpdateFaqInput,
} from "../schemas/content-schemas";

// ============================================================
// TYPES
// ============================================================

const CATEGORIES = ["all", "general", "booking", "payment", "provider"] as const;
type Category = (typeof CATEGORIES)[number];

// ============================================================
// FAQ FORM DIALOG
// ============================================================

type FaqFormDialogProps = {
  open: boolean;
  onClose: () => void;
  faq?: FaqItem | null;
};

function FaqFormDialog({ open, onClose, faq }: FaqFormDialogProps) {
  const t = useTranslations("admin.content");
  const tCommon = useTranslations("admin.common");
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditing = Boolean(faq);
  const schema = isEditing ? updateFaqSchema : createFaqSchema;

  const form = useForm<CreateFaqInput | UpdateFaqInput>({
    resolver: zodResolver(schema) as never,
    defaultValues: faq
      ? {
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
          category: (faq.category ?? "general") as
            | "general"
            | "booking"
            | "payment"
            | "provider",
          sortOrder: faq.sortOrder,
          isActive: faq.isActive,
        }
      : {
          question: "",
          answer: "",
          category: "general",
          sortOrder: 0,
          isActive: true,
        },
  });

  function handleClose() {
    form.reset();
    onClose();
  }

  function onSubmit(values: CreateFaqInput | UpdateFaqInput) {
    startTransition(async () => {
      let result;
      if (isEditing) {
        result = await updateFaqAction(values as UpdateFaqInput);
      } else {
        result = await createFaqAction(values as CreateFaqInput);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editFaq") : t("addFaq")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("faqQuestion")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Entrez la question..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("faqAnswer")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder="Entrez la reponse..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("faqCategory")}</FormLabel>
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
                        <SelectItem value="general">{t("faqGeneral")}</SelectItem>
                        <SelectItem value="booking">{t("faqBooking")}</SelectItem>
                        <SelectItem value="payment">{t("faqPayment")}</SelectItem>
                        <SelectItem value="provider">{t("faqProvider")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch
                      checked={field.value as boolean}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Active</FormLabel>
                </FormItem>
              )}
            />

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

type FaqEditorProps = {
  faqs: FaqItem[];
};

export function FaqEditor({ faqs }: FaqEditorProps) {
  const t = useTranslations("admin.content");
  const tCommon = useTranslations("admin.common");
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [deletingFaqId, setDeletingFaqId] = useState<string | null>(null);

  const filtered =
    activeCategory === "all"
      ? faqs
      : faqs.filter((faq) => faq.category === activeCategory);

  function getCategoryLabel(cat: Category): string {
    switch (cat) {
      case "all":
        return "Tous";
      case "general":
        return t("faqGeneral");
      case "booking":
        return t("faqBooking");
      case "payment":
        return t("faqPayment");
      case "provider":
        return t("faqProvider");
    }
  }

  function getCategoryBadgeVariant(
    cat: string | null,
  ): "default" | "secondary" | "outline" {
    switch (cat) {
      case "booking":
        return "default";
      case "payment":
        return "secondary";
      default:
        return "outline";
    }
  }

  function handleDelete() {
    if (!deletingFaqId) return;
    startTransition(async () => {
      const result = await deleteFaqAction(deletingFaqId);
      setDeletingFaqId(null);
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
      {/* Category tab bar */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat)}
          >
            {getCategoryLabel(cat)}
          </Button>
        ))}
      </div>

      {/* Add FAQ button */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditingFaq(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("addFaq")}
        </Button>
      </div>

      {/* FAQ list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">{tCommon("noResults")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((faq) => (
            <Card key={faq.id}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{faq.question}</p>
                    <Badge variant={getCategoryBadgeVariant(faq.category)}>
                      {getCategoryLabel(
                        (faq.category ?? "general") as Category,
                      )}
                    </Badge>
                    {!faq.isActive && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactif
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditingFaq(faq);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingFaqId(faq.id)}
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
      <FaqFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingFaq(null);
        }}
        faq={editingFaq}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(deletingFaqId)}
        onOpenChange={(v) => !v && setDeletingFaqId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteFaq")}</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible. La FAQ sera supprimee definitivement.
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
