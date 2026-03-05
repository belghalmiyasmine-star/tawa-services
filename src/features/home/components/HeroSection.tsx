"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useInView } from "@/hooks/use-in-view";
import { useCountUp } from "@/hooks/use-count-up";
import { Search, UserPlus } from "lucide-react";

/**
 * Round down to the nearest "nice" number for display.
 * Examples: 8→5, 15→15, 23→20, 156→150, 1234→1200
 */
function roundDownNice(n: number): number {
  if (n < 5) return n;
  let step: number;
  if (n < 50) step = 5;
  else if (n < 100) step = 10;
  else if (n < 1000) step = 50;
  else if (n < 10000) step = 100;
  else step = 1000;
  return Math.floor(n / step) * step;
}

function StatItem({
  target,
  suffix,
  label,
  active,
  isFloat,
}: {
  target: number;
  suffix: string;
  label: string;
  active: boolean;
  isFloat?: boolean;
}) {
  const count = useCountUp(target, 2000, active);
  const display = isFloat ? (count / 10).toFixed(1) : count.toLocaleString("fr-FR");

  return (
    <div className="flex flex-col items-center gap-1 px-5 py-2 sm:px-8">
      <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-3xl">
        {display}
        <span className="text-primary">{suffix}</span>
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 md:text-xs">
        {label}
      </span>
    </div>
  );
}

interface HeroStats {
  providerCount: number;
  serviceCount: number;
  avgRating: number;
}

export function HeroSection({ stats }: { stats: HeroStats }) {
  const t = useTranslations("home");
  const { ref: heroRef, inView: heroVisible } = useInView({ threshold: 0.1 });
  const { ref: statsRef, inView: statsVisible } = useInView({ threshold: 0.4 });

  const niceProviders = roundDownNice(stats.providerCount);
  const niceServices = roundDownNice(stats.serviceCount);
  const ratingTarget = Math.round(stats.avgRating * 10);

  return (
    <section ref={heroRef} className="relative w-full overflow-hidden">
      {/* Full-width background image */}
      <div className="absolute inset-0">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80)",
          }}
        />
      </div>

      {/* Semi-transparent overlay for text readability */}
      <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/60" />

      {/* Content — centered on top of background */}
      <div
        className={`relative z-10 mx-auto max-w-4xl px-4 pb-8 pt-20 text-center md:pb-12 md:pt-28 lg:pt-32 ${
          heroVisible ? "hero-content-visible" : "hero-content-hidden"
        }`}
      >
        {/* Eyebrow */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/80 px-4 py-1.5 text-xs font-medium text-primary shadow-sm dark:border-primary/30 dark:bg-gray-800/80">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          La plateforme N&deg;1 en Tunisie
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl lg:text-[4.25rem] lg:leading-[1.1]">
          {t("heroTitle")}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-relaxed text-gray-700 dark:text-gray-300 md:mt-6 md:text-lg">
          {t("heroSubtitle")}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-3 md:mt-10">
          <Link
            href="/services"
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90 hover:shadow-xl sm:w-auto"
          >
            <Search className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            {t("searchButton")}
          </Link>
          <Link
            href="/auth/register"
            className="group flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white/90 px-7 py-3 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-gray-300 hover:bg-white hover:shadow-md dark:border-gray-600 dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800 sm:w-auto"
          >
            <UserPlus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            {t("becomeProvider")}
          </Link>
        </div>
      </div>

      {/* Trust indicators — real data from database */}
      <div className="relative z-10 px-4 pb-12 md:pb-16">
        <div
          ref={statsRef}
          className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-2xl border border-gray-200/60 bg-white/95 px-2 py-4 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95 sm:flex-row sm:divide-x sm:divide-gray-100 dark:sm:divide-gray-700"
        >
          <StatItem
            target={niceProviders}
            suffix="+"
            label={t("statProviders")}
            active={statsVisible}
          />
          <StatItem
            target={niceServices}
            suffix="+"
            label={t("statServices")}
            active={statsVisible}
          />
          <StatItem
            target={ratingTarget}
            suffix="/5"
            label={t("statSatisfaction")}
            active={statsVisible}
            isFloat
          />
        </div>
      </div>
    </section>
  );
}
