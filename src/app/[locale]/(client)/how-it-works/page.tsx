import type { Metadata } from "next";
import { CheckCircle, Search, Calendar, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Comment ça marche | Tawa Services",
  description: "Découvrez comment utiliser Tawa Services pour trouver et réserver des prestataires de confiance en Tunisie.",
};

const steps = [
  {
    icon: Search,
    title: "Recherchez un service",
    description:
      "Parcourez notre catalogue de services ou utilisez la recherche pour trouver le prestataire idéal près de chez vous.",
  },
  {
    icon: Calendar,
    title: "Réservez en ligne",
    description:
      "Choisissez une date et un créneau horaire qui vous conviennent, puis confirmez votre réservation en quelques clics.",
  },
  {
    icon: CheckCircle,
    title: "Service réalisé",
    description:
      "Le prestataire se rend chez vous ou à l'adresse convenue pour réaliser le service. Le paiement est sécurisé.",
  },
  {
    icon: Star,
    title: "Laissez un avis",
    description:
      "Après le service, évaluez votre expérience pour aider la communauté et améliorer la qualité des prestations.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">Comment ça marche</h1>
        <p className="mt-3 text-muted-foreground">
          Réserver un prestataire de confiance en 4 étapes simples.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={index}>
              <CardContent className="flex gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    <span className="mr-2 text-primary">{index + 1}.</span>
                    {step.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
