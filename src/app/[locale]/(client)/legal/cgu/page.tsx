import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation | Tawa Services",
  description: "Conditions générales d'utilisation de la plateforme Tawa Services.",
};

export default function CguPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Conditions Générales d&apos;Utilisation</h1>

      <div className="prose prose-gray max-w-none dark:prose-invert">
        <p className="text-muted-foreground">Dernière mise à jour : février 2026</p>

        <h2 className="mt-8 text-xl font-semibold">1. Objet</h2>
        <p className="text-muted-foreground">
          Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;utilisation de la plateforme
          Tawa Services, accessible via le site web et les applications mobiles. En utilisant nos services,
          vous acceptez ces conditions dans leur intégralité.
        </p>

        <h2 className="mt-8 text-xl font-semibold">2. Description du service</h2>
        <p className="text-muted-foreground">
          Tawa Services est une plateforme de mise en relation entre des clients et des prestataires de
          services en Tunisie. La plateforme permet aux clients de rechercher, comparer et réserver des
          services auprès de prestataires vérifiés.
        </p>

        <h2 className="mt-8 text-xl font-semibold">3. Inscription</h2>
        <p className="text-muted-foreground">
          L&apos;inscription est gratuite et ouverte à toute personne majeure. Vous vous engagez à fournir des
          informations exactes et à maintenir la confidentialité de vos identifiants de connexion.
        </p>

        <h2 className="mt-8 text-xl font-semibold">4. Obligations des utilisateurs</h2>
        <p className="text-muted-foreground">
          Les utilisateurs s&apos;engagent à utiliser la plateforme de manière licite, à respecter les autres
          utilisateurs et à ne pas publier de contenu illicite ou offensant. Tout comportement abusif
          pourra entraîner la suspension ou la suppression du compte.
        </p>

        <h2 className="mt-8 text-xl font-semibold">5. Paiements</h2>
        <p className="text-muted-foreground">
          Les paiements sont traités de manière sécurisée via la plateforme. Le montant est retenu
          jusqu&apos;à la réalisation du service, puis versé au prestataire, déduction faite de la commission
          de la plateforme.
        </p>

        <h2 className="mt-8 text-xl font-semibold">6. Responsabilité</h2>
        <p className="text-muted-foreground">
          Tawa Services agit en tant qu&apos;intermédiaire et ne saurait être tenu responsable de la qualité
          des services fournis par les prestataires. Nous nous engageons toutefois à vérifier l&apos;identité
          des prestataires via notre processus KYC.
        </p>

        <h2 className="mt-8 text-xl font-semibold">7. Contact</h2>
        <p className="text-muted-foreground">
          Pour toute question relative aux présentes CGU, contactez-nous à : support@tawa-services.tn
        </p>
      </div>
    </div>
  );
}
