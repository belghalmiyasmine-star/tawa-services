import { SearchX, Home } from "lucide-react";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <h2 className="mt-2 text-xl font-semibold text-foreground">
        Page introuvable
      </h2>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        Desolee, la page que vous recherchez n&apos;existe pas ou a ete deplacee.
        Verifiez l&apos;URL ou retournez a l&apos;accueil.
      </p>
      <div className="mt-8">
        <Link
          href="/fr"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Home className="h-4 w-4" />
          Retour a l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
