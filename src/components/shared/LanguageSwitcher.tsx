"use client";

import { Globe, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES = [
  { code: "fr", label: "Français", available: true },
  { code: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", available: false },
  { code: "en", label: "English", available: false },
] as const;

const CURRENT_LOCALE = "fr";

export function LanguageSwitcher() {
  const { toast } = useToast();

  function handleSelect(code: string, available: boolean) {
    if (!available) {
      toast({
        title: "Bient\u00F4t disponible",
        description:
          code === "ar"
            ? "La version arabe sera disponible prochainement."
            : "The English version will be available soon.",
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Changer de langue"
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-44">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleSelect(lang.code, lang.available)}
            className="flex items-center justify-between"
          >
            <span className={!lang.available ? "text-muted-foreground" : undefined}>
              {lang.label}
            </span>
            {lang.code === CURRENT_LOCALE && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
