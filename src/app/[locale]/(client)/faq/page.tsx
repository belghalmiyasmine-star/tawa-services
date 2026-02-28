import type { Metadata } from "next";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ | Tawa Services",
  description: "Questions fréquemment posées sur Tawa Services.",
};

const faqs = [
  {
    question: "Comment créer un compte sur Tawa Services ?",
    answer:
      "Cliquez sur « S'inscrire » en haut de la page, remplissez le formulaire avec votre nom, email et mot de passe, puis validez votre adresse email via le lien reçu par mail.",
  },
  {
    question: "Comment réserver un service ?",
    answer:
      "Recherchez un service, consultez le profil du prestataire, choisissez un créneau disponible et confirmez votre réservation. Vous recevrez une confirmation par email.",
  },
  {
    question: "Comment devenir prestataire ?",
    answer:
      "Inscrivez-vous en tant que prestataire, complétez la vérification KYC en soumettant vos documents d'identité, puis créez vos services une fois votre profil validé.",
  },
  {
    question: "Les paiements sont-ils sécurisés ?",
    answer:
      "Oui. Les paiements sont gérés de manière sécurisée via notre plateforme. Le montant est retenu jusqu'à la réalisation du service, puis transféré au prestataire.",
  },
  {
    question: "Comment annuler une réservation ?",
    answer:
      "Rendez-vous dans « Mes réservations », sélectionnez la réservation concernée et cliquez sur « Annuler ». Les conditions d'annulation dépendent du prestataire.",
  },
  {
    question: "Comment contacter le support ?",
    answer:
      "Vous pouvez nous contacter via la page Contact ou envoyer un email à support@tawa-services.tn. Nous répondons sous 24h.",
  },
  {
    question: "Comment laisser un avis ?",
    answer:
      "Après la réalisation d'un service, vous recevrez une invitation à laisser un avis. Vous pouvez aussi le faire depuis la page de détail de votre réservation.",
  },
  {
    question: "Quelles zones géographiques sont couvertes ?",
    answer:
      "Tawa Services couvre l'ensemble de la Tunisie. Chaque prestataire indique ses zones d'intervention dans son profil.",
  },
];

export default function FaqPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">Foire aux questions</h1>
        <p className="mt-3 text-muted-foreground">
          Trouvez rapidement les réponses à vos questions.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
