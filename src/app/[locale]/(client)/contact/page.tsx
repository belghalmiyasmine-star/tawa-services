import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";

export const revalidate = 60;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact | Tawa Services",
  description:
    "Contactez l'équipe Tawa Services pour toute question ou assistance.",
};

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    detail: "support@tawa-services.tn",
    sub: "Réponse sous 24h",
  },
  {
    icon: Phone,
    title: "Téléphone",
    detail: "+216 23 827 432",
    sub: "Lun-Ven : 9h-18h",
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
    <div className="container mx-auto max-w-5xl px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">Nous contacter</h1>
        <p className="mt-3 text-muted-foreground">
          Une question ? Notre équipe est là pour vous aider.
        </p>
      </div>

      {/* Two-column layout: form + sidebar */}
      <div className="grid gap-8 md:grid-cols-3">
        {/* Contact form — 2 cols */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Envoyez-nous un message</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — 1 col */}
        <div className="space-y-4">
          {contactInfo.map((info) => {
            const Icon = info.icon;
            return (
              <Card key={info.title}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{info.title}</p>
                    <p className="text-sm">{info.detail}</p>
                    <p className="text-xs text-muted-foreground">{info.sub}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
