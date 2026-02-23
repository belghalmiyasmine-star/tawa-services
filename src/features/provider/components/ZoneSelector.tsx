"use client";

import { useState } from "react";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { updateZonesAction } from "@/features/provider/actions/manage-zones";

// ============================================================
// TYPES
// ============================================================

interface Delegation {
  id: string;
  name: string;
}

interface Gouvernorat {
  id: string;
  name: string;
  delegations: Delegation[];
}

interface ZoneSelectorProps {
  initialDelegationIds: string[];
  gouvernorats: Gouvernorat[];
}

// ============================================================
// COMPONENT
// ============================================================

export function ZoneSelector({ initialDelegationIds, gouvernorats }: ZoneSelectorProps) {
  const t = useTranslations("provider");
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialDelegationIds),
  );
  const [expandedGouvernorats, setExpandedGouvernorats] = useState<Set<string>>(
    new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);

  // Build a map for quick delegation lookup
  const delegationMap = new Map<string, { name: string; gouvernoratName: string }>();
  for (const gov of gouvernorats) {
    for (const del of gov.delegations) {
      delegationMap.set(del.id, { name: del.name, gouvernoratName: gov.name });
    }
  }

  const toggleGouvernorat = (govId: string) => {
    setExpandedGouvernorats((prev) => {
      const next = new Set(prev);
      if (next.has(govId)) {
        next.delete(govId);
      } else {
        next.add(govId);
      }
      return next;
    });
  };

  const toggleDelegation = (delId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(delId)) {
        next.delete(delId);
      } else {
        next.add(delId);
      }
      return next;
    });
  };

  const selectAllInGov = (gov: Gouvernorat) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const del of gov.delegations) {
        next.add(del.id);
      }
      return next;
    });
  };

  const deselectAllInGov = (gov: Gouvernorat) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const del of gov.delegations) {
        next.delete(del.id);
      }
      return next;
    });
  };

  const removeDelegation = (delId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(delId);
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: "Zones requises",
        description: t("validationZoneRequired"),
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateZonesAction({
        delegationIds: Array.from(selectedIds),
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({ title: t("zonesSaved") });
    } catch (err) {
      console.error("[ZoneSelector] Error:", err);
      toast({
        title: "Erreur",
        description: t("zonesError"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("selectZones")}</p>

      {/* Accordion list of gouvernorats */}
      <div className="divide-y rounded-lg border">
        {gouvernorats.map((gov) => {
          const isExpanded = expandedGouvernorats.has(gov.id);
          const selectedCount = gov.delegations.filter((d) =>
            selectedIds.has(d.id),
          ).length;

          return (
            <div key={gov.id}>
              {/* Gouvernorat header */}
              <button
                type="button"
                onClick={() => toggleGouvernorat(gov.id)}
                className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{gov.name}</span>
                  {selectedCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedCount}
                    </Badge>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {/* Delegations panel */}
              {isExpanded && (
                <div className="border-t bg-muted/20 px-4 py-3">
                  {/* Select all / Deselect all */}
                  <div className="mb-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => selectAllInGov(gov)}
                      className="text-xs text-primary hover:underline"
                    >
                      Tout selectionner
                    </button>
                    <span className="text-xs text-muted-foreground">·</span>
                    <button
                      type="button"
                      onClick={() => deselectAllInGov(gov)}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Tout deselectionner
                    </button>
                  </div>

                  {/* Delegation checkboxes — 2 cols on desktop */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {gov.delegations.map((del) => (
                      <label
                        key={del.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md p-1 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedIds.has(del.id)}
                          onCheckedChange={() => toggleDelegation(del.id)}
                        />
                        <span className="text-sm">{del.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected zones as badge chips */}
      {selectedIds.size > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {selectedIds.size} zone(s) selectionnee(s)
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedIds).map((delId) => {
              const del = delegationMap.get(delId);
              if (!del) return null;
              return (
                <Badge key={delId} variant="secondary" className="gap-1 pr-1">
                  <span className="text-xs">
                    {del.gouvernoratName} — {del.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeDelegation(delId)}
                    className="ml-1 rounded-full hover:bg-muted"
                    aria-label={`Retirer ${del.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {selectedIds.size === 0 && (
        <p className="text-sm text-muted-foreground">{t("noZones")}</p>
      )}

      {/* Save button */}
      <Button onClick={handleSave} disabled={isSaving || selectedIds.size === 0}>
        {isSaving ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Enregistrement...
          </span>
        ) : (
          t("saveZones")
        )}
      </Button>
    </div>
  );
}
