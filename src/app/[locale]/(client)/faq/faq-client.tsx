"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/routing";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ============================================================
// FAQ DATA — sectioned by audience
// ============================================================

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "Général",
    items: [
      {
        question: "Qu'est-ce que Tawa Services ?",
        answer:
          "Tawa Services est une plateforme tunisienne de mise en relation entre des clients et des prestataires de services vérifiés. Elle permet de rechercher, comparer et réserver des services dans de nombreuses catégories : ménage, plomberie, électricité, cours particuliers, beauté, et bien plus.",
      },
      {
        question: "Comment ça marche ?",
        answer:
          "1. Recherchez un service ou un prestataire dans votre zone.\n2. Consultez les profils, avis et tarifs.\n3. Réservez en ligne en choisissant un créneau.\n4. Le prestataire réalise la prestation.\n5. Payez de manière sécurisée et laissez un avis.",
      },
      {
        question: "Tawa Services est-il gratuit pour les clients ?",
        answer:
          "L'inscription et la recherche sont entièrement gratuites. Vous ne payez que le montant du service réservé, sans frais supplémentaires.",
      },
      {
        question: "Quelles zones géographiques sont couvertes ?",
        answer:
          "Tawa Services couvre l'ensemble de la Tunisie. Chaque prestataire indique ses zones d'intervention (gouvernorats et délégations) dans son profil.",
      },
    ],
  },
  {
    title: "Clients",
    items: [
      {
        question: "Comment créer un compte client ?",
        answer:
          "Cliquez sur « S'inscrire » en haut de la page, remplissez le formulaire avec votre nom, email et mot de passe, puis validez votre adresse email via le code reçu par mail. Vous pouvez aussi vous inscrire via Google ou Facebook.",
      },
      {
        question: "Comment réserver un service ?",
        answer:
          "Recherchez un service, consultez le profil du prestataire, puis cliquez sur « Réserver ». Choisissez la date, l'heure, l'adresse et ajoutez vos instructions. Confirmez et le prestataire recevra votre demande.",
      },
      {
        question: "Comment payer ?",
        answer:
          "Le paiement est sécurisé via la plateforme. Le montant est retenu lors de la réservation et n'est versé au prestataire qu'après la réalisation du service. Vous pouvez payer par carte bancaire ou via les méthodes de paiement disponibles.",
      },
      {
        question: "Quelle est la politique d'annulation ?",
        answer:
          "Vous pouvez annuler une réservation depuis la page « Mes réservations ». Les annulations effectuées plus de 24h avant le créneau prévu sont remboursées intégralement. Pour les annulations tardives, des frais peuvent s'appliquer selon les conditions du prestataire.",
      },
      {
        question: "Comment contacter un prestataire ?",
        answer:
          "Une fois une réservation effectuée, vous pouvez envoyer un message au prestataire directement depuis la page de votre réservation via la messagerie intégrée.",
      },
      {
        question: "Comment laisser un avis ?",
        answer:
          "Après la réalisation d'un service, vous recevrez une notification pour laisser un avis. Vous pouvez aussi le faire depuis la page de détail de votre réservation terminée.",
      },
    ],
  },
  {
    title: "Prestataires",
    items: [
      {
        question: "Comment devenir prestataire sur Tawa Services ?",
        answer:
          "Inscrivez-vous en choisissant le rôle « Prestataire ». Complétez votre profil (photo, bio, zones d'intervention), puis soumettez vos documents pour la vérification KYC. Une fois validé, vous pouvez créer et publier vos services.",
      },
      {
        question: "Quelle commission prend Tawa Services ?",
        answer:
          "Tawa Services prélève une commission de 12 % sur chaque transaction réalisée via la plateforme. Ce montant couvre l'utilisation de la plateforme, le traitement des paiements, la visibilité de vos services et le support client.",
      },
      {
        question: "Qu'est-ce que la vérification KYC ?",
        answer:
          "La vérification KYC (Know Your Customer) est un processus obligatoire pour les prestataires. Vous devez soumettre une pièce d'identité valide et un justificatif de domicile. Cette vérification garantit la confiance et la sécurité pour tous les utilisateurs de la plateforme.",
      },
      {
        question: "Comment gérer mes réservations ?",
        answer:
          "Accédez à votre tableau de bord prestataire pour voir toutes vos réservations. Vous pouvez accepter, refuser ou marquer une prestation comme terminée. Vous recevrez des notifications en temps réel pour chaque nouvelle demande.",
      },
      {
        question: "Quand suis-je payé ?",
        answer:
          "Les paiements sont versés sur votre compte après la confirmation de la réalisation du service par le client. Vous pouvez suivre vos revenus depuis la section « Revenus » de votre tableau de bord.",
      },
    ],
  },
];

// ============================================================
// COMPONENT
// ============================================================

export function FaqClient() {
  const [search, setSearch] = useState("");

  const filteredSections = useMemo(() => {
    if (!search.trim()) return FAQ_SECTIONS;

    const q = search.toLowerCase();
    return FAQ_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q),
      ),
    })).filter((section) => section.items.length > 0);
  }, [search]);

  const totalResults = filteredSections.reduce(
    (sum, s) => sum + s.items.length,
    0,
  );

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">Foire aux questions</h1>
        <p className="mt-3 text-muted-foreground">
          Trouvez rapidement les réponses à vos questions.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher une question..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results */}
      {filteredSections.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">
            Aucun résultat pour &laquo;&nbsp;{search}&nbsp;&raquo;
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Essayez avec d&apos;autres mots-clés ou{" "}
            <Link href="/contact" className="text-primary hover:underline">
              contactez-nous
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {search.trim() && (
            <p className="text-sm text-muted-foreground">
              {totalResults} résultat{totalResults > 1 ? "s" : ""} trouvé
              {totalResults > 1 ? "s" : ""}
            </p>
          )}

          {filteredSections.map((section) => (
            <div key={section.title}>
              <h2 className="mb-3 text-lg font-semibold text-primary">
                {section.title}
              </h2>
              <div className="rounded-xl border bg-card">
                <Accordion type="single" collapsible className="w-full">
                  {section.items.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`${section.title}-${index}`}
                      className="border-b px-4 last:border-b-0"
                    >
                      <AccordionTrigger className="text-left text-sm font-medium">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="whitespace-pre-line text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
