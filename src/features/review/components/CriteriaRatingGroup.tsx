"use client";

import { useTranslations } from "next-intl";

import { StarRating } from "./StarRating";

interface CriterionItem {
  key: string;
  label: string;
  value: number;
}

interface CriteriaRatingGroupProps {
  criteria: CriterionItem[];
  onChange: (key: string, value: number) => void;
}

export function CriteriaRatingGroup({
  criteria,
  onChange,
}: CriteriaRatingGroupProps) {
  const t = useTranslations("review");

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{t("criteriaRatings")}</p>
      <div className="space-y-2">
        {criteria.map((criterion) => (
          <div
            key={criterion.key}
            className="flex items-center justify-between gap-4"
          >
            <span className="min-w-[130px] text-sm text-muted-foreground">
              {criterion.label}
            </span>
            <StarRating
              value={criterion.value}
              onChange={(v) => onChange(criterion.key, v)}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
