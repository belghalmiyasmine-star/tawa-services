"use client";

import { useTranslations } from "next-intl";
import { X, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_ITEMS = 20;
const MAX_ITEM_LENGTH = 200;

interface InclusionsExclusionsEditorProps {
  type: "inclusions" | "exclusions";
  value: string[];
  onChange: (items: string[]) => void;
}

export function InclusionsExclusionsEditor({
  type,
  value,
  onChange,
}: InclusionsExclusionsEditorProps) {
  const t = useTranslations("service");

  const addItem = () => {
    if (value.length >= MAX_ITEMS) return;
    onChange([...value, ""]);
  };

  const removeItem = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateItem = (index: number, text: string) => {
    const updated = value.map((item, i) => (i === index ? text : item));
    onChange(updated);
  };

  const addLabel =
    type === "inclusions" ? t("addInclusion") : t("addExclusion");
  const placeholder =
    type === "inclusions"
      ? t("inclusionPlaceholder")
      : t("exclusionPlaceholder");

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={placeholder}
            maxLength={MAX_ITEM_LENGTH}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeItem(index)}
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
            aria-label="Supprimer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {value.length < MAX_ITEMS && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}
