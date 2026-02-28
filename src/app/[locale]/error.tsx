"use client";

import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-4xl font-bold text-foreground">500</h1>
      <h2 className="mt-2 text-xl font-semibold text-foreground">
        Erreur du serveur
      </h2>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        Une erreur inattendue s&apos;est produite. Notre equipe a ete notifiee.
        Veuillez reessayer ou retourner a l&apos;accueil.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCcw className="h-4 w-4" />
          Reessayer
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <Home className="h-4 w-4" />
          Retour a l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
