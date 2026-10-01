"use client";

import { HELP_CENTER_COPY } from "@/lib/help/help-center-contract";
import { Search } from "lucide-react";

type HelpCenterHeroProps = {
  query: string;
  onQueryChange: (value: string) => void;
  variant: "mobile" | "medium" | "desktop";
};

const VARIANT_CLASSES: Record<HelpCenterHeroProps["variant"], { section: string; title: string; subtitle: string }> = {
  mobile: {
    section: "px-4 py-8",
    title: "text-2xl font-bold tracking-tight text-neutral-950",
    subtitle: "mt-2 text-sm leading-relaxed text-neutral-600",
  },
  medium: {
    section: "px-6 py-10",
    title: "text-3xl font-bold tracking-tight text-neutral-950",
    subtitle: "mt-3 text-base leading-relaxed text-neutral-600",
  },
  desktop: {
    section: "px-4 py-12 sm:px-6 lg:px-8",
    title: "text-3xl font-bold tracking-tight text-neutral-950 md:text-4xl",
    subtitle: "mt-3 text-base text-neutral-600 md:text-lg",
  },
};

export function HelpCenterHero({ query, onQueryChange, variant }: HelpCenterHeroProps) {
  const styles = VARIANT_CLASSES[variant];

  return (
    <section className={`bg-[#F2F6FF] ${styles.section}`}>
      <div className="mx-auto max-w-3xl text-center">
        <h1 className={styles.title}>{HELP_CENTER_COPY.heroTitle}</h1>
        <p className={styles.subtitle}>{HELP_CENTER_COPY.heroSubtitle}</p>
        <label className="relative mx-auto mt-6 block max-w-2xl sm:mt-8">
          <span className="sr-only">{HELP_CENTER_COPY.searchPlaceholder}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={HELP_CENTER_COPY.searchPlaceholder}
            className="w-full rounded-full border border-neutral-200/90 bg-white py-3.5 pl-5 pr-12 text-sm text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/20"
            data-help-center-control="search"
          />
          <Search
            className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
        </label>
      </div>
    </section>
  );
}
