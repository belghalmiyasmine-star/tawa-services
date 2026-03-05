"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useInView } from "@/hooks/use-in-view";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  const t = useTranslations("home");
  const { ref, inView } = useInView({ threshold: 0.2 });

  return (
    <section ref={ref} className="bg-gradient-to-br from-primary/95 via-primary to-blue-700">
      <div className={`mx-auto max-w-2xl px-4 py-20 text-center md:py-24 ${inView ? "section-visible" : "section-hidden"}`}>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
          {t("ctaTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base text-blue-100 md:text-lg">
          {t("ctaSubtitle")}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/services"
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-primary shadow-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-xl sm:w-auto"
          >
            {t("searchButton")}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/auth/register"
            className="w-full rounded-full border border-white/30 bg-white/10 px-7 py-3 text-center text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:border-white/50 hover:bg-white/20 sm:w-auto"
          >
            {t("becomeProvider")}
          </Link>
        </div>
      </div>
    </section>
  );
}
