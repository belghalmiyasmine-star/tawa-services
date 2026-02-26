"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

import {
  updateLegalPageAction,
  type LegalPageItem,
} from "../actions/content-actions";

// ============================================================
// SINGLE PAGE EDITOR
// ============================================================

type LegalPageFormProps = {
  page: LegalPageItem;
};

function LegalPageForm({ page }: LegalPageFormProps) {
  const t = useTranslations("admin.content");
  const tCommon = useTranslations("admin.common");
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);

  function handleSave() {
    startTransition(async () => {
      const result = await updateLegalPageAction({
        id: page.id,
        title,
        content,
      });

      if (result.success) {
        toast({ title: t("saved_success") });
        router.refresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    });
  }

  const lastUpdated = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(page.updatedAt));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{getPageLabel(page.slug)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`title-${page.id}`}>{t("pageTitle")}</Label>
          <Input
            id={`title-${page.id}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`content-${page.id}`}>{t("pageContent")}</Label>
          <Textarea
            id={`content-${page.id}`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Derniere modification: {lastUpdated}
          </p>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Enregistrement..." : tCommon("save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const PAGE_LABELS: Record<string, string> = {
  cgu: "Conditions Generales d'Utilisation",
  privacy: "Politique de Confidentialite",
  "legal-mentions": "Mentions Legales",
};

function getPageLabel(slug: string): string {
  return PAGE_LABELS[slug] ?? slug;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

type LegalPageEditorProps = {
  pages: LegalPageItem[];
};

export function LegalPageEditor({ pages }: LegalPageEditorProps) {
  // Sort pages in a fixed order: cgu, privacy, legal-mentions
  const ORDER = ["cgu", "privacy", "legal-mentions"];
  const sorted = [...pages].sort(
    (a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug),
  );

  return (
    <div className="space-y-6">
      {sorted.map((page) => (
        <LegalPageForm key={page.id} page={page} />
      ))}
    </div>
  );
}
