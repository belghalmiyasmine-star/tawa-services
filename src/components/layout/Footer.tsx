import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="hidden border-t bg-muted/30 md:block">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">T</span>
              </div>
              <span className="font-bold text-primary">Tawa Services</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t("tagline")}</p>
          </div>

          {/* Pour les clients */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("forClients")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/services" className="transition-colors hover:text-foreground">
                  {t("findProvider")}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="transition-colors hover:text-foreground">
                  {t("howItWorks")}
                </Link>
              </li>
              <li>
                <Link href="/services" className="transition-colors hover:text-foreground">
                  {t("serviceCategories")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Pour les prestataires */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("forProviders")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/auth/register" className="transition-colors hover:text-foreground">
                  {t("becomeProvider")}
                </Link>
              </li>
              <li>
                <Link
                  href="/provider/dashboard"
                  className="transition-colors hover:text-foreground"
                >
                  {t("dashboard")}
                </Link>
              </li>
              <li>
                <Link href="/provider/kyc" className="transition-colors hover:text-foreground">
                  {t("kycVerification")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Aide */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("help")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/faq" className="transition-colors hover:text-foreground">
                  {t("faq")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-foreground">
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition-colors hover:text-foreground">
                  {t("support")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("legal")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/legal/cgu" className="transition-colors hover:text-foreground">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="transition-colors hover:text-foreground">
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Tawa Services. {t("copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
