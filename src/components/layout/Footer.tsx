import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="hidden bg-slate-800 md:block">
      <div className="container mx-auto max-w-7xl px-4 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="text-xl font-bold">
              <span className="text-blue-400">Tawa</span>
              <span className="text-amber-400"> Services</span>
            </span>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">{t("tagline")}</p>
          </div>

          {/* Pour les clients */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
              {t("forClients")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/services" className="text-gray-400 transition-colors hover:text-amber-400">
                  {t("findProvider")}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-400 transition-colors hover:text-amber-400">
                  {t("howItWorks")}
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-400 transition-colors hover:text-amber-400">
                  {t("serviceCategories")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Pour les prestataires */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
              {t("forProviders")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/auth/register" className="text-gray-400 transition-colors hover:text-amber-400">
                  {t("becomeProvider")}
                </Link>
              </li>
              <li>
                <Link
                  href="/provider/dashboard"
                  className="text-gray-400 transition-colors hover:text-amber-400"
                >
                  {t("dashboard")}
                </Link>
              </li>
              <li>
                <Link href="/provider/kyc" className="text-gray-400 transition-colors hover:text-amber-400">
                  {t("kycVerification")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Aide */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
              {t("help")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/faq" className="text-gray-400 transition-colors hover:text-amber-400">
                  {t("faq")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 transition-colors hover:text-amber-400">
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 transition-colors hover:text-amber-400">
                  {t("support")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
              {t("legal")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/legal/cgu" className="text-gray-400 transition-colors hover:text-amber-400">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-gray-400 transition-colors hover:text-amber-400">
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-700 pt-6 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Tawa Services. {t("copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
