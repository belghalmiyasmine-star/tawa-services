import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialité | Tawa Services",
  description: "Politique de confidentialité et de protection des données personnelles de Tawa Services.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Politique de Confidentialité</h1>

      <div className="prose prose-gray max-w-none dark:prose-invert">
        <p className="text-muted-foreground">Dernière mise à jour : février 2026</p>

        <h2 className="mt-8 text-xl font-semibold">1. Collecte des données</h2>
        <p className="text-muted-foreground">
          Nous collectons les données personnelles que vous nous fournissez lors de votre inscription
          (nom, email, numéro de téléphone) ainsi que les données générées par votre utilisation de la
          plateforme (réservations, avis, messages).
        </p>

        <h2 className="mt-8 text-xl font-semibold">2. Utilisation des données</h2>
        <p className="text-muted-foreground">
          Vos données sont utilisées pour : fournir et améliorer nos services, gérer votre compte,
          traiter vos réservations et paiements, vous envoyer des notifications relatives à vos
          réservations, et assurer la sécurité de la plateforme.
        </p>

        <h2 className="mt-8 text-xl font-semibold">3. Partage des données</h2>
        <p className="text-muted-foreground">
          Vos données ne sont partagées qu&apos;avec les prestataires dans le cadre d&apos;une réservation, et
          avec nos partenaires techniques (hébergement, paiement) dans la mesure nécessaire au
          fonctionnement du service. Nous ne vendons jamais vos données à des tiers.
        </p>

        <h2 className="mt-8 text-xl font-semibold">4. Sécurité</h2>
        <p className="text-muted-foreground">
          Nous mettons en oeuvre des mesures techniques et organisationnelles appropriées pour protéger
          vos données contre tout accès non autorisé, perte ou altération. Les documents KYC sont
          stockés de manière chiffrée.
        </p>

        <h2 className="mt-8 text-xl font-semibold">5. Vos droits</h2>
        <p className="text-muted-foreground">
          Conformément à la législation tunisienne sur la protection des données personnelles, vous
          disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Pour exercer
          ces droits, contactez-nous à : support@tawa-services.tn
        </p>

        <h2 className="mt-8 text-xl font-semibold">6. Cookies</h2>
        <p className="text-muted-foreground">
          Nous utilisons des cookies essentiels au fonctionnement de la plateforme (authentification,
          préférences). Aucun cookie publicitaire n&apos;est utilisé.
        </p>

        <h2 className="mt-8 text-xl font-semibold">7. Contact</h2>
        <p className="text-muted-foreground">
          Pour toute question relative à la protection de vos données : support@tawa-services.tn
        </p>
      </div>
    </div>
  );
}
