"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { useRouter } from "@/i18n/routing";
import { useToast } from "@/hooks/use-toast";
import { createServiceSchema, updateServiceSchema } from "@/lib/validations/service";
import type { CreateServiceFormData, UpdateServiceFormData } from "@/lib/validations/service";
import {
  SERVICE_TITLE_MAX_LENGTH,
  SERVICE_DESCRIPTION_MAX_LENGTH,
  SERVICE_DESCRIPTION_MIN_LENGTH,
} from "@/lib/constants";
import {
  createServiceAction,
  updateServiceAction,
  type CreateServiceFormData as ActionCreateData,
  type UpdateServiceFormData as ActionUpdateData,
} from "@/features/provider/actions/manage-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InclusionsExclusionsEditor } from "./InclusionsExclusionsEditor";
import { ServicePhotoUploader } from "./ServicePhotoUploader";

// ============================================================
// TYPES
// ============================================================

interface CategoryOption {
  id: string;
  name: string;
  parentId: string | null;
  children?: Array<{ id: string; name: string }>;
}

interface ServiceFormInitialData {
  id?: string;
  title?: string;
  description?: string;
  categoryId?: string;
  pricingType?: "FIXED" | "HOURLY" | "SUR_DEVIS";
  fixedPrice?: number | null;
  durationMinutes?: number | null;
  inclusions?: string[];
  exclusions?: string[];
  conditions?: string | null;
  photoUrls?: string[];
}

interface ServiceFormProps {
  mode: "create" | "edit";
  categories: CategoryOption[];
  initialData?: ServiceFormInitialData;
  serviceId?: string;
}

// ============================================================
// HELPERS
// ============================================================

function getPricingLabel(
  pricingType: "FIXED" | "HOURLY" | "SUR_DEVIS" | undefined,
  t: ReturnType<typeof useTranslations<"service">>,
): string {
  if (pricingType === "HOURLY") return t("pricePerHour");
  return t("price");
}

// ============================================================
// COMPONENT
// ============================================================

export function ServiceForm({
  mode,
  categories,
  initialData,
  serviceId,
}: ServiceFormProps) {
  const t = useTranslations("service");
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    initialData?.photoUrls ?? [],
  );

  // Detect parent categories (parentId === null)
  const parentCategories = categories.filter((c) => c.parentId === null);

  // Determine initial parent category id
  const resolveInitialParentId = (): string => {
    if (!initialData?.categoryId) return "";
    const cat = categories.find((c) => c.id === initialData.categoryId);
    if (!cat) return "";
    // If the category has a parentId, it's a subcategory — parent is parentId
    if (cat.parentId) return cat.parentId;
    // Otherwise this category IS the parent
    return cat.id;
  };

  const [selectedParentId, setSelectedParentId] = useState<string>(
    resolveInitialParentId(),
  );

  // Subcategories for the selected parent
  const subcategories =
    parentCategories.find((p) => p.id === selectedParentId)?.children ?? [];

  // Build form schema depending on mode
  const schema = mode === "edit" ? updateServiceSchema : createServiceSchema;

  // Default values
  const defaultPricingType =
    initialData?.pricingType ?? ("FIXED" as const);

  const form = useForm<CreateServiceFormData | UpdateServiceFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      categoryId: initialData?.categoryId ?? "",
      pricingType: defaultPricingType,
      fixedPrice: initialData?.fixedPrice ?? undefined,
      durationMinutes: initialData?.durationMinutes ?? undefined,
      inclusions: initialData?.inclusions ?? [],
      exclusions: initialData?.exclusions ?? [],
      conditions: initialData?.conditions ?? "",
      ...(mode === "edit" && serviceId ? { id: serviceId } : {}),
    },
  });

  const watchedPricingType = form.watch("pricingType");
  const watchedTitle = form.watch("title");
  const watchedDescription = form.watch("description");

  const showPriceField =
    watchedPricingType === "FIXED" || watchedPricingType === "HOURLY";

  const handleParentCategoryChange = (parentId: string) => {
    setSelectedParentId(parentId);
    // Reset subcategory selection
    form.setValue("categoryId", "");

    // If this parent has no children, use parent id directly as categoryId
    const parent = parentCategories.find((p) => p.id === parentId);
    if (!parent?.children || parent.children.length === 0) {
      form.setValue("categoryId", parentId);
    }
  };

  const onSubmit = async (
    data: CreateServiceFormData | UpdateServiceFormData,
  ) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        // Build payload using action's type (allows null for optional numerics)
        const payload: ActionCreateData = {
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          pricingType: data.pricingType,
          fixedPrice: data.fixedPrice ?? null,
          durationMinutes: data.durationMinutes ?? null,
          inclusions: data.inclusions ?? [],
          exclusions: data.exclusions ?? [],
          conditions: data.conditions ?? null,
        };
        const result = await createServiceAction(payload);
        if (!result.success) {
          toast({
            variant: "destructive",
            title: t("serviceError"),
            description: result.error,
          });
          return;
        }
        toast({
          title: t("serviceCreated"),
        });
        // Redirect to edit page so user can add photos
        router.push(`/provider/services/${result.data.id}/edit`);
      } else {
        const updateData = data as (typeof data) & { id: string };
        const payload: ActionUpdateData = {
          id: updateData.id,
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          pricingType: data.pricingType,
          fixedPrice: data.fixedPrice ?? null,
          durationMinutes: data.durationMinutes ?? null,
          inclusions: data.inclusions ?? [],
          exclusions: data.exclusions ?? [],
          conditions: data.conditions ?? null,
        };
        const result = await updateServiceAction(payload);
        if (!result.success) {
          toast({
            variant: "destructive",
            title: t("serviceError"),
            description: result.error,
          });
          return;
        }
        toast({
          title: t("serviceUpdated"),
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: t("serviceError"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        noValidate
      >
        {/* ---- TITLE ---- */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("title")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("titlePlaceholder")}
                  maxLength={SERVICE_TITLE_MAX_LENGTH}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                {t("titleCount", {
                  count: watchedTitle?.length ?? 0,
                  max: SERVICE_TITLE_MAX_LENGTH,
                })}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ---- DESCRIPTION ---- */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("description")}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t("descriptionPlaceholder")}
                  className="min-h-[120px]"
                  maxLength={SERVICE_DESCRIPTION_MAX_LENGTH}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                {t("descriptionCount", {
                  count: watchedDescription?.length ?? 0,
                  max: SERVICE_DESCRIPTION_MAX_LENGTH,
                })}
                {" — "}
                {t("validationDescriptionTooShort").replace(
                  "150",
                  String(SERVICE_DESCRIPTION_MIN_LENGTH),
                )}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ---- CATEGORY (two-level) ---- */}
        <div className="space-y-4">
          <div>
            <Label>{t("category")}</Label>
            <Select
              value={selectedParentId}
              onValueChange={handleParentCategoryChange}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder={t("selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                {parentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory — only if parent has children */}
          {subcategories.length > 0 && (
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("subcategory")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("selectSubcategory")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Show form error for categoryId even when single-level */}
          {subcategories.length === 0 && (
            <FormField
              control={form.control}
              name="categoryId"
              render={() => (
                <FormItem className="hidden">
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* ---- PRICING TYPE ---- */}
        <FormField
          control={form.control}
          name="pricingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("pricingType")}</FormLabel>
              <div className="mt-1.5 flex flex-wrap gap-3">
                {(
                  [
                    { value: "FIXED", label: t("pricingTypeFixed") },
                    { value: "HOURLY", label: t("pricingTypeHourly") },
                    { value: "SUR_DEVIS", label: t("pricingTypeSurDevis") },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => field.onChange(option.value)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      field.value === option.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ---- PRICE + DURATION ROW ---- */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Fixed / Hourly price */}
          {showPriceField && (
            <FormField
              control={form.control}
              name="fixedPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {getPricingLabel(watchedPricingType, t)}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100000}
                      step={0.5}
                      placeholder={t("pricePlaceholder")}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? undefined : Number(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Duration */}
          <FormField
            control={form.control}
            name="durationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("durationMinutes")}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (optionnel)
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={15}
                    max={1440}
                    step={15}
                    placeholder={t("durationPlaceholder")}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? undefined : Number(val));
                    }}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  {t("durationHint")}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ---- INCLUSIONS ---- */}
        <FormField
          control={form.control}
          name="inclusions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("inclusions")}</FormLabel>
              <InclusionsExclusionsEditor
                type="inclusions"
                value={field.value ?? []}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ---- EXCLUSIONS ---- */}
        <FormField
          control={form.control}
          name="exclusions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("exclusions")}</FormLabel>
              <InclusionsExclusionsEditor
                type="exclusions"
                value={field.value ?? []}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ---- CONDITIONS ---- */}
        <FormField
          control={form.control}
          name="conditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("conditions")}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optionnel)
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder={t("conditionsPlaceholder")}
                  className="min-h-[80px]"
                  maxLength={2000}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ---- PHOTOS (edit mode only) ---- */}
        {mode === "edit" && serviceId && (
          <div className="space-y-3">
            <Label>{t("photos")}</Label>
            <ServicePhotoUploader
              serviceId={serviceId}
              initialPhotos={photoUrls}
              onPhotosChange={setPhotoUrls}
            />
          </div>
        )}

        {/* ---- SUBMIT ---- */}
        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? t("createService") : t("saveService")}
        </Button>
      </form>
    </Form>
  );
}
