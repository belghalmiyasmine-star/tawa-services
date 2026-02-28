import type { Metadata } from "next";
import { Mail, MapPin, Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact | Tawa Services",
  description: "Contactez l'équipe Tawa Services pour toute question ou assistance.",
};

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    detail: "support@tawa-services.tn",
    sub: "Réponse sous 24h",
  },
  {
    icon: MapPin,
    title: "Adresse",
    detail: "Tunis, Tunisie",
    sub: "Siège social",
  },
  {
    icon: Clock,
    title: "Horaires",
    detail: "Lun-Ven : 9h-18h",
    sub: "Sam : 9h-13h",
  },
];

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">Nous contacter</h1>
        <p className="mt-3 text-muted-foreground">
          Une question ? Notre équipe est là pour vous aider.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {contactInfo.map((info, index) => {
          const Icon = info.icon;
          return (
            <Card key={index}>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-semibold">{info.title}</h2>
                <p className="mt-1 text-sm">{info.detail}</p>
                <p className="text-xs text-muted-foreground">{info.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
